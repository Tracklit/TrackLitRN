import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

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
  const [location, setLocation] = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

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

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent double navigation
    if (isNavigating) return;
    
    setIsNavigating(true);
    console.log('Paper plane clicked, navigating to chat');
    setLocation('/chat');
    
    // Reset navigation state after a brief delay
    setTimeout(() => {
      setIsNavigating(false);
    }, 500);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`h-9 w-9 p-0 text-gray-400 hover:text-white relative inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${className}`}
      aria-label="Messages"
    >
      <FontAwesomeIcon icon={faPaperPlane} className="h-5 w-5" />
      {unreadCount > 0 && (
        <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[1.25rem] h-5 flex items-center justify-center rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </button>
  );
}