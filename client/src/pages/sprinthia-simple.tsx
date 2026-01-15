import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Send, User, Copy, Check, History, Plus, Save, Mic, MicOff, Volume2, VolumeX, Languages } from 'lucide-react';
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
  const [savingMessageId, setSavingMessageId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en-US');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Auto-speak AI responses if enabled
  useEffect(() => {
    if (autoSpeak && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && !isGenerating) {
        speakText(lastMessage.content);
      }
    }
  }, [messages, autoSpeak, isGenerating]);

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

  // Voice input using Web Speech API
  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Not supported",
        description: "Voice input is not supported in your browser. Please use Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = selectedLanguage;
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      toast({
        title: "Voice captured",
        description: "Your message has been transcribed",
      });
    };
    
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      toast({
        title: "Voice input failed",
        description: `Error: ${event.error}`,
        variant: "destructive",
      });
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Text-to-speech function
  const speakText = (text: string) => {
    if (!synthRef.current) {
      toast({
        title: "Not supported",
        description: "Text-to-speech is not supported in your browser.",
        variant: "destructive",
      });
      return;
    }

    // Cancel any ongoing speech
    synthRef.current.cancel();

    // Clean text for speech (remove markdown, special characters)
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#+\s*/g, '')
      .replace(/[•\-]\s*/g, '')
      .replace(/\n+/g, '. ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Set voice based on selected language
    const voices = synthRef.current.getVoices();
    const voice = voices.find(v => v.lang.startsWith(selectedLanguage.split('-')[0]));
    if (voice) {
      utterance.voice = voice;
    }
    utterance.lang = selectedLanguage;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      toast({
        title: "Speech failed",
        description: "Could not read the message aloud",
        variant: "destructive",
      });
    };

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSaveAsProgram = async (content: string, messageId: string) => {
    try {
      setSavingMessageId(messageId);
      
      // Prompt user for program title
      const programTitle = prompt("Enter a title for this program:", "Recovery Program from Sprinthia");
      if (!programTitle) {
        setSavingMessageId(null);
        return;
      }

      // Detect if content is rehab-related
      const isRehab = /rehab|rehabilitation|recovery|injury|strain|pain|heal|hamstring|ankle|knee|shoulder|back/i.test(content);

      // Save as structured program with sessions
      const response = await apiRequest('POST', '/api/sprinthia/save-as-program', {
        messageContent: content,
        programTitle: programTitle,
        programType: isRehab ? "rehab" : "training",
        duration: 4
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Program saved!",
          description: `${result.sessionsCreated} sessions created in your programs`,
        });
        setTimeout(() => setSavingMessageId(null), 2000);
      } else {
        throw new Error('Failed to save program');
      }
    } catch (err) {
      console.error('Error saving program:', err);
      toast({
        title: "Failed to save",
        description: "Could not save program",
  };

  return (
    <div className="h-screen bg-background text-white flex flex-col" data-sprinthia-page>
      <div className="flex flex-1 overflow-hidden">
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
          <div className="p-6 pl-20 pt-20 border-b border-white/20 bg-transparent">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">
                    Sprinthia AI Coach
                  </h1>
                  <img 
                    src="/images/powered-by-aria.png" 
                    alt="Powered by Aria" 
                    className="h-8 w-auto object-contain"
                  />
                </div>
                <p className="text-white/80 text-sm">Your AI track and field coach • Always available</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAutoSpeak(!autoSpeak)}
                    className={cn(
                      "flex items-center gap-1",
                      autoSpeak ? "bg-green-500 text-white border-green-500 hover:bg-green-600" : "bg-white/10 text-white border-white/20"
                    )}
                    title={autoSpeak ? "Auto-speak enabled" : "Enable auto-speak"}
                  >
                    {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                      className="flex items-center gap-1 bg-white/10 text-white border-white/20 hover:bg-white/20"
                      title="Change language"
                    >
                      <Languages className="h-4 w-4" />
                    </Button>
                    {showLanguageMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50 py-1">
                        {[
                          { code: 'en-US', label: 'English (US)' },
                          { code: 'es-ES', label: 'Español' },
                          { code: 'fr-FR', label: 'Français' },
                          { code: 'de-DE', label: 'Deutsch' },
                          { code: 'it-IT', label: 'Italiano' },
                          { code: 'pt-BR', label: 'Português' },
                          { code: 'zh-CN', label: '中文' },
                          { code: 'ja-JP', label: '日本語' },
                          { code: 'ko-KR', label: '한국어' },
                        ].map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => {
                              setSelectedLanguage(lang.code);
                              setShowLanguageMenu(false);
                              toast({
                                title: "Language changed",
                                description: `Now using ${lang.label}`,
                              });
                            }}
                            className={cn(
                              "w-full px-4 py-2 text-left hover:bg-muted transition-colors",
                              selectedLanguage === lang.code && "bg-muted font-semibold"
                            )}
                          >
                            {lang.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-1 bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-500 hover:text-black hover:border-yellow-500 font-semibold"
                  >
                    <History className="h-4 w-4" />
                    History
                  </Button>
                </div>
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
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => isSpeaking ? stopSpeaking() : speakText(message.content)}
                          className="h-6 w-6 p-0 hover:bg-muted"
                          title={isSpeaking ? "Stop speaking" : "Read aloud"}
                        >
                          {isSpeaking ? (
                            <VolumeX className="h-3 w-3 text-blue-500" />
                          ) : (
                            <Volume2 className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyMessage(message.content, message.id)}
                          className="h-6 w-6 p-0 hover:bg-muted"
                          title="Copy response"
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveAsProgram(message.content, message.id)}
                          className="h-6 w-6 p-0 hover:bg-muted"
                          title="Save as program"
                        >
                          {savingMessageId === message.id ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Save className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
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
          <div className="p-6 pb-24 border-t border-white/20 bg-transparent">
            <div className="flex gap-3 max-w-4xl mx-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={isListening ? stopVoiceInput : startVoiceInput}
                disabled={isGenerating}
                className={cn(
                  "h-12 w-12 rounded-xl border-2 transition-all",
                  isListening 
                    ? "bg-red-500 border-red-500 hover:bg-red-600 text-white animate-pulse" 
                    : "bg-white/10 border-white/25 hover:bg-white/20 text-white"
                )}
                title={isListening ? "Stop recording" : "Voice input"}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isListening ? "Listening..." : "Ask Sprinthia about training, races, rehabilitation, or nutrition..."}
                  className="pr-12 h-12 rounded-xl border-2 border-white/25 focus:border-white/50 transition-colors bg-white/10 backdrop-blur-sm text-white placeholder:text-white/60"
                  disabled={isGenerating || isListening}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isGenerating || isListening || (user?.subscriptionTier !== 'star' && !user?.sprinthiaPrompts)}
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
  );
}