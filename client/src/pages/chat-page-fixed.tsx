import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Users, 
  Send, 
  Plus, 
  Search,
  ArrowLeft,
  X
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import SwipeWrapper from "@/components/swipe-wrapper";

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

const ChatPage = () => {
  const [selectedChat, setSelectedChat] = useState<{ type: 'group' | 'direct'; id: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
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

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; isPrivate: boolean }) => {
      const response = await apiRequest('POST', '/api/chat/groups', data);
      if (!response.ok) {
        throw new Error('Failed to create group');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups'] });
      setShowCreateGroup(false);
    }
  });

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
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
    return (
      <SwipeWrapper currentPage="chat">
        <div className="min-h-screen bg-white">
          <CreateGroupForm 
            onCancel={() => setShowCreateGroup(false)} 
            onSubmit={createGroupMutation.mutate} 
          />
        </div>
      </SwipeWrapper>
    );
  }

  // Show chat interface if a chat is selected
  if (selectedChat) {
    return (
      <SwipeWrapper currentPage="chat">
        <div className="min-h-screen bg-white">
          <ChatInterface 
            selectedChat={selectedChat} 
            onBack={() => setSelectedChat(null)} 
          />
        </div>
      </SwipeWrapper>
    );
  }

  return (
    <SwipeWrapper currentPage="chat">
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-200">
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

        {/* Chat List */}
        <div className="pb-4">
          {(groupsLoading || conversationsLoading) ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Groups */}
              {filteredGroups.map((group: ChatGroup) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedChat({ type: 'group', id: group.id })}
                  className="w-full p-4 hover:bg-gray-50 border-b border-gray-100 text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={group.avatar_url} />
                        <AvatarFallback className="bg-blue-500 text-white">
                          <Users className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 truncate">{group.name}</h3>
                        {group.last_message_at && (
                          <span className="text-xs text-gray-500">
                            {formatLastMessageTime(group.last_message_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-500 truncate">
                          {group.last_message || "No messages yet"}
                        </p>
                        <div className="flex items-center space-x-2">
                          {group.is_private && (
                            <Badge variant="secondary" className="text-xs">Private</Badge>
                          )}
                          {group.message_count && group.message_count > 0 && (
                            <Badge className="bg-blue-500 text-white text-xs">
                              {group.message_count}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              {/* Empty State */}
              {filteredGroups.length === 0 && conversations.length === 0 && !groupsLoading && !conversationsLoading && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <MessageCircle className="h-16 w-16 mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No chats yet</h3>
                  <p className="text-center">Create a group or start a conversation to get started</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </SwipeWrapper>
  );
};

// Simple Chat Interface Component
const ChatInterface = ({ selectedChat, onBack }: { selectedChat: { type: 'group' | 'direct'; id: number }; onBack: () => void }) => {
  const [messageText, setMessageText] = useState("");
  
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-200 flex items-center space-x-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold text-gray-900">Chat</h1>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4">
        <div className="text-center text-gray-500 py-8">
          <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>Start a conversation</p>
        </div>
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button 
            size="sm"
            disabled={!messageText.trim()}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Simple Create Group Form Component
const CreateGroupForm = ({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (data: { name: string; description?: string; isPrivate: boolean }) => void }) => {
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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Create Group</h1>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Form */}
      <div className="flex-1 p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
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