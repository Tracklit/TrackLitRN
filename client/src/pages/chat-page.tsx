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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MessageCircle, 
  Users, 
  Send, 
  Plus, 
  Search,
  Hash,
  Lock,
  Globe,
  ArrowLeft,
  Edit,
  Trash,
  Reply,
  X,
  Image,
  Settings,
  ArrowDown,
  ChevronDown,
  MoreVertical,
  LogOut,
  Ban
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "@/hooks/use-auth";
import flameLogoPath from "@assets/IMG_4720_1751015409604.png";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import { OptimizedMessageImage } from "@/components/ui/optimized-message-image";


// Global image cache to prevent reloading
const imageCache = new Map<string, HTMLImageElement>();

// Preload and cache image
const preloadImage = (src: string): Promise<HTMLImageElement> => {
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src)!);
  }
  
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
};

// Static cached avatar component
const MessageAvatar = ({ user }: { user?: any }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (user?.profile_image_url) {
      // Check if image is already cached
      if (imageCache.has(user.profile_image_url)) {
        setImageSrc(user.profile_image_url);
        setImageLoaded(true);
      } else {
        // Preload and cache the image
        preloadImage(user.profile_image_url)
          .then(() => {
            setImageSrc(user.profile_image_url);
            setImageLoaded(true);
          })
          .catch(() => {
            // Keep showing initials if image fails
          });
      }
    }
  }, [user?.profile_image_url]);

  return (
    <div className="h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center relative">
      {imageLoaded && imageSrc && (
        <img 
          src={imageSrc}
          alt={user?.name}
          className="h-full w-full object-cover absolute inset-0"
          style={{ display: 'block' }}
        />
      )}
      <div className="text-white font-medium text-xs flex items-center justify-center h-full w-full">
        {user?.name?.slice(0, 2).toUpperCase() || 'U'}
      </div>
    </div>
  );
};

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

