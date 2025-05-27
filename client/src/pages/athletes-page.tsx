import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus } from "lucide-react";
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

  // Fetch users based on search and page
  const { data: athletesResponse, isLoading, isFetching } = useQuery<AthletesResponse>({
    queryKey: ["/api/athletes", searchQuery, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }
      params.set("page", page.toString());
      
      const url = `/api/athletes?${params.toString()}`;
      const response = await apiRequest("GET", url);
      const data = await response.json();
      
      // Ensure we have valid data structure
      const validData = {
        athletes: data.athletes || [],
        pagination: data.pagination || { page: 1, limit: 10, total: 0, hasMore: false }
      };
      
      // Debug logging
      console.log("API Response:", data);
      console.log("Valid Data:", validData);
      console.log("Athletes array:", validData.athletes);
      
      // If it's page 1 or a new search, reset the list
      if (page === 1) {
        console.log("Setting athletes for page 1:", validData.athletes);
        setAllAthletes(validData.athletes);
      } else {
        // Append new athletes to existing list
        setAllAthletes(prev => {
          const newList = [...prev, ...validData.athletes];
          console.log("Appending athletes, new list:", newList);
          return newList;
        });
      }
      
      return validData;
    },
    enabled: !!currentUser,
  });

  // Reset page when search changes
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
      queryClient.invalidateQueries({ queryKey: ["/api/athletes"] });
    },
    onError: (error: Error) => {
      toast({
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
          <div className="flex justify-center">
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