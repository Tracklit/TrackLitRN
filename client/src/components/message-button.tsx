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

  // Check if currently in a message chat using window.location.pathname
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : location;
  const isInMessageChat = currentPath.startsWith('/messages/') || currentPath === '/conversations';
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Speech bubble clicked - forcing navigation to conversations');
    
    // Use multiple navigation methods to ensure it works
    try {
      setLocation('/conversations');
      
      // Alternative method using history API
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/conversations');
        
        // Trigger a popstate event to notify wouter
        window.dispatchEvent(new PopStateEvent('popstate'));
        
        // Final fallback
        setTimeout(() => {
          if (window.location.pathname !== '/conversations') {
            window.location.replace('/conversations');
          }
        }, 200);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Emergency fallback
      window.location.href = '/conversations';
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`relative inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9 z-[9999] ${className}`}
        style={{ zIndex: 9999 }}
        aria-label={isInMessageChat ? "Back" : "Messages"}
      >
        <MessageCircle className="h-5 w-5" />
        {!isInMessageChat && unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[1.25rem] h-5 flex items-center justify-center rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </button>

      <MessagePanel
        isOpen={showPanel}
        onClose={() => setShowPanel(false)}
        targetUserId={targetUserId}
      />
    </>
  );
}