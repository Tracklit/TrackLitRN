import { useState, useEffect, useRef } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Edit, X, Check } from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

interface ChatMessage {
  id: number;
  text: string;
  sender_id: number;
  sender_name: string;
  sender_profile_image?: string;
  created_at: string;
  is_edited?: boolean;
}

interface DirectMessage {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  createdAt: string;
  isEdited?: boolean;
  sender?: {
    name: string;
    profileImageUrl?: string;
  };
  receiver?: {
    name: string;
    profileImageUrl?: string;
  };
}

interface MessageBubbleProps {
  message: ChatMessage | DirectMessage;
  isOwn: boolean;
  currentUser?: any;
  onStartEdit?: (messageId: number, messageText: string) => void;
  isBeingEdited?: boolean;
}

const MessageBubble = ({ message, isOwn, currentUser, onStartEdit, isBeingEdited }: MessageBubbleProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const handlePressStart = () => {
    if (!isOwn) return;
    
    const timer = setTimeout(() => {
      setShowMenu(true);
      setLongPressTimer(null);
    }, 500);
    setLongPressTimer(timer);
  };

  const handlePressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const startEdit = () => {
    const messageText = (message as any).text || (message as any).content || '';
    onStartEdit?.(message.id, messageText);
    setShowMenu(false);
  };

  const getProfileImage = () => {
    if (isOwn && currentUser) {
      return currentUser.profileImageUrl;
    }
    if ('sender_profile_image' in message) {
      return message.sender_profile_image;
    }
    if ('sender' in message && message.sender) {
      return message.sender.profileImageUrl;
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
    if ('sender' in message && message.sender) {
      return message.sender.name;
    }
    return 'Unknown';
  };

  return (
    <div className={`flex gap-3 mb-3 relative ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Profile Image for other users (left side) */}
      {!isOwn && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={getProfileImage() || undefined} />
          <AvatarFallback className="bg-gray-400 text-white text-xs">
            {getSenderName().slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div 
          className={`
            rounded-2xl py-2 px-3 min-w-[100px] relative
            ${isOwn ? 'bg-blue-500 text-white ml-auto' : 'bg-white text-black border border-gray-200'}
            ${isBeingEdited ? 'ring-2 ring-blue-400' : ''}
          `}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
        >
          {!isOwn && (
            <div className="text-xs font-medium mb-1 text-gray-600">
              {getSenderName()}
            </div>
          )}
          
          <div className="text-sm break-words">
            {(message as any).text || (message as any).content || ''}
          </div>
          
          {/* Context Menu */}
          {showMenu && isOwn && (
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
          {(('is_edited' in message && message.is_edited) || ('isEdited' in message && message.isEdited)) && (
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

export default function ChatPage() {
  const { conversationId } = useParams();
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [originalMessage, setOriginalMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const isEditing = editingMessageId !== null;

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['/api/user'],
    retry: false
  });

  // Get conversation details
  const { data: conversation } = useQuery({
    queryKey: ['/api/conversations', conversationId],
    enabled: !!conversationId
  });

  // Get messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    enabled: !!conversationId
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; receiverId: number }) => {
      return apiRequest(`/api/conversations/${conversationId}/messages`, 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setNewMessage('');
      setIsLoading(false);
    },
    onError: () => {
      setIsLoading(false);
    }
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async (data: { messageId: number; content: string }) => {
      return apiRequest(`/api/messages/${data.messageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content: data.content })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'messages'] });
      cancelEdit();
    }
  });

  const startEdit = (messageId: number, messageText: string) => {
    setEditingMessageId(messageId);
    setOriginalMessage(newMessage);
    setNewMessage(messageText);
    inputRef.current?.focus();
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setNewMessage(originalMessage);
    setOriginalMessage('');
  };

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content || !conversation) return;

    if (isEditing) {
      // Handle edit
      if (content !== originalMessage) {
        editMessageMutation.mutate({
          messageId: editingMessageId!,
          content
        });
      } else {
        cancelEdit();
      }
    } else {
      // Handle new message
      setIsLoading(true);
      const receiverId = conversation.user1Id === currentUser?.id ? conversation.user2Id : conversation.user1Id;
      sendMessageMutation.mutate({ content, receiverId });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getOtherUser = () => {
    if (!conversation || !currentUser) return null;
    return conversation.user1Id === currentUser.id ? conversation.user2 : conversation.user1;
  };

  const otherUser = getOtherUser();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-200">
        <Link href="/messages">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        
        {otherUser && (
          <>
            <Avatar className="h-8 w-8">
              <AvatarImage src={otherUser.profileImageUrl || undefined} />
              <AvatarFallback className="bg-gray-400 text-white text-xs">
                {(otherUser.name || otherUser.username || 'U').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-medium text-gray-900">
                {otherUser.name || otherUser.username}
              </h2>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messagesLoading ? (
          <div className="flex justify-center py-8">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center py-8">
            <div className="text-gray-500">No messages yet. Start the conversation!</div>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message: ChatMessage | DirectMessage) => {
              const isOwn = 'sender_id' in message 
                ? message.sender_id === currentUser?.id 
                : message.senderId === currentUser?.id;
              
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={isOwn}
                  currentUser={currentUser}
                  onStartEdit={startEdit}
                  isBeingEdited={editingMessageId === message.id}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        {isEditing && (
          <div className="mb-2 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded flex items-center justify-between">
            <span>Editing message...</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelEdit}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isEditing ? "Edit message..." : "Type a message..."}
            className="flex-1"
            disabled={isLoading || sendMessageMutation.isPending || editMessageMutation.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isLoading || sendMessageMutation.isPending || editMessageMutation.isPending}
            size="sm"
          >
            {isEditing ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}