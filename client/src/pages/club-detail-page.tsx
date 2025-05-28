import { useState, useEffect, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";
import { ProtectedRoute } from "@/lib/protected-route";
import {
  Loader2,
  ArrowLeft,
  UserPlus,
  Settings,
  MessageSquare,
  Users,
  ImageIcon,
  SquarePen,
  Check
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
const defaultProfileImage = "/default-profile.png";
import { Separator } from "@/components/ui/separator";

export function Component() {
  const [, params] = useRoute<{ id: string }>("/club/:id");
  const clubId = params?.id ? parseInt(params.id) : null;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Club state
  const [club, setClub] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Member states
  const [members, setMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  
  // Chat states
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [membership, setMembership] = useState<any>(null);
  
  // Image edit states
  const [isEditingLogo, setIsEditingLogo] = useState(false);
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<{logo: boolean, banner: boolean}>({ logo: false, banner: false });
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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
        
        // Find the current user's membership
        const userMembership = membersData.find((member: any) => member.userId === user.id);
        setMembership(userMembership);
      } catch (err: any) {
        console.error('Error fetching club members:', err);
      } finally {
        setIsLoadingMembers(false);
      }
    };
    
    fetchClubMembers();
  }, [clubId, user]);
  
  // Fetch group messages (if user is a member)
  useEffect(() => {
    if (!clubId || !user || !membership) return;
    
    const fetchMessages = async () => {
      try {
        setIsLoadingMessages(true);
        const response = await fetch(`/api/clubs/${clubId}/messages`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            return; // Already handled
          }
          
          throw new Error(`Failed to fetch messages: ${response.status}`);
        }
        
        const messagesData = await response.json();
        setMessages(messagesData || []);
      } catch (err: any) {
        console.error('Error fetching messages:', err);
        // Don't show errors for messages as it might just be feature not enabled
      } finally {
        setIsLoadingMessages(false);
      }
    };
    
    fetchMessages();
  }, [clubId, user, membership]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    setIsSendingMessage(true);
    
    try {
      const response = await fetch(`/api/clubs/${clubId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          content: newMessage
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      
      const message = await response.json();
      setMessages(prev => [...prev, message]);
      setNewMessage("");
    } catch (err: any) {
      toast({
        title: "Error sending message",
        description: err?.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSendingMessage(false);
    }
  };
  
  // Handle file uploads
  const handleFileUpload = async (fileType: 'logo' | 'banner', file: File): Promise<string | null> => {
    if (!file) return null;
    
    // Update loading state for the specific upload type
    setIsUploading(prev => ({ ...prev, [fileType]: true }));
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: `File too large`,
        description: `${fileType === 'logo' ? 'Logo' : 'Banner'} image must be less than 2MB`,
        variant: "destructive"
      });
      setIsUploading(prev => ({ ...prev, [fileType]: false }));
      return null;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      setIsUploading(prev => ({ ...prev, [fileType]: false }));
      return null;
    }
    
    try {
      toast({
        title: `Uploading ${fileType}`,
        description: "Please wait while we process your image...",
      });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);
      
      const response = await fetch(`/api/clubs/${clubId}/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Authentication required",
            description: "Please login to upload images",
            variant: "destructive"
          });
          return null;
        }
        
        if (response.status === 403) {
          toast({
            title: "Permission denied",
            description: "Only club administrators can change club images",
            variant: "destructive"
          });
          return null;
        }
        
        const errorText = await response.text();
        throw new Error(errorText || `Failed to upload ${fileType}`);
      }
      
      const data = await response.json();
      
      toast({
        title: `${fileType === 'logo' ? 'Logo' : 'Banner'} uploaded`,
        description: "Your image has been uploaded successfully",
      });
      
      return data.fileUrl;
    } catch (err: any) {
      console.error(`Error uploading ${fileType}:`, err);
      toast({
        title: `Error uploading ${fileType}`,
        description: err?.message || "An error occurred",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(prev => ({ ...prev, [fileType]: false }));
    }
  };
  
  // Handle logo change
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      
      // Upload immediately
      const uploadedUrl = await handleFileUpload('logo', file);
      if (uploadedUrl) {
        // Update club in state
        setClub({
          ...club,
          logoUrl: uploadedUrl
        });
        
        // Close dialog
        setIsEditingLogo(false);
      }
    }
  };
  
  // Handle banner change
  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      
      // Upload immediately
      const uploadedUrl = await handleFileUpload('banner', file);
      if (uploadedUrl) {
        // Update club in state
        setClub({
          ...club,
          bannerUrl: uploadedUrl
        });
        
        // Close dialog
        setIsEditingBanner(false);
      }
    }
  };

  // Handle join club
  const handleJoinClub = async () => {
    try {
      const response = await fetch(`/api/clubs/${clubId}/request`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Authentication required",
            description: "Please login to request membership",
            variant: "destructive"
          });
          return;
        }
        
        const errorText = await response.text();
        throw new Error(errorText || "Failed to request membership");
      }
      
      toast({
        title: "Membership requested",
        description: club.isPrivate 
          ? "Your request is pending approval from an admin" 
          : "You have joined the club"
      });
      
      // Refresh the page to update membership status
      window.location.reload();
    } catch (err: any) {
      toast({
        title: "Error joining club",
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
                View All Clubs
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-8 md:pt-8 md:pl-72 pb-20">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => setLocation("/clubs")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Clubs
        </Button>
      </div>
      
      {/* Club Banner */}
      <div className="relative mb-8">
        <div className="relative group h-48 md:h-64 rounded-lg overflow-hidden bg-muted">
          {club.bannerUrl ? (
            <img 
              src={club.bannerUrl} 
              alt={`${club.name} banner`} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30">
              <span className="text-2xl font-bold text-primary/50">{club.name}</span>
            </div>
          )}
          
          {/* Edit Banner Button - only for admins */}
          {membership?.role === 'admin' && (
            <Button
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
              onClick={() => setIsEditingBanner(true)}
            >
              <SquarePen className="h-4 w-4 mr-2" />
              Edit Banner
            </Button>
          )}
        </div>
        
        <div className="absolute -bottom-6 left-8 flex items-end">
          <div className="relative group w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-background overflow-hidden bg-muted">
            {club.logoUrl ? (
              <img 
                src={club.logoUrl} 
                alt={`${club.name} logo`}
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/20">
                <span className="text-xl font-bold text-primary">{club.name.charAt(0)}</span>
              </div>
            )}
            
            {/* Edit Logo Button - only for admins */}
            {membership?.role === 'admin' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  size="sm"
                  variant="secondary"
                  className="opacity-0 group-hover:opacity-90 transition-opacity flex items-center justify-center z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingLogo(true);
                  }}
                >
                  <SquarePen className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="absolute bottom-4 right-4 flex gap-2" style={{ zIndex: 20 }}>
          {membership ? (
            <Button 
              variant="secondary"
              size="sm"
              onClick={() => setLocation(`/club-management/${clubId}`)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {membership.role === 'admin' ? 'Manage Club' : 'Settings'}
            </Button>
          ) : (
            <Button 
              onClick={handleJoinClub}
              size="sm"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {club.isPrivate ? 'Request to Join' : 'Join Club'}
            </Button>
          )}
        </div>
      </div>
      
      <div className="mt-10 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{club.name}</h1>
          {club.description && (
            <p className="mt-2 text-muted-foreground">{club.description}</p>
          )}
          
          <div className="flex items-center mt-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              <span>{members.length} {members.length === 1 ? 'member' : 'members'}</span>
            </div>
            <span className="mx-2">•</span>
            <div>
              {club.isPrivate ? 'Private club' : 'Public club'}
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="chat">
          <TabsList className="mb-4">
            <TabsTrigger value="chat">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="h-4 w-4 mr-2" />
              Members
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="p-0">
            {!membership ? (
              <Card>
                <CardHeader>
                  <CardTitle>Club Chat</CardTitle>
                  <CardDescription>Join the club to participate in discussions</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground opacity-20" />
                  <p className="mt-4">You need to be a member to view and send messages</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={handleJoinClub}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {club.isPrivate ? 'Request to Join' : 'Join Club'}
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Club Chat</CardTitle>
                  <CardDescription>Discuss with other club members</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] overflow-y-auto flex flex-col space-y-4 p-4 border rounded-md mb-4">
                    {isLoadingMessages ? (
                      <div className="h-full flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <MessageSquare className="h-12 w-12 text-muted-foreground opacity-20 mb-3" />
                        <p className="text-muted-foreground">No messages yet</p>
                        <p className="text-sm text-muted-foreground">Be the first to start a conversation!</p>
                      </div>
                    ) : (
                      <>
                        {messages.map((message: any) => (
                          <div 
                            key={message.id}
                            className={`flex ${message.userId === user?.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex ${message.userId === user?.id ? 'flex-row-reverse' : 'flex-row'} max-w-[80%] gap-2`}>
                              <Avatar className="h-8 w-8 rounded-[5px]">
                                <AvatarImage src={defaultProfileImage} className="object-cover" />
                                <AvatarFallback className="rounded-[5px]">{message.username?.[0] || 'U'}</AvatarFallback>
                              </Avatar>
                              <div className={`
                                rounded-lg p-3 
                                ${message.userId === user?.id 
                                  ? 'bg-primary text-primary-foreground rounded-tr-none' 
                                  : 'bg-muted rounded-tl-none'}
                              `}>
                                <div className="flex items-center gap-2 mb-1">
                                  <p className={`text-xs ${message.userId === user?.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                    {message.username || 'Unknown user'}
                                  </p>
                                  <span className={`text-xs ${message.userId === user?.id ? 'text-primary-foreground/60' : 'text-muted-foreground/60'}`}>
                                    {new Date(message.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <p className="break-words">{message.content}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>
                  
                  {!club.isPremium && membership?.role !== 'admin' ? (
                    <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-semibold">Premium Feature</p>
                        <p>Chat is available to club owners and members of premium clubs.</p>
                      </div>
                    </div>
                  ) : null}
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={isSendingMessage || (!club.isPremium && membership?.role !== 'admin')}
                    />
                    <Button 
                      type="submit" 
                      disabled={isSendingMessage || !newMessage.trim() || (!club.isPremium && membership?.role !== 'admin')}
                    >
                      {isSendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Send"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Club Members</CardTitle>
                <CardDescription>People in this club</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMembers ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading members...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Admins */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Admins</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {members
                          .filter(member => member.role === 'admin')
                          .map(member => (
                            <div key={member.id} className="flex items-center space-x-3 p-3 rounded-md bg-muted/50">
                              <Avatar>
                                <AvatarFallback>{member.username?.[0] || 'U'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{member.username || 'Unknown user'}</p>
                                <p className="text-xs text-muted-foreground">Admin</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                    
                    {/* Members */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">Members</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {members
                          .filter(member => member.role === 'member')
                          .map(member => (
                            <div key={member.id} className="flex items-center space-x-3 p-3 rounded-md bg-muted/50">
                              <Avatar>
                                <AvatarFallback>{member.username?.[0] || 'U'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{member.username || 'Unknown user'}</p>
                                <p className="text-xs text-muted-foreground">Member</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                    
                    {/* Pending Members (only show for admins) */}
                    {membership?.role === 'admin' && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Pending Approval</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {members
                            .filter(member => member.role === 'pending')
                            .map(member => (
                              <div key={member.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                                <div className="flex items-center space-x-3">
                                  <Avatar>
                                    <AvatarFallback>{member.username?.[0] || 'U'}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{member.username || 'Unknown user'}</p>
                                    <p className="text-xs text-muted-foreground">Pending approval</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline">Approve</Button>
                                  <Button size="sm" variant="destructive">Decline</Button>
                                </div>
                              </div>
                            ))}
                            
                            {members.filter(member => member.role === 'pending').length === 0 && (
                              <p className="text-sm text-muted-foreground col-span-2">No pending membership requests</p>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Logo Edit Dialog */}
      <Dialog open={isEditingLogo} onOpenChange={setIsEditingLogo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Club Logo</DialogTitle>
            <DialogDescription>
              Upload a new logo for your club. Square images work best.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {club.logoUrl && (
              <div className="flex justify-center mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden border">
                  <img 
                    src={club.logoUrl} 
                    alt={`${club.name} current logo`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            
            <div className="grid gap-2">
              <label htmlFor="logo-upload" className="text-sm font-medium">
                Select a new logo
              </label>
              <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                disabled={isUploading.logo}
              />
              <p className="text-xs text-muted-foreground">
                Recommended square image up to 2MB
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditingLogo(false)}
              disabled={isUploading.logo}
            >
              Cancel
            </Button>
            {isUploading.logo && (
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Banner Edit Dialog */}
      <Dialog open={isEditingBanner} onOpenChange={setIsEditingBanner}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Club Banner</DialogTitle>
            <DialogDescription>
              Upload a new banner for your club. Wide images work best.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {club.bannerUrl && (
              <div className="flex justify-center mb-4">
                <div className="w-full h-40 rounded-md overflow-hidden border">
                  <img 
                    src={club.bannerUrl} 
                    alt={`${club.name} current banner`} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            
            <div className="grid gap-2">
              <label htmlFor="banner-upload" className="text-sm font-medium">
                Select a new banner
              </label>
              <Input
                id="banner-upload"
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                disabled={isUploading.banner}
              />
              <p className="text-xs text-muted-foreground">
                Recommended size: 1200x300px (max 2MB)
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditingBanner(false)}
              disabled={isUploading.banner}
            >
              Cancel
            </Button>
            {isUploading.banner && (
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ClubDetailPage() {
  return (
    <ProtectedRoute path="/club/:id" component={Component} />
  );
}