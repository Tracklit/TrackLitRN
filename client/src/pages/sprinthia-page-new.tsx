import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Info, Send, Zap, Crown, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SidebarNavigation } from "@/components/layout/sidebar-navigation";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";

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
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/sprinthia/conversations'],
    enabled: !!user
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/sprinthia/messages', currentConversationId],
    enabled: !!currentConversationId
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/sprinthia/chat", { 
        message,
        conversationId: currentConversationId 
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.conversationId && !currentConversationId) {
        setCurrentConversationId(data.conversationId);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/sprinthia/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sprinthia/messages', data.conversationId || currentConversationId] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setIsTyping(false);
    }
  });

  const handleSendMessage = async () => {
    if (!input.trim() || sendMessageMutation.isPending || isTyping) return;
    
    const messageText = input.trim();
    setInput('');
    setIsTyping(true);
    
    try {
      await sendMessageMutation.mutateAsync(messageText);
    } catch (error) {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  return (
    <div className="flex h-screen bg-background">
      <SidebarNavigation />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-background">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Sprinthia</h1>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Info className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sprinthia Information</DialogTitle>
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
                      <span>{user?.spikes || 0} spikes</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">How It Works</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Ask about training plans and workouts</li>
                      <li>• Get race strategy advice</li>
                      <li>• Rehabilitation and injury guidance</li>
                      <li>• Nutrition recommendations</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Prompt Limits</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Free: 1 prompt per day</li>
                      <li>• Pro: 20 prompts per month</li>
                      <li>• Star: 100 prompts per month</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Main content area */}
          <div className="flex-1 relative">
            <div className="absolute inset-0 flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-auto p-6">
                {!currentConversationId && messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-center max-w-md">
                      <div 
                        className="w-full h-72 mx-auto mb-6 bg-cover rounded-lg"
                        style={{ 
                          backgroundImage: 'url(/brain-header.jpg)',
                          backgroundPosition: 'center -70px'
                        }}
                      />
                      <h2 className="text-2xl font-bold mb-6">Hi {user?.name?.split(' ')[0] || user?.username || 'there'}, how can I help you today?</h2>
                      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Zap className="h-4 w-4" />
                          {user?.sprinthiaPrompts || 0} prompts left
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 max-w-4xl mx-auto">
                    {messagesLoading ? (
                      <div className="space-y-4">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                      </div>
                    ) : (
                      messages.map((message: SprinthiaMessage) => (
                        <div 
                          key={message.id} 
                          className={cn(
                            "flex gap-3",
                            message.role === 'user' ? "justify-end" : "justify-start"
                          )}
                        >
                          {message.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                              <img 
                                src="/sprinthia-new.jpeg" 
                                alt="Sprinthia"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          
                          <div 
                            className={cn(
                              "rounded-lg px-4 py-3 max-w-[80%]",
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
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                          <img 
                            src="/sprinthia-avatar.jpeg?v=2" 
                            alt="Sprinthia"
                            className="w-full h-full object-cover"
                          />
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
              <div className="border-t border-border p-4 bg-background">
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
                        You have no prompts remaining. Purchase Spike packs to continue using Sprinthia.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}