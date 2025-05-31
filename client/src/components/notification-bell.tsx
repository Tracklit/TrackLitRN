import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { NotificationPanel } from "@/components/notification-panel";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [showPanel, setShowPanel] = useState(false);

  // Fetch notifications to get unread count
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    select: (data) => data || []
  });

  // Fetch pending requests count
  const { data: pendingRequests = [] } = useQuery({
    queryKey: ["/api/friend-requests/pending"],
    select: (data) => data || []
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length + pendingRequests.length;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowPanel(true)}
        className={`relative ${className}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[1.25rem] h-5 flex items-center justify-center rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <NotificationPanel
        isOpen={showPanel}
        onClose={() => setShowPanel(false)}
      />
    </>
  );
}