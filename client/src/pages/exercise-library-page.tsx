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
import { Plus, Upload, Youtube, Share2, Play, Trash2, ExternalLink, MoreVertical, Grid3X3, List } from "lucide-react";
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

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getThumbnail = (exercise: ExerciseLibraryItem) => {
    if (exercise.type === 'youtube' && exercise.thumbnailUrl) {
      return exercise.thumbnailUrl;
    }
    if (exercise.type === 'upload' && exercise.mimeType?.startsWith('image/')) {
      return exercise.fileUrl;
    }
    return '/placeholder-video.jpg'; // You might want to add a default video thumbnail
  };

  return (
    <PageContainer
      breadcrumbs={[
        { name: "Tools", href: "/training-tools" },
        { name: "Exercise Library", href: "/tools/exercise-library" }
      ]}
    >
      <div className="space-y-6">
        {/* Header with Upload Button and View Toggle */}
        <div className="flex justify-between items-center">
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
            
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Video
              </Button>
            </DialogTrigger>
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
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" placeholder="Exercise name" required />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="Exercise description" />
                </div>
                
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input id="tags" name="tags" placeholder="warm-up, speed, technique" />
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
          </div>
        </div>

        {/* Exercise Grid */}
        {isLoading ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
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
                        src={getThumbnail(exercise) || '/placeholder-video.jpg'}
                        alt={exercise.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-video.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          size="sm"
                          onClick={() => openFullscreen(exercise)}
                        >
                          <Play className="h-4 w-4" />
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
                              size="sm"
                              variant="ghost"
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
                              <Share2 className="h-4 w-4 mr-2" />
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
            ) : (
              <div className="space-y-4">
                {libraryData.exercises.map((exercise: ExerciseLibraryItem) => (
                  <Card key={exercise.id} className="group hover:shadow-lg transition-shadow">
                    <div className="flex gap-4 p-4">
                      <div className="relative w-32 h-20 flex-shrink-0 overflow-hidden rounded-lg">
                        <img
                          src={getThumbnail(exercise) || '/placeholder-video.jpg'}
                          alt={exercise.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-video.jpg';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            size="sm"
                            onClick={() => openFullscreen(exercise)}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        </div>

                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold truncate flex-1">{exercise.name}</h3>
                          
                          {/* Action Dropdown - Always visible */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
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
                                <Share2 className="h-4 w-4 mr-2" />
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
                      </div>
                    </div>
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
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No exercises yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start building your exercise library by uploading videos or adding YouTube links
                </p>
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Exercise
                </Button>
              </div>
            </CardContent>
          </Card>
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