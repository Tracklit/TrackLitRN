import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, UserMinus, MessageCircle, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { User, Follow } from "@shared/schema";
import { Link } from "wouter";

interface UserWithFollowStatus extends User {
  isFollowing?: boolean;
  isFollower?: boolean;
  followersCount?: number;
  followingCount?: number;
}

export default function AthletesPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"discover" | "following" | "followers">("discover");

  // Fetch all users (recent users for discovery)
  const { data: allUsers = [] } = useQuery<UserWithFollowStatus[]>({
    queryKey: ["/api/users/recent", searchQuery],
    queryFn: () => apiRequest("GET", `/api/users/recent${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ""}`),
    enabled: !!user,
  });

  // Fetch following list
  const { data: following = [] } = useQuery<UserWithFollowStatus[]>({
    queryKey: ["/api/following"],
    enabled: !!user && activeTab === "following",
  });

  // Fetch followers list
  const { data: followers = [] } = useQuery<UserWithFollowStatus[]>({
    queryKey: ["/api/followers"],
    enabled: !!user && activeTab === "followers",
  });

  // Follow/Unfollow mutation
  const followMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: number; action: "follow" | "unfollow" }) => {
      if (action === "follow") {
        return await apiRequest("POST", "/api/follow", { followingId: userId });
      } else {
        return await apiRequest("DELETE", `/api/follow/${userId}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/followers"] });
    },
  });

  // Start conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: async (receiverId: number) => {
      return await apiRequest("POST", "/api/conversations", { receiverId });
    },
    onSuccess: () => {
      // Navigate to messages page
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

  const getCurrentUsers = () => {
    switch (activeTab) {
      case "following":
        return following;
      case "followers":
        return followers;
      case "discover":
      default:
        return allUsers.filter(u => u.id !== user?.id); // Exclude current user
    }
  };

  const filteredUsers = getCurrentUsers().filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              Athletes
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Discover and connect with other athletes in the TrackLit community
            </p>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search athletes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("discover")}
                className={cn(
                  "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  activeTab === "discover"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                Discover
              </button>
              <button
                onClick={() => setActiveTab("following")}
                className={cn(
                  "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  activeTab === "following"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                Following ({following.length})
              </button>
              <button
                onClick={() => setActiveTab("followers")}
                className={cn(
                  "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  activeTab === "followers"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                Followers ({followers.length})
              </button>
            </div>

            {/* Users Grid */}
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? "No athletes found" : 
                   activeTab === "following" ? "Not following anyone yet" :
                   activeTab === "followers" ? "No followers yet" :
                   "No athletes to discover"}
                </h3>
                <p className="text-gray-500">
                  {searchQuery ? "Try adjusting your search terms" :
                   activeTab === "discover" ? "Check back later for new athletes to follow" :
                   "Start following athletes to build your network"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((athlete) => (
                  <Card key={athlete.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback name={athlete.name} />
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{athlete.name}</h3>
                          <p className="text-xs text-gray-500 truncate">@{athlete.username}</p>
                          {athlete.bio && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{athlete.bio}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span>{athlete.followersCount || 0} followers</span>
                            <span>{athlete.followingCount || 0} following</span>
                          </div>
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                            <span>Joined {formatDistanceToNow(new Date(athlete.createdAt || Date.now()), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 space-x-2">
                        <Button
                          variant={athlete.isFollowing ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleFollow(athlete.id, athlete.isFollowing || false)}
                          disabled={followMutation.isPending}
                          className="flex-1"
                        >
                          {athlete.isFollowing ? (
                            <>
                              <UserMinus className="h-3 w-3 mr-1" />
                              Unfollow
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-3 w-3 mr-1" />
                              Follow
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartConversation(athlete.id)}
                          disabled={startConversationMutation.isPending}
                        >
                          <MessageCircle className="h-3 w-3" />
                        </Button>
                      </div>

                      {athlete.role && athlete.role !== "athlete" && (
                        <div className="mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {athlete.role === "coach" ? "Coach" : athlete.role}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}