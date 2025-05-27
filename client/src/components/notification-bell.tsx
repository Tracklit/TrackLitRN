import { useState, useEffect } from "react";
import { Bell, X, Calendar, Trophy, Users, MessageSquare } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  relatedId?: number;
  relatedType?: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'program_assigned':
      return <Trophy className="h-4 w-4 text-amber-400" />;
    case 'meet_invitation':
      return <Calendar className="h-4 w-4 text-blue-400" />;
    case 'workout_liked':
      return <Trophy className="h-4 w-4 text-green-400" />;
    case 'group_message':
      return <MessageSquare className="h-4 w-4 text-purple-400" />;
    case 'achievement':
      return <Trophy className="h-4 w-4 text-amber-400" />;
    case 'friend_request':
      return <Users className="h-4 w-4 text-blue-400" />;
    case 'friend_accepted':
      return <Users className="h-4 w-4 text-green-400" />;
    default:
      return <Bell className="h-4 w-4 text-gray-400" />;
  }
}

export function NotificationBell() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications = [], refetch } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return await apiRequest("POST", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: (_, notificationId) => {
      // Immediately update the cache optimistically
      queryClient.setQueryData(["/api/notifications"], (oldData: Notification[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        );
      });
      // Also invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", "/api/notifications/mark-all-read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  // Mark all notifications as read when dropdown opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    // Temporarily disabled automatic mark all as read
    // if (open && unreadCount > 0) {
    //   markAllAsReadMutation.mutate();
    // }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // Handle different notification types
    if (notification.type === 'friend_request') {
      setLocation('/friends');
      setIsOpen(false);
    } else if (notification.actionUrl) {
      setLocation(notification.actionUrl);
      setIsOpen(false);
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-96 overflow-y-auto bg-[#1a2332] border-gray-700"
        sideOffset={5}
      >
        <div className="p-4 border-b border-gray-700 bg-[#1a2332]">
          <h4 className="font-semibold text-white">Notifications</h4>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-300">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-300 bg-[#1a2332]">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto bg-[#1a2332]">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-4 border-b border-gray-700 cursor-pointer transition-colors hover:bg-gray-800/50 bg-[#1a2332]",
                  !notification.isRead && "bg-blue-900/30"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h5 className={cn(
                        "text-sm font-medium truncate",
                        notification.isRead ? "text-gray-400" : "text-white font-semibold"
                      )}>
                        {notification.title}
                        {!notification.isRead && <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">NEW</span>}
                      </h5>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                    <p className={cn(
                      "text-sm mt-1 line-clamp-2",
                      notification.isRead ? "text-gray-500" : "text-gray-300"
                    )}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}