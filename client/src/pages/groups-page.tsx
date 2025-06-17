import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Send, ArrowLeft, MoreVertical, Users, Plus, Crown, Settings, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { GroupMessage, User, Group, ChatGroupMember } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [location] = useLocation();
  
  // Extract groupId from URL path
  const pathParts = location.split('/');
  const targetGroupId = pathParts.length > 2 && pathParts[1] === 'groups' && pathParts[2] 
    ? parseInt(pathParts[2]) 
    : null;
    
  const [selectedGroup, setSelectedGroup] = useState<number | null>(targetGroupId);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupPrivacy, setNewGroupPrivacy] = useState<"public" | "private">("private");
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

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: { name: string; description: string; isPrivate: boolean }) => {
      const response = await apiRequest("POST", "/api/groups", groupData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setIsCreating(false);
      setNewGroupName("");
      setNewGroupDescription("");
      setNewGroupPrivacy("private");
      toast({
        title: "Group created",
        description: "Your new group has been created successfully",
      });
    },
    onError: (error) => {
      console.error('Failed to create group:', error);
      toast({
        title: "Failed to create group",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedGroup) return;
    
    sendMessageMutation.mutate({
      groupId: selectedGroup,
      message: newMessage.trim(),
    });
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    
    createGroupMutation.mutate({
      name: newGroupName.trim(),
      description: newGroupDescription.trim(),
      isPrivate: newGroupPrivacy === "private",
    });
  };

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
    <div className="h-screen flex bg-[#010a18] pt-16">
      {/* Groups Sidebar */}
      <div className="w-1/3 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-white mr-2" />
              <h1 className="text-xl font-bold text-white">Groups</h1>
            </div>
            {canCreateGroups && canCreateMore && (
              <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create New Group</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="groupName" className="text-white">Group Name</Label>
                      <Input
                        id="groupName"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Enter group name"
                        className="bg-gray-800 border-gray-600 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="groupDescription" className="text-white">Description (Optional)</Label>
                      <Textarea
                        id="groupDescription"
                        value={newGroupDescription}
                        onChange={(e) => setNewGroupDescription(e.target.value)}
                        placeholder="Enter group description"
                        className="bg-gray-800 border-gray-600 text-white mt-1"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="groupPrivacy" className="text-white">Privacy</Label>
                      <Select value={newGroupPrivacy} onValueChange={(value: "public" | "private") => setNewGroupPrivacy(value)}>
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="public">Public</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsCreating(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateGroup}
                        disabled={!newGroupName.trim() || createGroupMutation.isPending}
                      >
                        {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
          {!canCreateGroups && (
            <div className="mt-2 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded text-yellow-400 text-xs">
              Only coaches and Star users can create groups
            </div>
          )}
          {canCreateGroups && !canCreateMore && (
            <div className="mt-2 p-2 bg-red-900/20 border border-red-700/50 rounded text-red-400 text-xs">
              Group limit reached ({currentGroupCount}/{groupLimits.maxGroups})
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredGroups.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No groups found</p>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                className={cn(
                  "p-4 cursor-pointer border-b border-gray-700 hover:bg-gray-800/50 transition-colors",
                  selectedGroup === group.id && "bg-gray-800"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="bg-purple-600 rounded-full p-2 mr-3">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <h3 className="font-medium text-white truncate">{group.name}</h3>
                        {group.isPrivate && (
                          <Badge variant="secondary" className="ml-2 text-xs">Private</Badge>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <span>{group.memberCount} members</span>
                        {group.lastMessage && (
                          <>
                            <span className="mx-1">•</span>
                            <span className="truncate">
                              {group.lastMessage.message.substring(0, 30)}...
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {group.lastMessage && (
                    <div className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(group.lastMessage.createdAt!), { addSuffix: true })}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedGroup && selectedGroupData ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-purple-600 rounded-full p-2 mr-3">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">{selectedGroupData.name}</h2>
                    <p className="text-sm text-gray-400">
                      {selectedGroupData.memberCount} members
                      {selectedGroupData.description && ` • ${selectedGroupData.description}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.senderId === user?.id ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                      message.senderId === user?.id
                        ? "bg-purple-600 text-white"
                        : "bg-gray-700 text-white"
                    )}
                  >
                    {message.senderId !== user?.id && (
                      <p className="text-xs text-purple-300 mb-1">{message.sender.name || message.sender.username}</p>
                    )}
                    <p className="text-sm">{message.message}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.createdAt && formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Select a group</h3>
              <p>Choose a group from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}