import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import { Heart, MessageCircle, Pencil, Trash2, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type FeedFilter = "all" | "connections";

interface FeedItem {
  id: number;
  userId: number | null;
  type: "post" | "activity";
  activityType?: string | null;
  title?: string | null;
  description?: string | null;
  metadata?: any;
  content?: string | null;
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

export default function FeedPage() {
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [editingPost, setEditingPost] = useState<FeedItem | null>(null);
  const [editContent, setEditContent] = useState("");
  const { toast } = useToast();

  const { data: feedItems = [], isLoading } = useQuery<FeedItem[]>({
    queryKey: ["/api/feed", filter],
  });

  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/feed/posts", { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      setShowCreateDialog(false);
      setNewPostContent("");
      toast({ description: "Post created successfully" });
    },
    onError: (error: any) => {
      toast({
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const editPostMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      return apiRequest("PATCH", `/api/feed/posts/${id}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      setEditingPost(null);
      setEditContent("");
      toast({ description: "Post updated successfully" });
    },
    onError: (error: any) => {
      toast({
        description: error.message || "Failed to update post",
        variant: "destructive",
      });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/feed/posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      toast({ description: "Post deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        description: error.message || "Failed to delete post",
        variant: "destructive",
      });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (postId: number) => {
      return apiRequest("POST", `/api/feed/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
    },
  });

  const handleCreatePost = () => {
    if (newPostContent.trim().length < 5) {
      toast({
        description: "Post must be at least 5 characters",
        variant: "destructive",
      });
      return;
    }
    createPostMutation.mutate(newPostContent);
  };

  const handleEditPost = (post: FeedItem) => {
    setEditingPost(post);
    setEditContent(post.content || "");
  };

  const handleSaveEdit = () => {
    if (!editingPost) return;
    if (editContent.trim().length < 5) {
      toast({
        description: "Post must be at least 5 characters",
        variant: "destructive",
      });
      return;
    }
    editPostMutation.mutate({ id: editingPost.id, content: editContent });
  };

  const handleDeletePost = (post: FeedItem) => {
    if (confirm("Are you sure you want to delete this post?")) {
      deletePostMutation.mutate(post.id);
    }
  };

  const handleLike = (post: FeedItem) => {
    if (post.type === "post") {
      likeMutation.mutate(post.id);
    }
  };

  const handleShowPost = (post: FeedItem) => {
    if (post.type === "post") {
      setLocation(`/feed/${post.id}`);
    }
  };

  const canEdit = (post: FeedItem) => {
    if (post.type !== "post" || !post.isOwnPost) return false;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return new Date(post.createdAt) > oneHourAgo;
  };

  const renderFeedItem = (item: FeedItem) => {
    const isConnection = item.isFollowing || item.isOwnPost;
    const bgGradient = isConnection
      ? "linear-gradient(135deg, rgba(147, 51, 234, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%)"
      : "linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 58, 138, 0.6) 100%)";

    return (
      <div
        key={`${item.type}-${item.id}`}
        className="rounded-lg p-4 border border-gray-700/50"
        style={{ background: bgGradient }}
        data-testid={`feed-item-${item.id}`}
      >
        <div className="flex gap-3">
          <OptimizedAvatar
            src={item.profileImageUrl || undefined}
            alt={item.name || item.username || "User"}
            fallback={(item.name || item.username || "U").slice(0, 2).toUpperCase()}
            className="h-10 w-10"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-semibold text-white">
                  {item.name || item.username || "Unknown User"}
                </div>
                <div className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  {item.isEdited && <span className="ml-1">(edited)</span>}
                </div>
              </div>
              {item.type === "post" && item.isOwnPost && (
                <div className="flex gap-1">
                  {canEdit(item) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditPost(item)}
                      data-testid={`button-edit-post-${item.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePost(item)}
                    data-testid={`button-delete-post-${item.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div 
              className="mt-2 cursor-pointer"
              onClick={() => item.type === "post" && handleShowPost(item)}
            >
              {item.type === "activity" ? (
                <div>
                  <div className="font-medium text-white">{item.title}</div>
                  {item.description && (
                    <div className="text-sm text-gray-300 mt-1">{item.description}</div>
                  )}
                </div>
              ) : (
                <div className="text-white whitespace-pre-wrap">{item.content}</div>
              )}
            </div>

            {item.type === "post" && (
              <div className="flex gap-4 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(item)}
                  className={`flex items-center gap-2 ${item.isLiked ? "text-pink-500" : "text-gray-400"}`}
                  data-testid={`button-like-${item.id}`}
                >
                  <Heart className={`h-4 w-4 ${item.isLiked ? "fill-current" : ""}`} />
                  <span>{item.likesCount}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleShowPost(item)}
                  className="flex items-center gap-2 text-gray-400"
                  data-testid={`button-comments-${item.id}`}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{item.commentsCount}</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">Feed</h1>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as FeedFilter)}>
          <SelectTrigger className="w-40 bg-gray-800 border-gray-700" data-testid="select-feed-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Posts</SelectItem>
            <SelectItem value="connections">Connections</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg p-4 bg-gray-800/50 border border-gray-700/50">
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </div>
          ))
        ) : feedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-gray-400 mb-4">No posts yet</p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
              data-testid="button-create-first-post"
            >
              Create Your First Post
            </Button>
          </div>
        ) : (
          feedItems.map(renderFeedItem)
        )}
      </div>

      <button
        onClick={() => setShowCreateDialog(true)}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full flex items-center justify-center shadow-lg"
        style={{
          background: "linear-gradient(135deg, #9333ea 0%, #ec4899 100%)",
        }}
        data-testid="button-create-post"
      >
        <Plus className="h-6 w-6 text-white" />
      </button>

      <Drawer open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DrawerContent className="bg-gray-800 border-gray-700">
          <DrawerHeader>
            <DrawerTitle className="text-white">Create Post</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 space-y-4">
            <Textarea
              placeholder="What's on your mind? (minimum 5 characters)"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="min-h-32 bg-gray-900 border-gray-700 text-white resize-none"
              data-testid="input-post-content"
            />
          </div>
          <DrawerFooter>
            <Button
              onClick={handleCreatePost}
              disabled={createPostMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
              data-testid="button-submit-post"
            >
              {createPostMutation.isPending ? "Posting..." : "Post"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setNewPostContent("");
              }}
              data-testid="button-cancel-post"
            >
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Dialog open={!!editingPost} onOpenChange={(open) => !open && setEditingPost(null)}>
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
                  setEditingPost(null);
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
