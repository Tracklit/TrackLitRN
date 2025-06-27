import { Request, Response, Router } from "express";
import { db } from "./db";
import { sql, eq, and } from "drizzle-orm";
import { messageReactions } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Debug endpoint for chat groups
router.get("/api/chat/groups/debug", async (req: Request, res: Response) => {
  console.log('=== DEBUG CHAT GROUPS API CALLED ===');
  
  if (!req.isAuthenticated()) {
    console.log('User not authenticated');
    return res.sendStatus(401);
  }
  
  try {
    const userId = req.user!.id;
    console.log('Debug User ID:', userId);
    
    // Test direct database query
    const groups = await db.execute(sql`
      SELECT 
        cg.id,
        cg.name,
        cg.description,
        cg.image as avatar_url,
        cg.creator_id,
        cg.is_private,
        cg.created_at,
        cg.last_message,
        cg.last_message_at,
        cg.message_count
      FROM chat_groups cg
      INNER JOIN chat_group_members cgm ON cg.id = cgm.group_id
      WHERE cgm.user_id = ${userId}
      ORDER BY cg.last_message_at DESC
    `);
    
    console.log('DEBUG Raw groups from database:', groups.rows);
    console.log('DEBUG Number of groups found:', groups.rows.length);
    
    groups.rows.forEach((group, index) => {
      console.log(`DEBUG Group ${index + 1}:`, JSON.stringify(group, null, 2));
    });
    
    res.json({ debug: true, groups: groups.rows });
  } catch (error) {
    console.error("DEBUG Error fetching chat groups:", error);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

// Get chat groups for user
router.get("/api/chat/groups", async (req: Request, res: Response) => {
  console.log('=== CHAT GROUPS API CALLED ===');
  
  // Force no-cache headers at the start
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'ETag': Date.now().toString() // Force unique response
  });
  
  if (!req.isAuthenticated()) {
    console.log('User not authenticated');
    return res.sendStatus(401);
  }
  
  try {
    const userId = req.user!.id;
    console.log('User ID:', userId);
    
    // Direct SQL query to get groups
    const groups = await db.execute(sql`
      SELECT 
        cg.id,
        cg.name,
        cg.description,
        cg.image as avatar_url,
        cg.creator_id,
        cg.is_private,
        cg.created_at,
        cg.last_message,
        cg.last_message_at,
        cg.message_count
      FROM chat_groups cg
      INNER JOIN chat_group_members cgm ON cg.id = cgm.group_id
      WHERE cgm.user_id = ${userId}
      ORDER BY cg.last_message_at DESC
    `);
    
    console.log('Raw groups from database:', groups.rows);
    console.log('Number of groups found:', groups.rows.length);
    
    // Log each group individually to see the exact structure
    groups.rows.forEach((group, index) => {
      console.log(`Group ${index + 1}:`, JSON.stringify(group, null, 2));
    });
    
    res.json(groups.rows);
  } catch (error) {
    console.error("Error fetching chat groups:", error);
    res.status(500).json({ error: "Failed to fetch groups" });
  }
});

// Create new chat group
router.post("/api/chat/groups", upload.single('image'), async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const userId = req.user!.id;
    const { name, description, isPrivate = false } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ error: "Group name is required" });
    }

    // Generate invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Handle image upload
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Create group with direct SQL
    const groupResult = await db.execute(sql`
      INSERT INTO chat_groups (name, description, image, creator_id, admin_ids, member_ids, is_private, invite_code)
      VALUES (${name.trim()}, ${description || ''}, ${imageUrl}, ${userId}, ARRAY[${userId}], ARRAY[${userId}], ${isPrivate === 'true'}, ${inviteCode})
      RETURNING *
    `);

    const group = groupResult.rows[0];

    // Add creator as member
    await db.execute(sql`
      INSERT INTO chat_group_members (group_id, user_id, role)
      VALUES (${group.id}, ${userId}, 'creator')
    `);

    res.json(group);
  } catch (error) {
    console.error("Error creating chat group:", error);
    res.status(500).json({ error: "Failed to create group" });
  }
});

// Get specific group details
router.get("/api/chat/groups/:groupId", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user!.id;

    if (isNaN(groupId)) {
      return res.status(400).json({ error: "Invalid group ID" });
    }

    // Get group details
    const groupResult = await db.execute(sql`
      SELECT * FROM chat_groups WHERE id = ${groupId}
    `);

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    const group = groupResult.rows[0];

    // Check if user is a member (handle both array and null cases)
    const memberIds = (group as any).member_ids || [];
    const isMember = Array.isArray(memberIds) ? memberIds.includes(userId) : false;
    const isCreator = (group as any).creator_id === userId;
    
    if (!isMember && !isCreator) {
      return res.status(403).json({ error: "Not a member of this group" });
    }

    res.json(group);
  } catch (error) {
    console.error("Error fetching group details:", error);
    res.status(500).json({ error: "Failed to fetch group" });
  }
});

