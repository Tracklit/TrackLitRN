import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/layout/header';
import { SidebarNavigation } from '@/components/layout/sidebar-navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Send, Plus, MessageSquare, Trash2, Zap, Crown, Star, Brain, Info } from 'lucide-react';
import { ListSkeleton } from '@/components/list-skeleton';

interface SprinthiaConversation {
  id: number;
  userId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface SprinthiaMessage {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  promptCost: number;
  createdAt: string;
}

export default function SprinthiaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [newConversationTitle, setNewConversationTitle] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations, isLoading: loadingConversations } = useQuery<SprinthiaConversation[]>({
    queryKey: ['/api/sprinthia/conversations'],
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: loadingMessages } = useQuery<SprinthiaMessage[]>({
    queryKey: ['/api/sprinthia/conversations', selectedConversation, 'messages'],
    enabled: !!selectedConversation,
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest('POST', '/api/sprinthia/conversations', { title });
      return await res.json();
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sprinthia/conversations'] });
      setSelectedConversation(newConversation.id);
      setIsCreatingConversation(false);
      setNewConversationTitle('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create conversation',
        variant: 'destructive',
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number; content: string }) => {
      const res = await apiRequest('POST', `/api/sprinthia/conversations/${conversationId}/messages`, { content });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sprinthia/conversations', selectedConversation, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setMessageInput('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      await apiRequest('DELETE', `/api/sprinthia/conversations/${conversationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sprinthia/conversations'] });
      if (selectedConversation && conversations) {
        const remaining = conversations.filter(c => c.id !== selectedConversation);
        setSelectedConversation(remaining.length > 0 ? remaining[0].id : null);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete conversation',
        variant: 'destructive',
      });
    },
  });

  // Purchase prompts mutation
  const purchasePromptsMutation = useMutation({
    mutationFn: async (packageType: string) => {
      const res = await apiRequest('POST', '/api/purchase/prompts', { package: packageType });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: 'Success',
        description: 'Prompts purchased successfully!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to purchase prompts',
        variant: 'destructive',
      });
    },
  });

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (conversations && conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0].id);
    }
  }, [conversations, selectedConversation]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation || sendMessageMutation.isPending) return;
    
    if (user?.sprinthiaPrompts <= 0) {
      toast({
        title: 'No Prompts Remaining',
        description: 'Purchase more prompts to continue using Sprinthia.',
        variant: 'destructive',
      });
      return;
    }

    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: messageInput.trim(),
    });
  };

  const handleCreateConversation = () => {
    if (!newConversationTitle.trim()) return;
    createConversationMutation.mutate(newConversationTitle.trim());
  };

  // Check subscription tier for prompt limits
  const getPromptLimits = () => {
    switch (user?.subscriptionTier) {
      case 'star':
        return { monthly: 200, daily: 20, color: 'text-yellow-400' };
      case 'pro':
        return { monthly: 50, daily: 5, color: 'text-blue-400' };
      default:
        return { monthly: 1, daily: 1, color: 'text-green-400' };
    }
  };

  const promptLimits = getPromptLimits();
  const currentPrompts = user?.sprinthiaPrompts || 0;

  if (!user) {
    return <div>Please log in to use Sprinthia.</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <Header title="Sprinthia AI" />
      
      <main className="flex-1 overflow-hidden pt-16 md:pt-16 md:pl-64">
        <div className="h-full flex">
          {/* Conversation List Sidebar */}
          <div className="w-80 border-r border-gray-700 bg-gray-900/50 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-6 w-6 text-blue-400" />
                  <h2 className="text-lg font-semibold text-white">Sprinthia</h2>
                </div>
                <Dialog open={isCreatingConversation} onOpenChange={setIsCreatingConversation}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-800 border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">New Conversation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        placeholder="Conversation title..."
                        value={newConversationTitle}
                        onChange={(e) => setNewConversationTitle(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateConversation()}
                      />
                      <Button 
                        onClick={handleCreateConversation}
                        disabled={!newConversationTitle.trim() || createConversationMutation.isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Create Conversation
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              {/* Prompt Counter */}
              <div className="bg-gray-800 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Prompts</span>
                  <Badge className={`${promptLimits.color} bg-transparent border`}>
                    {currentPrompts}
                  </Badge>
                </div>
                {user.subscriptionTier === 'free' && currentPrompts <= 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    Upgrade to Pro or Star for more prompts
                  </p>
                )}
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {loadingConversations ? (
                <div className="p-4">
                  <ListSkeleton items={3} />
                </div>
              ) : conversations?.length ? (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-800 ${
                      selectedConversation === conversation.id ? 'bg-gray-800' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">{conversation.title}</h3>
                        <p className="text-xs text-gray-400">
                          {new Date(conversation.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversationMutation.mutate(conversation.id);
                        }}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-400">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-xs">Create your first conversation to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                          <div className="h-16 bg-gray-700 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : messages?.length ? (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-3xl rounded-lg p-4 ${
                            message.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 text-gray-100 border border-gray-700'
                          }`}
                        >
                          {message.role === 'assistant' && (
                            <div className="flex items-center gap-2 mb-2">
                              <Brain className="h-4 w-4 text-blue-400" />
                              <span className="text-blue-400 font-medium">Sprinthia</span>
                            </div>
                          )}
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          <div className="text-xs opacity-70 mt-2">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-400 mt-8">
                      <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">Start a conversation with Sprinthia</h3>
                      <p className="text-sm">
                        Ask me about workout creation, race strategy, training advice, nutrition, or anything track and field related!
                      </p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-700 p-4">
                  {currentPrompts <= 0 ? (
                    <Alert className="mb-4">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        You've used all your prompts. Purchase more to continue using Sprinthia.
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder={currentPrompts > 0 ? "Ask Sprinthia anything about track and field..." : "No prompts remaining"}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      disabled={currentPrompts <= 0 || sendMessageMutation.isPending}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || currentPrompts <= 0 || sendMessageMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-gray-400">
                <div>
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-medium mb-2">Welcome to Sprinthia</h3>
                  <p className="text-gray-500">
                    Select a conversation or create a new one to start chatting with your AI track coach
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Purchase Prompts Sidebar */}
          {currentPrompts <= 5 && (
            <div className="w-72 border-l border-gray-700 bg-gray-900/50 p-4">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                Get More Prompts
              </h3>
              
              <div className="space-y-3">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white flex items-center gap-2">
                      <Zap className="h-4 w-4 text-green-400" />
                      Starter Pack
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-white mb-1">10 Prompts</div>
                    <div className="text-yellow-400 font-semibold mb-3">100 Spikes</div>
                    <Button
                      size="sm"
                      onClick={() => purchasePromptsMutation.mutate('small')}
                      disabled={purchasePromptsMutation.isPending}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Purchase
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white flex items-center gap-2">
                      <Crown className="h-4 w-4 text-blue-400" />
                      Pro Pack
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-white mb-1">30 Prompts</div>
                    <div className="text-yellow-400 font-semibold mb-1">250 Spikes</div>
                    <div className="text-xs text-green-400 mb-3">Better Value!</div>
                    <Button
                      size="sm"
                      onClick={() => purchasePromptsMutation.mutate('medium')}
                      disabled={purchasePromptsMutation.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Purchase
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-400" />
                      Champion Pack
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-white mb-1">75 Prompts</div>
                    <div className="text-yellow-400 font-semibold mb-1">500 Spikes</div>
                    <div className="text-xs text-yellow-400 mb-3">Best Value!</div>
                    <Button
                      size="sm"
                      onClick={() => purchasePromptsMutation.mutate('large')}
                      disabled={purchasePromptsMutation.isPending}
                      className="w-full bg-yellow-600 hover:bg-yellow-700"
                    >
                      Purchase
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 p-3 bg-gray-800 rounded-lg">
                <h4 className="text-white font-medium mb-2">Your Current Balance</h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Spikes:</span>
                  <span className="text-yellow-400 font-semibold">{user.spikes || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Prompts:</span>
                  <span className="text-blue-400 font-semibold">{currentPrompts}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <SidebarNavigation />
    </div>
  );
}