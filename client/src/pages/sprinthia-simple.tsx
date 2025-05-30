import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/layout/header';
import { SidebarNavigation } from '@/components/layout/sidebar-navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Send, Brain, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function SprinthiaSimple() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/sprinthia/chat', {
        conversationId,
        message,
      });
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Add AI response to messages
      setMessages(prev => [...prev, {
        id: Date.now() + '-ai',
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      }]);
      setConversationId(data.conversationId);
      setIsGenerating(false);
    },
    onError: (error: any) => {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  const handleSendMessage = () => {
    if (!input.trim() || isGenerating) return;
    
    // Check prompts for non-Star users
    if (user?.subscriptionTier !== 'star' && (!user?.sprinthiaPrompts || user.sprinthiaPrompts <= 0)) {
      toast({
        title: "No prompts remaining",
        description: "Purchase more Spike packs to continue using Sprinthia",
        variant: "destructive",
      });
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now() + '-user',
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);
    
    // Send to API
    sendMessageMutation.mutate(input);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getPromptDisplay = () => {
    if (user?.subscriptionTier === 'star') return 'Unlimited';
    return `${user?.sprinthiaPrompts || 0} prompts`;
  };

  return (
    <div className="flex h-screen bg-background">
      <SidebarNavigation />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Sprinthia</h1>
                <p className="text-muted-foreground">Your AI track and field coach</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm text-muted-foreground">Remaining Prompts</p>
                <p className="font-semibold">{getPromptDisplay()}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Hi {user?.name?.split(' ')[0]}, how can I help you today?</h3>
                <p className="text-muted-foreground">Ask me about training, races, rehabilitation, or nutrition.</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600">
                    <AvatarFallback>
                      <Brain className="h-4 w-4 text-white" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-3",
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-12'
                      : 'bg-muted'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>

                {message.role === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isGenerating && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600">
                  <AvatarFallback>
                    <Brain className="h-4 w-4 text-white" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 border-t border-border">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Sprinthia about training, races, rehabilitation, or nutrition..."
                className="flex-1"
                disabled={isGenerating}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!input.trim() || isGenerating || (user?.subscriptionTier !== 'star' && !user?.sprinthiaPrompts)}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}