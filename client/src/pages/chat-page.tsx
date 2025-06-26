import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  MessageCircle, 
  Users, 
  Send, 
  Plus, 
  Search,
  MoreVertical,
  Hash,
  Lock,
  Globe,
  ArrowLeft,
  Edit,
  Trash,
  Reply,
  X,
  Image
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

// Full-screen image viewer component
const FullScreenImageViewer = ({ 
  src, 
  isOpen, 
  onClose 
}: { 
  src: string; 
  isOpen: boolean; 
  onClose: () => void; 
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-60"
        onClick={onClose}
      >
        <X size={32} />
      </button>
      <img
        src={src}
        alt="Full screen view"
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

// Simple image compression utility
const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = document.createElement('img');
    
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      let newWidth = maxWidth;
      let newHeight = maxWidth / aspectRatio;
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        quality
      );
    };
    
    img.src = URL.createObjectURL(file);
  });
};

interface ChatGroup {
  id: number;
  name: string;
  description?: string;
  avatar_url?: string;
  creator_id: number;
  admin_ids?: number[];
  member_ids?: number[];
  is_private: boolean;
  invite_code?: string;
  created_at: string;
  last_message_at?: string;
  last_message?: string;
  message_count?: number;
}

interface ChatMessage {
  id: number;
  group_id: number;
  user_id: number;
  sender_name: string;
  sender_username?: string;
  sender_profile_image?: string;
  text: string;
  created_at: string;
  edited_at?: string;
  is_edited?: boolean;
  reply_to_id?: number;
  message_type: 'text' | 'image' | 'file' | 'system';
  media_url?: string;
}

interface DirectMessage {
  id: number;
  conversationId: number;
  senderId: number;
  receiverId: number;
  text: string;
  createdAt: string;
  editedAt?: string;
  isDeleted: boolean;
  isRead: boolean;
  readAt?: string;
  replyToId?: number;
  reply_to_id?: number;
  messageType: 'text' | 'image' | 'file';
  mediaUrl?: string;
}

interface Conversation {
  id: number;
  user1Id: number;
  user2Id: number;
  lastMessageId?: number;
  lastMessageAt: string;
  createdAt: string;
}

