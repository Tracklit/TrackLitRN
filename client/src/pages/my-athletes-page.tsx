import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserCheck, MessageSquare, UserMinus, UserPlus, Search } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ListSkeleton } from "@/components/list-skeleton";

export default function MyAthletesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
  });

  // Fetch coach's athletes
  const { data: coachAthletes = [], isLoading: loadingAthletes } = useQuery({
    queryKey: ["/api/coach/athletes"],
    enabled: !!currentUser?.isCoach,
  });

  // Fetch connections for search
  const { data: connections = [] } = useQuery({
    queryKey: ["/api/friends"],
    enabled: !!currentUser?.isCoach,
  });

  // Filter connections for search
  const filteredConnections = connections.filter((connection: any) =>
    connection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connection.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter out connections that are already athletes
  const availableConnections = filteredConnections.filter((connection: any) => 
    !coachAthletes.some((athlete: any) => athlete.id === connection.id)
  );

  // Add athlete mutation
  const addAthleteMutation = useMutation({
    mutationFn: (athleteId: number) => apiRequest("POST", "/api/coach/athletes", { athleteId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coach/athletes"] });
      toast({
        title: "Athlete added successfully",
        description: "The connection has been added to your athletes list.",
      });
      setIsDialogOpen(false);
      setSearchTerm("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add athlete",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">My Athletes</h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Athlete
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Add Athlete from Connections</DialogTitle>
                  <DialogDescription className="text-gray-300">
                    Search and select a connection to add as your athlete.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search connections..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {searchTerm && availableConnections.length > 0 ? (
                      availableConnections.map((connection: any) => (
                        <div
                          key={connection.id}
                          className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer"
                          onClick={() => addAthleteMutation.mutate(connection.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={connection.profileImageUrl} />
                              <AvatarFallback>{connection.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-white">{connection.name}</p>
                              <p className="text-sm text-gray-400">@{connection.username}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            Add
                          </Button>
                        </div>
                      ))
                    ) : searchTerm ? (
                      <p className="text-center text-gray-400 py-4">
                        No available connections found
                      </p>
                    ) : (
                      <p className="text-center text-gray-400 py-4">
                        Start typing to search your connections
                      </p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

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