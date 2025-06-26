import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Send, ArrowLeft, MoreVertical, Users, Plus, Crown, Settings, UserPlus, MessageSquare, Paperclip, Smile, Reply, Heart, CheckCheck, Mic } from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { GroupMessage, User, Group, ChatGroupMember } from "@shared/schema";
// Removed dialog, label, textarea, and select imports as they're now in create-group-page
import { useKeyboard } from "@/contexts/keyboard-context";

interface GroupWithMembers extends Group {
  members: (ChatGroupMember & { user: User })[];
  lastMessage?: GroupMessage;
  memberCount: number;
}

interface GroupMessageWithUser extends GroupMessage {
  sender: User;
}

export default function GroupsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { setKeyboardVisible } = useKeyboard();
  const [location, setLocation] = useLocation();
  
  // Extract groupId from URL path
  const pathParts = location.split('/');
  const targetGroupId = pathParts.length > 2 && pathParts[1] === 'groups' && pathParts[2] 
    ? parseInt(pathParts[2]) 
    : null;
    
  const [selectedGroup, setSelectedGroup] = useState<number | null>(targetGroupId);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredMessage, setHoveredMessage] = useState<number | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<GroupMessageWithUser | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user's groups
  const { data: groups = [] } = useQuery<GroupWithMembers[]>({
    queryKey: ["/api/groups"],
    enabled: !!user,
  });

  // Fetch messages for selected group with cache busting
  const { data: messages = [], refetch } = useQuery<GroupMessageWithUser[]>({
    queryKey: [`/api/groups/${selectedGroup}/messages`], // Remove timestamp as it breaks caching
    enabled: !!selectedGroup,
    refetchInterval: 2000, // Refetch every 2 seconds to get new messages
    staleTime: 0, // Force fresh data
    gcTime: 0, // Don't cache (updated from cacheTime in newer TanStack Query)
  });

  // Force refresh on component mount
  useEffect(() => {
    if (selectedGroup) {
      refetch();
    }
  }, [selectedGroup, refetch]);

  // Debug log the messages
  console.log('Messages from API:', messages);
  if (messages && messages.length > 0) {
    console.log('First message sender:', messages[0].sender);
  }

  // Get subscription limits
  const { data: coachLimits } = useQuery({
    queryKey: ['/api/coach/limits'],
    enabled: !!user?.isCoach,
  });

  // Filter groups based on search
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set selected group when targetGroupId changes
  useEffect(() => {
    if (targetGroupId && targetGroupId !== selectedGroup) {
      setSelectedGroup(targetGroupId);
    }
  }, [targetGroupId, selectedGroup]);

  // Send message mutation
  const queryClient = useQueryClient();

  const handleReply = (message: GroupMessageWithUser) => {
    setReplyingTo(message);
  };

  const formatMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  const groupMessages = (messages: GroupMessageWithUser[]) => {
    const grouped: Array<{
      sender: User;
      messages: GroupMessageWithUser[];
      timestamp: Date;
    }> = [];

    messages.forEach((message, index) => {
      const prevMessage = messages[index - 1];
      const timeDiff = prevMessage 
        ? new Date(message.createdAt || new Date()).getTime() - new Date(prevMessage.createdAt || new Date()).getTime()
        : 0;
      
      const shouldGroup = 
        prevMessage && 
        prevMessage.senderId === message.senderId && 
        timeDiff < 5 * 60 * 1000; // 5 minutes

      if (shouldGroup && grouped.length > 0) {
        grouped[grouped.length - 1].messages.push(message);
      } else {
        grouped.push({
          sender: message.sender,
          messages: [message],
          timestamp: new Date(message.createdAt || new Date()),
        });
      }
    });

    return grouped;
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { groupId: number; message: string; replyToId?: number }) => {
      console.log('Making POST request to /api/group-messages', messageData);
      const response = await apiRequest("POST", "/api/group-messages", messageData);
      console.log('Response status:', response.status);
      return response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ["/api/groups", selectedGroup, "messages"] });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  // Removed create group mutation - now handled in create-group-page

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedGroup) return;
    
    sendMessageMutation.mutate({
      groupId: selectedGroup,
      message: newMessage.trim(),
      replyToId: replyingTo?.id,
    });
  };

  // Removed handleCreateGroup - now handled in create-group-page

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Check if user can create groups
  const canCreateGroups = user?.isCoach || user?.subscriptionTier === 'star';

  // Get group creation limits
  const getGroupLimits = () => {
    if (user?.subscriptionTier === 'star') {
      return { maxGroups: 'unlimited', maxMembers: 'unlimited' };
    }
    if (user?.isCoach) {
      return { maxGroups: 10, maxMembers: 50 };
    }
    return { maxGroups: 0, maxMembers: 0 };
  };

  const groupLimits = getGroupLimits();
  const currentGroupCount = groups.length;
  const canCreateMore = groupLimits.maxGroups === 'unlimited' || currentGroupCount < (groupLimits.maxGroups as number);

  const selectedGroupData = groups.find(g => g.id === selectedGroup);

  return (
    <div className="min-h-screen bg-gray-900 w-full">
      {/* Full width layout */}
      <div className="w-full">
        {selectedGroup ? (
          <div className="flex flex-col h-screen">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-800 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                    onClick={() => setSelectedGroup(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {selectedGroupData?.name}
                    </h2>
                    <p className="text-sm text-gray-400">
                      {selectedGroupData?.memberCount} member{selectedGroupData?.memberCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-900">
              <div className="space-y-6 max-w-4xl mx-auto">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                    <p>Be the first to start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.senderId === user?.id;
                    
                    return (
                      <div key={message.id} className={cn("mb-4 flex", isOwnMessage ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[70%] flex", isOwnMessage ? "flex-row-reverse" : "flex-row")}>
                          {/* Avatar - only show for other users */}
                          {!isOwnMessage && (
                            <div className="mr-3 flex-shrink-0">
                              {message.sender?.profileImageUrl ? (
                                <img 
                                  src={message.sender.profileImageUrl} 
                                  alt={message.sender.name || message.sender.username}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-medium text-xs">
                                    {message.sender?.username?.charAt(0).toUpperCase() || 'U'}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="flex flex-col">
                            {/* Sender name and timestamp - show for all messages */}
                            <div className="mb-1 flex items-center space-x-2">
                              {!isOwnMessage && (
                                <span className="text-xs font-medium text-gray-300">
                                  {message.sender?.name || message.sender?.username || 'Unknown User'}
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {format(new Date(message.createdAt || new Date()), isOwnMessage ? 'h:mm a' : 'MMM d, h:mm a')}
                              </span>
                            </div>
                            
                            {/* Message bubble */}
                            <div
                              className={cn(
                                "group relative rounded-2xl px-4 py-2 max-w-full break-words",
                                isOwnMessage 
                                  ? "bg-blue-600 text-white rounded-br-md" 
                                  : "bg-gray-700 text-gray-100 rounded-bl-md",
                                hoveredMessage === message.id && "ring-1 ring-gray-500"
                              )}
                              onMouseEnter={() => setHoveredMessage(message.id)}
                              onMouseLeave={() => setHoveredMessage(null)}
                            >
                              {/* Reply preview if this is a reply */}
                              {replyingTo && (
                                <div className={cn(
                                  "mb-2 p-2 rounded-lg border-l-2 border-opacity-50",
                                  isOwnMessage 
                                    ? "bg-blue-700 border-blue-300" 
                                    : "bg-gray-800 border-gray-500"
                                )}>
                                  <div className="text-xs opacity-75 mb-1">
                                    Replying to {replyingTo.sender?.username || 'Unknown'}
                                  </div>
                                  <div className="text-sm opacity-90 truncate">
                                    {replyingTo.message}
                                  </div>
                                </div>
                              )}
                              
                              <p className="text-sm leading-relaxed">
                                {message.message}
                              </p>
                              
                              {/* Additional timestamp on hover */}
                              <div className={cn(
                                "text-xs mt-1 opacity-0 group-hover:opacity-60 transition-opacity",
                                isOwnMessage ? "text-right text-blue-100" : "text-left text-gray-400"
                              )}>
                                {format(new Date(message.createdAt || new Date()), 'MMM d, yyyy HH:mm')}
                              </div>
                            </div>
                            
                            {/* Message actions - show on hover */}
                            {hoveredMessage === message.id && (
                              <div className={cn(
                                "flex items-center space-x-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity",
                                isOwnMessage ? "justify-end" : "justify-start"
                              )}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                                  onClick={() => handleReply(message)}
                                >
                                  <Reply className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                                >
                                  <Heart className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            
                            {/* Message status for own messages */}
                            {isOwnMessage && (
                              <div className="flex justify-end mt-1">
                                <CheckCheck className="h-3 w-3 text-blue-400" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-center space-x-3 ml-11 mb-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500 italic">Someone is typing...</span>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-700 bg-gray-800 flex-shrink-0">
              <div className="max-w-4xl mx-auto">
                {/* Reply preview */}
                {replyingTo && (
                  <div className="mb-3 p-2 bg-gray-700 rounded-lg border-l-2 border-blue-500 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">
                        Replying to {replyingTo.sender.username}
                      </div>
                      <div className="text-sm text-gray-300 truncate">
                        {replyingTo.message.length > 50 
                          ? `${replyingTo.message.substring(0, 50)}...` 
                          : replyingTo.message}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                      onClick={() => setReplyingTo(null)}
                    >
                      ×
                    </Button>
                  </div>
                )}

                {/* Input area */}
                <div className="flex items-end space-x-2">
                  {/* Attachment button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white flex-shrink-0"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>

                  {/* Text input */}
                  <div className="flex-1 relative">
                    <textarea
                      placeholder="Type a message..."
                      className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 pr-10 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px] max-h-[120px]"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        // Auto-resize textarea
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      onFocus={() => setKeyboardVisible(true)}
                      onBlur={() => setKeyboardVisible(false)}
                      rows={1}
                    />
                    {/* Emoji picker button inside textarea */}
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      😊
                    </button>
                    
                    {/* Simple emoji picker */}
                    {showEmojiPicker && (
                      <div className="absolute bottom-full right-0 mb-2 bg-gray-800 border border-gray-600 rounded-lg p-2 shadow-lg z-50">
                        <div className="grid grid-cols-6 gap-1">
                          {['😊', '😂', '❤️', '👍', '🎉', '🔥', '💪', '✨', '⚡', '🏃‍♂️', '🏆', '🥇'].map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => {
                                setNewMessage(prev => prev + emoji);
                                setShowEmojiPicker(false);
                              }}
                              className="p-2 hover:bg-gray-700 rounded text-lg"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Send/Mic button */}
                  <Button
                    size="sm"
                    className="bg-accent hover:bg-accent/90 h-8 w-8 p-0 flex-shrink-0"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  >
                    {newMessage.trim() ? (
                      <Send className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-screen bg-gray-900">
            {/* Header */}
            <div className="px-4 py-6 border-b border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Groups</h1>
                {canCreateGroups && canCreateMore && (
                  <Button 
                    size="sm" 
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    onClick={() => setLocation("/create-group")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Group
                  </Button>
                )}
              </div>

              {!canCreateGroups && (
                <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded text-yellow-400 text-sm">
                  Only coaches and Star users can create groups
                </div>
              )}
              {canCreateGroups && !canCreateMore && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-700/50 rounded text-red-400 text-sm">
                  Group limit reached ({currentGroupCount}/{groupLimits.maxGroups})
                </div>
              )}

              {/* Search */}
              <div className="px-4 py-3 border-b border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search groups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-600 text-white rounded-lg"
                    onFocus={() => setKeyboardVisible(true)}
                    onBlur={() => setKeyboardVisible(false)}
                  />
                </div>
              </div>

              {/* Groups List - Telegram Style */}
              <div className="bg-gray-900">
                {filteredGroups.length === 0 ? (
                  <div className="text-gray-400 text-center py-8">
                    {searchQuery ? "No groups found" : "No groups yet. Create your first group!"}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-700">
                    {filteredGroups.map((group) => (
                      <div
                        key={group.id}
                        className="w-full px-4 py-3 cursor-pointer transition-colors hover:bg-gray-800 active:bg-gray-750"
                        onClick={() => setSelectedGroup(group.id)}
                      >
                        <div className="flex items-center space-x-3">
                          {/* Avatar */}
                          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-lg">
                              {group.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-white font-medium text-base truncate">
                                {group.name}
                              </h3>
                              {group.lastMessage && (
                                <span className="text-gray-400 text-sm ml-2 flex-shrink-0">
                                  {formatDistanceToNow(new Date(group.lastMessage.createdAt || new Date()), { 
                                    addSuffix: false 
                                  }).replace('about ', '')}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-gray-400 text-sm truncate">
                                {group.lastMessage 
                                  ? group.lastMessage.message.length > 40 
                                    ? `${group.lastMessage.message.substring(0, 40)}...`
                                    : group.lastMessage.message
                                  : `${group.memberCount} member${group.memberCount !== 1 ? 's' : ''}`
                                }
                              </p>
                              {group.lastMessage && (
                                <div className="flex items-center space-x-2 ml-2">
                                  {/* Read status indicator */}
                                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}