// Update group details
router.patch("/api/chat/groups/:groupId", upload.single('image'), async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user!.id;
    const { name, description, isPrivate } = req.body;

    if (isNaN(groupId)) {
      return res.status(400).json({ error: "Invalid group ID" });
    }

    // Check if user is admin or creator
    const groupResult = await db.execute(sql`
      SELECT * FROM chat_groups WHERE id = ${groupId}
    `);

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    const group = groupResult.rows[0];
    const adminIds = (group as any).admin_ids ? (Array.isArray((group as any).admin_ids) ? (group as any).admin_ids : []) : [];
    const isAdmin = group.creator_id === userId || adminIds.includes(userId);

    if (!isAdmin) {
      return res.status(403).json({ error: "Only admins can update group details" });
    }

    // Handle image upload
    let imageUrl = group.image;
    console.log('File upload received:', req.file);
    console.log('Current group image:', group.image);
    
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
      console.log('New image URL:', imageUrl);
    } else {
      console.log('No file uploaded in request');
    }

    // Update group
    const updateResult = await db.execute(sql`
      UPDATE chat_groups 
      SET name = ${name || group.name}, 
          description = ${description || group.description}, 
          image = ${imageUrl},
          is_private = ${isPrivate === 'true' ? true : (isPrivate === 'false' ? false : group.is_private)}
      WHERE id = ${groupId}
      RETURNING *
    `);

    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({ error: "Failed to update group" });
  }
});

// Get group members with details
router.get("/api/chat/groups/:groupId/members", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user!.id;

    if (isNaN(groupId)) {
      return res.status(400).json({ error: "Invalid group ID" });
    }

    // Check if user is a member
    const groupResult = await db.execute(sql`
      SELECT member_ids FROM chat_groups WHERE id = ${groupId}
    `);

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    const group = groupResult.rows[0];
    if (!(group as any).member_ids.includes(userId)) {
      return res.status(403).json({ error: "Not a member of this group" });
    }

    // Get member details
    const membersResult = await db.execute(sql`
      SELECT 
        cgm.user_id,
        cgm.role,
        cgm.joined_at,
        u.name,
        u.username,
        u.profile_image_url
      FROM chat_group_members cgm
      INNER JOIN users u ON cgm.user_id = u.id
      WHERE cgm.group_id = ${groupId}
      ORDER BY 
        CASE cgm.role 
          WHEN 'creator' THEN 1 
          WHEN 'admin' THEN 2 
          ELSE 3 
        END,
        cgm.joined_at ASC
    `);

    res.json(membersResult.rows);
  } catch (error) {
    console.error("Error fetching group members:", error);
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

// Add member to group
router.post("/api/chat/groups/:groupId/members", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const groupId = parseInt(req.params.groupId);
    const currentUserId = req.user!.id;
    const { userId } = req.body;

    if (isNaN(groupId) || !userId) {
      return res.status(400).json({ error: "Invalid group ID or user ID" });
    }

    // Check if current user is admin or creator
    const groupResult = await db.execute(sql`
      SELECT * FROM chat_groups WHERE id = ${groupId}
    `);

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    const group = groupResult.rows[0];
    const adminIds = (group as any).admin_ids ? (Array.isArray((group as any).admin_ids) ? (group as any).admin_ids : []) : [];
    const isAdmin = group.creator_id === currentUserId || adminIds.includes(currentUserId);

    if (!isAdmin) {
      return res.status(403).json({ error: "Only admins can add members" });
    }

    // Check if user is already a member
    if ((group as any).member_ids.includes(userId)) {
      return res.status(400).json({ error: "User is already a member" });
    }

    // Add user to group members array
    await db.execute(sql`
      UPDATE chat_groups 
      SET member_ids = array_append(member_ids, ${userId})
      WHERE id = ${groupId}
    `);

    // Add member record
    await db.execute(sql`
      INSERT INTO chat_group_members (group_id, user_id, role)
      VALUES (${groupId}, ${userId}, 'member')
    `);

    res.json({ message: "Member added successfully" });
  } catch (error) {
    console.error("Error adding member:", error);
    res.status(500).json({ error: "Failed to add member" });
  }
});

