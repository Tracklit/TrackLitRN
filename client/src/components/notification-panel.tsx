import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowRight, Check, Bell, Clock, UserPlus, Trophy, MessageSquare, X, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

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
    case 'connection_request':
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);



  // Fetch all notifications (excluding message notifications)
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ["/api/notifications"],
    select: (data: Notification[]) => (data || []).filter((n: Notification) => n.type !== 'message_received')
  });

  // Update state when notifications data changes
  useEffect(() => {
    if (notifications.length > 0) {
      setAllNotifications(notifications);
      setOffset(25);
      setHasMore(notifications.length === 25);
    }
  }, [notifications]);

  // Fetch pending follow requests
  const { data: pendingRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/friend-requests/pending"],
    select: (data: FollowRequest[]) => data || []
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => 
      apiRequest("PATCH", `/api/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    }
  });

  // Accept connection request
  const acceptRequestMutation = useMutation({
    mutationFn: (requestId: number) => apiRequest("POST", `/api/friend-requests/${requestId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "Connection request accepted" });
    },
    onError: () => {
      toast({ title: "Failed to accept request", variant: "destructive" });
    }
  });

  // Decline connection request
  const declineRequestMutation = useMutation({
    mutationFn: (requestId: number) => apiRequest("POST", `/api/friend-requests/${requestId}/decline`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "Connection request declined" });
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
      setLocation(notification.actionUrl);
      onClose();
    }
  };

  const handleAcceptRequest = (notificationId: number) => {
    // Immediately update the UI state to prevent flash
    const updatedNotifications = (notifications as any[]).map(notif => 
      notif.id === notificationId ? { ...notif, isRead: true } : notif
    );
    
    // Update the query cache immediately
    queryClient.setQueryData(["/api/notifications"], updatedNotifications);
    
    acceptRequestMutation.mutate(notificationId, {
      onSuccess: () => {
        // Refresh all relevant data after successful accept
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
        queryClient.invalidateQueries({ queryKey: ["/api/friend-requests/pending"] });
      },
      onError: () => {
        // Revert optimistic update on error
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      }
    });
  };

  const handleDeclineRequest = (requestId: number) => {
    declineRequestMutation.mutate(requestId);
  };

  // Load more notifications
  const loadMoreNotifications = async () => {
    if (!hasMore || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const response = await apiRequest("GET", `/api/notifications?limit=25&offset=${offset}`);
      const olderNotifications = await response.json();
      
      setAllNotifications(prev => [...prev, ...olderNotifications]);
      setOffset(prev => prev + 25);
      setHasMore(olderNotifications.length === 25);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load older notifications",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMore(false);
    }
  };

  const unreadCount = allNotifications.filter((n: Notification) => !n.isRead).length + pendingRequests.length;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[999999]",
        !isOpen && "pointer-events-none"
      )} 
      onClick={onClose}
      style={{
        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        opacity: isOpen ? 1 : 0,
        backgroundColor: isOpen ? 'rgba(0, 0, 0, 0.5)' : 'transparent'
      }}
    >
      <div 
        className="fixed right-0 top-0 w-full shadow-xl flex flex-col notification-panel-no-bottom-space"
        onClick={(e) => e.stopPropagation()}
        style={{
          transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          transform: isOpen ? 'translateX(0%)' : 'translateX(100%)',
          backgroundColor: 'hsl(220, 40%, 12%)'
        }}
      >
        <div className="p-4 border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <div className="notification-panel-content">
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
          <div className="px-4 pb-0">
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
            ) : allNotifications.length === 0 && pendingRequests.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-500">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {allNotifications.map((notification: Notification, index) => {
                  const isNewNotification = !notification.isRead;
                  const previousNotification = allNotifications[index - 1];
                  const showDivider = index > 0 && !isNewNotification && previousNotification?.isRead === false;

                  return (
                    <div key={notification.id}>
                      {/* Show divider before first read notification */}
                      {showDivider && (
                        <div className="flex items-center my-4">
                          <div className="flex-1 h-px bg-gray-200"></div>
                          <span className="px-3 text-xs text-gray-500 bg-background">Older notifications</span>
                          <div className="flex-1 h-px bg-gray-200"></div>
                        </div>
                      )}

                      {/* Special handling for connection request notifications */}
                      {notification.type === 'connection_request' && notification.relatedId ? (
                        <div
                          className={cn(
                            "flex items-start space-x-3 p-3 rounded-lg animate-in slide-in-from-right-1",
                            notification.isRead ? "bg-muted/80" : "bg-card"
                          )}
                          style={{ 
                            animationDelay: `${(pendingRequests?.length || 0) * 100 + index * 50}ms`
                          }}
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
                            
                            {/* Accept button for connection requests */}
                            <div className="flex space-x-2 mt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!notification.isRead) {
                                    handleAcceptRequest(notification.id);
                                  }
                                }}
                                disabled={notification.isRead || acceptRequestMutation.isPending}
                                className="px-3 py-1 h-7 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed notification-accept-btn"
                                style={{
                                  '--btn-bg': notification.isRead ? '#9ca3af' : '#16a34a',
                                  '--btn-color': notification.isRead ? '#4b5563' : '#ffffff',
                                  backgroundColor: notification.isRead ? '#9ca3af' : '#16a34a',
                                  color: notification.isRead ? '#4b5563' : '#ffffff',
                                  border: 'none',
                                  outline: 'none',
                                  boxShadow: 'none',
                                  transition: 'none'
                                } as React.CSSProperties}
                              >
                                <Check className="h-3 w-3" />
                                {notification.isRead ? 'Accepted' : 
                                 acceptRequestMutation.isPending ? 'Accepting...' : 'Accept'}
                              </button>
                            </div>
                          </div>
                          
                          {!notification.isRead && (
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Regular notification handling
                        <div
                          className="flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 animate-in slide-in-from-right-1 hover:bg-gray-50"
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
                      )}
                    </div>
                  );
                })}
                
                {/* Load Older Button */}
                {hasMore && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadMoreNotifications}
                      disabled={isLoadingMore}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load Older'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}