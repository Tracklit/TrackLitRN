import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Users, MessageCircle, Crown, Lock, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";


// Interface definitions
interface Group {
  id: number;
  name: string;
  description: string;
  coachId: number;
  createdAt: string;
  memberCount: number;
  coach: {
    name: string;
    username: string;
  };
}

interface GroupMessage {
  id: number;
  groupId: number;
  userId: number;
  content: string;
  createdAt: string;
  user: {
    name: string;
    username: string;
    profileImageUrl?: string;
  };
}

interface GroupMember {
  id: number;
  groupId: number;
  userId: number;
  joinedAt: string;
  user: {
    id: number;
    name: string;
    username: string;
    profileImageUrl?: string;
  };
}

export default function GroupChatPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [messageInputValue, setMessageInputValue] = useState("");
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
  });

  // Fetch groups
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/groups"],
  });

  // Fetch group messages
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/groups", selectedGroupId, "messages"],
    enabled: !!selectedGroupId,
  });

  // Fetch group members
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["/api/groups", selectedGroupId, "members"],
    enabled: !!selectedGroupId,
  });

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to join group");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Success",
        description: "Joined group successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ groupId, content }: { groupId: number; content: string }) => {
      const response = await fetch(`/api/groups/${groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", selectedGroupId, "messages"] });
      setMessageInputValue("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle sending message
  const handleSendMessage = (content: string) => {
    if (!selectedGroupId || !content.trim()) return;
    sendMessageMutation.mutate({ groupId: selectedGroupId, content: content.trim() });
    setMessageInputValue(""); // Clear input after sending
  };

  // Auto-scroll to bottom when messages change or group is selected
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedGroupId]);

  const selectedGroup = (groups as Group[])?.find((g: Group) => g.id === selectedGroupId);

  return (
    <div className="min-h-screen bg-black text-white pb-16">
      <div className="flex min-h-screen">
        {!selectedGroup ? (
          /* Groups List - Full Width */
          <div className="flex-1 bg-black">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Training Groups
                </h1>
                <Link href="/groups/create">
                  <Button 
                    size="sm" 
                    className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="p-4">
              {groupsLoading ? (
                <div className="text-gray-400">Loading groups...</div>
              ) : (
                <div className="space-y-2">
                  {(groups as Group[])?.map((group: Group) => (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroupId(group.id)}
                      className="w-full text-left p-4 rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors flex items-center space-x-3"
                    >
                      <Hash className="w-5 h-5 text-yellow-500" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-lg">
                          {group.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {group.memberCount} members • by {group.coach?.name || 'Unknown'}
                        </div>
                        {group.description && (
                          <div className="text-xs text-gray-500 mt-1">
                            {group.description}
                          </div>
                        )}
                      </div>
                      {group.coachId === (currentUser as any)?.id && (
                        <Crown className="w-5 h-5 text-yellow-500" />
                      )}
                    </button>
                  ))}
                  
                  {(!groups || (groups as Group[]).length === 0) && (
                    <div className="text-center py-12 text-gray-400">
                      <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No groups yet</h3>
                      <p className="text-sm mb-4">Create your first training group to get started</p>
                      <Link href="/groups/create">
                        <Button 
                          className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium"
                        >
                          Create First Group
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Chat View - Full Width */
          <div className="flex-1 flex flex-col bg-black">
            {/* Chat Header */}
            <div className="bg-gray-900 border-b border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedGroupId(null)}
                    className="mr-3 text-gray-400 hover:text-white"
                  >
                    ←
                  </Button>
                  <div>
                    <h2 className="text-lg font-semibold flex items-center">
                      <Hash className="w-5 h-5 mr-2 text-yellow-500" />
                      {selectedGroup.name}
                    </h2>
                    <p className="text-sm text-gray-400">
                      {selectedGroup.memberCount} members
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto">
              {messagesLoading ? (
                <div className="text-gray-400">Loading messages...</div>
              ) : (
                <div className="space-y-4">
                  {(messages as GroupMessage[])?.map((message: GroupMessage) => (
                    <div key={message.id} className="flex space-x-3">
                      <img
                        src={message.user?.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${message.user?.name || 'U'}`}
                        alt={message.user?.name || 'User'}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-white">{message.user?.name || 'Unknown User'}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-gray-200">{message.content}</div>
                      </div>
                    </div>
                  ))}
                  
                  {(!messages || (messages as GroupMessage[]).length === 0) && (
                    <div className="text-center py-12 text-gray-400">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  )}
                  
                  {/* Auto-scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={messageInputValue}
                  onChange={(e) => setMessageInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (messageInputValue.trim()) {
                        handleSendMessage(messageInputValue);
                      }
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  onClick={() => {
                    if (messageInputValue.trim()) {
                      handleSendMessage(messageInputValue);
                    }
                  }}
                  disabled={sendMessageMutation.isPending || !messageInputValue.trim()}
                  className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium"
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function Component() {
  return <GroupChatPage />;
}