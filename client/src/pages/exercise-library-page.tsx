import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PageContainer } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, Youtube, Send, Play, Trash2, ExternalLink, MoreVertical, Grid3X3, List, Copy, Check, Users, Lock, Crown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

interface ExerciseLibraryItem {
  id: number;
  name: string;
  description: string | null;
  type: 'upload' | 'youtube';
  fileUrl: string | null;
  youtubeUrl: string | null;
  youtubeVideoId: string | null;
  thumbnailUrl: string | null;
  fileSize: number | null;
  mimeType: string | null;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
}

interface LibraryLimits {
  uploads: {
    current: number;
    limit: number;
    canUpload: boolean;
  };
  youtube: {
    current: number;
    limit: number;
    canAdd: boolean;
  };
}

export default function ExerciseLibraryPage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseLibraryItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [fullscreenVideo, setFullscreenVideo] = useState<ExerciseLibraryItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [linkCopied, setLinkCopied] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [shareMessage, setShareMessage] = useState("");
  const [libraryShareDialogOpen, setLibraryShareDialogOpen] = useState(false);
  const [selectedLibraryRecipients, setSelectedLibraryRecipients] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch exercise library
  const { data: libraryData, isLoading } = useQuery({
    queryKey: ['/api/exercise-library', currentPage],
    queryFn: () => apiRequest('GET', `/api/exercise-library?page=${currentPage}`).then(res => res.json())
  });

  // Fetch library limits
  const { data: limits } = useQuery<LibraryLimits>({
    queryKey: ['/api/exercise-library/limits'],
    queryFn: () => apiRequest('GET', '/api/exercise-library/limits').then(res => res.json())
  });

  // Fetch connections and athletes for sharing
  const { data: shareContacts } = useQuery({
    queryKey: ['/api/share-contacts'],
    queryFn: () => apiRequest('GET', '/api/connections').then(res => res.json()),
    enabled: shareDialogOpen || libraryShareDialogOpen
  });

  // Fetch user data for subscription info
  const { data: userData } = useQuery({
    queryKey: ['/api/user'],
    queryFn: () => apiRequest('GET', '/api/user').then(res => res.json())
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/exercise-library/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exercise-library'] });
      queryClient.invalidateQueries({ queryKey: ['/api/exercise-library/limits'] });
      setUploadDialogOpen(false);
      toast({ title: "Success", description: "File uploaded successfully!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Upload Failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // YouTube mutation
  const youtubeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/exercise-library/youtube', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exercise-library'] });
      queryClient.invalidateQueries({ queryKey: ['/api/exercise-library/limits'] });
      setUploadDialogOpen(false);
      toast({ title: "Success", description: "YouTube video added successfully!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to Add Video", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (exerciseId: number) => {
      await apiRequest('DELETE', `/api/exercise-library/${exerciseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exercise-library'] });
      queryClient.invalidateQueries({ queryKey: ['/api/exercise-library/limits'] });
      toast({ title: "Success", description: "Exercise deleted successfully!" });
    },
    onError: () => {
      toast({ 
        title: "Delete Failed", 
        description: "Failed to delete exercise",
        variant: "destructive" 
      });
    }
  });

  // Share mutation for internal messaging
  const shareMutation = useMutation({
    mutationFn: async (data: { exerciseId: number; recipientIds: number[]; message: string }) => {
      const response = await apiRequest('POST', '/api/exercise-library/share', data);
      return response.json();
    },
    onSuccess: () => {
      setShareDialogOpen(false);
      setSelectedRecipients([]);
      setShareMessage("");
      toast({ title: "Success", description: "Exercise shared successfully!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Share Failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Library sharing mutation
  const libraryShareMutation = useMutation({
    mutationFn: async (data: { recipientIds: number[]; useSpikes?: boolean }) => {
      const response = await apiRequest('POST', '/api/exercise-library/share-library', data);
      return response.json();
    },
    onSuccess: () => {
      setLibraryShareDialogOpen(false);
      setSelectedLibraryRecipients([]);
      toast({ title: "Success", description: "Library access shared successfully!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Share Failed", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const youtubeUrl = formData.get('youtubeUrl') as string;
    const file = formData.get('file') as File;
    
    // Check if YouTube URL is provided
    if (youtubeUrl && youtubeUrl.trim()) {
      const data = {
        name: formData.get('name'),
        description: formData.get('description'),
        youtubeUrl: youtubeUrl.trim(),
        tags: formData.get('tags'),
        isPublic: formData.get('isPublic') === 'on'
      };
      youtubeMutation.mutate(data);
    } else if (file && file.size > 0) {
      // Handle file upload
      uploadMutation.mutate(formData);
    } else {
      toast({
        title: "Error",
        description: "Please provide either a file or YouTube URL",
        variant: "destructive"
      });
    }
  };

  const handleYouTube = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      youtubeUrl: formData.get('youtubeUrl'),
      tags: formData.get('tags'),
      isPublic: formData.get('isPublic') === 'on'
    };
    youtubeMutation.mutate(data);
  };

  const openFullscreen = (exercise: ExerciseLibraryItem) => {
    setFullscreenVideo(exercise);
  };

  const closeFullscreen = () => {
    setFullscreenVideo(null);
  };

  const copyExerciseLink = async (exerciseId: number) => {
    const link = `${window.location.origin}/exercise/${exerciseId}`;
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      toast({ title: "Success", description: "Link copied to clipboard!" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to copy link", variant: "destructive" });
    }
  };

  const handleShareInternal = () => {
    if (selectedExercise && selectedRecipients.length > 0) {
      shareMutation.mutate({
        exerciseId: selectedExercise.id,
        recipientIds: selectedRecipients,
        message: shareMessage
      });
    }
  };

  const handleLibraryShare = (useSpikes = false) => {
    if (selectedLibraryRecipients.length > 0) {
      libraryShareMutation.mutate({
        recipientIds: selectedLibraryRecipients,
        useSpikes
      });
    }
  };

  const getSubscriptionTier = () => {
    if (!userData) return 'free';
    if (userData.isPremium) return 'star';
    if (userData.isProUser) return 'pro';
    return 'free';
  };

  const canShareLibrary = () => {
    const tier = getSubscriptionTier();
    if (tier === 'pro' || tier === 'star') return true;
    return (userData?.spikes || 0) >= 100; // Free users need 100 spikes
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getThumbnail = (exercise: ExerciseLibraryItem) => {
    if (exercise.type === 'youtube' && exercise.thumbnailUrl) {
      return exercise.thumbnailUrl;
    }
    return '/placeholder-video.jpg';
  };

  return (
    <PageContainer
      breadcrumbs={[
        { name: "Tools", href: "/tools" },
        { name: "Exercise Library", href: "/tools/exercise-library" }
      ]}
    >
      <div className="space-y-6">
        {/* Header with Upload Button and View Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Exercise Library</h1>
            <p className="text-muted-foreground">
              Store and organize your training videos and exercises
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* View Toggle */}
            <div className="flex items-center border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-3"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Video
              </Button>

              <Button 
                variant="outline"
                onClick={() => setLibraryShareDialogOpen(true)}
                disabled={!canShareLibrary()}
                className="relative"
              >
                {getSubscriptionTier() === 'star' ? (
                  <Crown className="h-4 w-4 mr-2 text-yellow-500" />
                ) : getSubscriptionTier() === 'pro' ? (
                  <Users className="h-4 w-4 mr-2 text-blue-500" />
                ) : (
                  <Lock className="h-4 w-4 mr-2 text-gray-400" />
                )}
                Share Library
                {getSubscriptionTier() === 'free' && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    100 Spikes
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Video</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <Label htmlFor="file">Video/Image File</Label>
                <Input
                  id="file"
                  name="file"
                  type="file"
                  accept="video/*,image/*"
                  disabled={!limits?.uploads.canUpload}
                />
                {limits && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Usage: {limits.uploads.current}/{limits.uploads.limit === -1 ? '∞' : limits.uploads.limit}</span>
                    </div>
                    {limits.uploads.limit !== -1 && (
                      <Progress 
                        value={(limits.uploads.current / limits.uploads.limit) * 100} 
                        className="h-1 mt-1"
                      />
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="youtubeUrl">YouTube URL (Optional)</Label>
                <Input 
                  id="youtubeUrl" 
                  name="youtubeUrl" 
                  placeholder="https://www.youtube.com/watch?v=..."
                  type="url"
                />
                {limits && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>YouTube Usage: {limits.youtube.current}/{limits.youtube.limit === -1 ? '∞' : limits.youtube.limit}</span>
                    </div>
                    {limits.youtube.limit !== -1 && (
                      <Progress 
                        value={(limits.youtube.current / limits.youtube.limit) * 100} 
                        className="h-1 mt-1"
                      />
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="name">Exercise Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  required 
                  placeholder="e.g., Sprint intervals"
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  placeholder="Describe this exercise..."
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags (Optional)</Label>
                <Input 
                  id="tags" 
                  name="tags" 
                  placeholder="sprint, speed, intervals"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isPublic" name="isPublic" />
                <Label htmlFor="isPublic">Make public</Label>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? "Adding..." : "Add Exercise"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Share Exercise</DialogTitle>
            </DialogHeader>
            
            {selectedExercise && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Sharing: {selectedExercise.name}
                </div>
                
                <Tabs defaultValue="link" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="link">Copy Link</TabsTrigger>
                    <TabsTrigger value="internal">Send Message</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="link" className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Input 
                        value={`${window.location.origin}/exercise/${selectedExercise.id}`}
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => copyExerciseLink(selectedExercise.id)}
                        disabled={linkCopied}
                      >
                        {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="internal" className="space-y-4">
                    <div>
                      <Label>Send to Connections & Athletes</Label>
                      <div className="mt-2 max-h-32 overflow-y-auto space-y-2">
                        {shareContacts?.map((contact: any) => (
                          <div key={`share-${contact.id}`} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`share-contact-${contact.id}`}
                              checked={selectedRecipients.includes(contact.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRecipients(prev => [...prev, contact.id]);
                                } else {
                                  setSelectedRecipients(prev => prev.filter(id => id !== contact.id));
                                }
                              }}
                              className="rounded"
                            />
                            <label htmlFor={`share-contact-${contact.id}`} className="text-sm">
                              {contact.username}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="shareMessage">Message (Optional)</Label>
                      <Textarea
                        id="shareMessage"
                        value={shareMessage}
                        onChange={(e) => setShareMessage(e.target.value)}
                        placeholder="Add a message to share with this exercise..."
                        className="mt-1"
                      />
                    </div>
                    
                    <Button 
                      onClick={handleShareInternal}
                      disabled={selectedRecipients.length === 0 || shareMutation.isPending}
                      className="w-full"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {shareMutation.isPending ? "Sending..." : "Send Message"}
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Library Share Dialog - Simplified */}
        <Dialog open={libraryShareDialogOpen} onOpenChange={setLibraryShareDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getSubscriptionTier() === 'star' ? (
                  <Crown className="h-5 w-5 text-yellow-500" />
                ) : getSubscriptionTier() === 'pro' ? (
                  <Users className="h-5 w-5 text-blue-500" />
                ) : (
                  <Lock className="h-5 w-5 text-gray-400" />
                )}
                Share Full Library Access
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Subscription Status */}
              <div className="p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Your Plan:</span>
                  <Badge variant={getSubscriptionTier() === 'star' ? 'default' : getSubscriptionTier() === 'pro' ? 'secondary' : 'outline'}>
                    {getSubscriptionTier().toUpperCase()}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {getSubscriptionTier() === 'star' && "Unlimited library sharing"}
                  {getSubscriptionTier() === 'pro' && "Share with up to 10 people"}
                  {getSubscriptionTier() === 'free' && "Requires 100 Spikes to unlock sharing"}
                </div>
              </div>

              {/* Recipient Selection */}
              <div>
                <Label>Share with Connections & Athletes</Label>
                <div className="mt-2 max-h-32 overflow-y-auto space-y-2">
                  {shareContacts?.map((contact: any) => (
                    <div key={`library-${contact.id}`} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`library-share-contact-${contact.id}`}
                        checked={selectedLibraryRecipients.includes(contact.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLibraryRecipients(prev => [...prev, contact.id]);
                          } else {
                            setSelectedLibraryRecipients(prev => prev.filter(id => id !== contact.id));
                          }
                        }}
                        className="rounded"
                      />
                      <label htmlFor={`library-share-contact-${contact.id}`} className="text-sm">
                        {contact.username}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <Button 
                onClick={() => handleLibraryShare(getSubscriptionTier() === 'free')}
                disabled={selectedLibraryRecipients.length === 0 || libraryShareMutation.isPending}
                className="w-full"
              >
                <Users className="h-4 w-4 mr-2" />
                {libraryShareMutation.isPending ? "Sharing..." : 
                 getSubscriptionTier() === 'free' ? "Use 100 Spikes to Share" : "Share Library Access"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Exercise Grid */}
        {isLoading ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-4" : "space-y-4"}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted" />
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : libraryData?.exercises?.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-4">
                {libraryData.exercises.map((exercise: ExerciseLibraryItem) => (
                  <Card key={exercise.id} className="group hover:shadow-lg transition-shadow">
                    <div className="relative aspect-video overflow-hidden rounded-t-lg">
                      <img
                        src={getThumbnail(exercise)}
                        alt={exercise.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-video.jpg';
                        }}
                      />
                      
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openFullscreen(exercise)}
                          className="bg-white/90 hover:bg-white"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Play
                        </Button>
                      </div>

                    </div>
                    
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold truncate flex-1">{exercise.name}</h3>
                        
                        {/* Action Dropdown - Always visible */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 ml-2"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedExercise(exercise);
                                setShareDialogOpen(true);
                              }}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteMutation.mutate(exercise.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      {exercise.fileSize && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(exercise.fileSize)}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {libraryData.exercises.map((exercise: ExerciseLibraryItem) => (
                  <Card key={exercise.id} className="group hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-32 h-20 overflow-hidden rounded-lg flex-shrink-0">
                          <img
                            src={getThumbnail(exercise)}
                            alt={exercise.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-video.jpg';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => openFullscreen(exercise)}
                              className="bg-white/90 hover:bg-white p-2"
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{exercise.name}</h3>
                          {exercise.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {exercise.description}
                            </p>
                          )}
                          {exercise.fileSize && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(exercise.fileSize)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedExercise(exercise);
                                setShareDialogOpen(true);
                              }}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteMutation.mutate(exercise.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {libraryData.totalPages > 1 && (
              <div className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  Page {currentPage} of {libraryData.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(libraryData.totalPages, prev + 1))}
                  disabled={currentPage === libraryData.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-4" : "space-y-4"}>
            {/* Skeleton Card */}
            <Card className="opacity-50 border-dashed">
              <div className="relative aspect-video overflow-hidden rounded-t-lg bg-muted/50 flex items-center justify-center">
                <div className="text-center">
                  <Plus className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No videos yet</p>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="text-muted-foreground text-sm">Add your first video</div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setUploadDialogOpen(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Fullscreen Video Player */}
        {fullscreenVideo && (
          <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
            <div className="relative w-full h-full">
              <Button
                variant="ghost"
                size="sm"
                onClick={closeFullscreen}
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              >
                ✕
              </Button>
              
              {fullscreenVideo.type === 'youtube' ? (
                <iframe
                  src={`https://www.youtube.com/embed/${fullscreenVideo.youtubeVideoId}?autoplay=1`}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay"
                />
              ) : (
                <video
                  src={fullscreenVideo.fileUrl || undefined}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}