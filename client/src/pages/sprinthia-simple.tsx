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
import brainImage from '@assets/IMG_4120.jpeg';

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
          <div className="p-6 border-b border-border bg-gradient-to-r from-background to-muted/20">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" style={{ padding: '1px' }}>
                  <div className="w-full h-full rounded-full bg-background overflow-hidden">
                    <img src={brainImage} alt="Sprinthia AI" className="w-full h-full object-cover" style={{ transform: 'translateY(10px)' }} />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  Sprinthia
                </h1>
                <p className="text-muted-foreground text-sm">Your AI track and field coach • Always available</p>
              </div>
              <div className="text-right">
                <div className="bg-muted/50 rounded-lg px-3 py-2 border">
                  <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                  <p className="font-semibold text-sm">{getPromptDisplay()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-16">
                <div className="mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" style={{ width: '92px', height: '92px', padding: '1px' }}>
                  <div className="w-full h-full rounded-full bg-background overflow-hidden">
                    <img src={brainImage} alt="Sprinthia AI" className="w-full h-full object-cover" style={{ transform: 'translateY(10px)' }} />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">Hi {user?.name?.split(' ')[0] || 'there'}, how can I help you today?</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Ask me about training plans, race preparation, injury rehabilitation, or nutrition advice.
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                  {['Create a sprint workout', 'Race strategy for 400m', 'Hamstring injury recovery', 'Pre-race nutrition'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="px-3 py-2 text-sm bg-muted/50 hover:bg-muted rounded-lg border transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className="w-full mb-6">
                <div className={cn(
                  "mb-2 text-sm font-medium",
                  message.role === 'user' ? 'text-blue-600' : 'text-purple-600'
                )}>
                  {message.role === 'user' ? 'You' : 'Sprinthia'}
                </div>
                <div
                  className={cn(
                    "w-full rounded-lg px-4 py-3 shadow-sm",
                    message.role === 'user'
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : 'bg-muted/50 border-l-4 border-purple-500'
                  )}
                >
                  <div className="whitespace-pre-wrap leading-relaxed text-foreground">
                    {message.content
                      .replace(/\*\*(.*?)\*\*/g, '$1')
                      .replace(/\*(.*?)\*/g, '$1')
                      .replace(/^#+\s*/gm, '')
                      .replace(/^\*\s*/gm, '• ')
                      .replace(/^-\s*/gm, '• ')
                    }
                  </div>
                  <div className="text-xs opacity-70 mt-3 pt-2 border-t border-border">
                    {new Date(message.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isGenerating && (
              <div className="w-full mb-6">
                <div className="mb-2 text-sm font-medium text-purple-600">
                  Sprinthia
                </div>
                <div className="w-full bg-muted/50 border-l-4 border-purple-500 rounded-lg px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Thinking</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 border-t border-border bg-gradient-to-r from-background to-muted/10">
            <div className="flex gap-3 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Sprinthia about training, races, rehabilitation, or nutrition..."
                  className="pr-12 h-12 rounded-xl border-2 focus:border-blue-500 transition-colors bg-background/50 backdrop-blur-sm"
                  disabled={isGenerating}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isGenerating || (user?.subscriptionTier !== 'star' && !user?.sprinthiaPrompts)}
                  size="icon"
                  className="absolute right-1 top-1 h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {user?.subscriptionTier !== 'star' && user?.sprinthiaPrompts === 0 && (
              <p className="text-sm text-muted-foreground text-center mt-3">
                You've used all your prompts. Upgrade to Pro or Star to continue using Sprinthia.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}