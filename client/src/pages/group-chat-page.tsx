import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Users, MessageCircle, Crown, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  Sidebar,
  ConversationList,
  Conversation,
  Avatar,
  ConversationHeader,
  MessageSeparator,
  TypingIndicator,
  ExpansionPanel
} from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";

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

const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(50, "Group name must be less than 50 characters"),
  description: z.string().max(200, "Description must be less than 200 characters").optional(),
});

type CreateGroupForm = z.infer<typeof createGroupSchema>;

export default function GroupChatPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [messageInputValue, setMessageInputValue] = useState("");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
  });

  // Get user's groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/groups"],
  });

  // Get messages for selected group
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/groups", selectedGroupId, "messages"],
    enabled: !!selectedGroupId,
  });

  // Get members for selected group
  const { data: members = [] } = useQuery({
    queryKey: ["/api/groups", selectedGroupId, "members"],
    enabled: !!selectedGroupId,
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: CreateGroupForm) => {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create group");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setIsCreateGroupOpen(false);
      toast({
        title: "Success",
        description: "Group created successfully",
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

  // Form for creating groups
  const form = useForm<CreateGroupForm>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Handle form submission
  const onSubmit = (data: CreateGroupForm) => {
    createGroupMutation.mutate(data);
  };

  // Handle sending messages
  const handleSendMessage = () => {
    if (!selectedGroupId || !messageInputValue.trim()) return;
    
    sendMessageMutation.mutate({
      groupId: selectedGroupId,
      content: messageInputValue.trim(),
    });
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check if user can create groups
  const canCreateGroups = (currentUser as any)?.isCoach || (currentUser as any)?.subscriptionTier === 'star';

  const selectedGroup = (groups as Group[]).find((g: Group) => g.id === selectedGroupId);

  if (groupsLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading groups...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Group Chat</h1>
            <p className="text-gray-400 mt-1">Connect with your training groups</p>
          </div>
          
          {canCreateGroups && (
            <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black border border-purple-500/20">
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter group name" 
                              {...field}
                              className="bg-gray-900 border-gray-700"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Group description..."
                              {...field}
                              className="bg-gray-900 border-gray-700"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateGroupOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createGroupMutation.isPending}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {!canCreateGroups && (
          <Card className="mb-6 bg-black border border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 text-purple-400">
                <Lock className="w-5 h-5" />
                <div>
                  <p className="font-medium">Group Creation Restricted</p>
                  <p className="text-sm text-gray-400">
                    Only coaches and Star subscribers can create groups. Join existing groups to participate in discussions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(groups as Group[]).length === 0 ? (
          <Card className="bg-black border border-purple-500/20">
            <CardContent className="p-8 text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-semibold mb-2">No Groups Yet</h3>
              <p className="text-gray-400 mb-4">
                {canCreateGroups 
                  ? "Create your first group to start chatting with athletes and coaches"
                  : "You haven't joined any groups yet. Ask a coach or Star subscriber to invite you to a group"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="h-[700px] bg-black border border-purple-500/20 rounded-lg overflow-hidden">
            <MainContainer>
              <Sidebar position="left" scrollable>
                <ConversationList>
                  {(groups as Group[]).map((group: Group) => (
                    <Conversation
                      key={group.id}
                      name={group.name}
                      lastSenderName={group.coach.name}
                      info={`${group.memberCount} members • Coach: ${group.coach.name}`}
                      active={selectedGroupId === group.id}
                      onClick={() => setSelectedGroupId(group.id)}
                    >
                      <Avatar 
                        name={group.name}
                        status="available"
                      />
                    </Conversation>
                  ))}
                </ConversationList>
              </Sidebar>

              <ChatContainer>
                {selectedGroupId ? (
                  <>
                    <ConversationHeader>
                      <ConversationHeader.Back />
                      <Avatar 
                        name={selectedGroup?.name || ""}
                        status="available" 
                      />
                      <ConversationHeader.Content 
                        userName={selectedGroup?.name || ""}
                        info={`${selectedGroup?.memberCount || 0} members`}
                      />
                      <ConversationHeader.Actions>
                        <ExpansionPanel>
                          <div className="p-4 bg-gray-900 text-white">
                            <h4 className="font-semibold mb-2 flex items-center">
                              <Users className="w-4 h-4 mr-2" />
                              Members ({members.length})
                            </h4>
                            <div className="space-y-2">
                              {(members as GroupMember[]).map((member: GroupMember) => (
                                <div key={member.id} className="flex items-center space-x-2">
                                  <Avatar 
                                    name={member.user.name}
                                    size="sm"
                                    src={member.user.profileImageUrl}
                                  />
                                  <div>
                                    <p className="text-sm font-medium">{member.user.name}</p>
                                    <p className="text-xs text-gray-400">@{member.user.username}</p>
                                  </div>
                                  {selectedGroup?.coachId === member.user.id && (
                                    <Crown className="w-3 h-3 text-yellow-500" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </ExpansionPanel>
                      </ConversationHeader.Actions>
                    </ConversationHeader>

                    <MessageList 
                      loading={messagesLoading}
                      typingIndicator={sendMessageMutation.isPending ? <TypingIndicator content="Sending message..." /> : null}
                    >
                      {messages.map((message: GroupMessage, index: number) => {
                        const isOwn = message.userId === currentUser?.id;
                        const showSeparator = index === 0 || 
                          new Date(messages[index - 1].createdAt).toDateString() !== new Date(message.createdAt).toDateString();
                        
                        return (
                          <div key={message.id}>
                            {showSeparator && (
                              <MessageSeparator content={new Date(message.createdAt).toLocaleDateString()} />
                            )}
                            <Message
                              model={{
                                message: message.content,
                                sentTime: new Date(message.createdAt).toLocaleTimeString(),
                                sender: message.user.name,
                                direction: isOwn ? "outgoing" : "incoming",
                                position: "single",
                              }}
                            >
                              {!isOwn && (
                                <Avatar 
                                  name={message.user.name}
                                  src={message.user.profileImageUrl}
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
                      sendButton={true}
                      disabled={sendMessageMutation.isPending}
                    />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                      <h3 className="text-xl font-semibold mb-2">Select a Group</h3>
                      <p className="text-gray-400">Choose a group from the sidebar to start chatting</p>
                    </div>
                  </div>
                )}
              </ChatContainer>
            </MainContainer>
          </div>
        )}
      </div>
    </div>
  );
}

export function Component() {
  return <GroupChatPage />;
}