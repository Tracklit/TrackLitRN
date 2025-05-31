import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserCheck, UserPlus, UserMinus, Search, Check, X, ChevronDown, Users } from "lucide-react";
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
  const { data: connections = [], isLoading: connectionsLoading } = useQuery({
    queryKey: ["/api/friends"],
    select: (data) => data || []
  });

  // Fetch pending connection requests
  const { data: pendingRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/friend-requests/pending"],
    select: (data) => data || []
  });

  // Search for users
  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ["/api/users/search", searchTerm],
    enabled: searchTerm.length > 0,
    select: (data) => data || []
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

  const filteredConnections = connections.filter((connection: Connection) =>
    connection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Connections</h1>
          {connections.length > 0 && (
            <Badge variant="secondary">{connections.length}</Badge>
          )}
        </div>

        {/* Pending Requests Dropdown */}
        {pendingRequests.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="relative">
                <UserPlus className="h-4 w-4 mr-2" />
                Pending Requests
                <Badge className="ml-2 bg-orange-500 text-white">
                  {pendingRequests.length}
                </Badge>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-2">
                <h4 className="font-semibold text-sm mb-3">Connection Requests</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {pendingRequests.map((request: ConnectionRequest) => (
                    <div key={request.id} className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
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
                          className="bg-green-600 hover:bg-green-700 h-7 w-7 p-0"
                          disabled={acceptRequestMutation.isPending}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineRequest(request.id)}
                          className="h-7 w-7 p-0"
                          disabled={declineRequestMutation.isPending}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search connections or find new people..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Search Results */}
      {searchTerm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            {searchLoading ? (
              <ListSkeleton />
            ) : searchResults.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No users found matching "{searchTerm}"
              </p>
            ) : (
              <div className="space-y-3">
                {searchResults.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={user.profileImageUrl} />
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{user.name}</p>
                          {user.isCoach && (
                            <Badge variant="secondary">Coach</Badge>
                          )}
                          {user.isPrivate && (
                            <Badge variant="outline">Private</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                        {user.bio && (
                          <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>
                        )}
                      </div>
                    </div>
                    
                    {user.id !== user?.id && (
                      <div className="flex space-x-2">
                        {user.connectionStatus === 'connected' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveConnection(user.id)}
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        ) : user.connectionStatus === 'pending' ? (
                          <Button variant="outline" size="sm" disabled>
                            Pending
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleSendRequest(user.id)}
                            disabled={sendRequestMutation.isPending}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Connect
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Connections List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Connections</CardTitle>
        </CardHeader>
        <CardContent>
          {connectionsLoading ? (
            <ListSkeleton />
          ) : filteredConnections.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {searchTerm ? "No connections found" : "No connections yet"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? `No connections match "${searchTerm}"`
                  : "Start connecting with other athletes and coaches to build your network."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredConnections.map((connection: Connection) => (
                <div key={connection.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={connection.profileImageUrl} />
                      <AvatarFallback>{connection.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{connection.name}</p>
                        {connection.isCoach && (
                          <Badge variant="secondary">Coach</Badge>
                        )}
                        {connection.subscriptionTier === 'pro' && (
                          <Badge className="bg-orange-500">Pro</Badge>
                        )}
                        {connection.subscriptionTier === 'star' && (
                          <Badge className="bg-purple-500">Star</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">@{connection.username}</p>
                      {connection.bio && (
                        <p className="text-sm text-muted-foreground mt-1">{connection.bio}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link href={`/profile/${connection.username}`}>
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveConnection(connection.id)}
                      disabled={removeConnectionMutation.isPending}
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}