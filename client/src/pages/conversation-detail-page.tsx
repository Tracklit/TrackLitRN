import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, MoreVertical, Play, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useParams, useLocation } from "wouter";
import type { DirectMessage, User } from "@shared/schema";

interface ExerciseData {
  type: 'exercise_share';
  exerciseId: number;
  exerciseName: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  videoType: 'youtube' | 'upload';
  description: string | null;
}

interface MessageWithUser extends DirectMessage {
  sender: User;
  receiver: User;
}

// Component to render exercise video content in messages
function ExerciseVideoMessage({ exerciseData }: { exerciseData: ExerciseData }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const getYouTubeVideoId = (url: string) => {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const renderVideoPlayer = () => {
    if (exerciseData.videoType === 'youtube' && exerciseData.videoUrl) {
      const videoId = getYouTubeVideoId(exerciseData.videoUrl);
      if (videoId) {
        return (
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            {isPlaying ? (
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div
                className="relative w-full h-full bg-black flex items-center justify-center cursor-pointer"
                onClick={() => setIsPlaying(true)}
              >
                <img
                  src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <Play className="h-12 w-12 text-white" />
                </div>
              </div>
            )}
          </div>
        );
      }
    }

    if (exerciseData.videoType === 'upload' && exerciseData.videoUrl) {
      return (
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          <video
            src={exerciseData.videoUrl}
            controls
            className="w-full h-full object-cover"
            poster={exerciseData.thumbnailUrl || undefined}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="p-3 bg-muted/50 rounded-lg max-w-sm">
      <div className="mb-2">
        <h4 className="font-medium text-sm">{exerciseData.exerciseName}</h4>
        {exerciseData.description && (
          <p className="text-xs text-muted-foreground mt-1">{exerciseData.description}</p>
        )}
      </div>
      
      {renderVideoPlayer()}
      
      <div className="flex items-center gap-2 mt-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => window.open(`/exercise/${exerciseData.exerciseId}`, '_blank')}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          View Details
        </Button>
      </div>
    </div>
  );
}

export default function ConversationDetailPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Extract userId from URL
  const pathParts = location.split('/');
  const targetUserId = pathParts.length > 2 && pathParts[1] === 'messages' && pathParts[2] 
    ? parseInt(pathParts[2]) 
    : null;

  // Fetch user details
  const { data: targetUser } = useQuery<User>({
    queryKey: [`/api/users/${targetUserId}`],
    enabled: !!targetUserId,
  });

  // Fetch direct messages
  const { data: messages = [] } = useQuery<MessageWithUser[]>({
    queryKey: ["/api/direct-messages", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const response = await apiRequest("GET", `/api/direct-messages/${targetUserId}`);
      return response.json();
    },
    enabled: !!targetUserId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: number; content: string }) => {
      return await apiRequest("POST", "/api/direct-messages", { receiverId, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/direct-messages", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setNewMessage("");
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !targetUserId) return;
    
    sendMessageMutation.mutate({
      receiverId: targetUserId,
      content: newMessage.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!targetUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-lg font-medium">Loading conversation...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/conversations")}
          className="p-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {targetUser.name?.charAt(0) || targetUser.username?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h2 className="font-semibold text-base">
            {targetUser.name || targetUser.username}
          </h2>
          <p className="text-sm text-muted-foreground">
            @{targetUser.username}
          </p>
        </div>
        
        <Button variant="ghost" size="sm" className="p-2">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Avatar className="h-16 w-16 mb-4">
              <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                {targetUser.name?.charAt(0) || targetUser.username?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-lg font-medium mb-2">
              {targetUser.name || targetUser.username}
            </h3>
            <p className="text-muted-foreground mb-4">
              @{targetUser.username}
            </p>
            <p className="text-sm text-muted-foreground">
              Send a message to start your conversation
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isFromCurrentUser = message.senderId === user?.id;
              let exerciseData: ExerciseData | null = null;

              try {
                if (message.content.startsWith('{') && message.content.includes('exercise_share')) {
                  exerciseData = JSON.parse(message.content);
                }
              } catch (e) {
                // Not JSON, treat as regular message
              }

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2 max-w-[85%]",
                    isFromCurrentUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  {!isFromCurrentUser && (
                    <Avatar className="h-8 w-8 mt-auto">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {message.sender?.name?.charAt(0) || message.sender?.username?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2 break-words",
                      isFromCurrentUser
                        ? "bg-primary text-primary-foreground ml-2"
                        : "bg-muted mr-2"
                    )}
                  >
                    {exerciseData ? (
                      <ExerciseVideoMessage exerciseData={exerciseData} />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                    
                    <p className={cn(
                      "text-xs mt-1 opacity-70",
                      isFromCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {message.createdAt && formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex gap-2">
          <Input
            placeholder="Message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 rounded-full bg-muted/50 border-none"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            className="rounded-full px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}