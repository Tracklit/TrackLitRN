import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Send, ArrowLeft, MoreVertical, Play, ExternalLink, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import type { DirectMessage, User, Conversation } from "@shared/schema";

interface ConversationWithUser extends Conversation {
  otherUser: User;
  lastMessage?: DirectMessage;
}

interface ExerciseData {
  type: 'exercise_share';
  exerciseId: number;
  exerciseName: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  videoType: 'youtube' | 'upload';
  description: string | null;
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
                className="relative w-full h-full cursor-pointer group"
                onClick={() => setIsPlaying(true)}
              >
                <img
                  src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                  alt={exerciseData.exerciseName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-40 transition-all">
                  <Play className="h-12 w-12 text-white" fill="white" />
                </div>
              </div>
            )}
          </div>
        );
      }
    } else if (exerciseData.videoType === 'upload' && exerciseData.videoUrl) {
      return (
        <video
          controls
          className="w-full aspect-video bg-black rounded-lg"
          poster={exerciseData.thumbnailUrl || undefined}
        >
          <source src={exerciseData.videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    }
    return null;
  };

  return (
    <div className="max-w-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
        <Play className="h-4 w-4" />
        {exerciseData.exerciseName}
      </div>
      
      {renderVideoPlayer()}
      
      {exerciseData.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {exerciseData.description}
        </p>
      )}
      
      <div className="flex items-center gap-2">
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

interface MessageWithUser extends DirectMessage {
  sender: User;
  receiver: User;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Extract userId from URL path
  const pathParts = location.split('/');
  const targetUserId = pathParts.length > 2 && pathParts[1] === 'messages' && pathParts[2] 
    ? parseInt(pathParts[2]) 
    : null;
    
  console.log('URL parts:', { location, pathParts, targetUserId });
  
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations = [] } = useQuery<ConversationWithUser[]>({
    queryKey: ["/api/conversations"],
    enabled: !!user,
  });

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery<MessageWithUser[]>({
    queryKey: ["/api/messages", selectedConversation],
    enabled: !!selectedConversation,
  });

  // Fetch user details when userId is provided
  const { data: targetUser } = useQuery({
    queryKey: [`/api/users/${targetUserId}`],
    enabled: !!targetUserId,
  });

  // Fetch direct messages when targetUserId is provided
  const { data: directMessages = [] } = useQuery<MessageWithUser[]>({
    queryKey: ["/api/direct-messages", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      const response = await apiRequest("GET", `/api/direct-messages/${targetUserId}`);
      return response.json();
    },
    enabled: !!targetUserId,
  });

  // Send message mutation for direct messaging
  const sendDirectMessageMutation = useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: number; content: string }) => {
      return await apiRequest("POST", "/api/direct-messages", { receiverId, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/direct-messages", targetUserId] });
      setNewMessage("");
    },
  });

  // Send message mutation for conversations
  const sendMessageMutation = useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: number; content: string }) => {
      return await apiRequest("POST", "/api/messages", { receiverId, content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedConversation] });
      setNewMessage("");
    },
  });

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      return await apiRequest("PATCH", `/api/conversations/${conversationId}/mark-read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, directMessages]);

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedConversation) {
      markAsReadMutation.mutate(selectedConversation);
    }
  }, [selectedConversation]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user) return;

    if (targetUserId && targetUser) {
      // Send direct message
      sendDirectMessageMutation.mutate({
        receiverId: targetUserId,
        content: newMessage,
      });
    } else if (selectedConversation) {
      // Send regular conversation message
      const conversation = conversations.find(c => c.id === selectedConversation);
      if (conversation) {
        sendMessageMutation.mutate({
          receiverId: conversation.otherUser.id,
          content: newMessage,
        });
      }
    }
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv =>
    !searchQuery || 
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);

  if (!user) return null;

  // Instagram-style direct chat when userId is provided
  if (targetUserId && targetUser && typeof targetUser === 'object' && 'name' in targetUser) {
    const userProfile = targetUser as any; // Type assertion for user data
    return (
      <div className="h-screen flex flex-col bg-[#010a18] pt-16">
        {/* Instagram-style Header */}
        <div className="p-4 border-b border-gray-700 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="mr-3 text-gray-300 hover:text-white"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <Avatar className="h-10 w-10 mr-3">
            <AvatarFallback name={userProfile.name} />
          </Avatar>
          
          <div className="flex-1">
            <h2 className="font-semibold text-base text-white">
              {userProfile.name}
            </h2>
            <p className="text-sm text-gray-400">
              @{userProfile.username}
            </p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* User Profile Section */}
          <div className="text-center py-8 mb-6">
            <Avatar className="h-20 w-20 mx-auto mb-4">
              <AvatarFallback name={userProfile.name} className="text-2xl" />
            </Avatar>
            <h3 className="font-semibold text-lg text-white">{userProfile.name}</h3>
            <p className="text-gray-400">@{userProfile.username}</p>
            {userProfile.bio && (
              <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">
                {userProfile.bio}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              You're connected with this athlete
            </p>
          </div>

          {/* Messages */}
          <div className="space-y-4">
            {directMessages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p>Say hi to start the conversation!</p>
              </div>
            ) : (
              directMessages.map((message: any) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.senderId === user.id ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl",
                      message.senderId === user.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-white"
                    )}
                  >
                    {(() => {
                      // Check if message contains exercise video data
                      const exerciseMatch = message.content.match(/\{.*"type":"exercise_share".*\}/);
                      if (exerciseMatch) {
                        try {
                          const exerciseData = JSON.parse(exerciseMatch[0]) as ExerciseData;
                          const textContent = message.content.replace(exerciseMatch[0], '').replace(/📹.*?\n/, '').trim();
                          
                          return (
                            <div className="space-y-2">
                              {textContent && (
                                <p className="text-sm">{textContent}</p>
                              )}
                              <ExerciseVideoMessage exerciseData={exerciseData} />
                              <p className="text-xs opacity-70">
                                {formatDistanceToNow(new Date(message.createdAt || new Date()), { addSuffix: true })}
                              </p>
                            </div>
                          );
                        } catch (error) {
                          // Fall back to regular text if JSON parsing fails
                          return (
                            <div>
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs opacity-70 mt-1">
                                {formatDistanceToNow(new Date(message.createdAt || new Date()), { addSuffix: true })}
                              </p>
                            </div>
                          );
                        }
                      }
                      
                      // Regular text message
                      return (
                        <div>
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {formatDistanceToNow(new Date(message.createdAt || new Date()), { addSuffix: true })}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message..."
              className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400 rounded-full"
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendDirectMessageMutation.isPending}
              size="sm"
              className="rounded-full bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Regular conversations view
  return (
    <div className="h-screen flex bg-[#010a18] pt-16">
      {/* Conversations Sidebar */}
      <div className="w-1/3 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-end mb-4">
            <MessageCircle className="h-5 w-5 text-white mr-2" />
            <h1 className="text-xl font-bold text-white">Messages</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4">
              <div className="text-center py-8">
                <p className="text-gray-400 mb-2">No conversations yet</p>
                <p className="text-sm text-gray-500">Start a conversation from the Athletes page</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={cn(
                    "p-4 cursor-pointer hover:bg-gray-800 transition-colors",
                    selectedConversation === conversation.id && "bg-gray-800"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback name={conversation.otherUser.name} />
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-white truncate">
                          {conversation.otherUser.name}
                        </h3>
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(conversation.lastMessage.createdAt || new Date()), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 truncate">
                        @{conversation.otherUser.username}
                      </p>
                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-300 truncate mt-1">
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation && selectedConversationData ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700 flex items-center">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarFallback name={selectedConversationData.otherUser.name} />
              </Avatar>
              <div className="flex-1">
                <h2 className="font-semibold text-white">
                  {selectedConversationData.otherUser.name}
                </h2>
                <p className="text-sm text-gray-400">
                  @{selectedConversationData.otherUser.username}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="text-gray-400">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.senderId === user.id ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                        message.senderId === user.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-white"
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatDistanceToNow(new Date(message.createdAt || new Date()), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium text-white mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-400">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}