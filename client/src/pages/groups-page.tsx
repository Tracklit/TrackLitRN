import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Send, ArrowLeft, MoreVertical, Users, Plus, Crown, Settings, UserPlus, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
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
  // Removed create group form state - now handled in create-group-page
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user's groups
  const { data: groups = [] } = useQuery<GroupWithMembers[]>({
    queryKey: ["/api/groups"],
    enabled: !!user,
  });

  // Fetch messages for selected group
  const { data: messages = [] } = useQuery<GroupMessageWithUser[]>({
    queryKey: ["/api/groups", selectedGroup, "messages"],
    enabled: !!selectedGroup,
  });

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
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { groupId: number; message: string }) => {
      console.log('Making POST request to /api/group-messages', messageData);
      const response = await apiRequest("POST", "/api/group-messages", messageData);
      console.log('Response status:', response.status);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", selectedGroup, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setNewMessage("");
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
              <div className="space-y-4 max-w-4xl mx-auto">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                    <p>Be the first to start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="mb-3">
                      <div className="bg-gray-800 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-gray-300 text-sm flex-1">{message.message}</p>
                          <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-700 bg-gray-800 flex-shrink-0">
              <div className="flex items-center space-x-2 max-w-4xl mx-auto">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                  onFocus={() => setKeyboardVisible(true)}
                  onBlur={() => setKeyboardVisible(false)}
                />
                <Button
                  size="sm"
                  className="bg-accent hover:bg-accent/90"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
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
                                  {formatDistanceToNow(new Date(group.lastMessage.createdAt), { 
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