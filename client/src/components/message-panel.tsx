import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight, Send, ImagePlus, X, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import type { DirectMessage, User, Conversation } from "@shared/schema";

interface MessagePanelProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId?: number;
}

interface ConversationWithUser extends Conversation {
  otherUser: User;
  lastMessage?: DirectMessage;
}

interface MessageWithUser extends DirectMessage {
  sender: User;
  receiver: User;
}

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

export function MessagePanel({ isOpen, onClose, targetUserId }: MessagePanelProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedConversationUserId, setSelectedConversationUserId] = useState<number | null>(targetUserId || null);
  const [newMessage, setNewMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch conversations
  const { data: conversations = [] } = useQuery<ConversationWithUser[]>({
    queryKey: ["/api/conversations"],
    enabled: !!user && isOpen,
  });

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery<MessageWithUser[]>({
    queryKey: ["/api/direct-messages", selectedConversationUserId],
    queryFn: async () => {
      if (!selectedConversationUserId) return [];
      const response = await apiRequest("GET", `/api/direct-messages/${selectedConversationUserId}`);
      return response.json();
    },
    enabled: !!selectedConversationUserId && isOpen,
  });

  // Fetch target user details
  const { data: targetUser } = useQuery<User>({
    queryKey: [`/api/users/${selectedConversationUserId}`],
    enabled: !!selectedConversationUserId && isOpen,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: number; content: string }) => {
      return await apiRequest("POST", "/api/direct-messages", { receiverId, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/direct-messages", selectedConversationUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setNewMessage("");
      setSelectedImage(null);
      setImagePreview(null);
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

  const handleSendMessage = async () => {
    if (!selectedConversationUserId) return;
    
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
    } else if (!content) {
      return; // Don't send empty messages
    }
    
    sendMessageMutation.mutate({
      receiverId: selectedConversationUserId,
      content,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[99999]",
        !isOpen && "pointer-events-none"
      )} 
      onClick={onClose}
      style={{
        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        opacity: isOpen ? 1 : 0,
        backgroundColor: isOpen ? 'rgba(0, 0, 0, 0.5)' : 'transparent'
      }}
    >
      <div 
        className="fixed right-0 top-0 w-full shadow-xl flex flex-col h-full"
        onClick={(e) => e.stopPropagation()}
        style={{
          transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          transform: isOpen ? 'translateX(0%)' : 'translateX(100%)',
          backgroundColor: 'hsl(220, 40%, 12%)'
        }}
      >
        {/* Header */}
        <div className="p-4 border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="text-lg font-semibold">
                {selectedConversationUserId && targetUser 
                  ? (targetUser.name || targetUser.username)
                  : "Messages"
                }
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {selectedConversationUserId && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedConversationUserId(null)}
                  className="text-sm"
                >
                  Back
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {!selectedConversationUserId ? (
          // Conversation List View
          <>
            {/* Search */}
            <div className="p-4">
              <Input
                placeholder="Search conversations"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-muted/50 border-none"
              />
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
                  <p className="text-muted-foreground">
                    Start a conversation with your friends and coaches
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredConversations.map((conversation) => (
                    <div 
                      key={conversation.id}
                      className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedConversationUserId(conversation.otherUser.id)}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {conversation.otherUser.name?.charAt(0) || conversation.otherUser.username?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium truncate">
                            {conversation.otherUser.name || conversation.otherUser.username}
                          </h3>
                          {conversation.lastMessage?.createdAt && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        
                        {conversation.lastMessage && (
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessage.senderId === user?.id ? 'You: ' : ''}
                            {conversation.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          // Individual Conversation View
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Avatar className="h-16 w-16 mb-4">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                      {targetUser?.name?.charAt(0) || targetUser?.username?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-medium mb-2">
                    {targetUser?.name || targetUser?.username}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    @{targetUser?.username}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Send a message to start your conversation
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((message) => {
                    const isFromCurrentUser = message.senderId === user?.id;
                    let imageData: ImageData | null = null;
                    let messageText = message.content;

                    try {
                      if (message.content.startsWith('{')) {
                        const parsed = JSON.parse(message.content);
                        if (parsed.type === 'image_share') {
                          imageData = parsed;
                        }
                      }
                    } catch (e) {
                      // Not JSON, treat as regular message
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
                          {imageData ? (
                            <ImageMessage imageData={imageData} />
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
            <div className="p-4 border-t border-border">
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
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
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
          </>
        )}
      </div>
    </div>
  );
}