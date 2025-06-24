import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MoreVertical, Play, ExternalLink, ImagePlus, Paperclip, X, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useParams, useLocation } from "wouter";
import { useKeyboard } from "@/contexts/keyboard-context";
import type { DirectMessage, User } from "@shared/schema";

interface ExerciseData {
  type: 'exercise_share';
  exerciseId: number;
  exerciseName: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  videoType: 'youtube' | 'upload';
  description: string | null;
}

interface ImageData {
  type: 'image_share';
  imageUrl: string;
  caption?: string;
}

interface LinkPreview {
  type: 'link_preview';
  url: string;
  title?: string;
  description?: string;
  image?: string;
  domain?: string;
}

interface MessageWithUser extends DirectMessage {
  sender: User;
  receiver: User;
}

// Component to render exercise video content in messages
function ExerciseVideoMessage({ exerciseData }: { exerciseData: ExerciseData }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const getYouTubeVideoId = (url: string) => {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const renderVideoPlayer = () => {
    if (exerciseData.videoType === 'youtube' && exerciseData.videoUrl) {
      const videoId = getYouTubeVideoId(exerciseData.videoUrl);
      if (videoId) {
        return (
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            {isPlaying ? (
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div
                className="relative w-full h-full bg-black flex items-center justify-center cursor-pointer"
                onClick={() => setIsPlaying(true)}
              >
                <img
                  src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <Play className="h-12 w-12 text-white" />
                </div>
              </div>
            )}
          </div>
        );
      }
    }

    if (exerciseData.videoType === 'upload' && exerciseData.videoUrl) {
      return (
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          <video
            src={exerciseData.videoUrl}
            controls
            className="w-full h-full object-cover"
            poster={exerciseData.thumbnailUrl || undefined}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="p-3 bg-muted/50 rounded-lg max-w-sm">
      <div className="mb-2">
        <h4 className="font-medium text-sm">{exerciseData.exerciseName}</h4>
        {exerciseData.description && (
          <p className="text-xs text-muted-foreground mt-1">{exerciseData.description}</p>
        )}
      </div>
      
      {renderVideoPlayer()}
      
      <div className="flex items-center gap-2 mt-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => window.open(`/exercise/${exerciseData.exerciseId}`, '_blank')}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          View Details
        </Button>
      </div>
    </div>
  );
}

// Component to render image messages
function ImageMessage({ imageData }: { imageData: ImageData }) {
  return (
    <div className="max-w-sm">
      <img
        src={imageData.imageUrl}
        alt="Shared image"
        className="rounded-lg max-w-full h-auto"
        style={{ maxHeight: "300px" }}
      />
      {imageData.caption && (
        <p className="text-sm mt-2 opacity-90">{imageData.caption}</p>
      )}
    </div>
  );
}

// Component to render link previews
function LinkPreviewMessage({ linkData }: { linkData: LinkPreview }) {
  return (
    <div className="border border-border rounded-lg p-3 max-w-sm bg-muted/50">
      <div className="flex gap-3">
        {linkData.image && (
          <img
            src={linkData.image}
            alt="Link preview"
            className="w-16 h-16 rounded object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground mb-1">
            {linkData.domain}
          </div>
          {linkData.title && (
            <div className="font-medium text-sm mb-1 line-clamp-2">
              {linkData.title}
            </div>
          )}
          {linkData.description && (
            <div className="text-xs text-muted-foreground line-clamp-2">
              {linkData.description}
            </div>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 p-0 h-auto text-xs"
        onClick={() => window.open(linkData.url, '_blank')}
      >
        <ExternalLink className="h-3 w-3 mr-1" />
        Visit Link
      </Button>
    </div>
  );
}

export default function ConversationDetailPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [newMessage, setNewMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setKeyboardVisible } = useKeyboard();

  // Extract userId from URL
  const pathParts = location.split('/');
  const targetUserId = pathParts.length > 2 && pathParts[1] === 'messages' && pathParts[2] 
    ? parseInt(pathParts[2]) 
    : null;

  // Fetch user details
  const { data: targetUser } = useQuery<User>({
    queryKey: [`/api/users/${targetUserId}`],
    enabled: !!targetUserId,
  });

  // Fetch direct messages
  const { data: messages = [] } = useQuery<MessageWithUser[]>({
    queryKey: ["/api/direct-messages", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const response = await apiRequest("GET", `/api/direct-messages/${targetUserId}`);
      return response.json();
    },
    enabled: !!targetUserId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: number; content: string }) => {
      return await apiRequest("POST", "/api/direct-messages", { receiverId, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/direct-messages", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setNewMessage("");
      setSelectedImage(null);
      setImagePreview(null);
      setLinkPreview(null);
    },
  });

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Detect and parse links in message
  const detectLinks = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  // Handle message input change with link detection
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    const links = detectLinks(value);
    if (links.length > 0 && !linkPreview) {
      // Generate simple link preview
      const url = links[0];
      const domain = new URL(url).hostname;
      setLinkPreview({
        type: 'link_preview',
        url,
        domain,
        title: url,
      });
    } else if (links.length === 0 && linkPreview) {
      setLinkPreview(null);
    }
  };

  const handleSendMessage = async () => {
    if (!targetUserId) return;
    
    let content = newMessage.trim();
    
    // Handle image upload first if there's an image
    if (selectedImage) {
      try {
        const uploadResult = await uploadImageMutation.mutateAsync(selectedImage);
        const imageData: ImageData = {
          type: 'image_share',
          imageUrl: uploadResult.url,
          caption: content || undefined,
        };
        content = JSON.stringify(imageData);
      } catch (error) {
        console.error('Failed to upload image:', error);
        return;
      }
    } else if (linkPreview && content) {
      // Include link preview data with the message
      const messageWithLink = {
        text: content,
        linkPreview: linkPreview,
      };
      content = JSON.stringify(messageWithLink);
    } else if (!content) {
      return; // Don't send empty messages
    }
    
    sendMessageMutation.mutate({
      receiverId: targetUserId,
      content,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!targetUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-lg font-medium">Loading conversation...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background fixed inset-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-background fixed top-0 left-0 right-0 z-40">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/conversations")}
          className="p-2"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
        
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {targetUser.name?.charAt(0) || targetUser.username?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h2 className="font-semibold text-base">
            {targetUser.name || targetUser.username}
          </h2>
          <p className="text-sm text-muted-foreground">
            @{targetUser.username}
          </p>
        </div>
        
        <Button variant="ghost" size="sm" className="p-2">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="absolute top-20 bottom-32 left-0 right-0 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Avatar className="h-16 w-16 mb-4">
              <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                {targetUser.name?.charAt(0) || targetUser.username?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-medium mb-2">
              {targetUser.name || targetUser.username}
            </h3>
            <p className="text-muted-foreground mb-4">
              @{targetUser.username}
            </p>
            <p className="text-sm text-muted-foreground">
              Send a message to start your conversation
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isFromCurrentUser = message.senderId === user?.id;
              let exerciseData: ExerciseData | null = null;
              let imageData: ImageData | null = null;
              let linkData: LinkPreview | null = null;
              let messageText = message.content;
              let hasLinkInText = false;

              try {
                if (message.content.startsWith('{')) {
                  const parsed = JSON.parse(message.content);
                  if (parsed.type === 'exercise_share') {
                    exerciseData = parsed;
                  } else if (parsed.type === 'image_share') {
                    imageData = parsed;
                  } else if (parsed.linkPreview) {
                    messageText = parsed.text;
                    linkData = parsed.linkPreview;
                    hasLinkInText = true;
                  }
                }
              } catch (e) {
                // Not JSON, treat as regular message
                // Check if it contains links for basic link detection
                const links = detectLinks(message.content);
                if (links.length > 0) {
                  hasLinkInText = true;
                }
              }

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2 max-w-[85%]",
                    isFromCurrentUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  {!isFromCurrentUser && (
                    <Avatar className="h-8 w-8 mt-auto">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {message.sender?.name?.charAt(0) || message.sender?.username?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 break-words",
                      isFromCurrentUser
                        ? "bg-primary text-primary-foreground ml-2"
                        : "bg-muted mr-2"
                    )}
                  >
                    {exerciseData ? (
                      <ExerciseVideoMessage exerciseData={exerciseData} />
                    ) : imageData ? (
                      <ImageMessage imageData={imageData} />
                    ) : linkData ? (
                      <div>
                        <p className="text-sm whitespace-pre-wrap mb-2">{messageText}</p>
                        <LinkPreviewMessage linkData={linkData} />
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{messageText}</p>
                    )}
                    
                    <p className={cn(
                      "text-xs mt-1 opacity-70",
                      isFromCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {message.createdAt && formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-background fixed bottom-0 left-0 right-0 z-30">
        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-3 relative">
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Image preview"
                className="rounded-lg max-w-32 max-h-32 object-cover"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Link Preview */}
        {linkPreview && (
          <div className="mb-3 relative">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-muted-foreground">Link Preview</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setLinkPreview(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-sm font-medium">{linkPreview.domain}</div>
              <div className="text-xs text-muted-foreground">{linkPreview.url}</div>
            </div>
          </div>
        )}

        <div className="flex gap-2 items-end">
          {/* Attachment Button */}
          <Button
            variant="ghost"
            size="sm"
            className="p-2 h-10 w-10 rounded-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadImageMutation.isPending}
          >
            <ImagePlus className="h-5 w-5" />
          </Button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Message Input */}
          <Input
            placeholder="Message..."
            value={newMessage}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
            onFocus={() => setKeyboardVisible(true)}
            onBlur={() => setKeyboardVisible(false)}
            className="flex-1 rounded-full bg-muted/50 border-none"
          />

          {/* Send Button */}
          <Button
            onClick={handleSendMessage}
            disabled={(!newMessage.trim() && !selectedImage) || sendMessageMutation.isPending || uploadImageMutation.isPending}
            className="rounded-full px-4 h-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}