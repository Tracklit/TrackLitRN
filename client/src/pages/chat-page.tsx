import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, Edit, Settings, MessageCircle, Plus } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import flameLogoPath from '@assets/IMG_3722.png';

// FullScreenImageViewer component - inline definition
const FullScreenImageViewer: React.FC<{ src: string; isOpen: boolean; onClose: () => void }> = ({ src, isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="relative max-w-full max-h-full">
        <img src={src} alt="Full screen" className="max-w-full max-h-full object-contain" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-2xl bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
        >
          ×
        </button>
      </div>
    </div>
  );
};

interface ChatMessage {
  id: number;
  group_id: number;
  user_id: number;
  text: string;
  message_type: string;
  image_url?: string;
  reply_to_id?: number;
  created_at: string;
  user?: {
    id: number;
    name: string;
    username: string;
  };
  reply_to?: {
    id: number;
    text: string;
    user?: {
      name: string;
    };
  };
}

interface ChatInterfaceProps {
  selectedChat: { type: 'group'; id: number };
  onBack: () => void;
  currentUser?: any;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  selectedChat,
  onBack,
  currentUser
}) => {
  const [messageText, setMessageText] = useState('');
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch group details
  const { data: groupDetails } = useQuery({
    queryKey: ['/api/chat/groups', selectedChat.id],
    enabled: selectedChat.type === 'group'
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/groups', selectedChat.id, 'messages'],
    enabled: selectedChat.type === 'group'
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const response = await apiRequest('POST', `/api/chat/groups/${selectedChat.id}/messages`, messageData);
      return response.json();
    },
    onSuccess: () => {
      setMessageText('');
      setReplyToMessage(null);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups', selectedChat.id, 'messages'] });
    }
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, text }: { messageId: number; text: string }) => {
      const response = await apiRequest('PATCH', `/api/chat/groups/${selectedChat.id}/messages/${messageId}`, { text });
      return response.json();
    },
    onSuccess: () => {
      setMessageText('');
      setEditingMessage(null);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups', selectedChat.id, 'messages'] });
    }
  });

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    if (editingMessage) {
      editMessageMutation.mutate({
        messageId: editingMessage.id,
        text: messageText.trim()
      });
    } else {
      const messageData: any = {
        text: messageText.trim(),
        message_type: 'text'
      };

      if (replyToMessage) {
        messageData.reply_to_id = replyToMessage.id;
      }

      sendMessageMutation.mutate(messageData);
    }
  };

  const handleReplyToMessage = (message: ChatMessage) => {
    setReplyToMessage(message);
    setEditingMessage(null);
  };

  const handleEditMessage = (message: ChatMessage) => {
    setEditingMessage(message);
    setReplyToMessage(null);
    setMessageText(message.text);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setMessageText('');
  };

  const cancelReply = () => {
    setReplyToMessage(null);
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Force scroll to bottom without any animation
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Set scroll behavior to auto (no animation) and jump to bottom immediately
    container.style.scrollBehavior = 'auto';
    container.scrollTop = container.scrollHeight;
  }, [messages, selectedChat.id]);

  // Initialize at bottom on mount
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.style.scrollBehavior = 'auto';
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-full bg-slate-900">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-600/30 flex-shrink-0 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button onClick={onBack} size="sm" variant="ghost" className="text-white p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage src={(groupDetails as any)?.image || (groupDetails as any)?.avatar_url} />
              <AvatarFallback className="bg-blue-500 text-white">
                {(groupDetails as any)?.name?.slice(0, 2).toUpperCase() || 'CH'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-white">
                {(groupDetails as any)?.name || `Chat ${selectedChat.id}`}
              </h3>
              <p className="text-sm text-gray-400">
                {(groupDetails as any)?.member_count ? `${(groupDetails as any).member_count} members` : 'Private chat'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedChat.type === 'group' && (
              <Link href={`/group-settings/${selectedChat.id}`}>
                <Button size="sm" variant="ghost" className="text-white">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef} 
        className="flex-1 overflow-y-auto p-4"
        style={{ 
          scrollBehavior: 'auto'
        }}
      >
        {messagesLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <MessageCircle className="h-16 w-16 mb-4 text-gray-300" />
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message: ChatMessage) => (
            <div key={message.id} className="message-item mb-4">
              <div className={`flex ${currentUser?.id === message.user_id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  currentUser?.id === message.user_id 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-700 text-white'
                }`}>
                  {message.reply_to_id && (
                    <div className="text-xs opacity-75 mb-1 border-l-2 border-gray-400 pl-2">
                      Reply to previous message
                    </div>
                  )}
                  <div className="text-sm">{message.text}</div>
                  <div className={`text-xs mt-1 ${
                    currentUser?.id === message.user_id ? 'text-blue-100' : 'text-gray-400'
                  }`}>
                    {formatMessageTime(message.created_at)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Edit/Reply Preview */}
      {(editingMessage || replyToMessage) && (
        <div className="p-3 bg-gray-700/50 border-t border-gray-600/30 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-400 mb-1">
              {editingMessage ? 'Editing message' : `Replying to ${replyToMessage?.user?.name || 'Unknown'}`}
            </div>
            <div className="text-sm text-gray-300 truncate">
              {editingMessage ? editingMessage?.text : replyToMessage?.text}
            </div>
          </div>
          <Button
            onClick={() => editingMessage ? cancelEdit() : cancelReply()}
            size="sm"
            variant="ghost"
            className="text-gray-400 hover:text-white flex-shrink-0 ml-2"
          >
            ×
          </Button>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-gray-600/30 bg-black/20 backdrop-blur-sm flex-shrink-0">
        <div className="flex gap-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={
              editingMessage 
                ? "Edit message..." 
                : replyToMessage 
                  ? `Reply to ${replyToMessage.user?.name}...` 
                  : "Type a message..."
            }
            className="flex-1 bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sendMessageMutation.isPending || editMessageMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {editingMessage ? <Edit className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Full Screen Image Viewer */}
      <FullScreenImageViewer
        src={fullScreenImage || ''}
        isOpen={!!fullScreenImage}
        onClose={() => setFullScreenImage(null)}
      />
    </div>
  );
};

// Main ChatPage component with navigation and state management
const ChatPage: React.FC = () => {
  const [location, setLocation] = useLocation();
  const [viewState, setViewState] = useState<'list' | 'chat'>('list');
  const [selectedChat, setSelectedChat] = useState<{ type: 'group'; id: number } | null>(null);
  const [componentKey, setComponentKey] = useState(0);
  const [searchBarVisible, setSearchBarVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);

  // Get current user
  const { data: user } = useQuery({ queryKey: ['/api/auth/me'] });

  // Fetch chat groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery<any[]>({
    queryKey: ['/api/chat/groups']
  });

  const selectChat = (chat: { type: 'group'; id: number }) => {
    console.log('Selecting chat:', chat);
    setSelectedChat(chat);
    setViewState('chat');
  };

  const goBackToList = () => {
    setViewState('list');
    setSelectedChat(null);
    // Don't clear selectedChat immediately - let it persist in memory
  };

  // Touch handlers for search bar
  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - dragStartY;
    
    if (diff > 0) {
      setDragOffset(Math.min(diff, 60));
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > 70) {
      setSearchBarVisible(true);
    } else {
      setSearchBarVisible(false);
    }
    setIsDragging(false);
    setDragOffset(0);
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-slate-900">
      {/* Channel List View - Always mounted but conditionally visible */}
      <div 
        className={`absolute inset-0 w-full h-full transition-transform duration-300 ease-in-out bg-slate-900 ${
          viewState === 'list' ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div key={`chat-page-${componentKey}`} className="flex flex-col w-full h-full bg-slate-900">
          {/* Header */}
          <div className="p-4 border-b border-gray-600/30 flex-shrink-0 bg-black/20 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              {/* Logo and Home Link */}
              <div className="flex-shrink-0">
                <Link href="/" className="block">
                  <img 
                    src={flameLogoPath} 
                    alt="TrackLit Logo" 
                    className="h-12 w-12 transition-opacity"
                  />
                </Link>
              </div>

              {/* Title */}
              <div className="flex-1">
                <h1 className="text-xl font-semibold text-white">Chats</h1>
              </div>

              {/* Create Group Button */}
              <Link href="/create-group">
                <Button 
                  size="sm"
                  className="bg-purple-600 text-white border-none"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Group
                </Button>
              </Link>
            </div>
          </div>

          {/* Search Bar - pushes content down when visible */}
          <div 
            className="w-full overflow-hidden transition-all duration-300 ease-out bg-slate-900/95 backdrop-blur-sm border-b border-gray-600/30"
            style={{ 
              height: isDragging 
                ? `${Math.min(dragOffset, 60)}px` 
                : searchBarVisible 
                  ? '60px' 
                  : '0px' 
            }}
          >
            <div className="p-3">
              <Input
                placeholder="Search conversations..."
                className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Chat Groups List */}
          <div 
            className="flex-1 overflow-y-auto"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {groupsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <MessageCircle className="h-16 w-16 mb-4 text-gray-300" />
                <p>No chats yet</p>
                <p className="text-sm">Create a group to start chatting!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-600/30">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    onClick={() => selectChat({ type: 'group', id: group.id })}
                    className="p-4 flex items-center gap-3 bg-slate-900 active:bg-gray-700/50 transition-colors"
                  >
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarImage src={group.avatar_url} />
                      <AvatarFallback className="bg-blue-500 text-white">
                        {group.name?.slice(0, 2).toUpperCase() || 'GR'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-white truncate">{group.name}</h3>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {group.last_message_at ? new Date(group.last_message_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 truncate">
                        {group.last_message || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Interface View - Always mounted but conditionally visible */}
      <div 
        className={`absolute inset-0 w-full h-full transition-transform duration-300 ease-in-out ${
          viewState === 'chat' ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedChat && (
          <ChatInterface
            selectedChat={selectedChat}
            onBack={goBackToList}
            currentUser={user}
          />
        )}
      </div>
    </div>
  );
};

export default ChatPage;