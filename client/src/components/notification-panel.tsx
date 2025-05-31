import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Check, Bell, Clock, UserPlus, Trophy, MessageSquare, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

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

interface FollowRequest {
  id: number;
  followerId: number;
  followingId: number;
  createdAt: string;
  follower: {
    id: number;
    username: string;
    name: string;
    email: string;
    bio?: string;
    profileImageUrl?: string;
    isPrivate: boolean;
  };
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'friend_request':
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    case 'friend_accepted':
      return <Check className="h-4 w-4 text-green-500" />;
    case 'meet_invitation':
      return <Trophy className="h-4 w-4 text-orange-500" />;
    case 'message':
      return <MessageSquare className="h-4 w-4 text-purple-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all notifications
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ["/api/notifications"],
    select: (data) => data || []
  });

  // Fetch pending follow requests
  const { data: pendingRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/friend-requests/pending"],
    select: (data) => data || []
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => 
      apiRequest("PATCH", `/api/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    }
  });

  // Accept follow request
  const acceptRequestMutation = useMutation({
    mutationFn: (requestId: number) => apiRequest("POST", `/api/friend-requests/${requestId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "Follow request accepted" });
    },
    onError: () => {
      toast({ title: "Failed to accept request", variant: "destructive" });
    }
  });

  // Decline follow request
  const declineRequestMutation = useMutation({
    mutationFn: (requestId: number) => apiRequest("POST", `/api/friend-requests/${requestId}/decline`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "Follow request declined" });
    },
    onError: () => {
      toast({ title: "Failed to decline request", variant: "destructive" });
    }
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleAcceptRequest = (requestId: number) => {
    acceptRequestMutation.mutate(requestId);
  };

  const handleDeclineRequest = (requestId: number) => {
    declineRequestMutation.mutate(requestId);
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length + pendingRequests.length;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 transition-all duration-600 ease-in-out",
        isOpen ? "bg-black/50" : "bg-transparent pointer-events-none"
      )} 
      onClick={onClose}
    >
      <div 
        className={cn(
          "fixed right-0 top-0 h-full w-full bg-background shadow-xl transform transition-all duration-600 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b bg-muted/50">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {/* Connection Requests Section */}
          {pendingRequests.length > 0 && (
            <div className="p-4 border-b bg-primary/10">
              <h4 className="text-sm font-semibold text-primary mb-3">Connection Requests</h4>
              <div className="space-y-3">
                {pendingRequests.map((request: FollowRequest, index) => (
                  <div 
                    key={request.id} 
                    className="flex items-center space-x-3 p-3 rounded-lg bg-card border animate-in slide-in-from-right-2 duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={request.follower.profileImageUrl} />
                      <AvatarFallback>
                        {request.follower.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {request.follower.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        @{request.follower.username}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(request.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3"
                        disabled={acceptRequestMutation.isPending}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeclineRequest(request.id)}
                        disabled={declineRequestMutation.isPending}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* General Notifications Section */}
          <div className="p-4">
            {notificationsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex space-x-3">
                      <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 && pendingRequests.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-500">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification: Notification, index) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 animate-in slide-in-from-right-1",
                      notification.isRead 
                        ? "hover:bg-gray-50" 
                        : "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500"
                    )}
                    style={{ animationDelay: `${(pendingRequests?.length || 0) * 100 + index * 50}ms` }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm truncate",
                        notification.isRead ? "text-gray-600" : "text-gray-900 font-medium"
                      )}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    
                    {!notification.isRead && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}