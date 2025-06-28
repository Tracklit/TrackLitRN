import { Users } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export function ChatButton() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch unread message count across all chat groups and direct messages
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-chat-count'],
    queryFn: async () => {
      const response = await fetch('/api/chat/unread-count');
      if (!response.ok) return 0;
      return response.json();
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 30000,
  });

  const handleChatClick = () => {
    // Invalidate unread count when navigating to chat
    // This ensures count updates when user visits chat page
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['unread-chat-count'] });
    }, 1000);
  };

  return (
    <Link href="/chats">
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0 text-gray-400 hover:text-white relative"
        title="Chat"
        onClick={handleChatClick}
      >
        <svg 
          className="h-5 w-5 text-yellow-400 fill-yellow-400" 
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z" />
        </svg>
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs font-medium min-w-[20px] rounded-full"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
}