import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCheck, UserX, MessageCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FriendRequest {
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
  };
}

interface Friend {
  id: number;
  username: string;
  name: string;
  email: string;
  bio?: string;
  isOnline?: boolean;
}

export default function FriendsPage() {
  const { toast } = useToast();

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
  });

  // Fetch pending friend requests
  const { data: pendingRequests = [], isLoading: loadingRequests } = useQuery<FriendRequest[]>({
    queryKey: ["/api/friend-requests/pending"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/friend-requests/pending");
      return response.json();
    },
    enabled: !!currentUser,
  });

  // Fetch current friends
  const { data: friends = [], isLoading: loadingFriends } = useQuery<Friend[]>({
    queryKey: ["/api/friends"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/friends");
      return response.json();
    },
    enabled: !!currentUser,
  });

  // Accept friend request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return await apiRequest("POST", `/api/friend-requests/${requestId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Friend request accepted!",
        description: "You are now friends with this user.",
      });
    },
  });

  // Decline friend request mutation
  const declineRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      return await apiRequest("POST", `/api/friend-requests/${requestId}/decline`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Friend request declined",
        description: "The friend request has been declined.",
      });
    },
  });

  // Start conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: async (receiverId: number) => {
      return await apiRequest("POST", "/api/conversations", { receiverId });
    },
    onSuccess: () => {
      window.location.href = "/messages";
    },
  });

  const handleAcceptRequest = (requestId: number) => {
    acceptRequestMutation.mutate(requestId);
  };

  const handleDeclineRequest = (requestId: number) => {
    declineRequestMutation.mutate(requestId);
  };

  const handleMessageFriend = (friendId: number) => {
    startConversationMutation.mutate(friendId);
  };

  if (!currentUser) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Please log in</h2>
          <p className="text-muted-foreground">You need to be logged in to view your friends.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Friends</h1>
          <p className="text-muted-foreground">Manage your friend requests and connections</p>
        </div>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="friends">
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="relative">
              Pending Requests
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="mt-6">
            {loadingFriends ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : friends.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No friends yet</h3>
                  <p className="text-muted-foreground text-center">
                    Start connecting with other athletes by visiting the Athletes page.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {friends.map((friend) => (
                  <Card key={friend.id}>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${friend.name}`} />
                        <AvatarFallback>
                          {friend.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-4 flex-1">
                        <CardTitle className="text-lg">{friend.name}</CardTitle>
                        <CardDescription>@{friend.username}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {friend.bio && (
                        <p className="text-sm text-muted-foreground mb-4">{friend.bio}</p>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMessageFriend(friend.id)}
                        className="w-full"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            {loadingRequests ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
                  <p className="text-muted-foreground text-center">
                    You don't have any pending friend requests at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${request.follower.name}`} />
                            <AvatarFallback>
                              {request.follower.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold">{request.follower.name}</h3>
                            <p className="text-sm text-muted-foreground">@{request.follower.username}</p>
                            {request.follower.bio && (
                              <p className="text-sm text-muted-foreground mt-1">{request.follower.bio}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRequest(request.id)}
                            disabled={acceptRequestMutation.isPending}
                            className="w-24"
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeclineRequest(request.id)}
                            disabled={declineRequestMutation.isPending}
                            className="w-24"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}