// Remove member from group
router.delete("/api/chat/groups/:groupId/members/:userId", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const groupId = parseInt(req.params.groupId);
    const targetUserId = parseInt(req.params.userId);
    const currentUserId = req.user!.id;

    if (isNaN(groupId) || isNaN(targetUserId)) {
      return res.status(400).json({ error: "Invalid group ID or user ID" });
    }

    // Check if current user is admin or creator
    const groupResult = await db.execute(sql`
      SELECT * FROM chat_groups WHERE id = ${groupId}
    `);

    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: "Group not found" });
    }

    const group = groupResult.rows[0];
    const adminIds = group.admin_ids ? (Array.isArray(group.admin_ids) ? group.admin_ids : []) : [];
    const isAdmin = group.creator_id === currentUserId || adminIds.includes(currentUserId);

    if (!isAdmin) {
      return res.status(403).json({ error: "Only admins can remove members" });
    }

    // Cannot remove creator
    if (group.creator_id === targetUserId) {
      return res.status(400).json({ error: "Cannot remove group creator" });
    }

    // Remove user from group members array
    await db.execute(sql`
      UPDATE chat_groups 
      SET member_ids = array_remove(member_ids, ${targetUserId}),
          admin_ids = array_remove(admin_ids, ${targetUserId})
      WHERE id = ${groupId}
    `);

    // Remove member record
    await db.execute(sql`
      DELETE FROM chat_group_members 
      WHERE group_id = ${groupId} AND user_id = ${targetUserId}
    `);

    res.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json({ error: "Failed to remove member" });
  }
});

