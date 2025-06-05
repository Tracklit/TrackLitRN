import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PageContainer } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Send, Play, Trash2, ExternalLink, MoreVertical, Grid3X3, List, Copy, Check, Users, Lock, Crown } from "lucide-react";
import { Link } from "wouter";
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

  // Fetch user data
  const { data: userData } = useQuery({
    queryKey: ['/api/user'],
    queryFn: () => apiRequest('GET', '/api/user').then(res => res.json())
  });

  // Fetch contacts for sharing
  const { data: shareContacts } = useQuery({
    queryKey: ['/api/friends'],
    queryFn: () => apiRequest('GET', '/api/friends').then(res => res.json())
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

  // Share mutation
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
    if ((userData as any).isPremium) return 'star';
    if ((userData as any).isProUser) return 'pro';
    return 'free';
  };

  const canShareLibrary = () => {
    const tier = getSubscriptionTier();
    if (tier === 'pro' || tier === 'star') return true;
    return ((userData as any)?.spikes || 0) >= 100; // Free users need 100 spikes
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
              <Link href="/tools/exercise-library/add">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Video
                </Button>
              </Link>

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
                      
                      <div className="absolute inset-0 bg-black/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          size="sm"
                          onClick={() => openFullscreen(exercise)}
                          className="bg-red-600 md:hover:bg-red-700 text-white border-red-600 h-8 w-8 p-0"
                        >
                          <Play className="h-3 w-3 fill-white" />
                        </Button>
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold truncate flex-1">{exercise.name}</h3>
                        
                        {/* Action Dropdown */}
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
                          <div className="absolute inset-0 bg-black/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              size="sm"
                              onClick={() => openFullscreen(exercise)}
                              className="bg-red-600 md:hover:bg-red-700 text-white border-red-600 h-6 w-6 p-0"
                            >
                              <Play className="h-2.5 w-2.5 fill-white" />
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
          </>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
              <Play className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No exercises yet</h3>
            <p className="text-muted-foreground mb-4">
              Start building your exercise library by uploading videos or adding YouTube links
            </p>
            <Link href="/tools/exercise-library/add">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Video
              </Button>
            </Link>
          </div>
        )}

        {/* Custom Share Modal */}
        {shareDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShareDialogOpen(false)}
            />
            
            {/* Modal Content */}
            <div className="relative bg-[#010a18] border border-gray-700 rounded-lg shadow-xl max-w-md w-full max-h-[85vh] overflow-y-auto">
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Share Exercise</h2>
                  <button
                    onClick={() => setShareDialogOpen(false)}
                    className="text-gray-400 hover:text-white text-xl leading-none"
                  >
                    ×
                  </button>
                </div>
                
                {selectedExercise && (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-400">
                      Sharing: {selectedExercise.name}
                    </div>
                    
                    <Tabs defaultValue="link" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                        <TabsTrigger 
                          value="link" 
                          className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-blue-600"
                        >
                          Copy Link
                        </TabsTrigger>
                        <TabsTrigger 
                          value="internal" 
                          className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-blue-600"
                        >
                          Send Message
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="link" className="mt-4 space-y-3">
                        <div className="flex gap-2">
                          <Input
                            value={`${window.location.origin}/exercise/${selectedExercise.id}`}
                            readOnly
                            className="bg-gray-800 border-gray-600 text-white"
                          />
                          <Button
                            onClick={() => copyExerciseLink(selectedExercise.id)}
                            variant="outline"
                            size="sm"
                            className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700"
                          >
                            {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="internal" className="mt-4 space-y-4">
                        <div>
                          <Label className="text-white">Send to Connections & Athletes</Label>
                          <div className="mt-2 max-h-32 overflow-y-auto space-y-2 bg-gray-800 rounded-md p-2">
                            {shareContacts?.map((contact: any) => (
                              <div key={contact.id} className="flex items-center space-x-2">
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
                                <label htmlFor={`share-contact-${contact.id}`} className="text-sm text-gray-300">
                                  {contact.username}
                                </label>
                              </div>
                            ))}
                          </div>
                          
                          {selectedRecipients.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs text-gray-400 mb-1">Selected ({selectedRecipients.length}):</div>
                              <div className="flex flex-wrap gap-1">
                                {selectedRecipients.map(recipientId => {
                                  const recipient = shareContacts?.find((c: any) => c.id === recipientId);
                                  return recipient ? (
                                    <span key={recipientId} className="bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                                      {recipient.name || recipient.username}
                                      <button 
                                        onClick={() => setSelectedRecipients(prev => prev.filter(id => id !== recipientId))}
                                        className="text-blue-200 hover:text-white"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor="shareMessage" className="text-white">Message (Optional)</Label>
                          <Textarea
                            id="shareMessage"
                            value={shareMessage}
                            onChange={(e) => setShareMessage(e.target.value)}
                            placeholder="Add a message to share with this exercise..."
                            className="mt-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                          />
                        </div>
                        
                        <Button 
                          onClick={handleShareInternal}
                          disabled={selectedRecipients.length === 0 || shareMutation.isPending}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {shareMutation.isPending ? "Sending..." : "Send Exercise"}
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </div>
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
                className="absolute top-4 left-4 z-10 text-white hover:bg-white/20"
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