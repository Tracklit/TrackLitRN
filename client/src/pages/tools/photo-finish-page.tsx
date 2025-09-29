import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Video, 
  Upload, 
  Play, 
  Pause,
  FolderOpen,
  ArrowRight,
  Trash2,
  Crown
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  getAllVideoMetadata,
  getVideoBlob,
  deleteVideo,
  getTierLimit,
  type SavedVideoMetadata,
} from "@/lib/video-storage";

export default function PhotoFinishPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  // Video state
  const [currentVideo, setCurrentVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoPoster, setVideoPoster] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  // UI state
  const [savedVideos, setSavedVideos] = useState<SavedVideoMetadata[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved videos on mount
  useEffect(() => {
    loadSavedVideos();
  }, []);

  const loadSavedVideos = async () => {
    try {
      setIsLoadingVideos(true);
      const videos = await getAllVideoMetadata();
      setSavedVideos(videos);
    } catch (error) {
      console.error('Error loading saved videos:', error);
      toast({
        title: "Error",
        description: "Failed to load saved videos.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const uploadVideo = async (uri: string, file: File, blob?: Blob) => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("Uploading video...");

    try {
      // Simulate upload progress (replace with actual upload logic)
      const progressSteps = [20, 40, 60, 80, 95];
      for (let i = 0; i < progressSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setUploadProgress(progressSteps[i]);
        setUploadStatus(i === progressSteps.length - 1 ? "Finalizing..." : "Uploading...");
      }
      
      setUploadProgress(100);
      setUploadStatus("Upload complete!");
      
      // Store video data
      const videoData = {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        thumbnail: ''
      };
      
      sessionStorage.setItem('photoFinishVideoData', JSON.stringify(videoData));
      sessionStorage.setItem('photoFinishVideoUrl', uri);
      
      // Store blob if available for saving later
      if (blob) {
        try {
          // Convert blob to storable format (base64 would be too large, so we skip this)
          // The analysis page will re-fetch from the object URL
        } catch (e) {
          console.log('Could not store blob');
        }
      }
      
      // Navigate to fullscreen analysis immediately
      setTimeout(() => {
        navigate('/tools/photo-finish/analysis');
      }, 300);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input to allow selecting same file again
    event.target.value = '';

    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (limit to 500MB)
    if (file.size > 500 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a video under 500MB.",
        variant: "destructive",
      });
      return;
    }

    // Create object URL and immediately start upload
    const uri = URL.createObjectURL(file);
    await uploadVideo(uri, file, file);
  };

  const handleVideoLoad = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setCurrentTime(0);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  const loadSavedVideo = async (savedVideo: SavedVideoMetadata) => {
    try {
      // Get video blob from IndexedDB
      const blob = await getVideoBlob(savedVideo.id);
      if (!blob) {
        toast({
          title: "Error",
          description: "Video not found in storage.",
          variant: "destructive",
        });
        return;
      }

      // Create object URL and navigate to analysis
      const url = URL.createObjectURL(blob);
      
      const videoData = {
        name: savedVideo.name,
        type: blob.type,
        size: savedVideo.size,
        lastModified: Date.now(),
      };
      
      sessionStorage.setItem('photoFinishVideoData', JSON.stringify(videoData));
      sessionStorage.setItem('photoFinishVideoUrl', url);
      
      navigate('/tools/photo-finish/analysis');
    } catch (error) {
      console.error('Error loading saved video:', error);
      toast({
        title: "Error",
        description: "Failed to load video from library.",
        variant: "destructive",
      });
    }
  };

  const confirmDeleteVideo = (videoId: string) => {
    setVideoToDelete(videoId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteVideo = async () => {
    if (!videoToDelete) return;

    try {
      await deleteVideo(videoToDelete);
      setSavedVideos(prev => prev.filter(v => v.id !== videoToDelete));
      toast({
        title: "Video Deleted",
        description: "Video has been removed from your library.",
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "Failed to delete video.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const tierLimit = getTierLimit(user?.subscriptionTier || undefined);
  const tierName = user?.subscriptionTier === 'star' ? 'Star' : 
                   user?.subscriptionTier === 'pro' ? 'Pro' : 'Free';
  const usagePercentage = (savedVideos.length / tierLimit) * 100;

  return (
    <div className="container mx-auto px-4 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Video className="h-6 w-6" />
            Photo Finish
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyze race videos with precision timing and finish line overlay tools.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Upload/Analysis Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Video Upload & Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isUploading ? (
                <div className="p-8 text-center space-y-4">
                  <div className="flex items-center justify-center mb-4">
                    <Video className="h-12 w-12 text-primary animate-pulse" />
                  </div>
                  <h3 className="text-lg font-medium">Processing Video</h3>
                  <p className="text-muted-foreground">{uploadStatus}</p>
                  <div className="w-full max-w-md mx-auto space-y-2">
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground">{uploadProgress}% complete</p>
                  </div>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors min-h-[200px] flex flex-col justify-center"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-upload-video"
                >
                  <Upload className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-xl font-medium mb-2">Upload Race Video</p>
                  <p className="text-muted-foreground mb-4">Tap to select a video from your photo library</p>
                  <p className="text-sm text-muted-foreground">
                    Video will automatically open in fullscreen analysis mode
                  </p>
                  
                  {/* Photo library input */}
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/mov,video/avi,video/webm"
                    onChange={handleFileUpload}
                    className="hidden"
                    onClick={(e) => e.currentTarget.value = ''}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Video Library Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Video Library
                </div>
                {user?.subscriptionTier && (
                  <div className="flex items-center gap-1 text-xs">
                    <Crown className="h-3 w-3" />
                    {tierName}
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Storage usage indicator */}
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Storage</span>
                  <span className="font-medium">
                    {savedVideos.length} / {tierLimit} videos
                  </span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {tierName} tier • {tierLimit} video limit
                </p>
              </div>

              {isLoadingVideos ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
                  <p>Loading videos...</p>
                </div>
              ) : savedVideos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No saved videos yet</p>
                  <p className="text-sm">Upload and save videos to build your library</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {savedVideos.map((video) => (
                    <div
                      key={video.id}
                      className="group p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {video.thumbnail && (
                          <img
                            src={video.thumbnail}
                            alt="Video thumbnail"
                            className="w-16 h-12 object-cover rounded cursor-pointer"
                            onClick={() => loadSavedVideo(video)}
                            data-testid={`thumbnail-video-${video.id}`}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div 
                            className="text-sm font-medium truncate cursor-pointer hover:text-primary"
                            onClick={() => loadSavedVideo(video)}
                            data-testid={`link-video-${video.id}`}
                          >
                            {video.name}
                          </div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <div>{new Date(video.createdAt).toLocaleDateString()}</div>
                            <div>{formatFileSize(video.size)}</div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDeleteVideo(video.id);
                          }}
                          data-testid={`button-delete-${video.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this video from your library? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteVideo}
              data-testid="button-confirm-delete"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Export also as a component for dynamic routes
export function Component() {
  return <PhotoFinishPage />;
}
