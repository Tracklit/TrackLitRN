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
    
    // Get fresh path from browser
    const browserPath = window.location.pathname;
    console.log('Speech bubble clicked, browserPath:', browserPath, 'location:', location);
    
    // Always check browser path first for most accurate routing
    if (browserPath.includes('messages') || browserPath.includes('conversations')) {
      console.log('In message area, navigating back');
      if (browserPath.includes('messages/')) {
        console.log('From individual message to conversations list');
        setLocation('/conversations');
      } else if (browserPath === '/conversations') {
        console.log('From conversations list to home');
        setLocation('/');
      }
    } else {
      console.log('Opening message panel');
      setShowPanel(true);
    }
  };

  // Hide speech bubble icon when inside a message channel
  if (isInMessageChannel) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`relative inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9 ${className}`}
        aria-label="Messages"
      >
        <MessageCircle className="h-5 w-5" />
        {unreadCount > 0 && (
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