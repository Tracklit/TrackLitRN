import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserCheck, UserPlus, UserMinus, Search, Check, X, ChevronDown, Users, MoreHorizontal } from "lucide-react";
import { Link } from "wouter";
import { ListSkeleton } from "@/components/list-skeleton";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";

interface Connection {
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

interface ConnectionRequest {
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

export default function ConnectionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch connections (friends)
  const { data: connections = [], isLoading: connectionsLoading } = useQuery<Connection[]>({
    queryKey: ["/api/friends"],
    select: (data: Connection[]) => data || []
  });

  // Fetch pending connection requests
  const { data: pendingRequests = [], isLoading: requestsLoading } = useQuery<ConnectionRequest[]>({
    queryKey: ["/api/friend-requests/pending"],
    select: (data: ConnectionRequest[]) => data || []
  });

  // Search for users
  const { data: searchResults = [], isLoading: searchLoading } = useQuery<Connection[]>({
    queryKey: ["/api/users/search", searchTerm],
    enabled: searchTerm.length > 0,
    select: (data: Connection[]) => data || []
  });

  // Accept connection request
  const acceptRequestMutation = useMutation({
    mutationFn: (requestId: number) => apiRequest("POST", `/api/friend-requests/${requestId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friend-requests/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
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
      toast({ title: "Connection request declined" });
    },
    onError: () => {
      toast({ title: "Failed to decline request", variant: "destructive" });
    }
  });

  // Send connection request
  const sendRequestMutation = useMutation({
    mutationFn: (userId: number) => apiRequest("POST", "/api/friend-requests", { toUserId: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/search"] });
      toast({ title: "Connection request sent" });
    },
    onError: () => {
      toast({ title: "Failed to send request", variant: "destructive" });
    }
  });

  // Remove connection
  const removeConnectionMutation = useMutation({
    mutationFn: (userId: number) => apiRequest("DELETE", `/api/friends/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({ title: "Connection removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove connection", variant: "destructive" });
    }
  });

  // Add athlete mutation for coaches
  const addAthleteMutation = useMutation({
    mutationFn: (athleteId: number) => apiRequest("POST", "/api/coach/athletes", { athleteId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coach/athletes"] });
      toast({ title: "Athlete added successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to add athlete", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    }
  });

  // Fetch coach athletes to check existing relationships
  const { data: coachAthletes = [] } = useQuery<any[]>({
    queryKey: ["/api/coach/athletes"],
    enabled: user?.isCoach || user?.role === 'coach' || user?.role === 'both',
    select: (data: any[]) => data || []
  });

  const handleAcceptRequest = (requestId: number) => {
    acceptRequestMutation.mutate(requestId);
  };

  const handleDeclineRequest = (requestId: number) => {
    declineRequestMutation.mutate(requestId);
  };

  const handleSendRequest = (userId: number) => {
    sendRequestMutation.mutate(userId);
  };

  const handleRemoveConnection = (userId: number) => {
    removeConnectionMutation.mutate(userId);
  };

  const handleAddAsAthlete = (athleteId: number) => {
    addAthleteMutation.mutate(athleteId);
  };

  // Helper function to check if user is already an athlete of this coach
  const isAlreadyAthlete = (userId: number) => {
    return (coachAthletes as any[]).some((athlete: any) => athlete.id === userId);
  };

  // Check if current user is a coach
  const isCoach = user?.isCoach || user?.role === 'coach' || user?.role === 'both';

  const filteredConnections = connections.filter((connection: Connection) =>
    connection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Connections</h1>
          <div className="flex items-center space-x-3">
            {/* Pending Requests Button */}
            {pendingRequests.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <UserPlus className="h-5 w-5" />
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
                      {pendingRequests.length}
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="p-3">
                    <h4 className="font-semibold text-sm mb-3">Connection Requests</h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {pendingRequests.map((request: ConnectionRequest) => (
                        <div key={request.id} className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={request.follower.profileImageUrl} />
                            <AvatarFallback>
                              {request.follower.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {request.follower.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              @{request.follower.username}
                            </p>
                          </div>
                          
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              onClick={() => handleAcceptRequest(request.id)}
                              disabled={acceptRequestMutation.isPending}
                              className="h-7 px-3 text-xs"
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeclineRequest(request.id)}
                              disabled={declineRequestMutation.isPending}
                              className="h-7 px-3 text-xs"
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <Link href="/athletes">
              <Button variant="ghost" size="sm">
                <UserPlus className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search connections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/50 border-0"
            />
          </div>
        </div>
      </div>

      {/* Connections Count */}
      <div className="px-4 py-3 border-b">
        <p className="text-sm text-muted-foreground">
          {connections.length} {connections.length === 1 ? 'connection' : 'connections'}
        </p>
      </div>

      {/* Search Results Section */}
      {searchTerm && searchResults.length > 0 && (
        <div className="border-b">
          <div className="px-4 py-2">
            <p className="text-sm font-medium text-muted-foreground">Search Results</p>
          </div>
          {searchResults.map((user: any) => (
            <div key={`search-${user.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors border-b border-muted/20">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.profileImageUrl} />
                  <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <Link href={`/user/${user.id}`}>
                      <p className="font-medium hover:underline cursor-pointer truncate">
                        {user.name}
                      </p>
                    </Link>
                    {user.isCoach && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                        Coach
                      </Badge>
                    )}
                    {user.isPrivate && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                        Private
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    @{user.username}
                  </p>
                  {user.bio && (
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1 truncate">
                      {user.bio}
                    </p>
                  )}
                </div>
              </div>
              
              {user.id !== user?.id && (
                <div className="ml-3">
                  {user.connectionStatus === 'connected' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveConnection(user.id)}
                      className="h-8 px-3"
                    >
                      Remove
                    </Button>
                  ) : user.connectionStatus === 'pending' ? (
                    <Button variant="outline" size="sm" disabled className="h-8 px-3">
                      Pending
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleSendRequest(user.id)}
                      disabled={sendRequestMutation.isPending}
                      className="h-8 px-3"
                    >
                      Connect
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Connections List */}
      <div className="pb-20">
        {connectionsLoading ? (
          <div className="p-4">
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </div>
        ) : filteredConnections.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? "No connections found" : "No connections yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm 
                ? `No connections match "${searchTerm}"`
                : "Connect with other athletes and coaches to build your network"
              }
            </p>
            {!searchTerm && (
              <Link href="/athletes">
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Find People to Connect
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div>
            {filteredConnections.map((connection: Connection) => (
              <div key={connection.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={connection.profileImageUrl} />
                    <AvatarFallback>
                      {connection.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <Link href={`/user/${connection.id}`}>
                        <p className="font-medium hover:underline cursor-pointer truncate">
                          {connection.name}
                        </p>
                      </Link>
                      {connection.isCoach && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                          Coach
                        </Badge>
                      )}
                      {connection.subscriptionTier === 'pro' && (
                        <Badge className="text-xs px-1.5 py-0.5 bg-primary">
                          PRO
                        </Badge>
                      )}
                      {connection.subscriptionTier === 'star' && (
                        <Badge className="text-xs px-1.5 py-0.5 bg-yellow-500">
                          STAR
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      @{connection.username}
                    </p>
                    {connection.bio && (
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1 truncate">
                        {connection.bio}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isCoach && !isAlreadyAthlete(connection.id) && (
                        <DropdownMenuItem 
                          onClick={() => handleAddAsAthlete(connection.id)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add As Athlete
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => handleRemoveConnection(connection.id)}
                        className="text-destructive"
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remove Connection
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}