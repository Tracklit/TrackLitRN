import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { MessagePanel } from "./message-panel";
import type { DirectMessage, Conversation } from "@shared/schema";

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

  // Fetch unread message count
  const { data: unreadData } = useQuery({
    queryKey: ["/api/direct-messages/unread-count"],
    select: (data: any) => data || { count: 0 }
  });

  const unreadCount = unreadData?.count || 0;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowPanel(true)}
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