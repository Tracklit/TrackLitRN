import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/layout/header';
import { SidebarNavigation } from '@/components/layout/sidebar-navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Send, MessageSquare, Zap, Crown, Star, Brain, Info, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  createdAt: string;
}

export default function SprinthiaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/sprinthia/conversations'],
    enabled: !!user,
  });

  // Fetch messages for current conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/sprinthia/conversations', currentConversationId, 'messages'],
    enabled: !!currentConversationId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId?: number; content: string }) => {
      const response = await apiRequest('POST', '/api/sprinthia/chat', {
        conversationId,
        message: content,
      });
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sprinthia/conversations'] });
      if (data.conversationId) {
        setCurrentConversationId(data.conversationId);
        queryClient.invalidateQueries({ 
          queryKey: ['/api/sprinthia/conversations', data.conversationId, 'messages'] 
        });
      }
      setIsTyping(false);
    },
    onError: (error: any) => {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
      setIsTyping(false);
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim()) return;
    if (!user?.sprinthiaPrompts || user.sprinthiaPrompts <= 0) {
      toast({
        title: "No prompts remaining",
        description: "Purchase more Spike packs to continue using Sprinthia",
        variant: "destructive",
      });
      return;
    }

    setIsTyping(true);
    sendMessageMutation.mutate({
      conversationId: currentConversationId || undefined,
      content: input.trim(),
    });
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setInput('');
  };

  return (
    <div className="flex h-screen bg-background">
      <SidebarNavigation />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        {/* Single column chat layout */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          {/* Top bar with title and info */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Sprinthia AI</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Info className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sprinthia AI Information</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Your Current Plan</h3>
                      <div className="flex items-center gap-2">
                        {user?.subscriptionTier === 'free' && <Badge variant="secondary">Free</Badge>}
                        {user?.subscriptionTier === 'pro' && <Badge className="bg-orange-500"><Crown className="h-3 w-3 mr-1" />Pro</Badge>}
                        {user?.subscriptionTier === 'star' && <Badge className="bg-purple-500"><Star className="h-3 w-3 mr-1" />Star</Badge>}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Remaining Prompts</h3>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span>{user?.sprinthiaPrompts || 0} prompts</span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Available Spikes</h3>
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-blue-500" />
                        <span>{user?.spikes || 0} Spikes</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold">Purchase Options</h3>
                      <p className="text-sm text-muted-foreground">
                        Need more prompts? Purchase Spike packs to continue using Sprinthia AI for workout planning, race strategy, and training advice.
                      </p>
                      <Button className="w-full" variant="outline">
                        Buy Spike Packs
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button 
                onClick={startNewConversation}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>
          </div>

          {/* Main chat area */}
          <div className="flex-1 flex flex-col">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-6">
              {!currentConversationId && messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <Brain className="h-16 w-16 mx-auto mb-4 text-primary" />
                    <h2 className="text-2xl font-bold mb-2">Welcome to Sprinthia AI</h2>
                    <p className="text-muted-foreground mb-6">
                      Your AI training companion for track and field. Ask questions about workouts, 
                      race strategy, rehabilitation, nutrition, or training plans.
                    </p>
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Zap className="h-4 w-4" />
                        {user?.sprinthiaPrompts || 0} prompts left
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 max-w-4xl mx-auto w-full">
                  {messagesLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    messages.map((message: SprinthiaMessage) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3 max-w-none",
                          message.role === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        {message.role === 'assistant' && (
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0">
                            <Brain className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                        
                        <div
                          className={cn(
                            "rounded-lg px-4 py-3 max-w-[70%]",
                            message.role === 'user' 
                              ? "bg-primary text-primary-foreground ml-auto" 
                              : "bg-muted"
                          )}
                        >
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        </div>
                        
                        {message.role === 'user' && (
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center shrink-0">
                            <span className="text-sm font-medium">
                              {user?.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  
                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <Brain className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="bg-muted rounded-lg px-4 py-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="border-t border-border p-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask Sprinthia about training, races, rehabilitation, or nutrition..."
                    className="flex-1"
                    disabled={sendMessageMutation.isPending || isTyping}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!input.trim() || sendMessageMutation.isPending || isTyping || !user?.sprinthiaPrompts}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                {(!user?.sprinthiaPrompts || user.sprinthiaPrompts <= 0) && (
                  <Alert className="mt-2">
                    <AlertDescription>
                      You have no prompts remaining. Purchase Spike packs to continue using Sprinthia AI.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}