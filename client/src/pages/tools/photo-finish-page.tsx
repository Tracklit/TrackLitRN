import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Video, 
  Upload, 
  Play, 
  Pause,
  Save,
  FolderOpen,
  ArrowRight,
  Info
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import trackImagePath from "@assets/IMG_4075.JPG?url";

interface TimerOverlay {
  id: string;
  x: number;
  y: number;
  startTime: number; // in seconds relative to video start
  visible: boolean;
}

interface FinishLineNode {
  id: string;
  x: number;
  y: number;
}

interface FinishLine {
  id: string;
  nodes: FinishLineNode[];
  visible: boolean;
}

interface SavedVideo {
  id: string;
  name: string;
  file: File;
  thumbnail: string;
  duration: number;
  createdAt: Date;
}

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
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateVideoThumbnail = (video: HTMLVideoElement): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      video.currentTime = 1; // Seek to 1 second for thumbnail
      
      video.addEventListener('seeked', () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        }
      }, { once: true });
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file.",
        variant: "destructive",
      });
      return;
    }

    // Start processing after file selection
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("Processing video...");

    try {
      setUploadProgress(25);
      setUploadStatus("Reading video file...");
      
      // Convert file to ArrayBuffer for storage
      const arrayBuffer = await file.arrayBuffer();
      
      setUploadProgress(60);
      setUploadStatus("Preparing video data...");
      
      // Store video data for fullscreen analysis
      const videoData = {
        name: file.name,
        type: file.type,
        size: file.size,
        thumbnail: '' // Skip thumbnail for now to avoid hanging
      };
      
      const fileDataWithMeta = {
        ...videoData,
        fileData: Array.from(new Uint8Array(arrayBuffer))
      };
      
      setUploadProgress(80);
      setUploadStatus("Saving video...");
      
      sessionStorage.setItem('photoFinishVideo', JSON.stringify(fileDataWithMeta));
      
      setUploadProgress(95);
      setUploadStatus("Launching analysis...");
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setUploadProgress(100);
      setUploadStatus("Complete!");
      
      // Navigate to fullscreen analysis
      setTimeout(() => {
        navigate('/tools/photo-finish/analysis');
      }, 300);
      
    } catch (error) {
      console.error('Error processing video:', error);
      setIsUploading(false);
      setUploadProgress(0);
      toast({
        title: "Upload failed",
        description: "There was an error processing your video. Please try again.",
        variant: "destructive",
      });
    }
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

  const saveVideo = async () => {
    if (!currentVideo) return;

    const thumbnail = videoPoster || '';
    const savedVideo: SavedVideo = {
      id: Date.now().toString(),
      name: currentVideo.name,
      file: currentVideo,
      thumbnail,
      duration,
      createdAt: new Date(),
    };

    setSavedVideos(prev => [...prev, savedVideo]);
    
    toast({
      title: "Video saved",
      description: `${currentVideo.name} has been added to your library.`,
    });
  };

  const loadSavedVideo = (savedVideo: SavedVideo) => {
    setCurrentVideo(savedVideo.file);
    const url = URL.createObjectURL(savedVideo.file);
    setVideoUrl(url);
    setVideoPoster(savedVideo.thumbnail);
    setShowVideoLibrary(false);
  };

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
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <FolderOpen className="h-4 w-4" />
            Video Library ({savedVideos.length})
          </Button>
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
              ) : !currentVideo ? (
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Upload Race Video</p>
                  <p className="text-muted-foreground">Click to select a video file or drag and drop</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Video will automatically open in fullscreen analysis mode
                  </p>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-lg font-medium mb-2">
                      Ready to analyze: {currentVideo.name}
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCurrentVideo(null);
                          setVideoUrl("");
                        }}
                      >
                        Upload Different Video
                      </Button>
                      <Button
                        onClick={() => navigate('/tools/photo-finish/analysis')}
                        className="flex items-center gap-2"
                      >
                        <ArrowRight className="h-4 w-4" />
                        Open Analysis
                      </Button>
                    </div>
                  </div>

                  {/* Basic Video Preview */}
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      poster={videoPoster}
                      className="w-full h-full object-contain"
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleVideoLoad}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      controls={false}
                      disablePictureInPicture
                      controlsList="nodownload nofullscreen noremoteplayback"
                      playsInline
                    />
                    
                    {/* Basic Controls */}
                    <div className="absolute bottom-4 left-4 right-4 bg-black/50 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={togglePlayPause}
                          className="text-white hover:bg-white/20"
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <div className="text-white text-sm">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-sm text-muted-foreground">
                    Video uploaded successfully! Click "Open Analysis" above to start analyzing.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Video Library Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Video Library
              </CardTitle>
            </CardHeader>
            <CardContent>
              {savedVideos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No saved videos yet</p>
                  <p className="text-sm">Upload and save videos to build your library</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {savedVideos.map((video, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() => loadSavedVideo(video)}
                    >
                      <div className="flex items-center gap-3">
                        {video.thumbnail && (
                          <img
                            src={video.thumbnail}
                            alt="Video thumbnail"
                            className="w-12 h-8 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {video.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {video.createdAt.toLocaleDateString()}
                          </div>
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
  );
}

// Export also as a component for dynamic routes
export function Component() {
  return <PhotoFinishPage />;
}