import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MessageCircle, UserPlus, UserMinus } from "lucide-react";

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  bio?: string;
  isFollowing?: boolean;
  isFollower?: boolean;
}

export default function AthletesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
  });

  // Fetch users based on search
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/athletes", searchQuery],
    queryFn: async () => {
      const url = searchQuery.trim() 
        ? `/api/athletes?search=${encodeURIComponent(searchQuery.trim())}`
        : "/api/athletes";
      const response = await apiRequest("GET", url);
      return response.json();
    },
    enabled: !!currentUser,
  });

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: number; action: "follow" | "unfollow" }) => {
      if (action === "follow") {
        return await apiRequest("POST", `/api/follow/${userId}`);
      } else {
        return await apiRequest("DELETE", `/api/follow/${userId}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/athletes"] });
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

  const handleFollow = (userId: number, isFollowing: boolean) => {
    followMutation.mutate({
      userId,
      action: isFollowing ? "unfollow" : "follow",
    });
  };

  const handleStartConversation = (receiverId: number) => {
    startConversationMutation.mutate(receiverId);
  };

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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}

        {/* Users Grid */}
        {!isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-400">
                  {searchQuery ? "No athletes found matching your search." : "No athletes to display."}
                </p>
              </div>
            ) : (
              users.map((athlete) => (
                <Card key={athlete.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {athlete.name?.charAt(0).toUpperCase() || athlete.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-white text-base truncate">
                          {athlete.name || athlete.username}
                        </CardTitle>
                        <p className="text-gray-400 text-sm truncate">@{athlete.username}</p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {athlete.bio && (
                      <CardDescription className="text-gray-300 text-sm mb-4 line-clamp-2">
                        {athlete.bio}
                      </CardDescription>
                    )}
                    
                    <div className="flex items-center justify-between space-x-2">
                      {athlete.isFollowing && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartConversation(athlete.id)}
                          disabled={startConversationMutation.isPending}
                          className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Message
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        onClick={() => handleFollow(athlete.id, athlete.isFollowing || false)}
                        disabled={followMutation.isPending}
                        className={
                          athlete.isFollowing
                            ? "bg-gray-600 hover:bg-gray-700 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }
                      >
                        {athlete.isFollowing ? (
                          <>
                            <UserMinus className="w-3 h-3 mr-1" />
                            Friends
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3 mr-1" />
                            Friend Request
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}