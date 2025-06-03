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
import { Plus, Upload, Youtube, Share2, Play, Trash2, ExternalLink } from "lucide-react";
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
      setYoutubeDialogOpen(false);
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
    uploadMutation.mutate(formData);
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
        { label: "Tools", href: "/tools" },
        { label: "Exercise Library" }
      ]}
    >
      <div className="space-y-6">
        {/* Header with Upload Button */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Exercise Library</h1>
            <p className="text-muted-foreground">
              Store and organize your training videos and exercises
            </p>
          </div>
          
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Exercise
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Exercise</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="youtube" className="flex items-center gap-2">
                    <Youtube className="h-4 w-4" />
                    YouTube
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="space-y-4">
                  <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                      <Label htmlFor="file">Video/Image File</Label>
                      <Input
                        id="file"
                        name="file"
                        type="file"
                        accept="video/*,image/*"
                        required
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
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" name="name" placeholder="Exercise name" />
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
                      disabled={uploadMutation.isPending || !limits?.uploads.canUpload}
                    >
                      {uploadMutation.isPending ? "Uploading..." : "Upload"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="youtube" className="space-y-4">
                  <form onSubmit={handleYouTube} className="space-y-4">
                    <div>
                      <Label htmlFor="youtubeUrl">YouTube URL</Label>
                      <Input
                        id="youtubeUrl"
                        name="youtubeUrl"
                        placeholder="https://www.youtube.com/watch?v=..."
                        required
                        disabled={!limits?.youtube.canAdd}
                      />
                      {limits && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Usage: {limits.youtube.current}/{limits.youtube.limit === -1 ? '∞' : limits.youtube.limit}</span>
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
                      <Input id="name" name="name" placeholder="Exercise name" />
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
                      disabled={youtubeMutation.isPending || !limits?.youtube.canAdd}
                    >
                      {youtubeMutation.isPending ? "Adding..." : "Add YouTube Video"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        {/* Exercise Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {libraryData.exercises.map((exercise: ExerciseLibraryItem) => (
                <Card key={exercise.id} className="group hover:shadow-lg transition-shadow">
                  <div className="relative aspect-video overflow-hidden rounded-t-lg">
                    <img
                      src={getThumbnail(exercise)}
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
                        className="mr-2"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelectedExercise(exercise);
                          setShareDialogOpen(true);
                        }}
                        className="mr-2"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(exercise.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Type badge */}
                    <Badge 
                      variant={exercise.type === 'youtube' ? 'destructive' : 'secondary'}
                      className="absolute top-2 right-2"
                    >
                      {exercise.type === 'youtube' ? <Youtube className="h-3 w-3 mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                      {exercise.type}
                    </Badge>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{exercise.name}</h3>
                    {exercise.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {exercise.description}
                      </p>
                    )}
                    
                    {exercise.tags && exercise.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {exercise.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {exercise.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{exercise.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
                      <span>{new Date(exercise.createdAt).toLocaleDateString()}</span>
                      {exercise.fileSize && (
                        <span>{formatFileSize(exercise.fileSize)}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

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
                  src={fullscreenVideo.fileUrl || ''}
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