import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { MessagePanel } from "./message-panel";
import { useLocation } from "wouter";
import type { DirectMessage, Conversation, User } from "@shared/schema";

interface MessageButtonProps {
  className?: string;
  targetUserId?: number;
}

interface ConversationWithUser extends Conversation {
  otherUser: any;
  lastMessage?: DirectMessage;
}

export function MessageButton({ className, targetUserId }: MessageButtonProps) {
  const [showPanel, setShowPanel] = useState(false);
  const [location, setLocation] = useLocation();

  // Fetch conversations to get unread count
  const { data: conversations = [] } = useQuery<ConversationWithUser[]>({
    queryKey: ["/api/conversations"],
    select: (data: ConversationWithUser[]) => data || []
  });

  // Calculate unread messages count based on conversations where the current user is the receiver
  const { data: user } = useQuery<User>({ queryKey: ["/api/user"] });
  
  const unreadCount = user ? conversations.filter(conv => 
    conv.lastMessage && 
    !conv.lastMessage.isRead && 
    conv.lastMessage.receiverId === user.id
  ).length : 0;

  // Check if currently in a message chat
  const isInMessageChat = location.startsWith('/messages/') || location === '/conversations';
  
  const handleClick = () => {
    if (isInMessageChat) {
      // Navigate back if in message chat
      if (location.startsWith('/messages/')) {
        setLocation('/conversations');
      } else {
        window.history.back();
      }
    } else {
      // Normal behavior - open message panel
      setShowPanel(true);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={`relative ${className}`}
      >
        <MessageCircle className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[1.25rem] h-5 flex items-center justify-center rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <MessagePanel
        isOpen={showPanel}
        onClose={() => setShowPanel(false)}
        targetUserId={targetUserId}
      />
    </>
  );
}