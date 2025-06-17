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
  latestMessage?: {
    content: string;
    createdAt: string;
    senderName: string;
    senderUsername: string;
  } | null;
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
  const { data: currentUser } = useQuery<{
    id: number;
    name: string;
    username: string;
    profileImageUrl?: string;
  }>({
    queryKey: ["/api/user"],
  });

  // Fetch groups with forced refresh
  const { data: groups, isLoading: groupsLoading, refetch: refetchGroups } = useQuery({
    queryKey: ["/api/groups"],
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache (TanStack Query v5 syntax)
  });

  // Fetch group messages
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/groups/${selectedGroupId}/messages`],
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
        const errorText = await response.text();
        throw new Error(errorText || "Failed to send message");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${selectedGroupId}/messages`] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] }); // Refresh groups list to show latest message
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
    <div className="h-full bg-gray-900 text-gray-100" style={{ backgroundColor: '#1a1625' }}>
      {!selectedGroup ? (
        /* Groups List - Telegram Style */
        <div className="h-full" style={{ backgroundColor: '#1a1625' }}>
          {/* Groups List - Full Width */}
          <div className="overflow-y-auto h-full">
            {groupsLoading ? (
              <div className="p-4 text-gray-400">Loading groups...</div>
            ) : (
              <>
                {(groups as Group[])?.map((group: Group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className="w-full text-left px-4 py-4 border-b transition-colors flex items-center space-x-3 hover:bg-opacity-80"
                    style={{ 
                      backgroundColor: '#1a1625', 
                      borderColor: '#2d2438'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#241b2f'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1a1625'}
                  >
                    <div className="w-12 h-12 rounded-full bg-yellow-600 flex items-center justify-center flex-shrink-0">
                      <Hash className="w-6 h-6 text-black" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-100 text-lg truncate">
                          {group.name}
                        </div>
                        {group.coachId === (currentUser as any)?.id && (
                          <Crown className="w-4 h-4 text-yellow-500 ml-2" />
                        )}
                      </div>
                      {group.latestMessage ? (
                        <div className="text-sm text-gray-400 truncate">
                          <span className="font-medium">{group.latestMessage.senderName}:</span> {group.latestMessage.content}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 truncate">
                          Coach: {group.coach?.name || 'Unknown'}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1 flex justify-between">
                        <span>{group.memberCount} members</span>
                        {group.latestMessage && (
                          <span>{new Date(group.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                
                {(!groups || (groups as Group[]).length === 0) && (
                  <div className="text-center py-12 px-4 text-gray-400">
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
              </>
            )}
          </div>
        </div>
      ) : (
        /* Chat View - Telegram Style */
        <div className="h-full flex flex-col" style={{ backgroundColor: '#1a1625' }}>
          {/* Chat Header */}
          <div className="border-b px-4 py-3 flex-shrink-0" style={{ backgroundColor: '#1a1625', borderColor: '#2d2438' }}>
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedGroupId(null)}
                className="text-gray-400 hover:text-gray-100 p-1"
              >
                ←
              </Button>
              <div className="w-10 h-10 rounded-full bg-yellow-600 flex items-center justify-center flex-shrink-0">
                <Hash className="w-5 h-5 text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-100 truncate">
                  {selectedGroup.name}
                </h2>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto" style={{ paddingBottom: '100px' }}>
            {messagesLoading ? (
              <div className="p-4 text-gray-400">Loading messages...</div>
            ) : (
              <div className="px-4 py-2">
                {(messages as GroupMessage[])?.map((message: GroupMessage) => {
                  const isCurrentUser = message.userId === currentUser?.id;
                  return (
                    <div key={message.id} className={`flex mb-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      {/* Profile image for other users - left side */}
                      {!isCurrentUser && (
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs text-gray-300 mr-2 flex-shrink-0" style={{ marginTop: '35px' }}>
                          {message.user?.profileImageUrl ? (
                            <img 
                              src={message.user.profileImageUrl} 
                              alt={message.user.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            message.user?.name?.charAt(0)?.toUpperCase() || 'U'
                          )}
                        </div>
                      )}
                      
                      <div 
                        className={`min-w-[20vw] max-w-[70%] px-4 py-2 rounded-2xl break-words ${
                          isCurrentUser 
                            ? 'bg-yellow-600 text-black rounded-br-sm' 
                            : 'bg-gray-700 text-gray-100 rounded-bl-sm'
                        }`}
                      >
                        {/* Username inside bubble for other users */}
                        {!isCurrentUser && (
                          <div className="text-xs font-medium text-yellow-400 mb-1">
                            {message.user?.name || message.user?.username || 'Unknown'}
                          </div>
                        )}
                        
                        <div className="flex items-end justify-between">
                          <div className="text-sm leading-relaxed flex-1 mr-2">{message.content}</div>
                          <div className={`text-xs flex-shrink-0 ${isCurrentUser ? 'text-black/70' : 'text-gray-400'}`}>
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      

                    </div>
                  );
                })}
                
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

          {/* Native Message Input - Fixed to viewport bottom */}
          <div 
            className="fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom"
            style={{ backgroundColor: '#1a1625', borderTop: '1px solid #2d2438' }}
          >
            <div className="px-3 py-2">
              <div className="flex items-end space-x-2">
                <div className="flex-1 relative">
                  <textarea
                    value={messageInputValue}
                    onChange={(e) => setMessageInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (messageInputValue.trim()) {
                          handleSendMessage(messageInputValue);
                        }
                      }
                    }}
                    placeholder="Message"
                    rows={1}
                    className="w-full resize-none border rounded-2xl px-4 py-3 text-gray-100 placeholder-gray-400 focus:outline-none focus:border-yellow-500 max-h-32 min-h-[44px]"
                    style={{ 
                      backgroundColor: '#2d2438', 
                      borderColor: '#3d3450',
                      fontSize: '16px', // Prevents zoom on iOS
                      lineHeight: '1.4'
                    }}
                    disabled={sendMessageMutation.isPending}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                    }}
                  />
                </div>
                {messageInputValue.trim() && (
                  <button
                    onClick={() => {
                      if (messageInputValue.trim()) {
                        handleSendMessage(messageInputValue);
                      }
                    }}
                    disabled={sendMessageMutation.isPending}
                    className="w-10 h-10 rounded-full bg-yellow-600 hover:bg-yellow-700 flex items-center justify-center transition-colors disabled:opacity-50"
                    style={{ minWidth: '40px', minHeight: '40px' }}
                  >
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="text-black"
                    >
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Component() {
  return <GroupChatPage />;
}