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
  Globe,
  ArrowLeft,
  Edit,
  Trash
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
          {groupsLoading || conversationsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {filteredGroups.map((group: ChatGroup) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedChat({ type: 'group', id: group.id })}
                  className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={group.avatar_url} />
                        <AvatarFallback className="bg-blue-500 text-white">
                          {group.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Privacy Indicator */}
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
    </div>
  );
};

// Message Bubble Component
interface MessageBubbleProps {
  message: ChatMessage | DirectMessage;
  isOwn: boolean;
  currentUser?: any;
}

const MessageBubble = ({ message, isOwn, currentUser }: MessageBubbleProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const handlePressStart = () => {
    const timer = setTimeout(() => {
      if (isOwn) {
        setShowMenu(true);
      }
    }, 500); // 500ms for long press
    setLongPressTimer(timer);
  };

  const handlePressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const startEdit = () => {
    setIsEditing(true);
    const messageText = (message as any).text || (message as any).content || '';
    setEditedText(messageText);
    setShowMenu(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditedText('');
  };

  const saveEdit = async () => {
    try {
      const response = await apiRequest(
        'PUT',
        `/api/chat/messages/${message.id}`,
        { text: editedText }
      );

      if (response.ok) {
        const updatedMessage = await response.json();
        
        // Update the query cache with the new message data
        queryClient.setQueryData(['/api/chat/groups/1/messages'], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((msg: any) => 
            msg.id === message.id ? { ...msg, text: editedText, edited_at: updatedMessage.edited_at } : msg
          );
        });
        
        setIsEditing(false);
        setEditedText('');
      } else {
        console.error('Failed to edit message');
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const getProfileImage = () => {
    if (isOwn && currentUser) {
      return currentUser.profileImageUrl;
    }
    if ('sender_profile_image' in message) {
      return message.sender_profile_image;
    }
    return null;
  };

  const getSenderName = () => {
    if (isOwn && currentUser) {
      return currentUser.name || currentUser.username;
    }
    if ('sender_name' in message) {
      return String(message.sender_name);
    }
    return 'Unknown';
  };

  return (
    <div className={cn(
      "flex w-full mb-4 items-end gap-2 relative",
      isOwn ? "justify-end" : "justify-start"
    )}>
      {/* Profile Image for other users (left side) */}
      {!isOwn && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={getProfileImage() || undefined} />
          <AvatarFallback className="bg-gray-400 text-white text-xs">
            {getSenderName().slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className="flex flex-col max-w-xs lg:max-w-md">
        <div 
          className={cn(
            "min-w-[100px] px-3 py-2 rounded-2xl bg-white text-black border border-gray-200 relative",
            isOwn 
              ? "rounded-br-none" 
              : "rounded-bl-none"
          )}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
        >
          {!isOwn && 'sender_name' in message && (
            <div className="text-xs font-medium mb-1 text-gray-600">
              {getSenderName()}
            </div>
          )}
          
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit}>Save</Button>
                <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="text-sm break-words">
              {(message as any).text || (message as any).content || ''}
            </div>
          )}
          
          {/* Context Menu */}
          {showMenu && (
            <div className="absolute top-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={startEdit}
                className="flex items-center gap-2 w-full justify-start"
              >
                <Edit className="h-3 w-3" />
                Edit
              </Button>
            </div>
          )}
        </div>
        
        {/* Right-aligned timestamp */}
        <div className="text-[8px] mt-1 text-gray-500 text-right">
          {formatTime('created_at' in message ? message.created_at : message.createdAt)}
          {(message.edited_at || message.editedAt) && (
            <span className="ml-1">(edited)</span>
          )}
        </div>
      </div>
      
      {/* Profile Image for current user (right side) */}
      {isOwn && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={getProfileImage() || undefined} />
          <AvatarFallback className="bg-blue-400 text-white text-xs">
            {getSenderName().slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      
      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}
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

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user');
      return response.json();
    }
  });

  // Fetch chat groups for group name
  const { data: chatGroups = [] } = useQuery({
    queryKey: ['/api/chat/groups'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/chat/groups');
      return response.json();
    }
  });

  // Fetch messages for selected chat
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: selectedChat.type === 'group' 
      ? ['/api/chat/groups', selectedChat.id, 'messages']
      : ['/api/chat/direct', selectedChat.id, 'messages'],
    queryFn: async () => {
      const endpoint = selectedChat.type === 'group'
        ? `/api/chat/groups/${selectedChat.id}/messages`
        : `/api/chat/direct/${selectedChat.id}/messages`;
      const response = await apiRequest('GET', endpoint);
      return response.json();
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      const endpoint = selectedChat.type === 'group'
        ? `/api/chat/groups/${selectedChat.id}/messages`
        : `/api/chat/direct/${selectedChat.id}/messages`;
      
      const response = await apiRequest('POST', endpoint, { text });
      return response.json();
    },
    onSuccess: () => {
      setMessageText("");
      const queryKey = selectedChat.type === 'group' 
        ? ['/api/chat/groups', selectedChat.id, 'messages']
        : ['/api/chat/direct', selectedChat.id, 'messages'];
      queryClient.invalidateQueries({ queryKey });
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
    if (!messageText.trim()) return;
    
    sendMessageMutation.mutate({ text: messageText.trim() });
  };
  
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
            className="p-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <Avatar className="h-8 w-8">
            <AvatarImage src={selectedGroup?.avatar_url} />
            <AvatarFallback className="bg-blue-500 text-white text-sm">
              {selectedGroup?.name.slice(0, 2).toUpperCase() || 'CH'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">
              {selectedGroup?.name || 'Chat'}
            </h2>
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
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
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
                currentUser={currentUser}
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
    <div className="fixed inset-0 bg-white flex flex-col w-screen h-screen">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Create Group</h1>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter group description"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPrivate"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="isPrivate" className="text-sm text-gray-700">
              Make this group private
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()} className="flex-1 bg-blue-500 hover:bg-blue-600">
              Create Group
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;