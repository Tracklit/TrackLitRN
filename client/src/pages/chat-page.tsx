import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  MessageCircle, 
  Users, 
  Send, 
  Plus, 
  Search,
  MoreVertical,
  Hash,
  Lock,
  Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

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
}

interface DirectMessage {
  id: number;
  conversationId: number;
  senderId: number;
  receiverId: number;
  text: string;
  createdAt: string;
  editedAt?: string;
  isDeleted: boolean;
  isRead: boolean;
  readAt?: string;
  replyToId?: number;
  messageType: 'text' | 'image' | 'file';
  mediaUrl?: string;
}

interface Conversation {
  id: number;
  user1Id: number;
  user2Id: number;
  lastMessageId?: number;
  lastMessageAt: string;
  createdAt: string;
}

const ChatPage = () => {
  const [selectedChat, setSelectedChat] = useState<{ type: 'group' | 'direct'; id: number } | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch chat groups
  const { data: chatGroups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ['/api/chat/groups'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/chat/groups');
      return response.json();
    }
  });

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/conversations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/conversations');
      return response.json();
    }
  });

  // Fetch messages for selected chat
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: selectedChat?.type === 'group' 
      ? ['/api/chat/groups', selectedChat.id, 'messages']
      : ['/api/chat/direct', selectedChat?.id, 'messages'],
    queryFn: async () => {
      if (!selectedChat) return [];
      const endpoint = selectedChat.type === 'group'
        ? `/api/chat/groups/${selectedChat.id}/messages`
        : `/api/chat/direct/${selectedChat.id}/messages`;
      const response = await apiRequest('GET', endpoint);
      return response.json();
    },
    enabled: !!selectedChat
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ text, replyToId }: { text: string; replyToId?: number }) => {
      if (!selectedChat) throw new Error("No chat selected");
      
      const endpoint = selectedChat.type === 'group'
        ? `/api/chat/groups/${selectedChat.id}/messages`
        : `/api/chat/direct/${selectedChat.id}/messages`;
      
      const response = await apiRequest('POST', endpoint, { text, replyToId });
      return response.json();
    },
    onSuccess: () => {
      setMessageText("");
      if (selectedChat) {
        const queryKey = selectedChat.type === 'group' 
          ? ['/api/chat/groups', selectedChat.id, 'messages']
          : ['/api/chat/direct', selectedChat.id, 'messages'];
        queryClient.invalidateQueries({ queryKey });
        
        // Also invalidate chat lists to update last message
        queryClient.invalidateQueries({ queryKey: ['/api/chat/groups'] });
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      }
    }
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: { name: string; description?: string; isPrivate: boolean }) => {
      const response = await apiRequest('POST', '/api/chat/groups', groupData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups'] });
      setShowCreateGroup(false);
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChat) return;
    
    sendMessageMutation.mutate({ text: messageText.trim() });
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return formatMessageTime(timestamp);
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Filter chats based on search
  const filteredGroups = chatGroups.filter((group: ChatGroup) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showCreateGroup) {
    return <CreateGroupForm onCancel={() => setShowCreateGroup(false)} onSubmit={createGroupMutation.mutate} />;
  }

  // Show chat interface if a chat is selected
  if (selectedChat) {
    return <ChatInterface selectedChat={selectedChat} onBack={() => setSelectedChat(null)} />;
  }

  return (
    <div className="fixed inset-0 bg-white flex flex-col w-screen h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold text-gray-900">Chats</h1>
          <Button
            size="sm"
            onClick={() => setShowCreateGroup(true)}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Chat List - Full Width */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-100">


          {/* Groups Section */}
          {filteredGroups.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Groups
              </div>
              {filteredGroups.map((group: ChatGroup) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedChat({ type: 'group', id: group.id })}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={group.avatar_url} />
                        <AvatarFallback className="bg-blue-500 text-white">
                          {group.is_private ? <Lock className="h-5 w-5" /> : <Hash className="h-5 w-5" />}
                        </AvatarFallback>
                      </Avatar>
                      {group.is_private ? (
                        <Lock className="absolute -bottom-1 -right-1 h-3 w-3 text-gray-500" />
                      ) : (
                        <Globe className="absolute -bottom-1 -right-1 h-3 w-3 text-green-500" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 truncate">{group.name}</h3>
                        <span className="text-xs text-gray-500">
                          {group.last_message_at ? formatLastMessageTime(group.last_message_at) : ''}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 truncate">
                          {group.last_message || "No messages yet"}
                        </p>
                        <div className="flex items-center space-x-1">
                          <Badge variant="secondary" className="text-xs">
                            {group.member_ids?.length || 0}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Empty State */}
          {filteredGroups.length === 0 && conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <MessageCircle className="h-16 w-16 mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No chats yet</h3>
              <p className="text-center">Create a group or start a conversation to get started</p>
            </div>
          )}
        </div>
      </div>
  );
};

// Message Bubble Component
interface MessageBubbleProps {
  message: ChatMessage | DirectMessage;
  isOwn: boolean;
}

const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div className={cn("flex items-end space-x-2 max-w-[70%]", isOwn && "flex-row-reverse space-x-reverse")}>
        {!isOwn && (
          <Avatar className="h-6 w-6">
            <AvatarImage src={('senderProfileImage' in message) ? message.senderProfileImage : undefined} />
            <AvatarFallback className="text-xs">
              {('senderName' in message) ? message.senderName.charAt(0) : 'U'}
            </AvatarFallback>
          </Avatar>
        )}
        
        <div
          className={cn(
            "rounded-2xl px-4 py-2 max-w-full",
            isOwn
              ? "bg-blue-500 text-white"
              : "bg-white border border-gray-200 text-gray-900"
          )}
        >
          {!isOwn && 'senderName' in message && (
            <p className="text-xs font-medium text-blue-600 mb-1">{message.senderName}</p>
          )}
          
          <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
          
          <div className={cn("flex items-center justify-end mt-1 space-x-1")}>
            {message.editedAt && (
              <span className={cn("text-xs", isOwn ? "text-blue-200" : "text-gray-400")}>
                edited
              </span>
            )}
            <span className={cn("text-xs", isOwn ? "text-blue-200" : "text-gray-400")}>
              {formatTime(message.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Chat Interface Component
interface ChatInterfaceProps {
  selectedChat: { type: 'group' | 'direct'; id: number };
  onBack: () => void;
}

const ChatInterface = ({ selectedChat, onBack }: ChatInterfaceProps) => {
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch messages for selected chat
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/chat/groups/${selectedChat.id}/messages`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/chat/groups/${selectedChat.id}/messages`);
      return response.json();
    },
    enabled: selectedChat.type === 'group'
  });

  // Get current user from context
  const { data: currentUser } = useQuery({
    queryKey: ['/api/user']
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { text: string }) => {
      const response = await apiRequest('POST', `/api/chat/groups/${selectedChat.id}/messages`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${selectedChat.id}/messages`] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups'] });
      setMessageText("");
    }
  });

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sendMessageMutation.isPending) return;
    
    sendMessageMutation.mutate({ text: messageText.trim() });
  };

  // Get selected group info
  const { data: chatGroups = [] } = useQuery({
    queryKey: ['/api/chat/groups']
  });
  
  const selectedGroup = chatGroups.find((group: ChatGroup) => group.id === selectedChat.id);

  return (
    <div className="fixed inset-0 bg-white flex flex-col w-screen h-screen">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2"
          >
            ←
          </Button>
          
          <Avatar className="h-10 w-10">
            <AvatarImage src={selectedGroup?.avatar_url} />
            <AvatarFallback className="bg-blue-500 text-white">
              {selectedGroup?.is_private ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">{selectedGroup?.name || 'Chat'}</h2>
            <p className="text-sm text-gray-500">
              {selectedGroup?.member_ids?.length || 0} members
            </p>
          </div>
          
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messagesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <MessageCircle className="h-16 w-16 mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
              <p className="text-center">Be the first to send a message!</p>
            </div>
          ) : (
            messages.map((message: ChatMessage) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.user_id === currentUser?.id}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            type="submit"
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

// Create Group Form Component
interface CreateGroupFormProps {
  onCancel: () => void;
  onSubmit: (data: { name: string; description?: string; isPrivate: boolean }) => void;
}

const CreateGroupForm = ({ onCancel, onSubmit }: CreateGroupFormProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      isPrivate
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create New Group</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter group name..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional group description..."
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPrivate"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isPrivate" className="text-sm text-gray-700">
                Private group (invite only)
              </label>
            </div>
            
            <div className="flex space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim()} className="flex-1 bg-blue-500 hover:bg-blue-600">
                Create Group
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatPage;