import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
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
  Image,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import flameLogoPath from "@assets/IMG_4720_1751015409604.png";

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
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
      >
        <X className="h-8 w-8" />
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

interface ChatGroup {
  id: number;
  name: string;
  description?: string;
  image?: string;
  avatar_url?: string;
  is_private: boolean;
  created_by: number;
  created_at: string;
  last_message_at?: string;
  last_message_text?: string;
  message_count: number;
  admin_ids: number[];
  member_count?: number;
}

interface ChatMessage {
  id: number;
  group_id: number;
  user_id: number;
  text: string;
  created_at: string;
  edited_at?: string;
  is_deleted: boolean;
  reply_to_id?: number;
  message_type: 'text' | 'image' | 'file';
  media_url?: string;
  user?: {
    id: number;
    name: string;
    username: string;
    profile_image_url?: string;
  };
}

interface DirectMessage {
  id: number;
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [componentKey, setComponentKey] = useState(Date.now());
  const [localGroups, setLocalGroups] = useState<ChatGroup[]>([]);
  const [viewState, setViewState] = useState<'list' | 'chat'>('list'); // Track which view to show

  const queryClient = useQueryClient();

  // Fetch chat groups with proper caching
  const { data: chatGroups = [], isLoading: groupsLoading, refetch: refetchGroups } = useQuery({
    queryKey: ['/api/chat/groups'],
    queryFn: async () => {
      console.log('Fetching chat groups...');
      
      const response = await fetch('/api/chat/groups', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Chat groups data:', data);
      setLocalGroups(data);
      return data;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: false, // Don't refetch when component mounts if data exists
  });

  const activeGroups = localGroups.length > 0 ? localGroups : chatGroups;

  // Handle popstate and chat data updates
  useEffect(() => {
    const handleLocationChange = () => {
      setRefreshKey(prev => prev + 1);
      setComponentKey(Date.now());
    };

    const handleChatDataUpdate = async () => {
      console.log('Chat data update event received');
      setRefreshKey(prev => prev + 1);
      
      // Force fetch fresh data and update local state immediately
      try {
        const response = await apiRequest('GET', '/api/chat/groups');
        const freshData = await response.json();
        console.log('Fresh groups data:', freshData);
        setLocalGroups(freshData);
      } catch (error) {
        console.error('Error fetching fresh groups:', error);
      }
      
      refetchGroups();
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('chatDataUpdated', handleChatDataUpdate);
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('chatDataUpdated', handleChatDataUpdate);
    };
  }, [refetchGroups]);

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
    enabled: !!selectedChat,
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; isPrivate?: boolean }) => {
      const response = await apiRequest('POST', '/api/chat/groups', data);
      return response.json();
    },
    onSuccess: () => {
      setShowCreateGroup(false);
      refetchGroups();
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { text: string }) => {
      if (!selectedChat) return;
      const endpoint = selectedChat.type === 'group'
        ? `/api/chat/groups/${selectedChat.id}/messages`
        : `/api/chat/direct/${selectedChat.id}/messages`;
      const response = await apiRequest('POST', endpoint, data);
      return response.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({
        queryKey: selectedChat?.type === 'group' 
          ? ['/api/chat/groups', selectedChat.id, 'messages']
          : ['/api/chat/direct', selectedChat?.id, 'messages']
      });
    }
  });

  const handleSendMessage = () => {
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
  const filteredGroups = activeGroups.filter((group: ChatGroup) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showCreateGroup) {
    return <CreateGroupForm onCancel={() => setShowCreateGroup(false)} onSubmit={createGroupMutation.mutate} />;
  }

  // Handle chat selection - keep components in memory
  const handleSelectChat = (chat: { type: 'group' | 'direct'; id: number }) => {
    console.log('Selecting chat:', chat);
    setSelectedChat(chat);
    setViewState('chat'); // Switch to chat view without unmounting
  };

  // Handle back to channel list - keep components in memory
  const handleBackToList = () => {
    console.log('Back button clicked!');
    setViewState('list'); // Switch to list view without unmounting
    // Don't clear selectedChat immediately - let it persist in memory
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      {/* Channel List View - Always mounted but conditionally visible */}
      <div 
        className={`absolute inset-0 w-full h-full transition-transform duration-300 ease-in-out ${
          viewState === 'list' ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div key={`chat-page-${componentKey}`} className="flex flex-col w-full h-full" style={{
          background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 70%, #4a148c 90%, #7b1fa2 100%)'
        }}>
          {/* Header */}
          <div className="p-4 border-b border-gray-600/30 flex-shrink-0 bg-black/20 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              {/* Logo and Home Link */}
              <div className="flex-shrink-0">
                <Link href="/" className="block">
                  <img 
                    src={flameLogoPath} 
                    alt="TrackLit Logo" 
                    className="h-12 w-12 hover:opacity-80 transition-opacity"
                  />
                </Link>
              </div>

              {/* Title */}
              <div className="flex-1">
                <h1 className="text-xl font-semibold text-white">Chats</h1>
              </div>

              {/* Create Group Button */}
              <Button 
                onClick={() => setShowCreateGroup(true)}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white border-none"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Group
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-600/30 bg-black/10 backdrop-blur-sm flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Chat List - Full Width */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-0" key={`chat-list-${refreshKey}-${JSON.stringify(chatGroups)}`}>
              {(groupsLoading && chatGroups.length === 0) || (conversationsLoading && conversations.length === 0) ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  {filteredGroups.map((group: ChatGroup, index: number) => (
                    <div key={`${group.id}-${group.name}-${group.description}-${refreshKey}`} className="relative">
                      <button
                        onClick={() => handleSelectChat({ type: 'group', id: group.id })}
                        className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={group.image || group.avatar_url} />
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
                              <h3 className="font-medium text-white truncate">{group.name}</h3>
                              <span className="text-xs text-gray-400">
                                {group.last_message_at ? formatLastMessageTime(group.last_message_at) : ''}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-300 truncate">
                                {group.last_message_text || group.description || 'No messages yet'}
                              </p>
                              
                              {/* Message Count Badge */}
                              {group.message_count > 0 && (
                                <Badge variant="secondary" className="ml-2 bg-blue-500 text-white text-xs px-2 py-1">
                                  {group.message_count}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                      
                      {/* Thin gray divider that stops before the channel image */}
                      {index < filteredGroups.length - 1 && (
                        <div className="ml-16 mr-4 border-b border-gray-400/50" style={{ borderWidth: '0.5px', opacity: '0.5' }} />
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* Empty State - Only show when not loading and no data */}
              {!groupsLoading && !conversationsLoading && filteredGroups.length === 0 && conversations.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <MessageCircle className="h-16 w-16 mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No chats yet</h3>
                  <p className="text-center">Create a group or start a conversation to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Chat Interface View - Always mounted but conditionally visible */}
      <div 
        className={`absolute inset-0 w-full h-full transition-transform duration-300 ease-in-out ${
          viewState === 'chat' ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedChat && (
          <ChatInterface selectedChat={selectedChat} onBack={handleBackToList} />
        )}
      </div>
    </div>
  );
};

// Create Group Form Component
const CreateGroupForm = ({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (data: any) => void }) => {
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
    <div className="fixed inset-0 flex flex-col w-screen h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="p-4 border-b border-gray-600/30 flex items-center gap-4">
        <Button onClick={onCancel} size="sm" variant="ghost" className="text-white">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-xl font-semibold text-white">Create Group</h1>
      </div>
      
      <div className="flex-1 p-4">
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Group Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              className="bg-gray-800/50 border-gray-600/50 text-white"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="bg-gray-800/50 border-gray-600/50 text-white"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="private"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="private" className="text-sm text-white">
              Private group
            </label>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" onClick={onCancel} variant="outline">
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Create Group
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Chat Interface Component
const ChatInterface = ({ selectedChat, onBack }: { selectedChat: { type: 'group' | 'direct'; id: number }; onBack: () => void }) => {
  const [messageText, setMessageText] = useState("");
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user');
      return response.json();
    }
  });

  // Fetch messages for selected chat
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
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
    enabled: !!selectedChat,
  });

  // Fetch group details if it's a group chat
  const { data: groupDetails } = useQuery({
    queryKey: ['/api/chat/groups', selectedChat.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/chat/groups/${selectedChat.id}`);
      return response.json();
    },
    enabled: selectedChat.type === 'group',
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { text: string }) => {
      if (!selectedChat) return;
      const endpoint = selectedChat.type === 'group'
        ? `/api/chat/groups/${selectedChat.id}/messages`
        : `/api/chat/direct/${selectedChat.id}/messages`;
      const response = await apiRequest('POST', endpoint, data);
      return response.json();
    },
    onSuccess: () => {
      setMessageText("");
      refetchMessages();
    }
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedChat) return;
    
    sendMessageMutation.mutate({ text: messageText.trim() });
  };

  // Auto scroll to bottom when new messages arrive
  useLayoutEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
    }
  }, [messages]);

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className="flex flex-col w-full h-full" style={{
      background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 70%, #4a148c 90%, #7b1fa2 100%)'
    }}>
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-600/30 flex-shrink-0 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button onClick={onBack} size="sm" variant="ghost" className="text-white p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage src={groupDetails?.image || groupDetails?.avatar_url} />
              <AvatarFallback className="bg-blue-500 text-white">
                {groupDetails?.name?.slice(0, 2).toUpperCase() || 'CH'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-white">
                {groupDetails?.name || `Chat ${selectedChat.id}`}
              </h3>
              <p className="text-sm text-gray-400">
                {groupDetails?.member_count ? `${groupDetails.member_count} members` : 'Private chat'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedChat.type === 'group' && (
              <Link href={`/group-settings/${selectedChat.id}`}>
                <Button size="sm" variant="ghost" className="text-white">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messagesLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <MessageCircle className="h-16 w-16 mb-4 text-gray-300" />
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message: ChatMessage) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={currentUser?.id === message.user_id}
              currentUser={currentUser}
              onImageClick={setFullScreenImage}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-600/30 bg-black/20 backdrop-blur-sm flex-shrink-0">
        <div className="flex gap-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Full Screen Image Viewer */}
      <FullScreenImageViewer
        src={fullScreenImage || ''}
        isOpen={!!fullScreenImage}
        onClose={() => setFullScreenImage(null)}
      />
    </div>
  );
};

// Message Bubble Component
interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  currentUser?: any;
  onImageClick?: (imageUrl: string) => void;
}

const MessageBubble = ({ message, isOwn, currentUser, onImageClick }: MessageBubbleProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const handleLongPressStart = () => {
    const timer = setTimeout(() => {
      setShowMenu(true);
    }, 500); // 500ms long press
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleMenuAction = (action: string) => {
    setShowMenu(false);
    // TODO: Implement menu actions (reply, edit, delete, etc.)
    console.log(`Menu action: ${action} for message ${message.id}`);
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 relative`}>
      {/* Profile Image for received messages */}
      {!isOwn && (
        <div className="flex-shrink-0 mr-3">
          <Avatar className="h-8 w-8">
            {message.user?.profile_image_url ? (
              <AvatarImage 
                src={message.user.profile_image_url} 
                alt={message.user.name}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs font-medium">
              {message.user?.name?.slice(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      <div 
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwn 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-700 text-white'
        }`}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
      >
        {!isOwn && message.user && (
          <div className="text-xs text-gray-300 mb-1 font-medium">
            {message.user.name}
          </div>
        )}
        
        {message.message_type === 'image' && message.media_url ? (
          <div className="mb-2">
            <img 
              src={message.media_url} 
              alt="Shared image" 
              className="max-w-full h-auto rounded cursor-pointer"
              onClick={() => onImageClick?.(message.media_url!)}
            />
          </div>
        ) : null}
        
        <div className="text-sm">{message.text}</div>
        <div className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
          {formatMessageTime(message.created_at)}
        </div>
      </div>

      {/* Long Press Menu */}
      {showMenu && (
        <div className="absolute top-0 right-0 bg-gray-800 rounded-lg shadow-lg z-50 py-2 min-w-[120px]">
          <button 
            onClick={() => handleMenuAction('reply')}
            className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 text-sm"
          >
            Reply
          </button>
          {isOwn && (
            <>
              <button 
                onClick={() => handleMenuAction('edit')}
                className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 text-sm"
              >
                Edit
              </button>
              <button 
                onClick={() => handleMenuAction('delete')}
                className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 text-sm"
              >
                Delete
              </button>
            </>
          )}
          <button 
            onClick={() => setShowMenu(false)}
            className="w-full px-4 py-2 text-left text-gray-400 hover:bg-gray-700 text-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatPage;