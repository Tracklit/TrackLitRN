import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserCheck, UserPlus, UserMinus, Settings, Bell, X, Check } from "lucide-react";
import { Link } from "wouter";
import { ListSkeleton } from "@/components/list-skeleton";
import { useAuth } from "@/hooks/use-auth";

interface Follow {
  id: number;
  username: string;
  name: string;
  email: string;
  bio?: string;
  profileImageUrl?: string;
  isPrivate: boolean;
  isCoach?: boolean;
  subscriptionTier?: string;
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
  requests: FollowRequest[];
  onAccept: (requestId: number) => void;
  onDecline: (requestId: number) => void;
}

function NotificationPanel({ isOpen, onClose, requests, onAccept, onDecline }: NotificationPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div 
        className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Follow Requests</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto h-full">
          {requests.length === 0 ? (
            <p className="text-gray-500 text-center mt-8">No pending requests</p>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="flex items-center space-x-3 p-3 rounded-lg border">
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
                  {request.follower.bio && (
                    <p className="text-xs text-gray-400 truncate">
                      {request.follower.bio}
                    </p>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => onAccept(request.id)}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDecline(request.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function FollowsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch followers
  const { data: followers = [], isLoading: followersLoading } = useQuery({
    queryKey: ["/api/friends"],
    select: (data) => data || []
  });

  // Fetch following
  const { data: following = [], isLoading: followingLoading } = useQuery({
    queryKey: ["/api/following"],
    select: (data) => data || []
  });

  // Fetch pending follow requests
  const { data: pendingRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/friend-requests/pending"],
    select: (data) => data || []
  });

  // Accept follow request
  const acceptRequestMutation = useMutation({
    mutationFn: (requestId: number) => apiRequest("POST", `/api/friend-requests/${requestId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
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
      toast({ title: "Follow request declined" });
    },
    onError: () => {
      toast({ title: "Failed to decline request", variant: "destructive" });
    }
  });

  // Unfollow user
  const unfollowMutation = useMutation({
    mutationFn: (userId: number) => apiRequest("DELETE", `/api/friends/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({ title: "Unfollowed user" });
    },
    onError: () => {
      toast({ title: "Failed to unfollow", variant: "destructive" });
    }
  });

  const handleAcceptRequest = (requestId: number) => {
    acceptRequestMutation.mutate(requestId);
  };

  const handleDeclineRequest = (requestId: number) => {
    declineRequestMutation.mutate(requestId);
  };

  const handleUnfollow = (userId: number) => {
    if (confirm("Are you sure you want to unfollow this user?")) {
      unfollowMutation.mutate(userId);
    }
  };

  const UserCard = ({ user: followUser, showUnfollow = false }: { user: Follow; showUnfollow?: boolean }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={followUser.profileImageUrl} />
            <AvatarFallback>
              {followUser.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <Link href={`/user/${followUser.id}`}>
                <span className="text-sm font-medium text-gray-900 hover:text-orange-600 cursor-pointer truncate">
                  {followUser.name}
                </span>
              </Link>
              {followUser.isCoach && (
                <Badge variant="secondary" className="text-xs">Coach</Badge>
              )}
              {followUser.subscriptionTier === 'pro' && (
                <Badge className="text-xs bg-amber-100 text-amber-800">PRO</Badge>
              )}
              {followUser.subscriptionTier === 'star' && (
                <Badge className="text-xs bg-purple-100 text-purple-800">STAR</Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">@{followUser.username}</p>
            {followUser.bio && (
              <p className="text-xs text-gray-400 truncate mt-1">{followUser.bio}</p>
            )}
          </div>
          
          {showUnfollow && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleUnfollow(followUser.id)}
              disabled={unfollowMutation.isPending}
            >
              <UserMinus className="h-3 w-3 mr-1" />
              Unfollow
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follows</h1>
          <p className="text-sm text-gray-500">Manage your connections</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNotifications(true)}
            className="relative"
          >
            <Bell className="h-4 w-4 mr-1" />
            Requests
            {pendingRequests.length > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[1.25rem] h-5 flex items-center justify-center rounded-full">
                {pendingRequests.length}
              </Badge>
            )}
          </Button>
          
          <Link href="/athletes">
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-1" />
              Find People
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="followers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="followers" className="text-sm">
            Followers ({followers.length})
          </TabsTrigger>
          <TabsTrigger value="following" className="text-sm">
            Following ({following.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="followers" className="space-y-4">
          {followersLoading ? (
            <ListSkeleton />
          ) : followers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No followers yet</h3>
                <p className="text-gray-500 mb-4">
                  When people follow you, they'll appear here
                </p>
                <Link href="/athletes">
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Find People to Follow
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {followers.map((follower) => (
                <UserCard key={follower.id} user={follower} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="following" className="space-y-4">
          {followingLoading ? (
            <ListSkeleton />
          ) : following.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Not following anyone yet</h3>
                <p className="text-gray-500 mb-4">
                  Start following people to see their updates
                </p>
                <Link href="/athletes">
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Find People to Follow
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {following.map((followedUser) => (
                <UserCard key={followedUser.id} user={followedUser} showUnfollow />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        requests={pendingRequests}
        onAccept={handleAcceptRequest}
        onDecline={handleDeclineRequest}
      />
    </div>
  );
}