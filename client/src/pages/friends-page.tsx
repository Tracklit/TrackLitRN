import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserCheck, Clock, MessageCircle, UserMinus, Target } from "lucide-react";
import { Link } from "wouter";
import defaultProfileImage from "@assets/IMG_4089.jpeg";

interface Friend {
  id: number;
  username: string;
  name: string;
  email: string;
  bio?: string;
  isOnline?: boolean;
  isCoach?: boolean;
}

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

interface CoachingRequest {
  id: number;
  fromUserId: number;
  toUserId: number;
  requestType: 'coach_invite' | 'athlete_request';
  status: 'pending' | 'accepted' | 'declined';
  message?: string;
  createdAt: string;
  respondedAt?: string;
}

export default function FriendsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
  });

  // Fetch friends
  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["/api/friends"],
  });

  // Fetch friend requests
  const { data: pendingRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ["/api/friend-requests/pending"],
  });

  // Fetch coaching requests
  const { data: coachingRequests = [] } = useQuery({
    queryKey: ["/api/coaching-requests"],
  });

  // Fetch coach athletes
  const { data: coachAthletes = [] } = useQuery({
    queryKey: ["/api/coach/athletes"],
  });

  // Remove friend mutation
  const removeFriendMutation = useMutation({
    mutationFn: (friendId: number) => 
      apiRequest("DELETE", `/api/friends/${friendId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Friend removed",
        description: "The friend has been removed from your list.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove friend",
        variant: "destructive",
      });
    },
  });

  // Accept friend request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: (requestId: number) => 
      apiRequest("POST", `/api/friend-requests/${requestId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Friend request accepted",
        description: "You are now friends!",
      });
    },
  });

  // Decline friend request mutation
  const declineRequestMutation = useMutation({
    mutationFn: (requestId: number) => 
      apiRequest("POST", `/api/friend-requests/${requestId}/decline`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests/pending"] });
      toast({
        title: "Friend request declined",
        description: "The request has been declined.",
      });
    },
  });

  // Send coaching request mutation
  const sendCoachingRequestMutation = useMutation({
    mutationFn: ({ toUserId, requestType, message }: { 
      toUserId: number; 
      requestType: 'coach_invite' | 'athlete_request'; 
      message: string;
    }) => 
      apiRequest("POST", "/api/coaching-requests", {
        fromUserId: currentUser?.id,
        toUserId,
        requestType,
        message,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coaching-requests"] });
      toast({
        title: "Coaching request sent",
        description: "Your coaching request has been sent!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send coaching request",
        variant: "destructive",
      });
    },
  });

  const handleRemoveFriend = (friendId: number) => {
    removeFriendMutation.mutate(friendId);
  };

  const handleAcceptRequest = (requestId: number) => {
    acceptRequestMutation.mutate(requestId);
  };

  const handleDeclineRequest = (requestId: number) => {
    declineRequestMutation.mutate(requestId);
  };

  const handleMessageFriend = (friendId: number) => {
    // Navigate to messages page with the friend
    window.location.href = `/messages/${friendId}`;
  };

  const handleSendCoachingRequest = (toUserId: number, requestType: 'coach_invite' | 'athlete_request') => {
    const message = requestType === 'coach_invite' 
      ? "I'd like to invite you to join as my athlete"
      : "I'd like to request you as my coach";
    
    sendCoachingRequestMutation.mutate({
      toUserId,
      requestType,
      message,
    });
  };

  // Helper functions
  const isAlreadyAthlete = (userId: number) => {
    return coachAthletes.some((athlete: any) => athlete.id === userId);
  };

  const hasPendingCoachingRequest = (userId: number) => {
    if (!coachingRequests) return false;
    
    // Check both sent and received coaching requests
    const allRequests = [
      ...(coachingRequests.sent || []),
      ...(coachingRequests.received || [])
    ];
    
    return allRequests.some((request: any) => 
      request.toUserId === userId && request.status === 'pending'
    );
  };

  return (
    <div className="min-h-screen bg-[#010a18] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Friends</h1>

          <Tabs defaultValue="friends" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
              <TabsTrigger value="friends" className="data-[state=active]:bg-[#ff8c00]">
                Your Friends
              </TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-[#ff8c00]">
                Pending Requests
                {pendingRequests.length > 0 && (
                  <span className="ml-2 px-2 py-1 text-xs bg-red-600 rounded-full">
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
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <UserCheck className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-white">No friends yet</h3>
                    <p className="text-gray-400 text-center">
                      Start connecting with other athletes by visiting the Athletes page.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-0">
                  {friends.map((friend) => (
                    <div key={friend.id} className="flex items-center py-4 px-4 hover:bg-gray-800/50 transition-colors border-b border-gray-800 last:border-b-0">
                      <Avatar className="h-7 w-7 mr-4 rounded-[5px]">
                        <AvatarImage src={defaultProfileImage} className="object-cover" />
                        <AvatarFallback className="bg-blue-600 text-white text-xs rounded-[5px]">
                          {friend.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/profile/${friend.id}`}
                            className="font-semibold text-white hover:text-blue-400 transition-colors"
                          >
                            {friend.name}
                          </Link>
                          {friend.isCoach && (
                            <span className="px-2 py-0.5 text-xs bg-orange-600 text-white rounded-full">
                              COACH
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">@{friend.username}</p>
                        {friend.bio && (
                          <p className="text-sm text-gray-300 mt-1 line-clamp-1">{friend.bio}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Show Add As Athlete button only for coaches */}
                        {currentUser?.isCoach && !isAlreadyAthlete(friend.id) && !hasPendingCoachingRequest(friend.id) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendCoachingRequest(friend.id, 'coach_invite')}
                            disabled={sendCoachingRequestMutation.isPending}
                            className="text-blue-600 hover:text-blue-700 border-blue-600 hover:border-blue-700"
                          >
                            <Target className="h-4 w-4 mr-1" />
                            Add As Athlete
                          </Button>
                        )}
                        
                        {/* Show status if already athlete or request pending */}
                        {currentUser?.isCoach && isAlreadyAthlete(friend.id) && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="text-green-600 border-green-600"
                          >
                            <Target className="h-4 w-4 mr-1" />
                            Your Athlete
                          </Button>
                        )}
                        
                        {currentUser?.isCoach && hasPendingCoachingRequest(friend.id) && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            className="text-yellow-600 border-yellow-600"
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Pending
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMessageFriend(friend.id)}
                          className="border-gray-600 hover:border-gray-500"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveFriend(friend.id)}
                          disabled={removeFriendMutation.isPending}
                          className="text-red-600 hover:text-red-700 border-red-600 hover:border-red-700"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
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
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-white">No pending requests</h3>
                    <p className="text-gray-400 text-center">
                      You don't have any pending friend requests at the moment.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-0">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="flex items-center py-4 px-4 hover:bg-gray-800/50 transition-colors border-b border-gray-800 last:border-b-0">
                      <Avatar className="h-7 w-7 mr-4 rounded-[5px]">
                        <AvatarImage src={defaultProfileImage} className="object-cover" />
                        <AvatarFallback className="bg-blue-600 text-white text-xs rounded-[5px]">
                          {request.follower.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="font-semibold text-white">{request.follower.name}</div>
                        <p className="text-sm text-gray-400">@{request.follower.username}</p>
                        {request.follower.bio && (
                          <p className="text-sm text-gray-300 mt-1 line-clamp-1">{request.follower.bio}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleAcceptRequest(request.id)}
                          disabled={acceptRequestMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeclineRequest(request.id)}
                          disabled={declineRequestMutation.isPending}
                          className="text-red-600 hover:text-red-700 border-red-600 hover:border-red-700"
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}