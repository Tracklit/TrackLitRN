import { useState, useEffect } from "react";
import { useLocation, useRoute, Link as WouterLink } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";
import { ProtectedRoute } from "@/lib/protected-route";
import { Loader2, Save, Users, UserPlus, Settings, ArrowLeft, Trash, Shield, Globe, LinkIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function ClubManagementPage() {
  const [, params] = useRoute<{ id: string }>("/club-management/:id");
  const clubId = params?.id ? parseInt(params.id) : null;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Club states
  const [club, setClub] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [clubName, setClubName] = useState("");
  const [clubDescription, setClubDescription] = useState("");
  const [clubPrivacy, setClubPrivacy] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Members state
  const [members, setMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);
  
  // Invite member dialog state
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  // Invite link state
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [showInviteLink, setShowInviteLink] = useState(false);
  
  // Delete club state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch club details
  useEffect(() => {
    if (!clubId || !user) return;
    
    const fetchClubDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/clubs/${clubId}`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            toast({
              title: "Authentication required",
              description: "Please login to view club details",
              variant: "destructive"
            });
            return;
          }
          if (response.status === 404) {
            setError("Club not found");
            return;
          }
          
          throw new Error(`Failed to fetch club: ${response.status}`);
        }
        
        const clubData = await response.json();
        setClub(clubData);
        
        // Initialize form fields with club data
        setClubName(clubData.name);
        setClubDescription(clubData.description || "");
        setClubPrivacy(clubData.isPrivate);
      } catch (err: any) {
        console.error('Error fetching club details:', err);
        setError(err?.message || 'An error occurred while fetching club details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClubDetails();
  }, [clubId, user, toast]);
  
  // Fetch club members
  useEffect(() => {
    if (!clubId || !user) return;
    
    const fetchClubMembers = async () => {
      try {
        setIsLoadingMembers(true);
        const response = await fetch(`/api/clubs/${clubId}/members`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            return; // Already handled by the club fetch
          }
          
          throw new Error(`Failed to fetch members: ${response.status}`);
        }
        
        const membersData = await response.json();
        setMembers(membersData);
      } catch (err: any) {
        console.error('Error fetching club members:', err);
        setMembersError(err?.message || 'An error occurred while fetching members');
      } finally {
        setIsLoadingMembers(false);
      }
    };
    
    fetchClubMembers();
  }, [clubId, user, toast]);
  
  // Handle club update
  const handleSaveClub = async () => {
    if (!clubName.trim()) {
      toast({
        title: "Error",
        description: "Club name is required",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/clubs/${clubId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: clubName,
          description: clubDescription,
          isPrivate: clubPrivacy
        }),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Authentication required",
            description: "Please login to update the club",
            variant: "destructive"
          });
          return;
        }
        
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update club");
      }
      
      const updatedClub = await response.json();
      setClub(updatedClub);
      
      toast({
        title: "Club updated",
        description: "Club details saved successfully",
      });
      
      setIsEditing(false);
    } catch (err: any) {
      toast({
        title: "Error updating club",
        description: err?.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle club deletion
  const handleDeleteClub = async () => {
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/clubs/${clubId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Authentication required",
            description: "Please login to delete the club",
            variant: "destructive"
          });
          return;
        }
        
        const errorText = await response.text();
        throw new Error(errorText || "Failed to delete club");
      }
      
      toast({
        title: "Club deleted",
        description: "Club has been permanently deleted",
      });
      
      // Redirect to clubs page
      setLocation("/clubs");
    } catch (err: any) {
      toast({
        title: "Error deleting club",
        description: err?.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Generate shareable invite link
  const generateInviteLink = async () => {
    if (!clubId) return;
    
    setIsGeneratingLink(true);
    
    try {
      const response = await fetch(`/api/clubs/${clubId}/generateInviteLink`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Authentication required",
            description: "Please login to generate an invite link",
            variant: "destructive"
          });
          return;
        }
        
        const errorText = await response.text();
        throw new Error(errorText || "Failed to generate invite link");
      }
      
      const data = await response.json();
      setInviteLink(data.inviteLink);
      setShowInviteLink(true);
      
      toast({
        title: "Invite link generated",
        description: "Share this link to invite members to your club",
      });
    } catch (err: any) {
      toast({
        title: "Error generating invite link",
        description: err?.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };
  
  // Handle member invitation
  const handleInviteMember = async () => {
    if (!inviteUsername.trim()) {
      toast({
        title: "Error",
        description: "Username is required",
        variant: "destructive"
      });
      return;
    }
    
    setIsInviting(true);
    
    try {
      const response = await fetch(`/api/clubs/${clubId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: inviteUsername,
        }),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Authentication required",
            description: "Please login to invite members",
            variant: "destructive"
          });
          return;
        }
        
        if (response.status === 404) {
          toast({
            title: "User not found",
            description: `No user found with username "${inviteUsername}"`,
            variant: "destructive"
          });
          return;
        }
        
        const errorText = await response.text();
        throw new Error(errorText || "Failed to invite member");
      }
      
      const newMember = await response.json();
      setMembers(prev => [...prev, newMember]);
      
      toast({
        title: "Member invited",
        description: `${inviteUsername} has been invited to the club`,
      });
      
      setInviteUsername("");
      setIsInviteDialogOpen(false);
    } catch (err: any) {
      toast({
        title: "Error inviting member",
        description: err?.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsInviting(false);
    }
  };
  
  // Handle member removal
  const handleRemoveMember = async (memberId: number) => {
    try {
      const response = await fetch(`/api/clubs/${clubId}/members/${memberId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Authentication required",
            description: "Please login to remove members",
            variant: "destructive"
          });
          return;
        }
        
        const errorText = await response.text();
        throw new Error(errorText || "Failed to remove member");
      }
      
      // Remove member from list
      setMembers(prev => prev.filter(member => member.id !== memberId));
      
      toast({
        title: "Member removed",
        description: "Member has been removed from the club",
      });
    } catch (err: any) {
      toast({
        title: "Error removing member",
        description: err?.message || "An error occurred",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <h3 className="mt-4 text-xl font-medium">Loading club details...</h3>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => setLocation("/clubs")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clubs
            </Button>
          </div>
          
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>There was a problem loading the club</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
            </CardContent>
            <CardFooter className="justify-center">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }
  
  if (!club) {
    return (
      <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => setLocation("/clubs")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clubs
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Club Not Found</CardTitle>
              <CardDescription>We couldn't find the club you're looking for</CardDescription>
            </CardHeader>
            <CardContent>
              <p>The club may have been deleted or you don't have access to it.</p>
            </CardContent>
            <CardFooter className="justify-center">
              <Button onClick={() => setLocation("/clubs")}>
                View Your Clubs
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => setLocation("/clubs")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clubs
        </Button>
      </div>
      
      <PageHeader
        title={club.name}
        description={club.description || "No description provided"}
        actions={
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveClub}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Edit Club
              </Button>
            )}
          </div>
        }
      />
      
      <Tabs defaultValue="members" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="members">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="col-span-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Club Members</CardTitle>
                    <CardDescription>Manage members of your club</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={generateInviteLink}
                      disabled={isGeneratingLink}
                    >
                      {isGeneratingLink ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Generate Link
                        </>
                      )}
                    </Button>
                    <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite a New Member</DialogTitle>
                          <DialogDescription>
                            Enter the username of the person you want to invite to your club.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                              id="username"
                              placeholder="Enter username"
                              value={inviteUsername}
                              onChange={(e) => setInviteUsername(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Cancel</Button>
                          <Button 
                            onClick={handleInviteMember}
                            disabled={isInviting}
                          >
                            {isInviting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Inviting...
                              </>
                            ) : (
                              "Invite Member"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {showInviteLink && inviteLink && (
                  <div className="mb-6 p-4 border rounded-lg bg-muted">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Invite Link</Label>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            navigator.clipboard.writeText(inviteLink);
                            toast({
                              title: "Copied to clipboard",
                              description: "The invite link has been copied to your clipboard"
                            });
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-background rounded border overflow-hidden">
                        <p className="text-sm truncate flex-1">{inviteLink}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This link can be used by anyone to join your club without approval. 
                        Generate a new link to revoke the old one.
                      </p>
                    </div>
                  </div>
                )}
                
                {isLoadingMembers ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2">Loading members...</p>
                  </div>
                ) : membersError ? (
                  <div className="text-center py-8 text-destructive">
                    <p>{membersError}</p>
                    <Button 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => window.location.reload()}
                    >
                      Try Again
                    </Button>
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="mt-2">No members yet</p>
                    <Button
                      className="mt-4"
                      onClick={() => setIsInviteDialogOpen(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite First Member
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div 
                        key={member.id} 
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{member.username || "Unknown User"}</p>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              {member.role === 'admin' ? (
                                <span className="flex items-center">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Admin
                                </span>
                              ) : (
                                <span>Member</span>
                              )}
                              {member.joinedAt && (
                                <span className="ml-2">
                                  • Joined {new Date(member.joinedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Don't allow removing themselves if they're the owner */}
                        {member.userId !== club.ownerId && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Club Details</CardTitle>
                <CardDescription>Update your club information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="club-name">Club Name</Label>
                    <Input
                      id="club-name"
                      placeholder="Enter club name"
                      value={clubName}
                      onChange={(e) => setClubName(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="club-description">Description</Label>
                    <Textarea
                      id="club-description"
                      placeholder="Describe your club"
                      value={clubDescription}
                      onChange={(e) => setClubDescription(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="club-privacy">Privacy</Label>
                    <select
                      id="club-privacy"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={clubPrivacy ? "private" : "public"}
                      onChange={(e) => setClubPrivacy(e.target.value === "private")}
                      disabled={!isEditing}
                    >
                      <option value="public">Public - Anyone can join</option>
                      <option value="private">Private - Approval required</option>
                    </select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveClub}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Edit Club
                  </Button>
                )}
              </CardFooter>
            </Card>
            
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions for your club</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-6">
                  Deleting your club will permanently remove all data associated with it, including member records, groups, and messages. This action cannot be undone.
                </p>
                
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash className="mr-2 h-4 w-4" />
                      Delete Club
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your club 
                        "{club.name}" and all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteClub}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Yes, delete club"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Protected route wrapper
export function Component() {
  return (
    <ProtectedRoute path="/club-management/:id" component={ClubManagementPage} />
  );
}