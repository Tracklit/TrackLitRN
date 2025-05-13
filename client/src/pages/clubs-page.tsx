import { ProtectedRoute } from "@/lib/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Globe, Shield, Plus, MessagesSquare, UserCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// No need for context as we'll use window.location.reload() to refresh the clubs

export default function ClubsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isCreateClubOpen, setIsCreateClubOpen] = useState(false);
  const [clubName, setClubName] = useState("");
  const [clubDescription, setClubDescription] = useState("");
  const [clubPrivacy, setClubPrivacy] = useState("public");
  const [isCreatingClub, setIsCreatingClub] = useState(false);
  
  // State for clubs
  const [clubs, setClubs] = useState<any[]>([]);
  const [allClubs, setAllClubs] = useState<any[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [isLoadingAllClubs, setIsLoadingAllClubs] = useState(true);
  const [clubLoadError, setClubLoadError] = useState<string | null>(null);
  const [allClubsLoadError, setAllClubsLoadError] = useState<string | null>(null);
  const [clubAdmins, setClubAdmins] = useState<Record<number, string>>({});
  
  // Handle club creation
  const handleCreateClub = async () => {
    if (!clubName.trim()) {
      toast({
        title: "Error",
        description: "Club name is required",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreatingClub(true);
    
    try {
      const response = await fetch("/api/clubs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: clubName,
          description: clubDescription,
          isPrivate: clubPrivacy === "private"
        }),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Authentication required",
            description: "Please login to create a club",
            variant: "destructive"
          });
          return;
        }
        
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create club");
      }
      
      // Club created successfully
      toast({
        title: "Club created",
        description: `${clubName} club was created successfully`,
      });
      
      setIsCreateClubOpen(false);
      setClubName("");
      setClubDescription("");
      setClubPrivacy("public");
      
      // Refresh the page to show updated clubs
      window.location.reload();
    } catch (err: any) {
      toast({
        title: "Error creating club",
        description: err?.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsCreatingClub(false);
    }
  };
  
  // Fetch user's clubs and redirect to default club if it exists
  useEffect(() => {
    // Only fetch data if user is authenticated
    if (!user) {
      return;
    }
    
    // Function to fetch clubs
    const fetchClubs = async () => {
      try {
        setIsLoadingClubs(true);
        const response = await fetch('/api/clubs/my', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            toast({
              title: "Authentication required",
              description: "Please login to view your clubs",
              variant: "destructive"
            });
            return;
          }
          
          throw new Error(`Failed to fetch clubs: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched clubs:', data);
        setClubs(data);
        
        // Check if user has at least one club
        if (data.length > 0) {
          // If the user has only one club, go to that club
          if (data.length === 1) {
            setLocation(`/club/${data[0].id}`);
            return;
          }
          
          // Check if user has a default club set
          const userResponse = await fetch('/api/user', {
            credentials: 'include',
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData.defaultClubId) {
              // Check if defaultClubId matches one of the user's clubs
              const defaultClub = data.find((club: any) => club.id === userData.defaultClubId);
              if (defaultClub) {
                setLocation(`/club/${defaultClub.id}`);
                return;
              }
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching clubs:', err);
        setClubLoadError(err?.message || 'An error occurred while fetching clubs');
        
        toast({
          title: "Error loading clubs",
          description: err?.message || 'An error occurred while fetching clubs',
          variant: "destructive"
        });
      } finally {
        setIsLoadingClubs(false);
      }
    };
    
    fetchClubs();
  }, [toast, user, setLocation]);
  
  // Fetch all clubs for the discover tab
  useEffect(() => {
    // Only fetch data if user is authenticated
    if (!user) {
      return;
    }
    
    // Function to fetch all clubs
    const fetchAllClubs = async () => {
      try {
        setIsLoadingAllClubs(true);
        const response = await fetch('/api/clubs', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            toast({
              title: "Authentication required",
              description: "Please login to view clubs",
              variant: "destructive"
            });
            return;
          }
          
          throw new Error(`Failed to fetch clubs: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched all clubs:', data);
        setAllClubs(data);
        
        // Fetch admin usernames for each club
        const adminDetails: Record<number, string> = {};
        const adminPromises = data.map(async (club: any) => {
          try {
            const adminResponse = await fetch(`/api/users/${club.ownerId}`, {
              credentials: 'include',
            });
            
            if (adminResponse.ok) {
              const adminData = await adminResponse.json();
              adminDetails[club.id] = adminData.username;
            }
          } catch (err) {
            console.error(`Error fetching admin for club ${club.id}:`, err);
          }
        });
        
        // Wait for all admin username fetches to complete
        await Promise.all(adminPromises);
        setClubAdmins(adminDetails);
      } catch (err: any) {
        console.error('Error fetching all clubs:', err);
        setAllClubsLoadError(err?.message || 'An error occurred while fetching clubs');
        
        toast({
          title: "Error loading clubs",
          description: err?.message || 'An error occurred while fetching clubs',
          variant: "destructive"
        });
      } finally {
        setIsLoadingAllClubs(false);
      }
    };
    
    fetchAllClubs();
  }, [toast, user]);

  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
      <PageHeader
        title="Clubs"
        description="Join clubs and chat with fellow athletes"
        actions={
          <Dialog open={isCreateClubOpen} onOpenChange={setIsCreateClubOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Club
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a New Club</DialogTitle>
                <DialogDescription>
                  Create a club to connect with other athletes and coaches.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Club Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Enter club name" 
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe your club" 
                    value={clubDescription}
                    onChange={(e) => setClubDescription(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="privacy">Privacy</Label>
                  <select 
                    id="privacy"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={clubPrivacy}
                    onChange={(e) => setClubPrivacy(e.target.value)}
                  >
                    <option value="public">Public - Anyone can join</option>
                    <option value="private">Private - Approval required</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateClubOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleCreateClub} 
                  disabled={isCreatingClub}
                >
                  {isCreatingClub ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Club"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs defaultValue="my-clubs" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="my-clubs">My Clubs</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>

        <TabsContent value="my-clubs">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingClubs ? (
              <Card className="col-span-full text-center py-8">
                <CardContent>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted animate-pulse">
                    <Users className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="mt-6 text-xl font-medium">Loading clubs...</h3>
                </CardContent>
              </Card>
            ) : clubLoadError ? (
              <Card className="col-span-full text-center py-8 border-destructive">
                <CardContent>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                    <Shield className="h-10 w-10 text-destructive" />
                  </div>
                  <h3 className="mt-6 text-xl font-medium">Error loading clubs</h3>
                  <p className="mt-2 text-muted-foreground">{clubLoadError}</p>
                  <Button 
                    className="mt-4"
                    onClick={() => window.location.reload()}
                    variant="outline"
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : clubs.length === 0 ? (
              <Card className="col-span-full text-center py-8">
                <CardContent>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <Users className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="mt-6 text-xl font-medium">You haven't joined any clubs yet</h3>
                  <p className="mt-2 text-muted-foreground">
                    Clubs connect you with other athletes and coaches for training and competitions.
                  </p>
                  <Button className="mt-4" onClick={() => document.getElementById('discover-tab')?.click()}>
                    Discover Clubs
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {clubs.map((club) => (
                  <Card 
                    key={club.id} 
                    className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => setLocation(`/club/${club.id}`)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{club.name}</CardTitle>
                          <CardDescription>{club.description || "No description"}</CardDescription>
                        </div>
                        <div className="flex items-center space-x-1 text-muted-foreground text-sm">
                          {club.isPrivate ? (
                            <>
                              <Shield className="h-4 w-4" />
                              <span>Private</span>
                            </>
                          ) : (
                            <>
                              <Globe className="h-4 w-4" />
                              <span>Public</span>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-4">
                        <UserCircle className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">You are an admin</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Created {new Date(club.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="default"
                          className="flex-1"
                          onClick={() => setLocation(`/club/${club.id}`)}
                        >
                          View Club
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setLocation(`/club-management/${club.id}`)}
                        >
                          Manage
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
                
                <Card className="border-dashed border-2 flex flex-col items-center justify-center p-6">
                  <div className="text-center">
                    <Plus className="h-8 w-8 mx-auto mb-2 text-primary/60" />
                    <h3 className="font-medium mb-1">Create New Club</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start a new club for your team or community
                    </p>
                    <Button onClick={() => setIsCreateClubOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Club
                    </Button>
                  </div>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="discover" id="discover-tab">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingAllClubs ? (
              <Card className="col-span-full text-center py-8">
                <CardContent>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted animate-pulse">
                    <Users className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="mt-6 text-xl font-medium">Loading clubs...</h3>
                </CardContent>
              </Card>
            ) : allClubsLoadError ? (
              <Card className="col-span-full text-center py-8 border-destructive">
                <CardContent>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                    <Shield className="h-10 w-10 text-destructive" />
                  </div>
                  <h3 className="mt-6 text-xl font-medium">Error loading clubs</h3>
                  <p className="mt-2 text-muted-foreground">{allClubsLoadError}</p>
                  <Button 
                    className="mt-4"
                    onClick={() => window.location.reload()}
                    variant="outline"
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : allClubs.length === 0 ? (
              <Card className="col-span-full text-center py-8">
                <CardContent>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <Globe className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="mt-6 text-xl font-medium">No clubs available</h3>
                  <p className="mt-2 text-muted-foreground">
                    Be the first to create a club and invite others to join.
                  </p>
                  <Button 
                    className="mt-4"
                    onClick={() => setIsCreateClubOpen(true)}
                  >
                    Create a Club
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {allClubs.map((club: any) => (
                  <Card key={club.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{club.name}</CardTitle>
                          <CardDescription>{club.description || "No description"}</CardDescription>
                        </div>
                        <div className="flex items-center space-x-1 text-muted-foreground text-sm">
                          {club.isPrivate ? (
                            <>
                              <Shield className="h-4 w-4" />
                              <span>Private</span>
                            </>
                          ) : (
                            <>
                              <Globe className="h-4 w-4" />
                              <span>Public</span>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-4">
                        <UserCircle className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Admin: {clubAdmins[club.id] || "Unknown"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Created {new Date(club.createdAt).toLocaleDateString()}
                        {club.isPremium && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                            Premium
                          </span>
                        )}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full"
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/clubs/${club.id}/join`, {
                              method: 'POST',
                              credentials: 'include',
                              headers: {
                                'Content-Type': 'application/json'
                              }
                            });
                            
                            if (!response.ok) {
                              const errorText = await response.text();
                              throw new Error(errorText || 'Failed to join club');
                            }
                            
                            toast({
                              title: club.isPrivate ? "Request Sent" : "Joined Successfully",
                              description: club.isPrivate 
                                ? "Your request to join has been sent to the club admin" 
                                : `You have joined ${club.name}`,
                            });
                            
                            // Refresh the page after joining
                            window.location.reload();
                          } catch (err: any) {
                            toast({
                              title: "Error",
                              description: err?.message || "Failed to join club",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        {club.isPrivate ? "Request to Join" : "Join Club"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}