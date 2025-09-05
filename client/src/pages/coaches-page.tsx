import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, Star, MapPin, Trophy, MessageSquare, UserPlus, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SubscriptionModal } from '@/components/SubscriptionModal';

interface Coach {
  id: number;
  username: string;
  name: string;
  profileImageUrl?: string;
  bio?: string;
  location?: string;
  specialties?: string[];
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  yearsExperience?: number;
  certifications?: string[];
  subscription?: {
    id: number;
    monthlyRate: number;
    weeklyRate: number;
    sessionRate: number;
  };
}

export default function CoachesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch coaches list
  const { data: coaches = [], isLoading } = useQuery<Coach[]>({
    queryKey: ["/api/coaches"],
  });

  // Send connection request mutation
  const connectMutation = useMutation({
    mutationFn: (coachId: number) =>
      apiRequest("/api/connections/requests", "POST", {
        fromUserId: undefined, // Will be set by server from auth
        toUserId: coachId,
        requestType: "athlete_request",
        message: "I would like to connect with you as my coach."
      }),
    onSuccess: () => {
      toast({
        title: "Connection request sent",
        description: "Your request has been sent to the coach.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/coaches"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send connection request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle subscription modal
  const handleSubscribeToCoach = (coach: Coach) => {
    setSelectedCoach(coach);
    setIsSubscriptionModalOpen(true);
  };

  // Filter coaches based on search and specialty
  const filteredCoaches = coaches.filter(coach => {
    const matchesSearch = coach.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coach.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coach.bio?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSpecialty = selectedSpecialty === "all" || 
                           coach.specialties?.includes(selectedSpecialty);
    
    return matchesSearch && matchesSpecialty;
  });

  // Get unique specialties for filter
  const allSpecialties = [...new Set(coaches.flatMap(coach => coach.specialties || []))];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-12 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Find Your Coach</h1>
        <p className="text-muted-foreground">Connect with experienced track and field coaches</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search coaches by name, username, or bio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full p-2 border border-input bg-background rounded-md"
              >
                <option value="all">All Specialties</option>
                {allSpecialties.map(specialty => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredCoaches.length} coaches found
        </p>
      </div>

      {/* Coaches Grid */}
      {filteredCoaches.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No coaches found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or check back later for new coaches.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoaches.map((coach) => (
            <Card key={coach.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={coach.profileImageUrl} />
                    <AvatarFallback className="text-lg">
                      {coach.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{coach.name}</h3>
                      {coach.isVerified && (
                        <Badge variant="secondary" className="text-xs">
                          <Trophy className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">@{coach.username}</p>
                    {coach.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium">{coach.rating.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">
                          ({coach.reviewCount} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {coach.location && (
                  <div className="flex items-center gap-1 mb-2">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{coach.location}</span>
                  </div>
                )}

                {coach.yearsExperience && (
                  <div className="text-xs text-muted-foreground mb-3">
                    {coach.yearsExperience} years experience
                  </div>
                )}

                {coach.bio && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {coach.bio}
                  </p>
                )}

                {coach.specialties && coach.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {coach.specialties.slice(0, 3).map((specialty) => (
                      <Badge key={specialty} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                    {coach.specialties.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{coach.specialties.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Subscription Pricing Display */}
                {coach.subscription && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-lg border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-4 w-4 text-purple-400" />
                      <span className="text-xs font-medium text-purple-400">Subscription Available</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {coach.subscription.monthlyRate > 0 && (
                        <div className="text-center">
                          <div className="font-medium text-white">${coach.subscription.monthlyRate}</div>
                          <div className="text-muted-foreground">per month</div>
                        </div>
                      )}
                      {coach.subscription.sessionRate > 0 && (
                        <div className="text-center">
                          <div className="font-medium text-white">${coach.subscription.sessionRate}</div>
                          <div className="text-muted-foreground">per session</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {coach.subscription ? (
                    <Button
                      size="sm"
                      onClick={() => handleSubscribeToCoach(coach)}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                      <Crown className="h-3 w-3 mr-1" />
                      Subscribe
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => connectMutation.mutate(coach.id)}
                      disabled={connectMutation.isPending}
                      className="flex-1"
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Connect
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        user={selectedCoach}
        subscription={selectedCoach?.subscription}
        currentUser={undefined} // Will be fetched from context in modal
      />
    </div>
  );
}