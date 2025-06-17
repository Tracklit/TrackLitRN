import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Users, MessageCircle, Crown, Lock, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
  ExpansionPanel,
  Sidebar,
  ConversationList,
  Conversation,
  Avatar,
  ConversationHeader,
  MessageSeparator
} from "@chatscope/chat-ui-kit-react";

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
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedGroup = (groups as Group[])?.find((g: Group) => g.id === selectedGroupId);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex h-screen">
        {/* Left Sidebar - Groups as Channels */}
        <div className="w-80 bg-gray-900 border-r border-gray-700 flex flex-col">
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

          {/* Groups List as Channels */}
          <div className="flex-1 overflow-y-auto">
            {groupsLoading ? (
              <div className="p-4 text-gray-400">Loading groups...</div>
            ) : (
              <div className="p-2">
                {(groups as Group[])?.map((group: Group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`
                      w-full text-left p-3 rounded-lg mb-1 transition-colors
                      flex items-center space-x-3 hover:bg-gray-800
                      ${selectedGroupId === group.id ? 'bg-yellow-600/20 border-l-4 border-yellow-600' : ''}
                    `}
                  >
                    <Hash className="w-4 h-4 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">
                        {group.name}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {group.memberCount} members • by {group.coach?.name || 'Unknown'}
                      </div>
                    </div>
                    {group.coachId === (currentUser as any)?.id && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                  </button>
                ))}
                
                {(!groups || (groups as Group[]).length === 0) && (
                  <div className="p-4 text-center text-gray-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No groups yet</p>
                    <Link href="/groups/create">
                      <Button 
                        size="sm" 
                        className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-black font-medium"
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

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedGroup ? (
            <>
              {/* Chat Header */}
              <div className="bg-gray-900 border-b border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold flex items-center">
                      <Hash className="w-5 h-5 mr-2 text-yellow-500" />
                      {selectedGroup.name}
                    </h2>
                    <p className="text-sm text-gray-400">
                      {selectedGroup.description || "No description"}
                    </p>
                  </div>
                  <div className="text-sm text-gray-400">
                    {(members as GroupMember[])?.length || 0} members
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 flex">
                <div className="flex-1 flex flex-col">
                  <div style={{ position: "relative", height: "400px", flexGrow: 1 }}>
                    <MainContainer responsive>
                      <ChatContainer>
                        <MessageList 
                          loading={messagesLoading}
                          typingIndicator={sendMessageMutation.isPending ? <TypingIndicator content="Sending message..." /> : null}
                        >
                          {(messages as GroupMessage[])?.map((message: GroupMessage, index: number) => {
                            const isOwn = message.userId === (currentUser as any)?.id;
                            const showSeparator = index === 0 || 
                              new Date((messages as GroupMessage[])[index - 1].createdAt).toDateString() !== new Date(message.createdAt).toDateString();
                            
                            return (
                              <div key={message.id}>
                                {showSeparator && (
                                  <MessageSeparator content={new Date(message.createdAt).toLocaleDateString()} />
                                )}
                                <Message
                                  model={{
                                    message: message.content,
                                    sentTime: new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                    sender: message.user.name,
                                    direction: isOwn ? "outgoing" : "incoming",
                                    position: "single"
                                  }}
                                >
                                  {!isOwn && (
                                    <Avatar 
                                      src={message.user.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${message.user.name}`}
                                      name={message.user.name}
                                    />
                                  )}
                                </Message>
                              </div>
                            );
                          })}
                          <div ref={messagesEndRef} />
                        </MessageList>
                        <MessageInput
                          placeholder="Type a message..."
                          value={messageInputValue}
                          onChange={(val) => setMessageInputValue(val)}
                          onSend={handleSendMessage}
                          disabled={sendMessageMutation.isPending}
                          attachButton={false}
                        />
                      </ChatContainer>
                    </MainContainer>
                  </div>
                </div>

                {/* Right Sidebar - Members */}
                <div className="w-64 bg-gray-900 border-l border-gray-700">
                  <div className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Members ({(members as GroupMember[])?.length || 0})
                    </h3>
                    <div className="space-y-2">
                      {(members as GroupMember[])?.map((member: GroupMember) => (
                        <div key={member.id} className="flex items-center space-x-2">
                          <img
                            src={member.user.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${member.user.name}`}
                            alt={member.user.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <div>
                            <div className="text-sm font-medium">{member.user.name}</div>
                            <div className="text-xs text-gray-400">@{member.user.username}</div>
                          </div>
                          {selectedGroup.coachId === member.user.id && (
                            <Crown className="w-4 h-4 text-yellow-500 ml-auto" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Select a Group</h3>
                <p className="text-sm">Choose a group from the sidebar to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Component() {
  return <GroupChatPage />;
}