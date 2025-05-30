import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCheck, MessageSquare, UserMinus } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ListSkeleton } from "@/components/list-skeleton";

export default function MyAthletesPage() {
  const { toast } = useToast();

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
  });

  // Fetch coach's athletes
  const { data: coachAthletes = [], isLoading: loadingAthletes } = useQuery({
    queryKey: ["/api/coach/athletes"],
    enabled: !!currentUser?.isCoach,
  });

  // Remove athlete mutation
  const removeAthleteMutation = useMutation({
    mutationFn: async (athleteId: number) => {
      const response = await apiRequest("DELETE", `/api/coach/athletes/${athleteId}`);
      if (!response.ok) {
        throw new Error("Failed to remove athlete");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coach/athletes"] });
      toast({
        title: "Athlete removed",
        description: "The athlete has been removed from your coaching list.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove athlete. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRemoveAthlete = (athleteId: number) => {
    removeAthleteMutation.mutate(athleteId);
  };

  const handleMessageAthlete = (athleteId: number) => {
    // Navigate to messages page with the athlete
    window.location.href = `/messages/${athleteId}`;
  };

  // Show message if user is not a coach
  if (!currentUser?.isCoach) {
    return (
      <div className="min-h-screen bg-[#010a18] text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">My Athletes</h1>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <UserCheck className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">Coach Access Required</h3>
                <p className="text-gray-400 text-center">
                  You need to be a coach to view your athletes. Update your profile to become a coach.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#010a18] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">My Athletes</h1>

          {loadingAthletes ? (
            <ListSkeleton items={5} />
          ) : coachAthletes.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <UserCheck className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">No athletes yet</h3>
                <p className="text-gray-400 text-center">
                  Start building your coaching roster by inviting friends to become your athletes.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-0">
              {coachAthletes.map((athlete: any) => (
                <div key={athlete.id} className="flex items-center py-4 px-4 hover:bg-gray-800/50 transition-colors border-b border-gray-800 last:border-b-0">
                  <Avatar className="h-7 w-7 mr-4">
                    <AvatarImage src={athlete.profileImageUrl || "/default-avatar.png"} />
                    <AvatarFallback className="bg-blue-600 text-white text-xs">
                      {athlete.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || athlete.username?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/user/${athlete.id}`}
                        className="font-semibold text-white hover:text-blue-400 transition-colors"
                      >
                        {athlete.name || athlete.username}
                      </Link>
                    </div>
                    <p className="text-sm text-gray-400">@{athlete.username}</p>
                    {athlete.bio && (
                      <p className="text-sm text-gray-300 mt-1 line-clamp-1">{athlete.bio}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMessageAthlete(athlete.id)}
                      className="text-blue-600 hover:text-blue-700 border-blue-600 hover:border-blue-700"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveAthlete(athlete.id)}
                      disabled={removeAthleteMutation.isPending}
                      className="text-red-600 hover:text-red-700 border-red-600 hover:border-red-700"
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}