import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, Users, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch athletes");
      }
      
      const data = await response.json();
      
      // Validate the response structure
      const validData = {
        athletes: Array.isArray(data.athletes) ? data.athletes : [],
        pagination: data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          hasMore: false
        }
      };

      // Handle client-side pagination for search results
      if (searchQuery.trim()) {
        const startIndex = (page - 1) * 10;
        const endIndex = startIndex + 10;
        const paginatedAthletes = validData.athletes.slice(startIndex, endIndex);
        
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
      queryClient.invalidateQueries({ queryKey: ["/api/athletes"] });
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
        fromUserId: (currentUser as any).id,
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
    return (userCoaches as any[]).some((coach: any) => coach.id === coachId);
  };

  // Helper function to check if there's a pending coaching request
  const hasPendingCoachingRequest = (coachId: number) => {
    if (!coachingRequests) return false;
    const { sent = [], received = [] } = coachingRequests as any;
    return [...sent, ...received].some((req: any) => 
      (req.fromUserId === (currentUser as any).id && req.toUserId === coachId) ||
      (req.fromUserId === coachId && req.toUserId === (currentUser as any).id)
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
            <div className="space-y-0">
              {displayAthletes.map((athlete) => (
                <div key={athlete.id} className="flex items-center py-4 px-4 hover:bg-gray-800/50 transition-colors border-b border-gray-800 last:border-b-0">
                  <Avatar className="h-7 w-7 mr-4">
                    <AvatarImage src="/default-avatar.png" />
                    <AvatarFallback className="bg-blue-600 text-white text-xs">
                      {(athlete.name || athlete.username)?.charAt(0)?.toUpperCase()}
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
                        <span className="px-2 py-1 text-xs font-bold bg-[#ff8c00] text-black rounded-full">
                          COACH
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">@{athlete.username}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    {isCoach(athlete) && isAlreadyCoached(athlete.id) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-600 text-green-400 hover:bg-green-600/20"
                        disabled
                      >
                        Your Coach
                      </Button>
                    ) : isCoach(athlete) && hasPendingCoachingRequest(athlete.id) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/20"
                        disabled
                      >
                        Request Sent
                      </Button>
                    ) : isCoach(athlete) ? (
                      <Button
                        onClick={() => handleSendCoachingRequest(athlete.id)}
                        disabled={sendCoachingRequestMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
                      >
                        {sendCoachingRequestMutation.isPending ? "Sending..." : "Request Coaching"}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSendFriendRequest(athlete.id)}
                        disabled={sendFriendRequestMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-gray-400 hover:bg-gray-600/20"
                      >
                        {sendFriendRequestMutation.isPending ? "Sending..." : "Add Friend"}
                      </Button>
                    )}
                  </div>
                </div>
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