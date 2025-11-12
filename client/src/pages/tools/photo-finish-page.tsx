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
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

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

  // Sort videos based on selected order
  const sortedVideos = [...savedVideos].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 pt-20 max-w-4xl">
        <div className="space-y-6">
          
          {/* Upload & Analyze Card */}
          <div className="relative group">
            {/* Neon gradient glow border */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-3xl opacity-75 group-hover:opacity-100 blur transition duration-500 group-hover:duration-200" />
            
            <Card className="relative bg-gradient-to-br from-gray-900 to-gray-950 border-0 shadow-2xl overflow-hidden">
              <CardContent className="p-8 md:p-12">
                {isUploading ? (
                  <div className="text-center space-y-6">
                    <div className="flex items-center justify-center mb-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 blur-2xl rounded-full animate-pulse" />
                        <Video className="h-20 w-20 text-purple-400 animate-pulse relative" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                      Processing Video
                    </h3>
                    <p className="text-gray-400 text-lg font-medium">{uploadStatus}</p>
                    <div className="w-full max-w-md mx-auto space-y-4">
                      <Progress value={uploadProgress} className="w-full h-3 bg-gray-800" />
                      <p className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {uploadProgress}% complete
                      </p>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="cursor-pointer group/upload"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-upload-video"
                  >
                    <div className="text-center space-y-8">
                      {/* Large pulsing upload icon */}
                      <div className="flex justify-center">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 blur-3xl rounded-full opacity-50 group-hover/upload:opacity-75 transition-opacity duration-300 animate-pulse" />
                          <div className="relative p-8 bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 rounded-3xl shadow-2xl group-hover/upload:scale-110 transition-transform duration-300">
                            <Upload className="h-16 w-16 md:h-20 md:w-20 text-white" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Typography */}
                      <div className="space-y-3">
                        <h2 className="text-3xl md:text-4xl font-bold text-white">
                          Upload & Analyze
                        </h2>
                        <p className="text-gray-400 text-base md:text-lg font-medium max-w-md mx-auto">
                          Upload a race video to analyze with precision timing tools
                        </p>
                      </div>
                      
                      {/* Drag & drop hint */}
                      <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800/50 backdrop-blur-sm rounded-full border border-purple-500/30 group-hover/upload:border-purple-500/60 transition-colors">
                        <div className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse" />
                        <span className="text-sm font-medium text-gray-300">Drag & drop or tap to upload</span>
                      </div>
                    </div>
                    
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

          {/* Video Library Card */}
          <div className="relative group">
            {/* Subtle glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-3xl opacity-30 group-hover:opacity-50 blur transition duration-300" />
            
            <Card className="relative bg-gradient-to-br from-gray-800 to-gray-900 border-0 shadow-2xl overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl shadow-lg">
                      <FolderOpen className="h-6 w-6" />
                    </div>
                    <span className="text-2xl font-bold text-white">Video Library</span>
                  </div>
                  {user?.subscriptionTier && (
                    <Badge variant="secondary" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 text-sm px-3 py-1">
                      <Crown className="h-3.5 w-3.5 mr-1.5" />
                      {tierName}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Storage usage with progress bar */}
                <div className="relative p-6 bg-gradient-to-br from-gray-900/80 to-gray-950/80 rounded-2xl border border-purple-500/20 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-pink-600/5" />
                  <div className="relative space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 font-semibold text-sm">Storage Usage</span>
                      <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {savedVideos.length} / {tierLimit} videos
                      </span>
                    </div>
                    <Progress value={usagePercentage} className="h-3 bg-gray-800" />
                    <div className="flex justify-between items-center text-xs">
                      <Badge variant="outline" className="border-purple-500/30 text-purple-300 bg-purple-950/30">
                        <Crown className="h-3 w-3 mr-1" />
                        {tierName}
                      </Badge>
                      <span className="text-gray-500 font-medium">
                        {tierLimit - savedVideos.length} slots remaining
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sort filter */}
                {savedVideos.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-400">Sort by Date</span>
                    <div className="flex gap-2">
                      <Button
                        variant={sortOrder === 'newest' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortOrder('newest')}
                        className={sortOrder === 'newest' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'border-gray-700 text-gray-400'}
                      >
                        Newest
                      </Button>
                      <Button
                        variant={sortOrder === 'oldest' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSortOrder('oldest')}
                        className={sortOrder === 'oldest' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'border-gray-700 text-gray-400'}
                      >
                        Oldest
                      </Button>
                    </div>
                  </div>
                )}

                {/* Video grid */}
                {isLoadingVideos ? (
                  <div className="text-center py-16">
                    <div className="relative inline-block mb-4">
                      <div className="absolute inset-0 bg-purple-600/30 blur-2xl rounded-full animate-pulse" />
                      <Video className="h-16 w-16 mx-auto text-purple-400 animate-pulse relative" />
                    </div>
                    <p className="font-semibold text-gray-300">Loading videos...</p>
                  </div>
                ) : savedVideos.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="inline-flex p-5 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl mb-4 border border-purple-500/10">
                      <Video className="h-14 w-14 text-purple-400" />
                    </div>
                    <p className="font-bold text-lg mb-2 text-white">No saved videos yet</p>
                    <p className="text-sm text-gray-400 font-medium">
                      Upload and save videos to build your library
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
                    {sortedVideos.map((video) => (
                      <div
                        key={video.id}
                        className="group/video relative rounded-xl overflow-hidden border-2 border-purple-500/20 hover:border-purple-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20 bg-gray-900/50"
                      >
                        {/* Thumbnail */}
                        <div 
                          className="aspect-video relative overflow-hidden cursor-pointer bg-gradient-to-br from-gray-800 to-gray-900"
                          onClick={() => loadSavedVideo(video)}
                        >
                          {video.thumbnail ? (
                            <>
                              <img
                                src={video.thumbnail}
                                alt={video.name}
                                className="w-full h-full object-cover transform group-hover/video:scale-110 transition-transform duration-300"
                                data-testid={`thumbnail-video-${video.id}`}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/video:opacity-100 transition-opacity" />
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="h-8 w-8 text-purple-400" />
                            </div>
                          )}
                          
                          {/* Delete button overlay */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover/video:opacity-100 transition-opacity bg-red-600/90 hover:bg-red-700 p-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDeleteVideo(video.id);
                            }}
                            data-testid={`button-delete-${video.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-white" />
                          </Button>
                        </div>
                        
                        {/* Upload date */}
                        <div className="p-3 bg-gray-900/80 border-t border-purple-500/10">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="font-medium">
                              {new Date(video.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
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
