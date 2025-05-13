import { ProtectedRoute } from "@/lib/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Globe, Shield, Plus, MessagesSquare, UserCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// No need for context as we'll use window.location.reload() to refresh the groups

export default function ClubsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateClubOpen, setIsCreateClubOpen] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [groupLoadError, setGroupLoadError] = useState<string | null>(null);
  
  // Fetch user's groups
  useEffect(() => {
    // Only fetch groups if user is authenticated
    if (!user) {
      return;
    }
    
    const fetchGroups = async () => {
      try {
        setIsLoadingGroups(true);
        const response = await fetch('/api/groups', {
          credentials: 'include', // Important for sending cookies with the request
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            // Handle unauthorized - should redirect to login
            toast({
              title: "Authentication required",
              description: "Please login to view your groups",
              variant: "destructive"
            });
            return;
          }
          
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to fetch groups');
        }
        
        const data = await response.json();
        setGroups(data);
      } catch (err: any) {
        console.error('Error fetching groups:', err);
        setGroupLoadError(err?.message || 'An error occurred while fetching groups');
        
        toast({
          title: "Error loading groups",
          description: err?.message || 'An error occurred while fetching groups',
          variant: "destructive"
        });
      } finally {
        setIsLoadingGroups(false);
      }
    };
    
    fetchGroups();
  }, [toast, user]);

  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
      <PageHeader
        title="Clubs & Groups"
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
                  <Input id="name" placeholder="Enter club name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Describe your club" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="privacy">Privacy</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="public">Public - Anyone can join</option>
                    <option value="private">Private - Approval required</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateClubOpen(false)}>Cancel</Button>
                <Button type="submit">Create Club</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs defaultValue="my-clubs" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="my-clubs">My Clubs</TabsTrigger>
          <TabsTrigger value="groups">My Groups</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>

        <TabsContent value="my-clubs">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Empty state */}
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
          </div>
        </TabsContent>

        <TabsContent value="groups">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingGroups ? (
              <Card className="col-span-full text-center py-8">
                <CardContent>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted animate-pulse">
                    <MessagesSquare className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="mt-6 text-xl font-medium">Loading groups...</h3>
                </CardContent>
              </Card>
            ) : groupLoadError ? (
              <Card className="col-span-full text-center py-8 border-destructive">
                <CardContent>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                    <Shield className="h-10 w-10 text-destructive" />
                  </div>
                  <h3 className="mt-6 text-xl font-medium">Error loading groups</h3>
                  <p className="mt-2 text-muted-foreground">{groupLoadError}</p>
                  <Button 
                    className="mt-4"
                    onClick={() => window.location.reload()}
                    variant="outline"
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : groups.length === 0 ? (
              <Card className="col-span-full text-center py-8">
                <CardContent>
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <MessagesSquare className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="mt-6 text-xl font-medium">No group chats yet</h3>
                  <p className="mt-2 text-muted-foreground">
                    Groups let you chat with specific sets of athletes and coaches.
                  </p>
                  <CreateGroupDialog />
                </CardContent>
              </Card>
            ) : (
              <>
                {groups.map((group) => (
                  <Card key={group.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{group.name}</CardTitle>
                          <CardDescription>{group.description || "No description"}</CardDescription>
                        </div>
                        <div className="flex items-center space-x-1 text-muted-foreground text-sm">
                          {group.isPrivate ? (
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
                      <p className="text-sm text-muted-foreground mb-4">
                        Created {new Date(group.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full">
                        <MessagesSquare className="h-4 w-4 mr-2" />
                        Open Chat
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
                
                <Card className="border-dashed border-2 flex flex-col items-center justify-center p-6">
                  <div className="text-center">
                    <Plus className="h-8 w-8 mx-auto mb-2 text-primary/60" />
                    <h3 className="font-medium mb-1">Create New Group</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add a new chat group for your team
                    </p>
                    <CreateGroupDialog />
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

// CreateGroupDialog component
function CreateGroupDialog() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleCreateGroup = async () => {
    if (!name) {
      setError("Group name is required");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // Important for authentication
        body: JSON.stringify({
          name,
          description,
          isPrivate
        }),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Authentication required",
            description: "Please login to create a group",
            variant: "destructive"
          });
          return;
        }
        
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create group");
      }
      
      // Group created successfully
      toast({
        title: "Group created",
        description: `${name} group was created successfully`,
      });
      
      setIsOpen(false);
      setName("");
      setDescription("");
      setIsPrivate(false);
      
      // Refresh the groups list without reloading the page
      const groupsResponse = await fetch('/api/groups', {
        credentials: 'include',
      });
      
      if (groupsResponse.ok) {
        const newGroups = await groupsResponse.json();
        // Refresh the page to show updated groups
        window.location.reload();
      } else {
        // Fallback to reload if refresh fails
        window.location.reload();
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred");
      toast({
        title: "Error creating group",
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
          Create a Group
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Group</DialogTitle>
          <DialogDescription>
            Create a group to chat with specific athletes and coaches.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Group Name</Label>
            <Input 
              id="name" 
              placeholder="Enter group name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Describe your group" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="privacy" 
              checked={isPrivate}
              onCheckedChange={(checked) => setIsPrivate(!!checked)}
            />
            <Label htmlFor="privacy" className="cursor-pointer">
              Private Group (invite only)
            </Label>
          </div>
          {error && (
            <div className="text-destructive text-sm">{error}</div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateGroup} 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="mr-2">Creating...</span>
                <span className="animate-spin">⏳</span>
              </>
            ) : "Create Group"}
          </Button>
        </DialogFooter>
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