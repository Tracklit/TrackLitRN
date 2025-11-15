import { Router, type Request, type Response } from "express";
import { db } from "../db";
import { feedPosts, feedComments, feedLikes, users, follows, communityActivities } from "@shared/schema";
import { eq, desc, and, inArray, sql, or } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Get all feed items (community activities + user posts) with filter support
router.get("/", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userId = req.user.id;
    const filter = req.query.filter as string; // 'all' or 'connections'

    // Get user's connections (people they follow)
    let connectionIds: number[] = [];
    if (filter === 'connections') {
      const connections = await db
        .select({ followingId: follows.followingId })
        .from(follows)
        .where(eq(follows.followerId, userId));
      
      connectionIds = connections.map(c => c.followingId);
      connectionIds.push(userId); // Include user's own posts
    }

    // Get community activities (disabled for now - table doesn't exist)
    const activities: any[] = [];

    // Get user feed posts with likes and comments count
    const posts = await db
      .select({
        id: feedPosts.id,
        userId: feedPosts.userId,
        type: sql<string>`'post'`.as('type'),
        activityType: sql<string | null>`NULL`.as('activity_type'),
        title: sql<string | null>`NULL`.as('title'),
        description: sql<string | null>`NULL`.as('description'),
        metadata: sql<any>`NULL`.as('metadata'),
        content: feedPosts.content,
        voiceRecordingUrl: feedPosts.voiceRecordingUrl,
        voiceRecordingDuration: feedPosts.voiceRecordingDuration,
        isEdited: feedPosts.isEdited,
        editedAt: feedPosts.editedAt,
        createdAt: feedPosts.createdAt,
        username: users.username,
        name: users.name,
        profileImageUrl: users.profileImageUrl,
      })
      .from(feedPosts)
      .leftJoin(users, eq(feedPosts.userId, users.id))
      .where(
        filter === 'connections' && connectionIds.length > 0
          ? inArray(feedPosts.userId, connectionIds)
          : undefined
      )
      .orderBy(desc(feedPosts.createdAt))
      .limit(50);

    // Get likes and comments counts for all posts
    const postIds = posts.map(p => p.id);
    let likesData: any[] = [];
    let commentsData: any[] = [];

    if (postIds.length > 0) {
      likesData = await db
        .select({
          postId: feedLikes.postId,
          count: sql<number>`count(*)::int`.as('count'),
          userLiked: sql<boolean>`bool_or(${feedLikes.userId} = ${userId})`.as('user_liked'),
        })
        .from(feedLikes)
        .where(inArray(feedLikes.postId, postIds))
        .groupBy(feedLikes.postId);

      commentsData = await db
        .select({
          postId: feedComments.postId,
          count: sql<number>`count(*)::int`.as('count'),
        })
        .from(feedComments)
        .where(inArray(feedComments.postId, postIds))
        .groupBy(feedComments.postId);
    }

    // Check if user follows each post author
    const allUserIds = [...activities.map(a => a.userId), ...posts.map(p => p.userId)].filter((id): id is number => id !== null);
    const uniqueUserIds = Array.from(new Set(allUserIds));
    
    const followingData = await db
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(
        and(
          eq(follows.followerId, userId),
          inArray(follows.followingId, uniqueUserIds)
        )
      );
    
    const followingIds = new Set(followingData.map(f => f.followingId));

    // Combine and format feed items
    const feedItems = [
      ...activities.map(activity => ({
        ...activity,
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
        isFollowing: activity.userId ? followingIds.has(activity.userId) : false,
        isOwnPost: activity.userId === userId,
      })),
      ...posts.map(post => {
        const likes = likesData.find(l => l.postId === post.id);
        const comments = commentsData.find(c => c.postId === post.id);
        return {
          ...post,
          likesCount: likes?.count || 0,
          commentsCount: comments?.count || 0,
          isLiked: likes?.userLiked || false,
          isFollowing: post.userId ? followingIds.has(post.userId) : false,
          isOwnPost: post.userId === userId,
        };
      }),
    ].sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

    res.json(feedItems);
  } catch (error) {
    console.error("Error fetching feed:", error);
    res.status(500).json({ error: "Failed to fetch feed" });
  }
});

