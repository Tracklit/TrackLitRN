import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import { Heart, MessageCircle, Send, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FeedPost {
  id: number;
  userId: number | null;
  content: string | null;
  voiceRecordingUrl?: string | null;
  voiceRecordingDuration?: number | null;
  isEdited?: boolean;
  editedAt?: Date | null;
  createdAt: Date;
  username?: string | null;
  name?: string | null;
  profileImageUrl?: string | null;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isFollowing: boolean;
  isOwnPost: boolean;
}

interface Comment {
  id: number;
  postId: number;
  userId: number;
  content: string;
  createdAt: Date;
  username: string | null;
  name: string | null;
  profileImageUrl: string | null;
}

export default function FeedPostDetailPage() {
  const [, params] = useRoute("/feed/:id");
  const postId = params?.id ? parseInt(params.id) : null;
  const [commentText, setCommentText] = useState("");
  const [showAddComment, setShowAddComment] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editContent, setEditContent] = useState("");
  const { toast } = useToast();

  const { data: post, isLoading: postLoading } = useQuery<FeedPost>({
    queryKey: ["/api/feed/posts", postId],
    queryFn: async () => {
      const res = await fetch(`/api/feed/posts/${postId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch post");
      return res.json();
    },
    enabled: !!postId,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: ["/api/feed/posts", postId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/feed/posts/${postId}/comments`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
    enabled: !!postId,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/feed/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed/posts", postId] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", `/api/feed/posts/${postId}/comments`, { content });
    },
    onSuccess: () => {
      setCommentText("");
      setShowAddComment(false);
      queryClient.invalidateQueries({ queryKey: ["/api/feed/posts", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed/posts", postId] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      });
    },
  });

  const editPostMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("PATCH", `/api/feed/posts/${postId}`, { content });
    },
    onSuccess: () => {
      setEditingPost(false);
      setEditContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/feed/posts", postId] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      toast({
        title: "Post updated",
        description: "Your post has been updated",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/feed/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      toast({
        title: "Post deleted",
        description: "Your post has been deleted",
      });
      window.history.back();
    },
  });

  const handleLike = () => {
    if (post) {
      likeMutation.mutate();
    }
  };

  const handleAddComment = () => {
    if (commentText.trim().length === 0) return;
    addCommentMutation.mutate(commentText);
  };

  const handleEditPost = () => {
    if (!post) return;
    setEditContent(post.content || "");
    setEditingPost(true);
  };

  const handleSaveEdit = () => {
    if (editContent.trim().length === 0) return;
    editPostMutation.mutate(editContent);
  };

  const handleDeletePost = () => {
    if (confirm("Are you sure you want to delete this post?")) {
      deletePostMutation.mutate();
    }
  };

  if (!postId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Post not found</p>
      </div>
    );
  }

  if (postLoading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-2xl mx-auto p-4">
          <Skeleton className="h-48 w-full bg-gray-800" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Post not found</p>
      </div>
    );
  }

  const gradientClass = post.isFollowing || post.isOwnPost
    ? "bg-gradient-to-br from-purple-900/30 to-pink-900/30"
    : "bg-gradient-to-br from-blue-900/20 to-cyan-900/20";

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="text-white"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-white font-semibold text-lg">Post</h1>
        </div>
      </div>

      {/* Post Content */}
      <div className="max-w-2xl mx-auto p-4">
        <div
          className={`rounded-lg p-4 ${gradientClass} border border-gray-700`}
          data-testid={`post-${post.id}`}
        >
          {/* Post Header */}
          <div className="flex items-start gap-3 mb-3">
            <OptimizedAvatar
              src={post.profileImageUrl || undefined}
              alt={post.name || post.username || "User"}
              fallback={(post.name || post.username || "U").slice(0, 2).toUpperCase()}
              className="h-10 w-10"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white truncate">
                  {post.name || post.username}
                </span>
                {post.isOwnPost && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-white"
                      onClick={handleEditPost}
                      data-testid="button-edit-post"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-500"
                      onClick={handleDeletePost}
                      data-testid="button-delete-post"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-400">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                {post.isEdited && " (edited)"}
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="text-white mb-4 whitespace-pre-wrap">{post.content}</div>

          {/* Post Actions */}
          <div className="flex items-center gap-4 pt-3 border-t border-gray-700/50">
            <button
              onClick={handleLike}
              className="flex items-center gap-2 text-gray-400 hover:text-pink-500 transition-colors"
              data-testid="button-like-post"
            >
              <Heart className={`h-5 w-5 ${post.isLiked ? "fill-pink-500 text-pink-500" : ""}`} />
              <span className="text-sm">{post.likesCount}</span>
            </button>
            <button
              onClick={() => setShowAddComment(true)}
              className="flex items-center gap-2 text-gray-400 hover:text-blue-500 transition-colors"
              data-testid="button-add-comment"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">{post.commentsCount}</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-6">
          <h2 className="text-white font-semibold mb-4">
            Comments ({comments.length})
          </h2>
          {commentsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full bg-gray-800" />
              <Skeleton className="h-20 w-full bg-gray-800" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No comments yet</p>
              <Button
                onClick={() => setShowAddComment(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
                data-testid="button-be-first-comment"
              >
                Be the first to comment
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                  data-testid={`comment-${comment.id}`}
                >
                  <div className="flex gap-3">
                    <OptimizedAvatar
                      src={comment.profileImageUrl || undefined}
                      alt={comment.name || comment.username || "User"}
                      fallback={(comment.name || comment.username || "U").slice(0, 2).toUpperCase()}
                      className="h-8 w-8"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-white">
                        {comment.name || comment.username}
                      </div>
                      <div className="text-sm text-gray-300 mt-1">{comment.content}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Comment Drawer */}
      <Drawer open={showAddComment} onOpenChange={setShowAddComment}>
        <DrawerContent className="bg-gray-800 border-gray-700">
          <DrawerHeader>
            <DrawerTitle className="text-white">Add Comment</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 space-y-4">
            <Textarea
              placeholder="Write your comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-32 bg-gray-900 border-gray-700 text-white resize-none"
              data-testid="input-comment"
              autoFocus
            />
          </div>
          <DrawerFooter>
            <Button
              onClick={handleAddComment}
              disabled={addCommentMutation.isPending || !commentText.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
              data-testid="button-submit-comment"
            >
              {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddComment(false);
                setCommentText("");
              }}
              data-testid="button-cancel-comment"
            >
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Edit Post Dialog */}
      <Dialog open={editingPost} onOpenChange={setEditingPost}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-32 bg-gray-900 border-gray-700 text-white resize-none"
              data-testid="input-edit-content"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setEditingPost(false);
                  setEditContent("");
                }}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={editPostMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
                data-testid="button-save-edit"
              >
                {editPostMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
