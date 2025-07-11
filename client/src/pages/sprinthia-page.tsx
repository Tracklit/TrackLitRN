import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Send, MessageSquare, Info, Plus, Brain } from 'lucide-react';
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
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Force refresh - gradient background should be visible

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversationId]);

  const { data: conversations = [] } = useQuery<SprinthiaConversation[]>({
    queryKey: ['/api/sprinthia/conversations'],
    enabled: !!user,
  });

  const { data: messages = [] } = useQuery<SprinthiaMessage[]>({
    queryKey: ['/api/sprinthia/messages', activeConversationId],
    enabled: !!activeConversationId,
  });

  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await fetch('/api/sprinthia/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sprinthia/conversations'] });
      setActiveConversationId(data.id);
      toast({
        title: "New conversation created",
        description: "You can now start chatting with Sprinthia!",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number; content: string }) => {
      const response = await fetch('/api/sprinthia/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, content }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sprinthia/messages', activeConversationId] });
      setMessageInput('');
      setIsLoading(false);
      scrollToBottom();
    },
    onError: () => {
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeConversationId || isLoading) return;

    setIsLoading(true);
    sendMessageMutation.mutate({
      conversationId: activeConversationId,
      content: messageInput,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const activeConversation = conversations.find((c: SprinthiaConversation) => c.id === activeConversationId);

  return (
    <div className="fixed inset-0 bg-purple-600" style={{ 
      background: 'linear-gradient(135deg, #8b5cf6 0%, #1e40af 100%)',
      minHeight: '100vh',
      width: '100vw',
      zIndex: 1
    }}>
      <div className="pt-20 px-4 h-full flex flex-col">
        {/* UPDATED HEADER - NO PROFILE IMAGE */}
        <div className="flex items-center justify-between p-3 border-b border-white/20">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-white">Sprinthia AI Coach</h1>
          </div>

            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-white/25 text-white hover:text-white hover:bg-white/10">
                    <Info className="h-4 w-4 mr-2" />
                    About
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      About Sprinthia AI Coach
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">What is Sprinthia?</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">AI-Powered</Badge>
                        <Badge variant="secondary">Track & Field Expert</Badge>
                        <Badge variant="secondary">24/7 Available</Badge>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">Key Features</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Training Plans</Badge>
                        <Badge variant="outline">Performance Analysis</Badge>
                        <Badge variant="outline">Injury Prevention</Badge>
                        <Badge variant="outline">Technique Tips</Badge>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-2">How to Use</h3>
                      <div className="flex items-center gap-2">
                        <Badge>Ask Questions</Badge>
                        <Badge>Get Personalized Advice</Badge>
                        <Badge>Track Progress</Badge>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button 
                onClick={() => createConversationMutation.mutate(`New Chat ${new Date().toLocaleDateString()}`)}
                disabled={createConversationMutation.isPending}
                size="sm"
                className="border-white/25 text-white hover:text-white hover:bg-white/10"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {activeConversationId ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                        <Brain className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-white">Start chatting with Sprinthia!</h3>
                      <p className="text-white/80 max-w-md">
                        Ask about training techniques, performance analysis, injury prevention, or any track and field related questions.
                      </p>
                    </div>
                  ) : (
                    messages.map((message: SprinthiaMessage) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3 max-w-4xl",
                          message.role === 'user' ? "ml-auto flex-row-reverse" : ""
                        )}
                      >
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                          {message.role === 'user' ? (
                            <span className="text-sm font-semibold text-white">
                              {user?.username?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          ) : (
                            <Brain className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div
                          className={cn(
                            "rounded-lg p-3 max-w-[80%]",
                            message.role === 'user'
                              ? "bg-white/20 text-white ml-auto"
                              : "bg-black/20 text-white"
                          )}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <div className="text-xs opacity-70 mt-1">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {isLoading && (
                    <div className="flex gap-3 max-w-4xl">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Brain className="h-4 w-4 text-white" />
                      </div>
                      <div className="rounded-lg p-3 bg-black/20">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-white/20 p-4 bg-black/20">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex gap-2">
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask Sprinthia about training, techniques, or performance..."
                        disabled={isLoading}
                        className="flex-1 bg-white/10 border-white/25 text-white placeholder:text-white/60"
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || isLoading}
                        size="icon"
                        className="bg-white/20 text-white hover:bg-white/30"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                {conversations.length === 0 ? (
                  <Alert className="max-w-md bg-white/10 border-white/20">
                    <MessageSquare className="h-4 w-4 text-white" />
                    <AlertDescription className="text-white/80">
                      Welcome to Sprinthia! Create your first conversation to start chatting with your AI track and field coach.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="max-w-md bg-white/10 border-white/20">
                    <MessageSquare className="h-4 w-4 text-white" />
                    <AlertDescription className="text-white/80">
                      Select a conversation from the sidebar or create a new one to continue chatting with Sprinthia.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
      </div>
    </div>
  );
}