const ChatPage = () => {
  const [selectedChat, setSelectedChat] = useState<{ type: 'group' | 'direct'; id: number } | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch chat groups
  const { data: chatGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['/api/chat/groups'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/chat/groups');
      return response.json();
    }
  });

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/conversations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/conversations');
      return response.json();
    }
  });

  // Fetch messages for selected chat
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: selectedChat?.type === 'group' 
      ? ['/api/chat/groups', selectedChat.id, 'messages']
      : ['/api/chat/direct', selectedChat?.id, 'messages'],
    queryFn: async () => {
      if (!selectedChat) return [];
      const endpoint = selectedChat.type === 'group'
        ? `/api/chat/groups/${selectedChat.id}/messages`
        : `/api/chat/direct/${selectedChat.id}/messages`;
      const response = await apiRequest('GET', endpoint);
      return response.json();
    },
    enabled: !!selectedChat
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ text, replyToId }: { text: string; replyToId?: number }) => {
      if (!selectedChat) throw new Error("No chat selected");
      
      const endpoint = selectedChat.type === 'group'
        ? `/api/chat/groups/${selectedChat.id}/messages`
        : `/api/chat/direct/${selectedChat.id}/messages`;
      
      const response = await apiRequest('POST', endpoint, { text, replyToId });
      return response.json();
    },
    onSuccess: () => {
      setMessageText("");
      if (selectedChat) {
        const queryKey = selectedChat.type === 'group' 
          ? ['/api/chat/groups', selectedChat.id, 'messages']
          : ['/api/chat/direct', selectedChat.id, 'messages'];
        queryClient.invalidateQueries({ queryKey });
        
        // Also invalidate chat lists to update last message
        queryClient.invalidateQueries({ queryKey: ['/api/chat/groups'] });
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      }
    }
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: { name: string; description?: string; isPrivate: boolean }) => {
      const response = await apiRequest('POST', '/api/chat/groups', groupData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups'] });
      setShowCreateGroup(false);
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChat) return;
    
    sendMessageMutation.mutate({ text: messageText.trim() });
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return formatMessageTime(timestamp);
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Filter chats based on search
  const filteredGroups = chatGroups.filter((group: ChatGroup) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showCreateGroup) {
    return <CreateGroupForm onCancel={() => setShowCreateGroup(false)} onSubmit={createGroupMutation.mutate} />;
  }

  // Show chat interface if a chat is selected
  if (selectedChat) {
    return <ChatInterface selectedChat={selectedChat} onBack={() => setSelectedChat(null)} />;
  }

  return (
    <div className="fixed inset-0 bg-white flex flex-col w-screen h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold text-gray-900">Chats</h1>
          <Button
            size="sm"
            onClick={() => setShowCreateGroup(true)}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Chat List - Full Width */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-100">
          {groupsLoading || conversationsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {filteredGroups.map((group: ChatGroup) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedChat({ type: 'group', id: group.id })}
                  className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={group.avatar_url} />
                        <AvatarFallback className="bg-blue-500 text-white">
                          {group.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Privacy Indicator */}
                      {group.is_private ? (
                        <Lock className="absolute -bottom-1 -right-1 h-3 w-3 text-gray-500" />
                      ) : (
                        <Globe className="absolute -bottom-1 -right-1 h-3 w-3 text-green-500" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 truncate">{group.name}</h3>
                        <span className="text-xs text-gray-500">
                          {group.last_message_at ? formatLastMessageTime(group.last_message_at) : ''}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 truncate">
                          {group.last_message || "No messages yet"}
                        </p>
                        <div className="flex items-center space-x-1">
                          <Badge variant="secondary" className="text-xs">
                            {group.member_ids?.length || 0}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Empty State */}
          {filteredGroups.length === 0 && conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <MessageCircle className="h-16 w-16 mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No chats yet</h3>
              <p className="text-center">Create a group or start a conversation to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Message Bubble Component
interface MessageBubbleProps {
  message: ChatMessage | DirectMessage;
  isOwn: boolean;
  currentUser?: any;
  onReply?: (message: ChatMessage | DirectMessage) => void;
  allMessages?: (ChatMessage | DirectMessage)[];
  onImageClick?: (imageUrl: string) => void;
}

const MessageBubble = ({ message, isOwn, currentUser, onReply, allMessages, onImageClick }: MessageBubbleProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [startPosition, setStartPosition] = useState<{ x: number; y: number } | null>(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [menuPosition, setMenuPosition] = useState<'bottom' | 'top'>('bottom');
  const [lastTap, setLastTap] = useState<number>(0);
  const [reactionAnimation, setReactionAnimation] = useState(false);
  const [reactions, setReactions] = useState<any[]>([]);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Fetch reactions for this message
  const messageType = (message as any).group_id || (message as any).groupId ? 'group' : 'direct';
  const { data: messageReactions } = useQuery({
    queryKey: ['reactions', message.id, messageType],
    queryFn: async () => {
      const response = await fetch(`/api/chat/messages/${message.id}/${messageType}/reactions`);
      if (!response.ok) return [];
      return response.json();
    },
    staleTime: 30000, // 30 seconds
  });

  // Reaction mutation
  const reactionMutation = useMutation({
    mutationFn: async ({ messageId, messageType, emoji }: { messageId: number; messageType: string; emoji: string }) => {
      const response = await apiRequest('POST', `/api/chat/messages/${messageId}/${messageType}/reactions`, { emoji });
      if (!response.ok) {
        throw new Error('Failed to toggle reaction');
      }
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Reaction toggled:', data);
      // Show animation for successful reaction
      setReactionAnimation(true);
      setTimeout(() => setReactionAnimation(false), 1000);
      
      // Invalidate reactions query to refresh the display
      queryClient.invalidateQueries({ queryKey: ['reactions', message.id, messageType] });
    },
    onError: (error) => {
      console.error('Error toggling reaction:', error);
    }
  });

  const handleReaction = () => {
    // Prevent multiple reactions if one is already in progress
    if (reactionMutation.isPending) {
      return;
    }
    
    // Detect message type based on message properties
    const messageType = (message as any).group_id || (message as any).groupId ? 'group' : 'direct';
    reactionMutation.mutate({
      messageId: message.id,
      messageType,
      emoji: '👍'
    });
  };

  const handlePressStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setStartPosition({ x: clientX, y: clientY });
    setHasScrolled(false);
    
    // Handle double-tap for reactions
    const currentTime = Date.now();
    const timeDiff = currentTime - lastTap;
    
    if (timeDiff < 300 && timeDiff > 0) {
      // Double tap detected - add thumbs up reaction
      handleReaction();
      setLastTap(0);
      return;
    }
    
    setLastTap(currentTime);
    
    const timer = setTimeout(() => {
      if (!hasScrolled) {
        // Check if menu would go below viewport
        if (bubbleRef.current) {
          const bubbleRect = bubbleRef.current.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const menuHeight = 80; // Approximate menu height
          
          // If bubble is in bottom third of viewport, show menu above
          if (bubbleRect.bottom + menuHeight > viewportHeight - 50) {
            setMenuPosition('top');
          } else {
            setMenuPosition('bottom');
          }
        }
        setShowMenu(true);
      }
    }, 500); // 500ms for long press
    setLongPressTimer(timer);
  };

  const handlePressMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!startPosition) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = Math.abs(clientX - startPosition.x);
    const deltaY = Math.abs(clientY - startPosition.y);
    
    // If moved more than 10px in any direction, consider it scrolling
    if (deltaX > 10 || deltaY > 10) {
      setHasScrolled(true);
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
    }
  };

  const handlePressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setStartPosition(null);
    setHasScrolled(false);
  };

  const startEdit = () => {
    setIsEditing(true);
    const messageText = (message as any).text || (message as any).content || '';
    setEditedText(messageText);
    setShowMenu(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditedText('');
  };

  const editMutation = useMutation({
    mutationFn: async ({ messageId, text }: { messageId: number; text: string }) => {
      const response = await apiRequest('PUT', `/api/chat/messages/${messageId}`, { text });
      if (!response.ok) {
        throw new Error('Failed to edit message');
      }
      return response.json();
    },
    onSuccess: (updatedMessage) => {
      console.log('Edit success, updated message:', updatedMessage);
      
      // Update only the specific message in cache without full refetch
      queryClient.setQueryData(['/api/chat/groups', 1, 'messages'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((msg: any) => 
          msg.id === updatedMessage.id ? {
            ...msg,
            text: updatedMessage.text,
            edited_at: updatedMessage.edited_at,
            is_edited: true
          } : msg
        ).sort((a: any, b: any) => {
          const timeA = new Date(a.created_at).getTime();
          const timeB = new Date(b.created_at).getTime();
          return timeA - timeB;
        });
      });
      
      setIsEditing(false);
      setEditedText('');
    },
    onError: (error) => {
      console.error('Error editing message:', error);
    }
  });

  const saveEdit = () => {
    if (!editedText.trim()) return;
    editMutation.mutate({ messageId: message.id, text: editedText.trim() });
  };

  const getProfileImage = () => {
    if (isOwn && currentUser) {
      return currentUser.profileImageUrl;
    }
    if ('sender_profile_image' in message) {
      return message.sender_profile_image;
    }
    return null;
  };

  const getSenderName = () => {
    if (isOwn && currentUser) {
      return currentUser.name || currentUser.username;
    }
    if ('sender_name' in message) {
      return String(message.sender_name);
    }
    return 'Unknown';
  };

  return (
    <div className={cn(
      "flex w-full mb-4 items-end gap-2 relative",
      isOwn ? "justify-end" : "justify-start"
    )}>
      {/* Profile Image for other users (left side) */}
      {!isOwn && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={getProfileImage() || undefined} />
          <AvatarFallback className="bg-gray-400 text-white text-xs">
            {getSenderName().slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className="flex flex-col max-w-xs lg:max-w-md">
        <div 
          ref={bubbleRef}
          className={cn(
            "min-w-[100px] px-3 py-2 rounded-2xl bg-white text-black border border-gray-200 relative",
            isOwn 
              ? "rounded-br-none" 
              : "rounded-bl-none",
            ((message as any).edited_at || (message as any).editedAt) && "animate-pulse duration-1000"
          )}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onMouseMove={handlePressMove}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onTouchCancel={handlePressEnd}
          onTouchMove={handlePressMove}
        >
          {!isOwn && 'sender_name' in message && (
            <div className="text-xs font-medium mb-1 text-gray-600">
              {getSenderName()}
            </div>
          )}
          
          {/* Reply Preview */}
          {('reply_to_id' in message && message.reply_to_id) && (
            <div className="mb-2 p-2 bg-gray-100 border-l-2 border-blue-500 rounded-r">
              <div className="text-xs text-gray-600 font-medium">
                Replying to message
              </div>
              <div className="text-xs text-gray-700 truncate">
                {allMessages?.find((m: ChatMessage | DirectMessage) => m.id === message.reply_to_id)?.text || 'Original message'}
              </div>
            </div>
          )}
          
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit}>Save</Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Image content */}
              {(message as any).message_type === 'image' && (message as any).media_url && (
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={(message as any).media_url}
                    alt="Shared image"
                    className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ maxHeight: '450px', maxWidth: '288px' }}
                    onClick={() => onImageClick?.((message as any).media_url)}
                    loading="lazy"
                  />
                </div>
              )}
              
              {/* Text content */}
              {((message as any).text || (message as any).content) && (
                <div className="text-sm break-words">
                  {(message as any).text || (message as any).content || ''}
                </div>
              )}
            </div>
          )}
          
          {/* Context Menu */}
          {showMenu && (
            <div className={cn(
              "absolute right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-1",
              menuPosition === 'bottom' ? "top-full -mt-1" : "bottom-full mb-1"
            )}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  onReply?.(message);
                  setShowMenu(false);
                }}
                className="flex items-center gap-2 w-full justify-start"
              >
                <Reply className="h-3 w-3" />
                Reply
              </Button>
              {isOwn && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={startEdit}
                  className="flex items-center gap-2 w-full justify-start"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Right-aligned timestamp */}
        <div className="text-[8px] mt-1 text-gray-500 text-right">
          {formatTime('created_at' in message ? message.created_at : message.createdAt)}
          {((message as any).edited_at || (message as any).editedAt) && (
            <span className="ml-1">(edited)</span>
          )}
        </div>
        
        {/* Persistent Reactions Display */}
        {messageReactions && messageReactions.length > 0 && (
          <div className={cn(
            "flex flex-wrap gap-1 mt-1",
            isOwn ? "justify-end" : "justify-start"
          )}>
            {messageReactions.map((reaction: any, index: number) => (
              <div
                key={`${reaction.emoji}-${index}`}
                className="bg-gray-100 border border-gray-200 rounded-full px-2 py-1 flex items-center gap-1 text-xs shadow-sm"
              >
                <span>{reaction.emoji}</span>
                <span className="text-gray-600 font-medium">{reaction.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Profile Image for current user (right side) */}
      {isOwn && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={getProfileImage() || undefined} />
          <AvatarFallback className="bg-blue-400 text-white text-xs">
            {getSenderName().slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      
      {/* Reaction Animation - positioned on the bubble edge */}
      {reactionAnimation && (
        <div className={cn(
          "absolute pointer-events-none z-50 transition-all duration-300",
          isOwn 
            ? "-bottom-2 -right-1" 
            : "-bottom-2 -left-1"
        )}>
          <div className="relative animate-bounce">
            {/* Main reaction bubble with enhanced depth */}
            <div className="relative bg-white rounded-full shadow-xl border border-gray-300 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center">
              {/* Gradient overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-50 rounded-full opacity-80"></div>
              
              {/* Emoji */}
              <div className="relative text-xl leading-none">👍</div>
              
              {/* Shine effect */}
              <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full opacity-60"></div>
            </div>
            
            {/* Drop shadow */}
            <div className="absolute inset-0 bg-black opacity-10 rounded-full blur-sm transform translate-y-1 -z-10"></div>
            
            {/* Subtle connecting line to message */}
            <div className={cn(
              "absolute top-1/2 w-1 h-1 bg-gray-300 rounded-full transform -translate-y-1/2 opacity-50",
              isOwn ? "right-full mr-1" : "left-full ml-1"
            )}></div>
          </div>
        </div>
      )}
      
      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

// Chat Interface Component
interface ChatInterfaceProps {
  selectedChat: { type: 'group' | 'direct'; id: number };
  onBack: () => void;
}

const ChatInterface = ({ selectedChat, onBack }: ChatInterfaceProps) => {
  const [messageText, setMessageText] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showAttachmentPane, setShowAttachmentPane] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  const queryClient = useQueryClient();

  // Image compression function
  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = document.createElement('img');
      
      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob!], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle image selection
  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Compress the image
      const compressedFile = await compressImage(file);
      setSelectedImage(compressedFile);
      
      // Create preview
      const previewUrl = URL.createObjectURL(compressedFile);
      setImagePreview(previewUrl);
      setShowAttachmentPane(false);
    } catch (error) {
      console.error('Error processing image:', error);
    }
  };

  // Clear selected image
  const clearSelectedImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user');
      return response.json();
    }
  });

  // Fetch chat groups for group name
  const { data: chatGroups = [] } = useQuery({
    queryKey: ['/api/chat/groups'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/chat/groups');
      return response.json();
    }
  });

  // Fetch messages for selected chat with improved caching
  const { data: messagesData = [], isLoading: messagesLoading } = useQuery({
    queryKey: selectedChat.type === 'group' 
      ? ['/api/chat/groups', selectedChat.id, 'messages']
      : ['/api/chat/direct', selectedChat.id, 'messages'],
    queryFn: async () => {
      const endpoint = selectedChat.type === 'group'
        ? `/api/chat/groups/${selectedChat.id}/messages`
        : `/api/chat/direct/${selectedChat.id}/messages`;
      const response = await apiRequest('GET', endpoint);
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    refetchOnReconnect: false // Don't refetch on network reconnect
  });

  // Sort messages by creation time to ensure newest appear at bottom
  const messages = messagesData.sort((a: any, b: any) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return timeA - timeB;
  });

  // Track if we've scrolled to bottom for this chat already
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  // Reset scroll flag when changing chats
  useEffect(() => {
    setHasScrolledToBottom(false);
  }, [selectedChat.id]);

  // Scroll to bottom only on initial chat entry or new messages for current user
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0 && !hasScrolledToBottom) {
      const scrollToBottom = () => {
        if (messagesContainerRef.current) {
          const container = messagesContainerRef.current;
          container.scrollTop = container.scrollHeight + 100;
          setHasScrolledToBottom(true);
        }
      };

      setTimeout(scrollToBottom, 50);
    }
  }, [messages, hasScrolledToBottom]);

  // Auto-scroll for new messages from current user
  useEffect(() => {
    if (hasScrolledToBottom && messages.length > 0 && messagesContainerRef.current) {
      const lastMessage = messages[messages.length - 1];
      const currentUserId = currentUser?.id;
      
      // Only auto-scroll if the last message is from current user (they sent it)
      if (lastMessage.user_id === currentUserId) {
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight + 100;
          }
        }, 50);
      }
    }
  }, [messages, hasScrolledToBottom, currentUser?.id]);

  // Send message mutation with optimistic updates
  const sendMessageMutation = useMutation({
    mutationFn: async ({ text, replyToId, image }: { text?: string; replyToId?: number; image?: File }) => {
      const endpoint = selectedChat.type === 'group'
        ? `/api/chat/groups/${selectedChat.id}/messages`
        : `/api/chat/direct/${selectedChat.id}/messages`;
      
      if (image) {
        // Compress image before upload
        const compressedImage = await compressImage(image, 800, 0.8);
        
        // Upload compressed image using FormData
        const formData = new FormData();
        formData.append('image', compressedImage);
        if (text) formData.append('text', text);
        if (replyToId) formData.append('replyToId', replyToId.toString());
        formData.append('messageType', 'image');
        
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        return response.json();
      } else {
        // Send text message
        const payload: any = { text };
        if (replyToId) {
          payload.replyToId = replyToId;
        }
        
        const response = await apiRequest('POST', endpoint, payload);
        return response.json();
      }
    },
    onMutate: async ({ text, replyToId, image }) => {
      // Cancel any outgoing refetches
      const queryKey = selectedChat.type === 'group' 
        ? ['/api/chat/groups', selectedChat.id, 'messages']
        : ['/api/chat/direct', selectedChat.id, 'messages'];
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(queryKey);

      // Optimistically update with new message
      if (text && !image) {
        const optimisticMessage = {
          id: Date.now(), // Temporary ID
          group_id: selectedChat.type === 'group' ? selectedChat.id : undefined,
          user_id: currentUser?.id,
          sender_name: currentUser?.name || 'You',
          sender_profile_image: currentUser?.profileImageUrl,
          text: text,
          created_at: new Date().toISOString(),
          reply_to_id: replyToId,
          message_type: 'text' as const,
          isOptimistic: true // Flag to identify optimistic updates
        };

        queryClient.setQueryData(queryKey, (old: any[] = []) => [...old, optimisticMessage]);
      }

      return { previousMessages };
    },
    onSuccess: () => {
      setMessageText("");
      setReplyingTo(null);
      clearSelectedImage();
      // Refetch to get the real message with server ID
      const queryKey = selectedChat.type === 'group' 
        ? ['/api/chat/groups', selectedChat.id, 'messages']
        : ['/api/chat/direct', selectedChat.id, 'messages'];
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        const queryKey = selectedChat.type === 'group' 
          ? ['/api/chat/groups', selectedChat.id, 'messages']
          : ['/api/chat/direct', selectedChat.id, 'messages'];
        queryClient.setQueryData(queryKey, context.previousMessages);
      }
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !selectedImage) return;
    
    sendMessageMutation.mutate({ 
      text: messageText.trim() || undefined,
      replyToId: replyingTo?.id,
      image: selectedImage || undefined
    });
  };
  
  const selectedGroup = chatGroups.find((group: ChatGroup) => group.id === selectedChat.id);

  return (
    <div className="fixed inset-0 bg-white flex flex-col w-screen h-screen">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              console.log('Back button clicked!');
              onBack();
            }}
            className="p-3 hover:bg-gray-100 rounded-full flex-shrink-0 bg-gray-50 border border-gray-200"
            type="button"
          >
            <ArrowLeft className="h-6 w-6 text-gray-900" />
          </button>
          
          <Avatar className="h-8 w-8">
            <AvatarImage src={selectedGroup?.avatar_url} />
            <AvatarFallback className="bg-blue-500 text-white text-sm">
              {selectedGroup?.name.slice(0, 2).toUpperCase() || 'CH'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">
              {selectedGroup?.name || 'Chat'}
            </h2>
            <p className="text-sm text-gray-500">
              {selectedGroup?.member_ids?.length || 0} members
            </p>
          </div>
          
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="space-y-4">
          {messagesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <MessageCircle className="h-16 w-16 mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
              <p className="text-center">Be the first to send a message!</p>
            </div>
          ) : (
            messages.map((message: ChatMessage) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.user_id === currentUser?.id}
                currentUser={currentUser}
                onReply={(message) => setReplyingTo(message as ChatMessage)}
                allMessages={messages}
                onImageClick={setFullScreenImage}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
        {/* Reply Preview */}
        {replyingTo && (
          <div className="mb-3 bg-gray-50 border-l-4 border-blue-500 p-3 rounded-r-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 font-medium">
                  Replying to {('sender_name' in replyingTo) ? replyingTo.sender_name : 'Unknown'}
                </p>
                <p className="text-sm text-gray-800 truncate">
                  {(replyingTo as any).text || (replyingTo as any).content || ''}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyingTo(null)}
                className="ml-2 p-1 h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-3 p-3 bg-gray-100 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Image Preview</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelectedImage}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-48 max-h-48 rounded-lg object-cover"
              />
            </div>
          </div>
        )}

        {/* Attachment Pane */}
        {showAttachmentPane && !imagePreview && (
          <div className="mb-3 p-4 bg-gray-100 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Add Attachment</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAttachmentPane(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="h-6 w-6 text-blue-500" />
                <span className="text-xs">Photo</span>
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAttachmentPane(!showAttachmentPane)}
            className="p-2 h-10 w-10 flex-shrink-0"
          >
            <Plus className="h-5 w-5 text-gray-500" />
          </Button>
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
            className="flex-1 text-black"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            type="submit"
            disabled={(!messageText.trim() && !selectedImage) || sendMessageMutation.isPending}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>

      {/* Full-screen image viewer */}
      <FullScreenImageViewer 
        src={fullScreenImage || ''}
        isOpen={!!fullScreenImage}
        onClose={() => setFullScreenImage(null)}
      />
    </div>
  );
};

// Create Group Form Component
interface CreateGroupFormProps {
  onCancel: () => void;
  onSubmit: (data: { name: string; description?: string; isPrivate: boolean }) => void;
}

const CreateGroupForm = ({ onCancel, onSubmit }: CreateGroupFormProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      isPrivate
    });
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col w-screen h-screen">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Create Group</h1>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter group description"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="isPrivate" className="text-sm text-gray-700">
              Make this group private
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()} className="flex-1 bg-blue-500 hover:bg-blue-600">
              Create Group
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;