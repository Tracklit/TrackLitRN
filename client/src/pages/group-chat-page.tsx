import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Crown, Star, Lock, Settings } from 'lucide-react';
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
  TypingIndicator,
  MessageSeparator
} from '@chatscope/chat-ui-kit-react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';

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
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [messageInputValue, setMessageInputValue] = useState('');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupForm, setNewGroupForm] = useState({
    name: '',
    description: ''
  });

  // Check if user can create groups (coaches and star users)
  const canCreateGroups = user?.isCoach || user?.subscriptionTier === 'star';

  // Fetch user's groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
    select: (data) => data || []
  });

  // Fetch selected group messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<GroupMessage[]>({
    queryKey: ['/api/groups', selectedGroupId, 'messages'],
    enabled: !!selectedGroupId,
    select: (data) => data || []
  });

  // Fetch selected group members
  const { data: members = [], isLoading: membersLoading } = useQuery<GroupMember[]>({
    queryKey: ['/api/groups', selectedGroupId, 'members'],
    enabled: !!selectedGroupId,
    select: (data) => data || []
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await apiRequest('POST', '/api/groups', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      toast({
        title: 'Group created',
        description: 'Your new group has been created successfully'
      });
      setIsCreateGroupOpen(false);
      setNewGroupForm({ name: '', description: '' });
    },
    onError: () => {
      toast({
        title: 'Failed to create group',
        description: 'There was an error creating your group',
        variant: 'destructive'
      });
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ groupId, content }: { groupId: number; content: string }) => {
      const response = await apiRequest('POST', `/api/groups/${groupId}/messages`, { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups', selectedGroupId, 'messages'] });
      setMessageInputValue('');
    },
    onError: () => {
      toast({
        title: 'Failed to send message',
        description: 'There was an error sending your message',
        variant: 'destructive'
      });
    }
  });

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const handleSendMessage = (content: string) => {
    if (!selectedGroupId || !content.trim()) return;
    sendMessageMutation.mutate({ groupId: selectedGroupId, content: content.trim() });
  };

  const handleCreateGroup = () => {
    if (!newGroupForm.name.trim()) {
      toast({
        title: 'Group name required',
        description: 'Please enter a name for your group',
        variant: 'destructive'
      });
      return;
    }
    createGroupMutation.mutate(newGroupForm);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="container max-w-screen-xl mx-auto p-4 md:pl-72 pb-20 h-screen overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold mb-1">Group Chats</h1>
          <p className="text-xs text-muted-foreground">Connect and communicate with your training groups</p>
        </div>
        
        {canCreateGroups && (
          <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-black/95 border-purple-500/25">
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Group Name</label>
                  <Input
                    value={newGroupForm.name}
                    onChange={(e) => setNewGroupForm({ ...newGroupForm, name: e.target.value })}
                    placeholder="Enter group name"
                    className="mt-1 bg-gray-800/50 border-gray-700/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newGroupForm.description}
                    onChange={(e) => setNewGroupForm({ ...newGroupForm, description: e.target.value })}
                    placeholder="Enter group description"
                    className="mt-1 bg-gray-800/50 border-gray-700/50"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateGroupOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateGroup} disabled={createGroupMutation.isPending}>
                  {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!canCreateGroups && (
        <Card className="bg-black/95 border-purple-500/25 mb-4" style={{ borderWidth: '0.5px' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium">Premium Feature</p>
                <p className="text-sm text-gray-400">
                  Only coaches and Star subscribers can create groups. 
                  {!user?.isCoach && ' Upgrade to Star or become a coach to create groups.'}
                </p>
              </div>
              {user?.subscriptionTier !== 'star' && (
                <Badge variant="outline" className="ml-auto">
                  <Star className="h-3 w-3 mr-1" />
                  Star Required
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="h-[calc(100vh-180px)] bg-black/95 border border-purple-500/25 rounded-lg" style={{ borderWidth: '0.5px' }}>
        <MainContainer>
          <Sidebar position="left" scrollable={false}>
            <ConversationList>
              {groupsLoading ? (
                <div className="p-4 text-center text-gray-400">Loading groups...</div>
              ) : groups.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No groups yet</p>
                  {canCreateGroups && (
                    <p className="text-xs mt-1">Create your first group to get started</p>
                  )}
                </div>
              ) : (
                groups.map((group) => (
                  <Conversation
                    key={group.id}
                    name={group.name}
                    lastSenderName={group.coach.name}
                    info={`${group.memberCount} members`}
                    active={selectedGroupId === group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                  >
                    <Avatar
                      name={getInitials(group.name)}
                      size="md"
                      status="available"
                    />
                  </Conversation>
                ))
              )}
            </ConversationList>
          </Sidebar>

          <ChatContainer>
            {selectedGroup ? (
              <>
                <ConversationHeader>
                  <ConversationHeader.Back />
                  <Avatar
                    name={getInitials(selectedGroup.name)}
                    size="md"
                  />
                  <ConversationHeader.Content
                    userName={selectedGroup.name}
                    info={`${members.length} members • Coach: ${selectedGroup.coach.name}`}
                  />
                  <ConversationHeader.Actions>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </ConversationHeader.Actions>
                </ConversationHeader>

                <MessageList>
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-400">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No messages yet</p>
                        <p className="text-sm mt-1">Start the conversation!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const isOwnMessage = message.userId === user?.id;
                      const showSeparator = index === 0 || 
                        new Date(messages[index - 1].createdAt).toDateString() !== 
                        new Date(message.createdAt).toDateString();

                      return (
                        <div key={message.id}>
                          {showSeparator && (
                            <MessageSeparator content={new Date(message.createdAt).toDateString()} />
                          )}
                          <Message
                            model={{
                              message: message.content,
                              sentTime: new Date(message.createdAt).toLocaleTimeString(),
                              sender: message.user.name,
                              direction: isOwnMessage ? 'outgoing' : 'incoming',
                              position: 'single'
                            }}
                          >
                            {!isOwnMessage && (
                              <Avatar
                                name={getInitials(message.user.name)}
                                size="sm"
                              />
                            )}
                          </Message>
                        </div>
                      );
                    })
                  )}
                </MessageList>

                <MessageInput
                  placeholder="Type a message..."
                  value={messageInputValue}
                  onChange={setMessageInputValue}
                  onSend={handleSendMessage}
                  sendDisabled={sendMessageMutation.isPending}
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Select a group to start chatting</h3>
                  <p className="text-sm">Choose a group from the sidebar to view messages and participate in discussions</p>
                </div>
              </div>
            )}
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  );
}

export function Component() {
  return <GroupChatPage />;
}