interface ChatChannel {
  id: number;
  name: string;
  description?: string;
  image?: string;
  avatar_url?: string;
  is_private: boolean;
  is_public: boolean;
  created_by: number;
  owner_id: number;
  created_at: string;
  last_message_at?: string;
  last_message_text?: string;
  last_message?: string;
  message_count: number;
  admin_ids: number[];
  member_count?: number;
  members?: Array<{
    id: number;
    name: string;
    username: string;
  }>;
  channel_type: 'group' | 'direct';
  other_user_id?: number;
  is_member: boolean;
  is_admin: boolean;
  is_owner: boolean;
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
  message_type: 'text' | 'image' | 'file' | 'system';
  media_url?: string;
  reactions?: Array<{
    emoji: string;
    count: number;
    users?: number[];
  }>;
  reply_to_message?: {
    id: number;
    text: string;
    message_type: string;
    user: {
      id: number;
      name: string;
    };
  };
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
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const [showConnectionsList, setShowConnectionsList] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);

  // Removed refreshKey to prevent unnecessary re-renders and image reloading
  const [localChannels, setLocalChannels] = useState<ChatChannel[]>([]);
  const [viewState, setViewState] = useState<'list' | 'chat'>('list'); // Track which view to show
  const [searchBarVisible, setSearchBarVisible] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  // Removed animation state - no more slide animations
  const [groupFilter, setGroupFilter] = useState<'my' | 'public'>('my'); // Filter for groups

  
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if we're on a chat route (but exclude settings routes)
  const isChatRoute = (location.startsWith('/chat') || location.startsWith('/chats')) && !location.includes('/settings');
  
  // Removed animation logic - no more entrance/exit animations

  // Scroll handler to track position
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    setIsAtTop(container.scrollTop <= 5);
  };

  // Touch/drag handlers for search bar with overscroll detection
  const handleTouchStart = (e: React.TouchEvent) => {
    const container = e.currentTarget as HTMLElement;
    const touch = e.touches[0];
    setDragStartY(touch.clientY);
    
    // Don't set dragging state immediately - wait for actual movement
    if (container.scrollTop === 0) {
      // Just store the start position, don't set dragging yet
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const container = e.currentTarget as HTMLElement;
    const touch = e.touches[0];
    const deltaY = touch.clientY - dragStartY;
    
    // Handle downward pulls when at top to show search bar
    if (container.scrollTop === 0 && deltaY > 20 && !searchBarVisible) {
      if (!isDragging) {
        setIsDragging(true);
      }
      
      e.preventDefault(); // Prevent bounce scroll
      e.stopPropagation();
      
      const offset = Math.min(deltaY - 20, 100); // Subtract 20px threshold
      setDragOffset(Math.max(0, offset));
      
      // Show search bar when pulled down enough
      if (offset > 40) {
        setSearchBarVisible(true);
      }
    }
    // Handle upward drags when search bar is visible to hide it
    else if (searchBarVisible && deltaY < -20) {
      if (!isDragging) {
        setIsDragging(true);
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      // Hide search bar on upward drag
      setSearchBarVisible(false);
      setIsDragging(false);
      setDragOffset(0);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setDragOffset(0);
    setDragStartY(0);
    
    // For showing search bar: keep visible if pulled far enough during drag
    if (!searchBarVisible && dragOffset >= 70) {
      setSearchBarVisible(true);
    }
    // For hiding search bar: already handled in touchMove
  };



  // Fetch chat channels (groups + direct messages) with proper caching
  const { data: chatChannels = [], isLoading: channelsLoading, refetch: refetchChannels } = useQuery({
    queryKey: ['/api/chat/groups'],
    queryFn: async () => {
      console.log('Fetching chat channels...');
      
      const response = await fetch('/api/chat/groups', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Chat channels data:', data);
      setLocalChannels(data);
      return data;
    },
    staleTime: Infinity, // Never consider data stale to prevent image reloading
    gcTime: Infinity, // Keep in cache permanently
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: false, // Don't refetch when component mounts if data exists
    refetchOnReconnect: false, // Don't refetch on reconnect
  });

  // Fetch unread message counts per group
  const { data: unreadCounts = {} } = useQuery({
    queryKey: ['/api/chat/groups/unread-counts'],
    queryFn: async () => {
      const response = await fetch('/api/chat/groups/unread-counts', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds to keep counts current
  });

  const activeChannels = localChannels.length > 0 ? localChannels : chatChannels;
  
  // Filter channels based on the toggle selection and search query
  const filteredChannels = activeChannels?.filter((channel: any) => {
    // First apply group filter (my vs public)
    let matchesFilter = false;
    if (groupFilter === 'my') {
      // Show groups where user is a member, admin, or owner
      const isMember = channel.is_member || false;
      const isAdmin = channel.is_admin || false;
      const isOwner = channel.is_owner || false;
      matchesFilter = isMember || isAdmin || isOwner;
    } else {
      // Show all public groups (not private)
      matchesFilter = !channel.is_private;
    }
    
    // Then apply search filter
    const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  }) || [];

  // Handle chat data updates only - stable component to prevent image reloading
  useEffect(() => {
    const handleChatDataUpdate = async () => {
      console.log('Chat data update event received');
      
      // Update local state without triggering component refresh
      try {
        const response = await apiRequest('GET', '/api/chat/groups');
        const freshData = await response.json();
        console.log('Fresh channels data:', freshData);
        setLocalChannels(freshData);
      } catch (error) {
        console.error('Error fetching fresh channels:', error);
      }
      
      // Don't refetch to prevent image reloading - local state update is sufficient
    };

    window.addEventListener('chatDataUpdated', handleChatDataUpdate);
    
    return () => {
      window.removeEventListener('chatDataUpdated', handleChatDataUpdate);
    };
  }, [refetchChannels]);

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
  // Group creation is now handled on dedicated page







  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async (data: { messageId: number; text: string }) => {
      if (!selectedChat) return;
      const response = await apiRequest('PATCH', `/api/chat/groups/${selectedChat.id}/messages/${data.messageId}`, {
        text: data.text
      });
      return response.json();
    },
    onSuccess: () => {
      setMessageText("");
      setEditingMessage(null);
      queryClient.invalidateQueries({
        queryKey: selectedChat?.type === 'group' 
          ? ['/api/chat/groups', selectedChat.id, 'messages']
          : ['/api/chat/direct', selectedChat?.id, 'messages']
      });
    }
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedChat) return;
    
    if (editingMessage) {
      // Edit existing message
      editMessageMutation.mutate({ 
        messageId: editingMessage.id, 
        text: messageText.trim() 
      });
    } else {
      // Send new message - handled in ChatInterface component
      console.log('Message sending handled in ChatInterface component');
    }
  };

  const handleEditMessage = (message: ChatMessage) => {
    setEditingMessage(message);
    setMessageText(message.text || '');
    setReplyToMessage(null);
  };

  const handleReplyToMessage = (message: ChatMessage) => {
    setReplyToMessage(message);
    setEditingMessage(null);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setMessageText("");
  };

  const formatMessageTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
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

  // Deduplicate channels and filter based on search
  const uniqueChannels = activeChannels.reduce((acc: ChatChannel[], current: ChatChannel) => {
    const existing = acc.find(channel => channel.id === current.id);
    if (!existing) {
      acc.push(current);
    }
    return acc;
  }, []);





  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const response = await apiRequest('PATCH', `/api/chat/groups/${groupId}/mark-read`);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate unread counts to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups/unread-counts'] });
    }
  });

  // Handle chat selection - keep components in memory
  const handleSelectChat = (chat: { type: 'group' | 'direct'; id: number }) => {
    console.log('Selecting chat:', chat);
    setSelectedChat(chat);
    setViewState('chat'); // Switch to chat view without unmounting
    
    // Mark messages as read when entering a group
    if (chat.type === 'group') {
      markAsReadMutation.mutate(chat.id);
    }
  };

  // Handle back to channel list - keep components in memory
  const handleBackToList = () => {
    console.log('Back button clicked!');
    setViewState('list'); // Switch to list view without unmounting
    // Don't clear selectedChat immediately - let it persist in memory
  };

  // Handle direct message creation
  const handleDirectMessage = async (userId: number) => {
    try {
      // Create or get existing conversation
      const response = await apiRequest('POST', '/api/conversations', {
        body: JSON.stringify({ otherUserId: userId })
      });
      
      if (response.ok) {
        const conversation = await response.json();
        // Select the direct message chat
        setSelectedChat({ type: 'direct', id: conversation.id });
        setViewState('chat');
      }
    } catch (error) {
      console.error('Error creating direct message:', error);
    }
  };

  return (
    <div className={`w-full h-full overflow-hidden bg-slate-900 ${
      !isChatRoute ? 'translate-x-full' : 'translate-x-0'
    } ${isChatRoute ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Channel List View - Always mounted but conditionally visible */}
      <div 
        className={`absolute inset-0 w-full h-full bg-slate-900 ${
          viewState === 'list' ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col w-full h-full bg-slate-900">
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

              {/* Toggle Filter and Create Group Button - Right Aligned */}
              <div className="flex items-center space-x-3 ml-auto">
                {/* Group Filter Toggle */}
                <div className="flex bg-gray-800/50 rounded-md p-0.5 h-8">
                  <button
                    onClick={() => setGroupFilter('my')}
                    className={cn(
                      "px-2 py-1.5 text-xs font-medium rounded-sm transition-all h-7 flex items-center",
                      groupFilter === 'my'
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                    )}
                  >
                    My Chats
                  </button>
                  <button
                    onClick={() => setGroupFilter('public')}
                    className={cn(
                      "px-2 py-1.5 text-xs font-medium rounded-sm transition-all h-7 flex items-center",
                      groupFilter === 'public'
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                    )}
                  >
                    Public Chats
                  </button>
                </div>

                {/* Create Chat Button */}
                <button
                  onClick={() => setShowCreateOptions(true)}
                  className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
                  aria-label="Create new chat"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar - pushes content down when visible */}
          <div 
            className="w-full overflow-hidden transition-all duration-300 ease-out bg-slate-900/95 backdrop-blur-sm border-b border-gray-600/30"
            style={{ 
              height: isDragging 
                ? `${Math.min(dragOffset, 60)}px` 
                : searchBarVisible 
                  ? '60px' 
                  : '0px'
            }}
          >
            <div className="p-4 h-full flex items-center">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  autoFocus={searchBarVisible}
                />
              </div>
            </div>
          </div>

          {/* Chat List - Mobile Touch Only */}
          <div 
            className="flex-1 overflow-y-auto relative"
            onScroll={handleScroll}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Pull-to-reveal indicator at top */}
            <div className="absolute top-0 left-0 right-0 h-6 flex items-center justify-center z-20 bg-gradient-to-b from-slate-800/50 to-transparent">
              {isDragging ? (
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="text-xs text-blue-400 font-medium">Release to search</div>
                </div>
              ) : isAtTop ? (
                <div className="flex items-center gap-2 opacity-30">
                  <div className="w-6 h-0.5 bg-gray-600 rounded-full"></div>
                  <div className="text-xs text-gray-600">Pull down to search</div>
                </div>
              ) : null}
            </div>
            {/* Spacing between pull indicator and chat list */}
            <div className="h-8"></div>
            <div className="space-y-0">
              {(channelsLoading && chatChannels.length === 0) || (conversationsLoading && conversations.length === 0) ? (
                <div className="space-y-0">
                  {/* Channel skeleton loaders */}
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-full p-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="h-12 w-12 rounded-full bg-gray-600 animate-pulse"></div>
                          <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-gray-700 animate-pulse"></div>
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className={`h-4 bg-gray-600 rounded animate-pulse ${i % 3 === 0 ? 'w-24' : i % 3 === 1 ? 'w-32' : 'w-20'}`}></div>
                            <div className="h-3 bg-gray-700 rounded animate-pulse w-12"></div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className={`h-3 bg-gray-700 rounded animate-pulse ${i % 2 === 0 ? 'w-40' : 'w-28'}`}></div>
                            {i % 3 === 0 && <div className="h-5 w-5 rounded-full bg-red-500/50 animate-pulse"></div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {filteredChannels.map((channel: ChatChannel, index: number) => (
                    <div key={`channel-${channel.id}-${index}`} className="relative">
                      <button
                        onClick={() => handleSelectChat({ type: channel.channel_type, id: channel.id })}
                        className="w-full p-4 text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <OptimizedAvatar
                              src={channel.avatar_url}
                              fallback={channel.name.slice(0, 2).toUpperCase()}
                              size="md"
                              lazy={true}
                            />
                            
                            {/* Privacy Indicator */}
                            {channel.is_private ? (
                              <Lock className="absolute -bottom-1 -right-1 h-3 w-3 text-gray-500" />
                            ) : (
                              <Globe className="absolute -bottom-1 -right-1 h-3 w-3 text-green-500" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-white truncate">{channel.name}</h3>
                              <span className="text-xs text-gray-400">
                                {channel.last_message_at ? formatLastMessageTime(channel.last_message_at) : ''}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-300 truncate">
                                {channel.last_message_text || channel.description || 'No messages yet'}
                              </p>
                              
                              {/* Unread Message Count Badge - only show for members with unread messages */}
                              {(() => {
                                const unreadCount = unreadCounts[channel.id] || 0;
                                // Only show badge if user has unread messages in this group
                                return unreadCount > 0 && (
                                  <Badge variant="secondary" className="ml-2 bg-red-500 text-white text-xs px-2 py-1">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                  </Badge>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </button>
                      
                      {/* Thin gray divider that stops before the channel image */}
                      {index < filteredChannels.length - 1 && (
                        <div className="ml-16 mr-4 border-b border-gray-400/50" style={{ borderWidth: '0.5px', opacity: '0.5' }} />
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* Empty State - Only show when not loading and no data */}
              {!channelsLoading && !conversationsLoading && filteredChannels.length === 0 && conversations.length === 0 && (
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
        className={`absolute inset-0 w-full h-full ${
          viewState === 'chat' ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedChat && (
          <ChatInterface selectedChat={selectedChat} onBack={handleBackToList} />
        )}
      </div>

      {/* Create Options Modal */}
      {showCreateOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-slate-800 rounded-lg p-6 mx-4 w-full max-w-sm">
            <h2 className="text-xl font-bold text-white mb-4">Create New Chat</h2>
            <div className="space-y-3">
              <Link href="/create-group" className="block">
                <button 
                  onClick={() => setShowCreateOptions(false)}
                  className="w-full p-3 bg-slate-700 rounded-lg text-white text-left hover:bg-slate-600 transition-colors"
                >
                  <span className="font-medium">Create a Chat</span>
                  <p className="text-sm text-gray-300 mt-1">Start a new group conversation</p>
                </button>
              </Link>
              <button 
                onClick={() => {
                  setShowCreateOptions(false);
                  setShowConnectionsList(true);
                }}
                className="w-full p-3 bg-slate-700 rounded-lg text-white text-left hover:bg-slate-600 transition-colors"
              >
                <span className="font-medium">Message Connection</span>
                <p className="text-sm text-gray-300 mt-1">Send a direct message to a connection</p>
              </button>
            </div>
            <button 
              onClick={() => setShowCreateOptions(false)}
              className="w-full mt-3 px-3 py-1 text-left text-gray-400 hover:bg-gray-700 text-sm rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Connections List Modal */}
      {showConnectionsList && (
        <ConnectionsList
          onClose={() => setShowConnectionsList(false)}
          onMessageUser={(userId) => {
            setShowConnectionsList(false);
            // Handle direct message creation
            handleDirectMessage(userId);
          }}
        />
      )}
    </div>
  );
};



// Chat Interface Component
const ChatInterface = ({ selectedChat, onBack }: { selectedChat: { type: 'group' | 'direct'; id: number }; onBack: () => void }) => {
  const [messageText, setMessageText] = useState("");
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const hasInitiallyLoadedRef = useRef(false);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Leave chat mutation
  const leaveChatMutation = useMutation({
    mutationFn: async () => {
      if (!selectedChat || selectedChat.type !== 'group') return;
      const response = await apiRequest('DELETE', `/api/chat/groups/${selectedChat.id}/members/${user?.id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Left chat",
        description: "You have successfully left the chat group.",
      });
      onBack(); // Go back to chat list
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to leave the chat. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Block user mutation
  const blockUserMutation = useMutation({
    mutationFn: async () => {
      if (!selectedChat || selectedChat.type !== 'direct') return;
      const response = await apiRequest('POST', `/api/chat/direct/${selectedChat.id}/block`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User blocked",
        description: "You have blocked this user. No more messages can be sent.",
      });
      onBack(); // Go back to chat list
      queryClient.invalidateQueries({ queryKey: ['/api/chat/direct'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to block the user. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
  });

  // Send message mutation with minimal re-renders
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { text?: string; image?: File; replyToId?: number }) => {
      if (!selectedChat) return;
      const endpoint = selectedChat.type === 'group'
        ? `/api/chat/groups/${selectedChat.id}/messages`
        : `/api/chat/direct/${selectedChat.id}/messages`;
      
      // Create FormData for file uploads
      const formData = new FormData();
      if (data.text) {
        formData.append('text', data.text);
      }
      if (data.image) {
        formData.append('image', data.image);
        formData.append('messageType', 'image');
      }
      if (data.replyToId) {
        formData.append('replyToId', data.replyToId.toString());
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      // Keep input focused during state updates
      const input = messageInputRef.current;
      const wasFocused = document.activeElement === input;
      
      // Clear form state
      setMessageText("");
      setReplyToMessage(null);
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Restore focus immediately if it was focused
      if (wasFocused && input) {
        // Use requestAnimationFrame to ensure DOM updates are complete
        requestAnimationFrame(() => {
          input.focus();
        });
      }
      
      // Refresh messages
      queryClient.invalidateQueries({
        queryKey: selectedChat?.type === 'group' 
          ? ['/api/chat/groups', selectedChat.id, 'messages']
          : ['/api/chat/direct', selectedChat?.id, 'messages']
      });
      
      // Scroll to bottom after message is sent and DOM updates
      setTimeout(() => {
        scrollToBottom(false);
      }, 100);
    }
  });

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



  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async (data: { messageId: number; text: string }) => {
      if (!selectedChat) return;
      const response = await apiRequest('PATCH', `/api/chat/groups/${selectedChat.id}/messages/${data.messageId}`, {
        text: data.text
      });
      return response.json();
    },
    onSuccess: () => {
      setMessageText("");
      setEditingMessage(null);
      queryClient.invalidateQueries({
        queryKey: selectedChat?.type === 'group' 
          ? ['/api/chat/groups', selectedChat.id, 'messages']
          : ['/api/chat/direct', selectedChat?.id, 'messages']
      });
    }
  });

  // Image handling functions
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const cancelReply = () => {
    setReplyToMessage(null);
  };

  const handleSendMessage = async () => {
    if ((!messageText.trim() && !selectedImage) || !selectedChat) return;
    
    if (editingMessage) {
      // Edit existing message
      editMessageMutation.mutate({ 
        messageId: editingMessage.id, 
        text: messageText.trim() 
      });
      setEditingMessage(null);
      setMessageText("");
      
      // Keep input focused after editing (native-style behavior)
      setTimeout(() => {
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
      }, 50);
    } else {
      // Send new message
      const messageData: any = {
        text: messageText.trim()
      };
      
      if (selectedImage) {
        messageData.image = selectedImage;
      }
      
      if (replyToMessage) {
        messageData.replyToId = replyToMessage.id;
      }
      
      sendMessageMutation.mutate(messageData);
      setMessageText("");
      setReplyToMessage(null);
      removeSelectedImage();
      
      // Keep input focused after sending (Telegram-style behavior)
      setTimeout(() => {
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
      }, 50);
      
      // Scroll to bottom after sending (immediate for local feedback)
      scrollToBottom(false);
    }
  };



  const cancelEdit = () => {
    setEditingMessage(null);
    setMessageText("");
  };

  // Define the handler functions
  const handleReplyToMessage = (message: ChatMessage) => {
    setReplyToMessage(message);
  };

  const handleEditMessage = (message: ChatMessage) => {
    // Since we're using native input method instead of inline editing,
    // this function sets up the message for editing in the main input field
    console.log("Edit message requested:", message.id);
    // TODO: Implement native input editing functionality
  };

  const handleDirectMessage = async (userId: number) => {
    try {
      // Create or get a conversation between the current user and the selected user
      const response = await fetch('/api/conversations/create', {
        method: 'POST',
        body: JSON.stringify({ otherUserId: userId }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      const conversation = await response.json();
      
      if (conversation.id) {
        // Navigate to the direct message conversation
        // This will be handled by the existing chat system
        queryClient.invalidateQueries({ queryKey: ['/api/chat/groups'] });
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      }
    } catch (error) {
      console.error('Error creating direct message:', error);
    }
  };

  // Check scroll position to show/hide scroll-to-bottom button
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold
    setShowScrollToBottom(!isAtBottom);
  }, []);

  // Enhanced scroll to bottom function that accounts for keyboard
  const scrollToBottom = useCallback((immediate: boolean = false) => {
    const container = messagesContainerRef.current;
    if (container) {
      // Calculate scroll position accounting for keyboard
      const scrollTop = container.scrollHeight - container.clientHeight;
      
      if (immediate) {
        container.scrollTop = scrollTop;
      } else {
        container.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      }
      setShowScrollToBottom(false);
    }
  }, []);

  // Telegram-style keyboard detection with exact pixel tracking
  useEffect(() => {
    let initialViewportHeight = window.visualViewport?.height || window.innerHeight;
    let rafId: number | null = null;
    
    const handleViewportChange = () => {
      // Cancel any pending animation frame
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      // Use requestAnimationFrame for smooth updates
      rafId = requestAnimationFrame(() => {
        const currentViewportHeight = window.visualViewport?.height || window.innerHeight;
        const heightDiff = initialViewportHeight - currentViewportHeight;
        
        // Set keyboard height to exact pixel difference
        // Only consider it a keyboard if height difference is substantial (>50px)
        if (heightDiff > 50) {
          setKeyboardHeight(heightDiff);
        } else {
          setKeyboardHeight(0);
        }
      });
    };

    // Store initial viewport height
    const updateInitialHeight = () => {
      initialViewportHeight = window.visualViewport?.height || window.innerHeight;
    };

    // Listen for visual viewport changes (most reliable for keyboard detection)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    } else {
      // Fallback for browsers without visualViewport support
      window.addEventListener('resize', handleViewportChange);
    }

    // Update initial height when page loads or regains focus
    window.addEventListener('focus', updateInitialHeight);
    window.addEventListener('pageshow', updateInitialHeight);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleViewportChange);
      }
      
      window.removeEventListener('focus', updateInitialHeight);
      window.removeEventListener('pageshow', updateInitialHeight);
    };
  }, []);

  // Force scroll to bottom immediately after DOM paint
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (!hasInitiallyLoadedRef.current && messages.length > 0) {
      // Jump to bottom immediately after layout, no scroll animation
      container.scrollTop = container.scrollHeight;
      hasInitiallyLoadedRef.current = true;
      setShowScrollToBottom(false);
    }
  }, [messages]);

  // Auto-scroll when keyboard height changes (Telegram-style)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (keyboardHeight > 0) {
      // Keyboard appeared - immediately scroll to bottom to keep messages above keyboard
      // Use RAF to ensure DOM has updated with new keyboard height
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight - container.clientHeight;
      });
    } else {
      // Keyboard disappeared - maintain current scroll position
      // No need to auto-scroll when keyboard closes
    }
  }, [keyboardHeight]);

  // Reset initial load flag when changing channels
  useEffect(() => {
    hasInitiallyLoadedRef.current = false;
    setShowScrollToBottom(false);
  }, [selectedChat.id]);





  const formatMessageTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-900">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-600/30 flex-shrink-0 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button onClick={onBack} size="sm" variant="ghost" className="text-white p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              {groupDetails ? (
                <>
                  <h3 className="font-medium text-white">
                    {groupDetails.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {groupDetails.member_count ? `${groupDetails.member_count} members` : 'Private chat'}
                  </p>
                </>
              ) : (
                <>
                  <div className="h-5 bg-gray-600 rounded animate-pulse w-32"></div>
                  <div className="h-4 bg-gray-700 rounded animate-pulse w-20 mt-1"></div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(selectedChat.type === 'group' || selectedChat.type === 'direct') && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div 
                    className="p-2 cursor-pointer hover:bg-white/10 rounded-lg relative z-10"
                    onClick={() => console.log('THREE DOT MENU CLICKED!')}
                  >
                    <MoreVertical className="h-4 w-4 text-white" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {selectedChat.type === 'group' && (
                    <>
                      {(() => {
                        console.log('Debug admin check:', {
                          user: user,
                          userId: user?.id,
                          groupDetails: groupDetails,
                          isAdmin: groupDetails?.is_admin,
                          isOwner: groupDetails?.is_owner,
                          adminIds: groupDetails?.admin_ids,
                          includesUser: user?.id && groupDetails?.admin_ids?.includes(user.id),
                          finalResult: groupDetails?.is_admin || groupDetails?.is_owner || (user?.id && groupDetails?.admin_ids?.includes(user.id))
                        });
                        return true; // TEMPORARILY SHOWING FOR ALL USERS FOR TESTING
                      })() && (
                        <DropdownMenuItem
                          onClick={() => {
                            console.log('Navigating to settings for channel:', selectedChat.id);
                            setLocation(`/chats/channels/${selectedChat.id}/settings`);
                          }}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => {
                          if (confirm('Are you sure you want to leave this chat?')) {
                            leaveChatMutation.mutate();
                          }
                        }}
                        className="text-red-600"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Leave Chat
                      </DropdownMenuItem>
                    </>
                  )}
                  {selectedChat.type === 'direct' && (
                    <DropdownMenuItem
                      onClick={() => {
                        if (confirm('Are you sure you want to block this user? You will no longer be able to send or receive messages.')) {
                          blockUserMutation.mutate();
                        }
                      }}
                      className="text-red-600"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Block User
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef} 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onScroll={handleScroll}
        style={{
          // Telegram-style: Move entire container up by keyboard height
          transform: keyboardHeight > 0 ? `translateY(-${keyboardHeight}px)` : 'none',
          transition: 'transform 0.15s ease-out',
          paddingBottom: '16px'
        }}
      >
        {messagesLoading ? (
          <div className="space-y-4">
            {/* Message skeleton loaders */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                  <div className="h-8 w-8 rounded-full bg-gray-600 animate-pulse flex-shrink-0"></div>
                  <div className="space-y-2">
                    <div className={`h-4 bg-gray-600 rounded animate-pulse ${i % 3 === 0 ? 'w-32' : i % 3 === 1 ? 'w-48' : 'w-24'}`}></div>
                    <div className={`h-4 bg-gray-700 rounded animate-pulse ${i % 2 === 0 ? 'w-20' : 'w-36'}`}></div>
                  </div>
                </div>
              </div>
            ))}
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
              onReply={handleReplyToMessage}
              onEdit={handleEditMessage}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollToBottom && (
        <div className="absolute bottom-24 right-4 z-10">
          <Button
            onClick={scrollToBottom}
            size="sm"
            variant="ghost"
            className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg border-2 border-blue-500"
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Edit/Reply Preview */}
      {(editingMessage || replyToMessage) && (
        <div className="p-3 bg-gray-700/50 border-t border-gray-600/30 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-400 mb-1">
              {editingMessage ? 'Editing message' : `Replying to ${replyToMessage?.user?.name || 'Unknown'}`}
            </div>
            <div className="text-sm text-gray-300 truncate">
              {editingMessage ? editingMessage.text : replyToMessage?.text}
            </div>
          </div>
          <Button
            onClick={() => editingMessage ? cancelEdit() : cancelReply()}
            size="sm"
            variant="ghost"
            className="text-gray-400 hover:text-white flex-shrink-0 ml-2"
          >
            ×
          </Button>
        </div>
      )}

      {/* Message Input */}
      <div 
        className="p-4 border-t border-gray-600/30 bg-black/20 backdrop-blur-sm flex-shrink-0"
        style={{
          // Telegram-style: Move input bar up by keyboard height
          transform: keyboardHeight > 0 ? `translateY(-${keyboardHeight}px)` : 'none',
          transition: 'transform 0.15s ease-out'
        }}
      >
        {/* Reply Preview */}
        {replyToMessage && (
          <div className="mb-3 bg-gray-800/50 border-l-4 border-blue-500 p-3 rounded-r-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-300 font-medium">
                  Replying to {replyToMessage.user?.name}
                </p>
                <p className="text-sm text-gray-400 truncate">
                  {replyToMessage.message_type === 'image' ? '📷 Photo' : replyToMessage.text}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelReply}
                className="ml-2 p-1 h-6 w-6 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-3 p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">Image Preview</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeSelectedImage}
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-w-full h-auto max-h-32 rounded object-cover"
            />
          </div>
        )}

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSendMessage();
          }}
          className="flex gap-2 items-end"
        >
          {/* Image Upload Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-2 h-10 w-10 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadImageMutation.isPending}
          >
            <Image className="h-5 w-5" />
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
          <input
            ref={messageInputRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={
              editingMessage 
                ? "Edit message..." 
                : replyToMessage 
                  ? `Reply to ${replyToMessage.user?.name}...` 
                  : "Type a message..."
            }
            className="flex-1 bg-gray-800/50 border border-gray-600/50 text-white placeholder-gray-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            autoComplete="off"
            autoCorrect="on" 
            autoCapitalize="sentences"
            spellCheck="true"
            inputMode="text"
            enterKeyHint="send"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />

          {/* Send Button */}
          <Button 
            type="submit"
            disabled={(!messageText.trim() && !selectedImage) || sendMessageMutation.isPending || editMessageMutation.isPending || uploadImageMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {editingMessage ? <Edit className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
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
  onReply?: (message: ChatMessage) => void;
  onEdit?: (message: ChatMessage) => void;
}

const MessageBubble = ({ message, isOwn, currentUser, onImageClick, onReply, onEdit }: MessageBubbleProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastTap, setLastTap] = useState(0);
  const [showReaction, setShowReaction] = useState(false);
  
  // Check if this is a system message
  const isSystemMessage = message.message_type === 'system';
  
  const queryClient = useQueryClient();
  
  const formatMessageTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Generic reaction mutation that accepts any emoji
  const addReactionMutation = useMutation({
    mutationFn: async (emoji: string) => {
      const response = await apiRequest('POST', `/api/chat/groups/${message.group_id}/messages/${message.id}/reactions`, {
        emoji
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Show animation briefly and then refetch to show persistent emoji
      setShowReaction(true);
      setTimeout(() => {
        setShowReaction(false);
        // Refetch messages to show the persistent reaction without scroll jump
        queryClient.invalidateQueries({ queryKey: ['/api/chat/groups', message.group_id, 'messages'] });
      }, 1000);
    }
  });

  // Double tap handler for thumbs up
  const handleDoubleTap = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap detected - add thumbs up reaction
      addReactionMutation.mutate('👍');
      console.log(`Double tap reaction on message ${message.id}`);
    }
    setLastTap(now);
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
    
    switch (action) {
      case 'edit':
        if (isOwn) {
          onEdit?.(message);
        }
        break;
      case 'reply':
        onReply?.(message);
        console.log(`Reply to message ${message.id}`);
        break;
      case 'reactions':
        setShowEmojiPicker(true);
        break;
      case 'delete':
        // TODO: Implement delete functionality
        console.log(`Delete message ${message.id}`);
        break;
      default:
        console.log(`Menu action: ${action} for message ${message.id}`);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    addReactionMutation.mutate(emoji);
    setShowEmojiPicker(false);
  };

  // Early return for system messages - render as centered text without bubble
  if (isSystemMessage) {
    return (
      <div className="flex justify-center mb-4">
        <div className="text-center text-gray-400 text-sm italic px-4 py-2">
          {message.text}
          <div className="text-xs text-gray-500 mt-1">
            {formatMessageTime(message.created_at)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 relative items-end`}>
      {/* Profile Image for received messages */}
      {!isOwn && (
        <div className="flex-shrink-0 mr-3">
          <MessageAvatar user={message.user} />
        </div>
      )}
      
      <div 
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
          isOwn 
            ? 'bg-white text-black shadow-md' 
            : 'bg-gray-700 text-white'
        }`}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        onClick={handleDoubleTap}
      >
        {/* Speech bubble tail pointing to profile image at bottom */}
        {isOwn ? (
          // Tail pointing right (to own profile image on the right) at bottom
          <div className="absolute bottom-2 -right-2 w-0 h-0 border-l-8 border-l-white border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
        ) : (
          // Tail pointing left (to other user's profile image on the left) at bottom  
          <div className="absolute bottom-2 -left-2 w-0 h-0 border-r-8 border-r-gray-700 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
        )}
        {!isOwn && message.user && (
          <div className="text-xs text-gray-300 mb-1 font-medium">
            {message.user.name}
          </div>
        )}
        
        {/* Reply Preview */}
        {message.reply_to_message && (
          <div className="mb-2 p-2 bg-gray-100 border-l-4 border-blue-500 rounded text-sm">
            <div className="text-xs text-gray-600 mb-1">
              Replying to {message.reply_to_message.user.name}
            </div>
            <div className="text-gray-800 truncate">
              {message.reply_to_message.message_type === 'image' ? '📷 Photo' : message.reply_to_message.text}
            </div>
          </div>
        )}

        {message.message_type === 'image' && message.media_url ? (
          <div className="mb-2 cursor-pointer" onClick={() => onImageClick?.(message.media_url!)}>
            <OptimizedMessageImage
              src={message.media_url}
              alt="Shared image"
              className="rounded-lg"
              lazy={true}
              maxWidth={300}
              maxHeight={400}
            />
          </div>
        ) : null}
        
        {/* Message content */}
        <div className="text-sm">{message.text}</div>
        
        {/* Timestamp and Reactions Container */}
        <div className="flex items-center justify-between mt-2">
          <div className={`text-xs ${isOwn ? 'text-gray-500' : 'text-gray-400'}`}>
            {formatMessageTime(message.created_at)}
            {(message as any).edited_at && (
              <span className="ml-1 italic">(edited)</span>
            )}
          </div>
          
          {/* Persistent Reaction Circles - positioned next to timestamp */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex gap-1 ml-3">
              {message.reactions.map((reaction: any, index: number) => (
                <div key={index} className="bg-white rounded-full shadow-sm border border-gray-300 p-1 min-w-[24px] min-h-[24px] flex items-center justify-center">
                  <span className="text-xs">{reaction.emoji}</span>
                  {reaction.count > 1 && (
                    <span className="text-xs text-gray-600 ml-1">{reaction.count}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reaction Animation - positioned below timestamp row */}
        {showReaction && (
          <div className="absolute -bottom-3 left-2 pointer-events-none z-20 transition-all duration-1000">
            <div className="animate-bounce">
              <div className="bg-white rounded-full shadow-lg border border-gray-300 p-1 min-w-[28px] min-h-[28px] flex items-center justify-center">
                <span className="text-sm">👍</span>
              </div>
            </div>
          </div>
        )}
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
          <button 
            onClick={() => handleMenuAction('reactions')}
            className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 text-sm"
          >
            Reactions
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

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute top-0 right-0 bg-gray-800 rounded-lg shadow-lg z-50 p-3 min-w-[240px]">
          <div className="text-white text-sm mb-2 font-medium">Add Reaction</div>
          <div className="grid grid-cols-6 gap-2">
            {['👍', '❤️', '😂', '😮', '😢', '😡', '🔥', '👏', '🎉', '💯', '👀', '🙏'].map(emoji => (
              <button
                key={emoji}
                onClick={() => handleEmojiSelect(emoji)}
                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-700 rounded transition-colors"
                disabled={addReactionMutation.isPending}
              >
                {emoji}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowEmojiPicker(false)}
            className="w-full mt-3 px-3 py-1 text-left text-gray-400 hover:bg-gray-700 text-sm rounded"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

// Connections List Component
const ConnectionsList = ({ onClose, onMessageUser }: { onClose: () => void; onMessageUser: (userId: number) => void }) => {
  const { data: connections, isLoading } = useQuery<any[]>({
    queryKey: ['/api/connections'],
    enabled: true,
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-slate-800 rounded-lg p-6 mx-4 w-full max-w-md">
          <div className="text-center text-white">Loading connections...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-slate-800 rounded-lg p-6 mx-4 w-full max-w-md max-h-[70vh] overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Message Connection</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[50vh]">
          {connections && connections.length > 0 ? (
            <div className="space-y-2">
              {connections.map((connection: any) => (
                <button
                  key={connection.id}
                  onClick={() => onMessageUser(connection.id)}
                  className="w-full p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center space-x-3 transition-colors"
                >
                  <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {connection.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{connection.name}</div>
                    <div className="text-sm text-gray-300">@{connection.username}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No connections found</p>
              <p className="text-sm mt-1">Add some connections to start messaging</p>
            </div>
          )}
        </div>
      </div>
      

    </div>
  );
};

export default ChatPage;