import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Upload, 
  Play, 
  Pause,
  FolderOpen,
  ArrowRight,
  Trash2,
  Crown,
  Calendar
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
    <div className="min-h-screen pb-20">
      <div className="container mx-auto px-4 pt-20">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Upload/Analysis Area */}
        <div className="lg:col-span-2">
          <Card className="border-purple-200 dark:border-purple-900/50 shadow-lg bg-white dark:bg-gray-900">
            <CardHeader className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-850">
              <CardTitle className="flex items-center gap-2 text-xl">
                <div className="p-1.5 bg-purple-600 text-white rounded-lg">
                  <Upload className="h-5 w-5" />
                </div>
                Upload & Analyze
              </CardTitle>
              <CardDescription>
                Upload a race video to analyze with precision timing tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {isUploading ? (
                <div className="p-12 text-center space-y-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800/50 dark:to-gray-850/50 rounded-xl">
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-purple-600/20 blur-xl rounded-full animate-pulse" />
                      <Video className="h-16 w-16 text-purple-600 dark:text-purple-400 animate-pulse relative" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Processing Video
                  </h3>
                  <p className="text-muted-foreground text-lg">{uploadStatus}</p>
                  <div className="w-full max-w-md mx-auto space-y-3">
                    <Progress value={uploadProgress} className="w-full h-3" />
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      {uploadProgress}% complete
                    </p>
                  </div>
                </div>
              ) : (
                <div 
                  className="relative border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl p-12 text-center cursor-pointer hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-gray-800/50 transition-all duration-300 min-h-[300px] flex flex-col justify-center group overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-upload-video"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800/30 dark:to-gray-850/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative space-y-4">
                    <div className="inline-flex p-4 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Upload className="h-12 w-12 text-white" />
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Upload Race Video
                      </p>
                    </div>
                  </div>
                  
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
          <Card className="border-blue-200 dark:border-blue-900/50 shadow-lg bg-white dark:bg-gray-900">
            <CardHeader className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-850">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xl">
                  <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  Video Library
                </div>
                {user?.subscriptionTier && (
                  <Badge variant="secondary" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
                    <Crown className="h-3 w-3 mr-1" />
                    {tierName}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Storage usage indicator */}
              <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800/70 dark:to-gray-850/70 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-muted-foreground font-medium">Storage Usage</span>
                  <span className="font-bold text-purple-700 dark:text-purple-300">
                    {savedVideos.length} / {tierLimit} videos
                  </span>
                </div>
                <Progress value={usagePercentage} className="h-2.5" />
                <div className="flex items-center justify-between mt-3">
                  <Badge variant="outline" className="border-purple-300 dark:border-purple-700 text-xs">
                    <Crown className="h-3 w-3 mr-1" />
                    {tierName}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {tierLimit - savedVideos.length} slots remaining
                  </p>
                </div>
              </div>

              {isLoadingVideos ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-purple-600/20 blur-xl rounded-full animate-pulse" />
                    <Video className="h-14 w-14 mx-auto text-purple-600 dark:text-purple-400 opacity-50 animate-pulse relative" />
                  </div>
                  <p className="font-medium">Loading videos...</p>
                </div>
              ) : savedVideos.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="inline-flex p-4 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-gray-800/50 dark:to-gray-850/50 rounded-2xl mb-4">
                    <Video className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="font-semibold text-base mb-2">No saved videos yet</p>
                  <p className="text-sm text-muted-foreground">
                    Upload and save videos to build your library
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {savedVideos.map((video) => (
                    <div
                      key={video.id}
                      className="group p-3 rounded-xl border border-purple-200 dark:border-purple-800 hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50 dark:hover:from-gray-800/30 dark:hover:to-gray-850/30 hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        {video.thumbnail && (
                          <div className="relative overflow-hidden rounded-lg ring-2 ring-purple-200 dark:ring-purple-800 group-hover:ring-purple-400 dark:group-hover:ring-purple-600 transition-all">
                            <img
                              src={video.thumbnail}
                              alt="Video thumbnail"
                              className="w-20 h-14 object-cover cursor-pointer transform group-hover:scale-110 transition-transform duration-200"
                              onClick={() => loadSavedVideo(video)}
                              data-testid={`thumbnail-video-${video.id}`}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div 
                            className="text-sm font-semibold truncate cursor-pointer text-foreground group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors"
                            onClick={() => loadSavedVideo(video)}
                            data-testid={`link-video-${video.id}`}
                          >
                            {video.name}
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1 mt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(video.createdAt).toLocaleDateString()}
                            </div>
                            <div className="font-medium text-purple-600 dark:text-purple-400">
                              {formatFileSize(video.size)}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-950/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDeleteVideo(video.id);
                          }}
                          data-testid={`button-delete-${video.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
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
