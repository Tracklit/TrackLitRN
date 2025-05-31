import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { NotificationPanel } from "@/components/notification-panel";
import { apiRequest } from "@/lib/queryClient";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [showPanel, setShowPanel] = useState(false);
  const queryClient = useQueryClient();

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

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/notifications/mark-all-read"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    }
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length + pendingRequests.length;

  const handleOpenPanel = () => {
    setShowPanel(true);
    // Mark all notifications as read when opening the panel
    if (notifications.some((n: any) => !n.isRead)) {
      markAllAsReadMutation.mutate();
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleOpenPanel}
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