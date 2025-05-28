import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, Users, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  bio?: string;
  isFollowing?: boolean;
  isFollower?: boolean;
}

interface AthletesResponse {
  athletes: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export default function AthletesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [allAthletes, setAllAthletes] = useState<User[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
  });

  // Get coaching requests
  const { data: coachingRequests } = useQuery({
    queryKey: ["/api/coaching-requests"],
    enabled: !!currentUser,
  });

  // Get user's coaches
  const { data: userCoaches = [] } = useQuery({
    queryKey: ["/api/athlete/coaches"],
    enabled: !!currentUser,
  });

  // Fetch athletes with search and pagination
  const { data: athletesResponse, isLoading, isFetching } = useQuery<AthletesResponse>({
    queryKey: ["/api/athletes", searchQuery, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }
      params.set("page", page.toString());
      params.set("limit", "10");
      
      const url = `/api/athletes?${params.toString()}`;
      const response = await apiRequest("GET", url);
      const data = await response.json();
      
      // Handle both old format (array) and new format (object with pagination)
      const validData = Array.isArray(data) 
        ? {
            athletes: data,
            pagination: { 
              page: 1, 
              limit: 10, 
              total: data.length, 
              hasMore: false
            }
          }
        : {
            athletes: data.athletes || [],
            pagination: data.pagination || { page: 1, limit: 10, total: 0, hasMore: false }
          };
      
      // For simple array response, implement client-side pagination
      if (Array.isArray(data)) {
        const startIndex = (page - 1) * 10;
        const endIndex = startIndex + 10;
        const paginatedAthletes = data.slice(startIndex, endIndex);
        
        if (page === 1) {
          setAllAthletes(paginatedAthletes);
        } else {
          setAllAthletes(prev => [...prev, ...paginatedAthletes]);
        }
        
        return {
          athletes: paginatedAthletes,
          pagination: {
            page: page,
            limit: 10,
            total: data.length,
            hasMore: endIndex < data.length
          }
        };
      } else {
        // Server-side pagination
        if (page === 1) {
          setAllAthletes(validData.athletes);
        } else {
          setAllAthletes(prev => [...prev, ...validData.athletes]);
        }
        return validData;
      }
    },
    enabled: !!currentUser,
  });

  // Reset search and pagination
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
    setAllAthletes([]);
  };

  // Load more athletes
  const handleShowMore = () => {
    if (athletesResponse?.pagination?.hasMore) {
      setPage(prev => prev + 1);
    }
  };

  // Send friend request mutation
  const sendFriendRequestMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", `/api/follow/${userId}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend request sent successfully!",
      });
      // Refresh the athletes list
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send friend request.",
        variant: "destructive",
      });
    },
  });

  // Coaching request mutation
  const sendCoachingRequestMutation = useMutation({
    mutationFn: async ({ coachId }: { coachId: number }) => {
      const response = await apiRequest("POST", "/api/coaching-requests", {
        fromUserId: currentUser.id,
        toUserId: coachId,
        requestType: 'athlete_request',
        message: "I'd like to request your coaching"
      });
      if (!response.ok) {
        throw new Error("Failed to send coaching request");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coaching-requests"] });
      toast({
        title: "Coaching request sent",
        description: "Your coaching request has been sent successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send coaching request. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSendCoachingRequest = (coachId: number) => {
    sendCoachingRequestMutation.mutate({ coachId });
  };

  // Helper function to check if user already has this coach
  const isAlreadyCoached = (coachId: number) => {
    return userCoaches.some((coach: any) => coach.id === coachId);
  };

  // Helper function to check if there's a pending coaching request
  const hasPendingCoachingRequest = (coachId: number) => {
    if (!coachingRequests) return false;
    const { sent = [], received = [] } = coachingRequests;
    return [...sent, ...received].some((req: any) => 
      (req.fromUserId === currentUser.id && req.toUserId === coachId) ||
      (req.fromUserId === coachId && req.toUserId === currentUser.id)
    );
  };

  // Check if athlete is a coach (coaches are shown in athletes list)
  const isCoach = (athlete: User) => {
    return athlete.bio?.toLowerCase().includes('coach') || false;
  };

  const handleSendFriendRequest = (userId: number) => {
    sendFriendRequestMutation.mutate(userId);
  };

  if (!currentUser) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (isLoading && page === 1) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  const displayAthletes = searchQuery.trim() ? 
    (athletesResponse?.athletes || []) : 
    allAthletes;

  return (
    <div className="min-h-screen bg-[#010a18] text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Athletes</h1>
          
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search athletes..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Recent Athletes Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {searchQuery.trim() ? "Search Results" : "Recent Athletes"}
          </h2>
          
          {displayAthletes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">
                {searchQuery.trim() ? "No athletes found matching your search." : "No athletes found."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayAthletes.map((athlete) => (
                <Card key={athlete.id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-blue-600 text-white">
                          {athlete.name?.charAt(0) || athlete.username?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/profile/${athlete.id}`}
                            className="font-semibold text-white hover:text-blue-400 transition-colors"
                          >
                            {athlete.name || athlete.username}
                          </Link>
                          {isCoach(athlete) && (
                            <span className="px-2 py-1 text-xs bg-orange-600 text-white rounded-full">
                              COACH
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">@{athlete.username}</p>
                      </div>
                    </div>
                    
                    {athlete.bio && (
                      <p className="text-sm text-gray-300 mb-4 line-clamp-2">{athlete.bio}</p>
                    )}
                    
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendFriendRequest(athlete.id)}
                        disabled={sendFriendRequestMutation.isPending}
                        className="w-full"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Friend
                      </Button>
                      
                      {/* Show Request Coaching button for coaches */}
                      {isCoach(athlete) && !isAlreadyCoached(athlete.id) && !hasPendingCoachingRequest(athlete.id) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendCoachingRequest(athlete.id)}
                          disabled={sendCoachingRequestMutation.isPending}
                          className="w-full text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Request Coaching
                        </Button>
                      )}
                      
                      {/* Show status if already coached or request pending */}
                      {isCoach(athlete) && isAlreadyCoached(athlete.id) && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="w-full text-green-600"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Your Coach
                        </Button>
                      )}
                      
                      {isCoach(athlete) && hasPendingCoachingRequest(athlete.id) && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="w-full text-yellow-600"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Request Pending
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Show More Button */}
          {!searchQuery.trim() && athletesResponse?.pagination?.hasMore && (
            <div className="text-center mt-6">
              <Button
                variant="outline"
                onClick={handleShowMore}
                disabled={isFetching}
                className="bg-gray-800 border-gray-700 hover:bg-gray-700"
              >
                {isFetching ? "Loading..." : "Show More"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
        title: "Error",
        description: error.message || "Failed to send friend request",
        variant: "destructive",
      });
    },
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#010a18] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#010a18] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Athletes</h1>
          <p className="text-gray-400">Discover and connect with fellow athletes</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search athletes by name or username..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
          />
        </div>

        {/* Section Title */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">
            {searchQuery ? `Search Results (${athletesResponse?.pagination.total || 0})` : "Recent Athletes"}
          </h2>
          {!searchQuery && (
            <p className="text-sm text-gray-400 mt-1">Latest registered athletes on TrackLit</p>
          )}
        </div>

        {/* Loading State */}
        {isLoading && allAthletes.length === 0 && (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}

        {/* No Results */}
        {!isLoading && allAthletes.length === 0 && athletesResponse && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">
              {searchQuery ? "No athletes found matching your search" : "No athletes found"}
            </div>
            {searchQuery && (
              <Button
                variant="ghost"
                onClick={() => handleSearchChange("")}
                className="text-blue-400 hover:text-blue-300"
              >
                Clear search
              </Button>
            )}
          </div>
        )}

        {/* Athletes Grid */}
        {allAthletes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {allAthletes.map((user) => (
              <Card key={user.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Link href={`/athlete/${user.username}`} className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity">
                      <Avatar className="h-12 w-12 border border-gray-600">
                        <AvatarFallback className="bg-blue-600 text-white font-semibold">
                          {user.name?.charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">
                          {user.name || user.username}
                        </h3>
                        <p className="text-sm text-gray-400 truncate">@{user.username}</p>
                      </div>
                    </Link>
                  </div>
                  
                  {user.bio && (
                    <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                      {user.bio}
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    {!user.isFollowing && !user.isFollower && (
                      <Button
                        onClick={() => sendFriendRequestMutation.mutate(user.id)}
                        disabled={sendFriendRequestMutation.isPending}
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Friend
                      </Button>
                    )}
                    
                    {user.isFollowing && user.isFollower && (
                      <div className="flex-1 text-center py-2 text-sm text-green-400">
                        ✓ Friends
                      </div>
                    )}
                    
                    {user.isFollower && !user.isFollowing && (
                      <Button
                        onClick={() => sendFriendRequestMutation.mutate(user.id)}
                        disabled={sendFriendRequestMutation.isPending}
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        Accept Friend
                      </Button>
                    )}
                    
                    {user.isFollowing && !user.isFollower && (
                      <div className="flex-1 text-center py-2 text-sm text-yellow-400">
                        Request Sent
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Show More Button */}
        {athletesResponse?.pagination?.hasMore && !isLoading && (
          <div className="flex justify-center mb-6">
            <Button
              onClick={handleShowMore}
              disabled={isFetching}
              variant="outline"
              className="bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700/70"
            >
              {isFetching ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Loading...
                </>
              ) : (
                <>Show More ({(athletesResponse?.pagination?.total || 0) - allAthletes.length} remaining)</>
              )}
            </Button>
          </div>
        )}

        {/* Footer info */}
        {!athletesResponse?.pagination?.hasMore && allAthletes.length > 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-400">
              Showing all {allAthletes.length} athletes
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}