// Get direct messages for conversation
router.get("/api/chat/direct/:conversationId/messages", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const conversationId = parseInt(req.params.conversationId);
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (isNaN(conversationId)) {
      return res.status(400).json({ error: "Invalid conversation ID" });
    }

    // Get messages with direct SQL
    const messages = await db.execute(sql`
      SELECT 
        dm.id,
        dm.conversation_id,
        dm.sender_id,
        dm.receiver_id,
        dm.text,
        dm.created_at,
        dm.is_read,
        u.name as sender_name,
        u.profile_image_url as sender_profile_image
      FROM telegram_direct_messages dm
      INNER JOIN users u ON dm.sender_id = u.id
      WHERE dm.conversation_id = ${conversationId}
      ORDER BY dm.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    res.json(messages.rows);
  } catch (error) {
    console.error("Error fetching direct messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Send direct message
router.post("/api/chat/direct/:conversationId/messages", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const conversationId = parseInt(req.params.conversationId);
    const userId = req.user!.id;
    const { text, receiverId } = req.body;

    if (isNaN(conversationId)) {
      return res.status(400).json({ error: "Invalid conversation ID" });
    }

    if (!text?.trim()) {
      return res.status(400).json({ error: "Message text is required" });
    }

    if (!receiverId) {
      return res.status(400).json({ error: "Receiver ID is required" });
    }

    // Insert message with direct SQL
    const messageResult = await db.execute(sql`
      INSERT INTO telegram_direct_messages (conversation_id, sender_id, receiver_id, text)
      VALUES (${conversationId}, ${userId}, ${receiverId}, ${text.trim()})
      RETURNING *
    `);

    const message = messageResult.rows[0];
    res.json(message);
  } catch (error) {
    console.error("Error sending direct message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Get group messages
router.get("/api/chat/groups/:groupId/messages", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (isNaN(groupId)) {
      return res.status(400).json({ error: "Invalid group ID" });
    }

    // Check if user is a member of this group using the member_ids array
    const groupCheck = await db.execute(sql`
      SELECT member_ids FROM chat_groups 
      WHERE id = ${groupId} AND ${userId} = ANY(member_ids)
    `);

    if (groupCheck.rows.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get messages with sender info
    const messages = await db.execute(sql`
      SELECT 
        cgm.id,
        cgm.group_id,
        cgm.sender_id as user_id,
        cgm.text,
        cgm.created_at,
        cgm.message_type,
        cgm.media_url,
        cgm.reply_to_id,
        cgm.is_deleted as is_edited,
        cgm.edited_at,
        u.name as sender_name,
        u.username as sender_username,
        u.profile_image_url as sender_profile_image
      FROM chat_group_messages cgm
      INNER JOIN users u ON cgm.sender_id = u.id
      WHERE cgm.group_id = ${groupId}
      ORDER BY cgm.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    res.json(messages.rows);
  } catch (error) {
    console.error("Error fetching group messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Send group message
router.post("/api/chat/groups/:groupId/messages", upload.single('image'), async (req: Request, res: Response) => {
  console.log('=== GROUP MESSAGE ROUTE HIT ===');
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const groupId = parseInt(req.params.groupId);
    const userId = req.user!.id;
    const { text, replyToId, messageType = "text" } = req.body;
    const file = req.file;

    console.log('Message upload debug:', {
      text: text,
      file: file ? { filename: file.filename, size: file.size } : null,
      messageType,
      hasText: !!text?.trim(),
      hasFile: !!file
    });

    if (isNaN(groupId)) {
      return res.status(400).json({ error: "Invalid group ID" });
    }

    // Validate that we have either text or a file
    if (!text?.trim() && !file) {
      console.log('Validation failed: no text and no file');
      return res.status(400).json({ error: "Message text or image is required" });
    }

    // Check if user is a member of this group using the member_ids array
    const groupCheck = await db.execute(sql`
      SELECT member_ids FROM chat_groups 
      WHERE id = ${groupId} AND ${userId} = ANY(member_ids)
    `);

    if (groupCheck.rows.length === 0) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get user info for the message
    const userResult = await db.execute(sql`
      SELECT name, profile_image_url FROM users WHERE id = ${userId}
    `);
    const user = userResult.rows[0];

    // Determine message type and media URL
    const finalMessageType = file ? "image" : "text";
    const mediaUrl = file ? `/uploads/${file.filename}` : null;
    const messageText = text?.trim() || "";

    // Insert message
    const messageResult = await db.execute(sql`
      INSERT INTO chat_group_messages (group_id, sender_id, sender_name, sender_profile_image, text, message_type, media_url, reply_to_id)
      VALUES (${groupId}, ${userId}, ${user.name || 'Unknown'}, ${user.profile_image_url || null}, ${messageText}, ${finalMessageType}, ${mediaUrl}, ${replyToId || null})
      RETURNING *
    `);

    const message = messageResult.rows[0];

    // Update group's last message info
    const lastMessageText = text?.trim() || (file ? "📷 Photo" : "");
    await db.execute(sql`
      UPDATE chat_groups 
      SET 
        last_message = ${lastMessageText},
        last_message_at = NOW(),
        message_count = message_count + 1
      WHERE id = ${groupId}
    `);

    res.json(message);
  } catch (error) {
    console.error("Error sending group message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Message Reactions Routes
router.post("/messages/:messageId/:messageType/reactions", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  try {
    const { messageId, messageType } = req.params;
    const { emoji = "👍" } = req.body;
    const userId = req.user!.id;

    if (!messageId || !messageType) {
      return res.status(400).json({ error: "Missing messageId or messageType" });
    }

    // Check if user already reacted with this emoji
    const existingReaction = await db
      .select()
      .from(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, parseInt(messageId)),
          eq(messageReactions.messageType, messageType),
          eq(messageReactions.userId, userId),
          eq(messageReactions.emoji, emoji)
        )
      )
      .limit(1);

    if (existingReaction.length > 0) {
      // Remove existing reaction (toggle off)
      await db
        .delete(messageReactions)
        .where(eq(messageReactions.id, existingReaction[0].id));
      
      return res.json({ action: "removed", messageId, emoji });
    } else {
      // Add new reaction
      const [newReaction] = await db
        .insert(messageReactions)
        .values({
          messageId: parseInt(messageId),
          messageType,
          userId,
          emoji
        })
        .returning();

      return res.json({ action: "added", reaction: newReaction });
    }
  } catch (error) {
    console.error("Error toggling message reaction:", error);
    res.status(500).json({ error: "Failed to toggle reaction" });
  }
});

router.get("/messages/:messageId/:messageType/reactions", async (req: Request, res: Response) => {
  try {
    const { messageId, messageType } = req.params;

    if (!messageId || !messageType) {
      return res.status(400).json({ error: "Missing messageId or messageType" });
    }

    const reactions = await db
      .select({
        id: messageReactions.id,
        emoji: messageReactions.emoji,
        userId: messageReactions.userId,
        createdAt: messageReactions.createdAt
      })
      .from(messageReactions)
      .where(
        and(
          eq(messageReactions.messageId, parseInt(messageId)),
          eq(messageReactions.messageType, messageType)
        )
      )
      .orderBy(messageReactions.createdAt);

    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc: any, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: []
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.userId);
      return acc;
    }, {});

    res.json(Object.values(groupedReactions));
  } catch (error) {
    console.error("Error getting message reactions:", error);
    res.status(500).json({ error: "Failed to get reactions" });
  }
});

export default router;