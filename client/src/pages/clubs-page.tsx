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
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// No need for context as we'll use window.location.reload() to refresh the clubs

export default function ClubsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateClubOpen, setIsCreateClubOpen] = useState(false);
  const [clubName, setClubName] = useState("");
  const [clubDescription, setClubDescription] = useState("");
  const [clubPrivacy, setClubPrivacy] = useState("public");
  const [isCreatingClub, setIsCreatingClub] = useState(false);
  
  // State for clubs
  const [clubs, setClubs] = useState<any[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [clubLoadError, setClubLoadError] = useState<string | null>(null);
  
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
  
  // Fetch user's clubs
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
                        <span className="text-sm text-muted-foreground">You are an admin</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Created {new Date(club.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full"
                        onClick={() => window.location.href = `/club-management/${club.id}`}
                      >
                        Manage Club
                      </Button>
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
            {/* Example club cards */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Track Stars Academy</CardTitle>
                    <CardDescription>Elite training for sprinters and jumpers</CardDescription>
                  </div>
                  <div className="flex items-center space-x-1 text-muted-foreground text-sm">
                    <Globe className="h-4 w-4" />
                    <span>Public</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <UserCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">142 members</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Join our community of dedicated athletes focused on sprint events and jumps. 
                  Weekly training plans and expert coaching available.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Join Club</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Distance Runners Guild</CardTitle>
                    <CardDescription>For cross country and distance events</CardDescription>
                  </div>
                  <div className="flex items-center space-x-1 text-muted-foreground text-sm">
                    <Globe className="h-4 w-4" />
                    <span>Public</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <UserCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">98 members</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Community for endurance athletes specializing in 800m and up.
                  Share training routes, compare race strategies, and support each other.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Join Club</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Field Event Specialists</CardTitle>
                    <CardDescription>Throws, jumps, and combined events</CardDescription>
                  </div>
                  <div className="flex items-center space-x-1 text-muted-foreground text-sm">
                    <Shield className="h-4 w-4" />
                    <span>Private</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <UserCircle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">67 members</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Exclusive group for serious field event athletes. 
                  Technical coaching, video analysis, and competition preparation.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Request to Join</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// CreateClubDialog component 
function CreateClubDialog() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Create form with default values
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      isPrivate: false
    },
    resolver: zodResolver(z.object({
      name: z.string().min(1, "Club name is required"),
      description: z.string().optional(),
      isPrivate: z.boolean().default(false)
    }))
  });
  
  const handleCreateClub = async (values: any) => {
    try {
      setIsLoading(true);
      
      const response = await fetch("/api/clubs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please login to create a club");
        }
        
        const errorData = await response.json().catch(() => null);
        if (errorData?.error) {
          throw new Error(errorData.error);
        }
        
        throw new Error("Failed to create club");
      }
      
      const club = await response.json();
      
      // Club created successfully
      toast({
        title: "Club created",
        description: `${values.name} club was created successfully`,
      });
      
      // Close dialog and reset form
      setIsOpen(false);
      form.reset();
      
      // Refresh the page to show updated clubs
      window.location.reload();
    } catch (err: any) {
      toast({
        title: "Error creating club",
        description: err?.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="mt-4">
          <Plus className="h-4 w-4 mr-2" />
          Create a Club
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Club</DialogTitle>
          <DialogDescription>
            Create a club to collaborate with athletes and coaches.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateClub)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Club Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter club name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe what this club is about" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Briefly explain the purpose of this club
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isPrivate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Make this club private</FormLabel>
                    <FormDescription>
                      Private clubs are only visible to members
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Group"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Protected route wrapper
export function Component() {
  return (
    <ProtectedRoute path="/clubs" component={ClubsPage} />
  );
}