import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Users, 
  Send, 
  Plus, 
  Search,
  MoreVertical,
  Hash,
  Lock,
  Globe,
  ArrowLeft,
  Check,
  CheckCheck,
  Edit2,
  Reply,
  MoreHorizontal,
  Phone,
  Video,
  Paperclip,
  Smile,
  Pin,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow, format } from "date-fns";

interface ChatGroup {
  id: number;
  name: string;
  description?: string;
  avatar_url?: string;
  creator_id: number;
  admin_ids?: number[];
  member_ids?: number[];
  is_private: boolean;
  invite_code?: string;
  created_at: string;
  last_message_at?: string;
  last_message?: string;
  message_count?: number;
}

interface ChatMessage {
  id: number;
  group_id: number;
  user_id: number;
  sender_name: string;
  sender_username?: string;
  sender_profile_image?: string;
  text: string;
  created_at: string;
  edited_at?: string;
  is_edited?: boolean;
  reply_to_id?: number;
  message_type: 'text' | 'image' | 'file' | 'system';
  media_url?: string;
  is_read?: boolean;
  read_by?: number[];
}

interface User {
  id: number;
  name: string;
  username?: string;
  profileImageUrl?: string;
}

export default function ChatPage() {
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [editingMessage, setEditingMessage] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
    enabled: true,
  });

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    }
  }, [user]);

  // Fetch chat groups
  const { data: groups = [] } = useQuery({
    queryKey: ['/api/chat/groups'],
    enabled: true,
  });

  // Fetch messages for selected group
  const { data: messages = [] } = useQuery({
    queryKey: ['/api/chat/groups', selectedGroup, 'messages'],
    enabled: selectedGroup !== null,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { text: string; reply_to_id?: number }) => {
      return apiRequest(`/api/chat/groups/${selectedGroup}/messages`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups', selectedGroup, 'messages'] });
      setMessageText("");
      setReplyingTo(null);
    },
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async (data: { messageId: number; text: string }) => {
      return apiRequest(`/api/chat/groups/${selectedGroup}/messages/${data.messageId}`, {
        method: 'PUT',
        body: JSON.stringify({ text: data.text }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups', selectedGroup, 'messages'] });
      setEditingMessage(null);
      setMessageText("");
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedGroup) return;

    if (editingMessage) {
      editMessageMutation.mutate({ messageId: editingMessage, text: messageText });
    } else {
      sendMessageMutation.mutate({ 
        text: messageText, 
        reply_to_id: replyingTo?.id 
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startEdit = (message: ChatMessage) => {
    setEditingMessage(message.id);
    setMessageText(message.text);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setMessageText("");
  };

  const setReply = (message: ChatMessage) => {
    setReplyingTo(message);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'HH:mm');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();
    
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { [key: string]: ChatMessage[] }, message: ChatMessage) => {
    const date = formatDate(message.created_at);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  if (!selectedGroup) {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-gray-900">Chats</h1>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search chats..."
                className="pl-10 bg-gray-50 border-0 focus:bg-white"
              />
            </div>
          </div>

          {/* Chat List */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {groups.map((group: ChatGroup) => (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroup(group.id)}
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <Avatar className="h-12 w-12 mr-3">
                    <AvatarImage src={group.avatar_url} />
                    <AvatarFallback className="bg-blue-500 text-white">
                      {group.is_private ? <Lock className="h-6 w-6" /> : <Hash className="h-6 w-6" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">{group.name}</h3>
                      {group.last_message_at && (
                        <span className="text-xs text-gray-500">
                          {formatTime(group.last_message_at)}
                        </span>
                      )}
                    </div>
                    {group.last_message && (
                      <p className="text-sm text-gray-500 truncate">{group.last_message}</p>
                    )}
                  </div>
                  {group.message_count && group.message_count > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {group.message_count}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Chat Area - Empty State */}
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a chat</h2>
            <p className="text-gray-500">Choose a conversation to start messaging</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedGroupData = groups.find((g: ChatGroup) => g.id === selectedGroup);

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Chats</h1>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search chats..."
              className="pl-10 bg-gray-50 border-0 focus:bg-white"
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {groups.map((group: ChatGroup) => (
              <div
                key={group.id}
                onClick={() => setSelectedGroup(group.id)}
                className={cn(
                  "flex items-center p-3 rounded-lg cursor-pointer transition-colors",
                  selectedGroup === group.id ? "bg-blue-50" : "hover:bg-gray-50"
                )}
              >
                <Avatar className="h-12 w-12 mr-3">
                  <AvatarImage src={group.avatar_url} />
                  <AvatarFallback className="bg-blue-500 text-white">
                    {group.is_private ? <Lock className="h-6 w-6" /> : <Hash className="h-6 w-6" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 truncate">{group.name}</h3>
                    {group.last_message_at && (
                      <span className="text-xs text-gray-500">
                        {formatTime(group.last_message_at)}
                      </span>
                    )}
                  </div>
                  {group.last_message && (
                    <p className="text-sm text-gray-500 truncate">{group.last_message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="mr-3 md:hidden"
                onClick={() => setSelectedGroup(null)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-10 w-10 mr-3">
                <AvatarImage src={selectedGroupData?.avatar_url} />
                <AvatarFallback className="bg-blue-500 text-white">
                  {selectedGroupData?.is_private ? <Lock className="h-5 w-5" /> : <Hash className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-gray-900">{selectedGroupData?.name}</h2>
                <p className="text-sm text-gray-500">
                  {selectedGroupData?.member_ids?.length || 0} members
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {Object.entries(groupedMessages).map(([date, dayMessages]) => (
              <div key={date}>
                {/* Date Separator */}
                <div className="flex items-center justify-center my-4">
                  <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {date}
                  </div>
                </div>
                
                {/* Messages for this date */}
                {dayMessages.map((message: ChatMessage) => {
                  const isOwnMessage = currentUser && message.user_id === currentUser.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex items-start space-x-3 group",
                        isOwnMessage ? "justify-end" : "justify-start"
                      )}
                    >
                      {!isOwnMessage && (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage src={message.sender_profile_image} />
                          <AvatarFallback className="bg-gray-500 text-white text-xs">
                            {getInitials(message.sender_name)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={cn("flex flex-col", isOwnMessage ? "items-end" : "items-start")}>
                        {/* Message bubble */}
                        <div
                          className={cn(
                            "relative max-w-md px-4 py-2 rounded-2xl",
                            isOwnMessage
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-900"
                          )}
                        >
                          {/* Reply indicator */}
                          {message.reply_to_id && (
                            <div className={cn(
                              "text-xs opacity-70 mb-1 p-2 rounded border-l-2",
                              isOwnMessage ? "border-blue-300 bg-blue-400" : "border-gray-400 bg-gray-200"
                            )}>
                              Replying to message
                            </div>
                          )}
                          
                          {/* Sender name for group messages */}
                          {!isOwnMessage && (
                            <div className="text-xs font-medium text-blue-600 mb-1">
                              {message.sender_name}
                            </div>
                          )}
                          
                          {/* Message text */}
                          <div className="text-sm leading-relaxed">
                            {message.text}
                          </div>
                          
                          {/* Edit indicator */}
                          {message.is_edited && (
                            <div className={cn(
                              "text-xs opacity-70 mt-1",
                              isOwnMessage ? "text-blue-200" : "text-gray-500"
                            )}>
                              edited
                            </div>
                          )}
                        </div>
                        
                        {/* Message info */}
                        <div className="flex items-center space-x-1 mt-1">
                          <span className="text-xs text-gray-500">
                            {formatTime(message.created_at)}
                          </span>
                          {isOwnMessage && (
                            <div className="text-blue-500">
                              {message.is_read ? (
                                <CheckCheck className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Message actions */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setReply(message)}
                          >
                            <Reply className="h-3 w-3" />
                          </Button>
                          {isOwnMessage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => startEdit(message)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          {/* Reply indicator */}
          {replyingTo && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-3 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-blue-900">
                    Replying to {replyingTo.sender_name}
                  </div>
                  <div className="text-sm text-blue-700 truncate">
                    {replyingTo.text}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelReply}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
            </div>
          )}
          
          {/* Edit indicator */}
          {editingMessage && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-3 rounded">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-yellow-900">
                  Editing message
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelEdit}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex items-end space-x-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Paperclip className="h-4 w-4" />
            </Button>
            <div className="flex-1 relative">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="pr-12 resize-none"
                disabled={sendMessageMutation.isPending || editMessageMutation.isPending}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || sendMessageMutation.isPending || editMessageMutation.isPending}
              className="h-10 w-10 p-0 rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}