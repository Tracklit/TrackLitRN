import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Send, ArrowLeft, MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useParams } from "wouter";
import type { DirectMessage, User, Conversation } from "@shared/schema";

interface ConversationWithUser extends Conversation {
  otherUser: User;
  lastMessage?: DirectMessage;
}

interface MessageWithUser extends DirectMessage {
  sender: User;
  receiver: User;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const params = useParams();
  const targetUserId = params.userId ? parseInt(params.userId) : null;
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

  // Send message mutation
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

  // Fetch user details when userId is provided
  const { data: targetUser } = useQuery({
    queryKey: ["/api/users", targetUserId],
    enabled: !!targetUserId,
  });

  // Fetch direct messages when userId is provided
  const { data: directMessages = [] } = useQuery({
    queryKey: ["/api/direct-messages", targetUserId],
    enabled: !!targetUserId,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedConversation) {
      markAsReadMutation.mutate(selectedConversation);
    }
  }, [selectedConversation]);

  // Auto-select conversation when userId is provided
  useEffect(() => {
    if (targetUserId && conversations.length > 0) {
      const conversation = conversations.find(c => c.otherUser.id === targetUserId);
      if (conversation) {
        setSelectedConversation(conversation.id);
      }
    }
  }, [targetUserId, conversations]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Direct messaging with targetUserId
    if (targetUserId && targetUser) {
      sendMessageMutation.mutate({
        receiverId: targetUserId,
        content: newMessage.trim(),
      });
      return;
    }

    // Regular conversation messaging
    if (!selectedConversation) return;
    const conversation = conversations.find(c => c.id === selectedConversation);
    if (conversation) {
      sendMessageMutation.mutate({
        receiverId: conversation.otherUser.id,
        content: newMessage.trim(),
      });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConversationData = conversations.find(c => c.id === selectedConversation);

  if (!user) return null;

  // Instagram-style direct chat when userId is provided
  if (targetUserId && targetUser && typeof targetUser === 'object' && 'name' in targetUser) {
    const user = targetUser as any; // Type assertion for user data
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
            <AvatarFallback name={user.name} />
          </Avatar>
          
          <div className="flex-1">
            <h2 className="font-semibold text-base text-white">
              {user.name}
            </h2>
            <p className="text-sm text-gray-400">
              @{user.username}
            </p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* User Profile Section */}
          <div className="text-center py-8 mb-6">
            <Avatar className="h-20 w-20 mx-auto mb-4">
              <AvatarFallback name={user.name} className="text-2xl" />
            </Avatar>
            <h3 className="font-semibold text-lg text-white">{user.name}</h3>
            <p className="text-gray-400">@{user.username}</p>
            {user.bio && (
              <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">
                {user.bio}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              You're connected with this athlete
            </p>
          </div>

          {/* Messages */}
          <div className="space-y-4">
            {directMessages.length === 0 ? (
              <div className="text-center text-gray-400 py-4">
                <p className="text-sm">Start the conversation!</p>
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
                        ? "bg-blue-500 text-white"
                        : "bg-gray-700 text-white"
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Instagram-style Message Input */}
        <div className="p-4 border-t border-gray-700">
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Message..."
                className="rounded-full border-gray-600 bg-gray-800/50 px-4 py-2 text-white placeholder-gray-400"
                disabled={sendMessageMutation.isPending}
              />
            </div>
            <Button 
              type="submit" 
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
              variant="ghost"
              size="sm"
              className="text-blue-400 font-semibold hover:text-blue-300"
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[#010a18] pt-16">
      {/* Conversations List */}
      <div className={cn(
        "w-full md:w-80 border-r border-gray-700 flex flex-col",
        selectedConversation && "hidden md:flex"
      )}>
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
            <div className="p-4 text-center text-gray-400">
              <p>No conversations yet</p>
              <p className="text-sm mt-1">Start a conversation from the Athletes page</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation.id)}
                className={cn(
                  "p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors",
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
                      {conversation.lastMessageAt && (
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
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
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className={cn(
          "flex-1 flex flex-col",
          !selectedConversation && "hidden md:flex"
        )}>
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-700 flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedConversation(null)}
              className="md:hidden text-gray-300 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            {selectedConversationData && (
              <>
                <Avatar className="h-10 w-10">
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
                <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                    "max-w-xs lg:max-w-md px-4 py-2 rounded-2xl",
                    message.senderId === user.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-white"
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={cn(
                    "text-xs mt-1",
                    message.senderId === user.id ? "text-blue-100" : "text-gray-400"
                  )}>
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
              <Button
                type="submit"
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              <Send className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Select a conversation</h3>
            <p>Choose a conversation to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}