// Get a single post by ID
router.get("/posts/:id", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userId = req.user.id;
    const postId = parseInt(req.params.id);

    // Get the post with user info
    const [post] = await db
      .select({
        id: feedPosts.id,
        userId: feedPosts.userId,
        content: feedPosts.content,
        voiceRecordingUrl: feedPosts.voiceRecordingUrl,
        voiceRecordingDuration: feedPosts.voiceRecordingDuration,
        isEdited: feedPosts.isEdited,
        editedAt: feedPosts.editedAt,
        createdAt: feedPosts.createdAt,
        username: users.username,
        name: users.name,
        profileImageUrl: users.profileImageUrl,
      })
      .from(feedPosts)
      .leftJoin(users, eq(feedPosts.userId, users.id))
      .where(eq(feedPosts.id, postId));

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Get likes count and check if user liked
    const likesData = await db
      .select({
        count: sql<number>`count(*)::int`.as('count'),
        userLiked: sql<boolean>`bool_or(${feedLikes.userId} = ${userId})`.as('user_liked'),
      })
      .from(feedLikes)
      .where(eq(feedLikes.postId, postId));

    // Get comments count
    const commentsData = await db
      .select({
        count: sql<number>`count(*)::int`.as('count'),
      })
      .from(feedComments)
      .where(eq(feedComments.postId, postId));

    // Check if user follows the post author
    const following = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, userId),
          eq(follows.followingId, post.userId!)
        )
      );

    const result = {
      ...post,
      likesCount: likesData[0]?.count || 0,
      isLiked: likesData[0]?.userLiked || false,
      commentsCount: commentsData[0]?.count || 0,
      isFollowing: following.length > 0,
      isOwnPost: post.userId === userId,
    };

    res.json(result);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// Create a new feed post
router.post("/posts", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { content, voiceRecordingUrl, voiceRecordingDuration } = req.body;

    if (!content && !voiceRecordingUrl) {
      return res.status(400).json({ error: "Content or voice recording required" });
    }

    if (content && content.length < 5) {
      return res.status(400).json({ error: "Content must be at least 5 characters" });
    }

    const [post] = await db
      .insert(feedPosts)
      .values({
        userId: req.user.id,
        content: content || null,
        voiceRecordingUrl: voiceRecordingUrl || null,
        voiceRecordingDuration: voiceRecordingDuration || null,
      })
      .returning();

    res.json(post);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Edit a feed post (only within 1 hour)
router.patch("/posts/:id", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const postId = parseInt(req.params.id);
    const { content } = req.body;

    // Get the post
    const [post] = await db
      .select()
      .from(feedPosts)
      .where(eq(feedPosts.id, postId));

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to edit this post" });
    }

    // Check if post is within 1 hour of creation
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (new Date(post.createdAt!) < oneHourAgo) {
      return res.status(403).json({ error: "Can only edit posts within 1 hour of creation" });
    }

    if (content && content.length < 5) {
      return res.status(400).json({ error: "Content must be at least 5 characters" });
    }

    const [updatedPost] = await db
      .update(feedPosts)
      .set({
        content,
        isEdited: true,
        editedAt: new Date(),
      })
      .where(eq(feedPosts.id, postId))
      .returning();

    res.json(updatedPost);
  } catch (error) {
    console.error("Error editing post:", error);
    res.status(500).json({ error: "Failed to edit post" });
  }
});

// Delete a feed post
router.delete("/posts/:id", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const postId = parseInt(req.params.id);

    const [post] = await db
      .select()
      .from(feedPosts)
      .where(eq(feedPosts.id, postId));

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.userId !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to delete this post" });
    }

    await db.delete(feedPosts).where(eq(feedPosts.id, postId));

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

// Get comments for a post
router.get("/posts/:id/comments", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const postId = parseInt(req.params.id);

    const comments = await db
      .select({
        id: feedComments.id,
        postId: feedComments.postId,
        userId: feedComments.userId,
        content: feedComments.content,
        createdAt: feedComments.createdAt,
        username: users.username,
        name: users.name,
        profileImageUrl: users.profileImageUrl,
      })
      .from(feedComments)
      .leftJoin(users, eq(feedComments.userId, users.id))
      .where(eq(feedComments.postId, postId))
      .orderBy(feedComments.createdAt);

    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Add a comment to a post
router.post("/posts/:id/comments", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const postId = parseInt(req.params.id);
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Comment content required" });
    }

    const [comment] = await db
      .insert(feedComments)
      .values({
        postId,
        userId: req.user.id,
        content: content.trim(),
      })
      .returning();

    // TODO: Create notification for post author

    res.json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Failed to create comment" });
  }
});

// Toggle like on a post
router.post("/posts/:id/like", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const postId = parseInt(req.params.id);

    // Check if already liked
    const [existingLike] = await db
      .select()
      .from(feedLikes)
      .where(and(eq(feedLikes.postId, postId), eq(feedLikes.userId, req.user.id)));

    if (existingLike) {
      // Unlike
      await db
        .delete(feedLikes)
        .where(and(eq(feedLikes.postId, postId), eq(feedLikes.userId, req.user.id)));

      res.json({ liked: false });
    } else {
      // Like
      await db
        .insert(feedLikes)
        .values({
          postId,
          userId: req.user.id,
        });

      // TODO: Create notification for post author

      res.json({ liked: true });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

export default router;
