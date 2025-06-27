import { MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export function ChatButton() {
  const { user } = useAuth();

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

  return (
    <Link href="/chat">
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0 text-gray-400 hover:text-white relative"
        title="Chat"
      >
        <MessageCircle className="h-5 w-5" />
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