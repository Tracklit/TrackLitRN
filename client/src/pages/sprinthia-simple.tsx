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
import { Send, User, Copy, Check, History, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface SprinthiaConversation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export default function SprinthiaSimple() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Fetch conversation history
  const { data: conversations = [] } = useQuery<SprinthiaConversation[]>({
    queryKey: ['/api/sprinthia/conversations'],
    enabled: !!user,
  });

  // Load a specific conversation
  const loadConversation = async (id: number) => {
    try {
      const response = await apiRequest('GET', `/api/sprinthia/conversations/${id}/messages`);
      const messagesData = await response.json();
      
      // Convert database messages to chat messages format
      const chatMessages: ChatMessage[] = messagesData.map((msg: any) => ({
        id: msg.id.toString(),
        role: msg.role,
        content: msg.content,
        timestamp: msg.createdAt,
      }));
      
      setMessages(chatMessages);
      setConversationId(id);
      setShowHistory(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      });
    }
  };

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

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast({
        title: "Copied!",
        description: "Response copied to clipboard",
      });
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen" data-sprinthia-page style={{ 
      background: 'linear-gradient(135deg, #8b5cf6 0%, #1e40af 100%)' 
    }}>
      <SidebarNavigation />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <div className="flex-1 flex">
          {/* Conversation History Sidebar */}
          {showHistory && (
            <div className="w-80 border-r border-border bg-background/50 flex flex-col">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Conversation History</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMessages([]);
                      setConversationId(null);
                      setShowHistory(false);
                    }}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    New
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2">
                {conversations.length === 0 ? (
                  <div className="text-center text-muted-foreground p-4">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() => loadConversation(conversation.id)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-colors hover:bg-muted/50",
                          conversationId === conversation.id && "bg-muted border-primary"
                        )}
                      >
                        <h3 className="font-medium text-sm truncate">{conversation.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(conversation.createdAt).toLocaleDateString()}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
            {/* Header */}
          <div className="p-6 border-b border-white/20 bg-transparent">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white">
                  Sprinthia AI Coach
                </h1>
                <p className="text-white/80 text-sm">Your AI track and field coach • Always available</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-1 border-white/25 text-white hover:text-white hover:bg-white/10"
                >
                  <History className="h-4 w-4" />
                  History
                </Button>
                <div className="bg-white/10 rounded-lg px-3 py-2 border-white/20 border">
                  <p className="text-xs text-white/60 mb-1">Remaining</p>
                  <p className="font-semibold text-sm text-white">{getPromptDisplay()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-2">
                <h3 className="text-xl font-semibold mb-3 text-white">Hi {user?.name?.split(' ')[0] || 'there'}, how can I help you today?</h3>
                <p className="text-white/80 mb-6 max-w-md mx-auto">
                  Ask me about training plans, race preparation, injury rehabilitation, or nutrition advice.
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                  {['Create a sprint workout', 'Race strategy for 400m', 'Hamstring injury recovery', 'Pre-race nutrition'].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(suggestion)}
                      className="px-3 py-2 text-sm bg-white/20 hover:bg-white/30 rounded-lg border border-white/25 transition-colors text-white"
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
                  message.role === 'user' ? 'text-white' : 'text-white/90'
                )}>
                  {message.role === 'user' ? 'You' : 'Sprinthia'}
                </div>
                <div
                  className={cn(
                    "w-full rounded-lg px-4 py-3 shadow-sm",
                    message.role === 'user'
                      ? 'bg-white/20 border-l-4 border-white/50'
                      : 'bg-black/20 border-l-4 border-white/50'
                  )}
                >
                  <div className="whitespace-pre-wrap leading-relaxed text-white">
                    {message.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/^#+\s*(.*?)$/gm, '<strong>$1</strong>')
                      .replace(/^\*\s*/gm, '• ')
                      .replace(/^-\s*/gm, '• ')
                      .split('\n').map((line, index) => (
                        <span key={index} dangerouslySetInnerHTML={{ __html: line }} />
                      )).reduce((prev, curr, index) => [prev, <br key={`br-${index}`} />, curr])
                    }
                  </div>
                  <div className="flex items-center justify-between text-xs opacity-70 mt-3 pt-2 border-t border-border">
                    <span>
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    {message.role === 'assistant' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyMessage(message.content, message.id)}
                        className="h-6 w-6 p-0 hover:bg-muted"
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isGenerating && (
              <div className="w-full mb-6">
                <div className="mb-2 text-sm font-medium text-white/90">
                  Sprinthia
                </div>
                <div className="w-full bg-black/20 border-l-4 border-white/50 rounded-lg px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/70">Thinking</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 border-t border-white/20 bg-transparent">
            <div className="flex gap-3 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Sprinthia about training, races, rehabilitation, or nutrition..."
                  className="pr-12 h-12 rounded-xl border-2 border-white/25 focus:border-white/50 transition-colors bg-white/10 backdrop-blur-sm text-white placeholder:text-white/60"
                  disabled={isGenerating}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isGenerating || (user?.subscriptionTier !== 'star' && !user?.sprinthiaPrompts)}
                  size="icon"
                  className="absolute right-1 top-1 h-10 w-10 rounded-lg bg-white/20 hover:bg-white/30 border border-white/25 transition-all text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {user?.subscriptionTier !== 'star' && user?.sprinthiaPrompts === 0 && (
              <p className="text-sm text-white/70 text-center mt-3">
                You've used all your prompts. Upgrade to Pro or Star to continue using Sprinthia.
              </p>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}