import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Video, 
  Clock, 
  Upload, 
  Play, 
  Pause,
  RotateCcw,
  Save,
  FolderOpen,
  Maximize,
  X,
  Info,
  Trash2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BackNavigation } from "@/components/back-navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import PhotoFinishFullscreen from './photo-finish-fullscreen';

interface TimerOverlay {
  id: string;
  x: number;
  y: number;
  startTime: number; // in seconds relative to video start
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
  
  // Video state
  const [currentVideo, setCurrentVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [showVideoLibrary, setShowVideoLibrary] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Video poster/thumbnail state
  const [videoPoster, setVideoPoster] = useState<string>("");
  
  // Overlay state
  const [timers, setTimers] = useState<TimerOverlay[]>([]);
  const [selectedTool, setSelectedTool] = useState<'none' | 'timer'>('none');
  const [mode, setMode] = useState<'timer' | null>(null);
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get user tier limits
  const getVideoLimit = () => {
    if (!user) return 1;
    if (user.isPremium) return 20; // Pro users
    return 1; // Free users
  };

  // Video Limits Info Component
  const VideoLimitsInfo = () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Video Storage Limits</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>Video storage limits by subscription tier:</p>
            <ul className="mt-2 space-y-1">
              <li>• <strong>Free:</strong> 1 video</li>
              <li>• <strong>Pro:</strong> 20 videos</li>
            </ul>
          </div>
          <div className="text-sm">
            <p>Current usage: {savedVideos.length} / {getVideoLimit()} videos</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const hundredths = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
  };

  // Load saved videos from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('photo-finish-videos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedVideos(parsed.map((v: any) => ({
          ...v,
          createdAt: new Date(v.createdAt)
        })));
      } catch (e) {
        console.error('Failed to parse saved videos:', e);
      }
    }
  }, []);

  // Save videos to localStorage
  const saveVideosToStorage = (videos: SavedVideo[]) => {
    localStorage.setItem('photo-finish-videos', JSON.stringify(videos));
  };

  // Generate video thumbnail
  const generateThumbnail = (video: HTMLVideoElement): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }

      canvas.width = 320;
      canvas.height = 180;
      
      video.currentTime = 1; // Seek to 1 second for thumbnail
      video.addEventListener('seeked', () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      }, { once: true });
    });
  };

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file (MP4, MOV, AVI)",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    
    try {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setCurrentVideo(file);
      
      // Generate poster
      const video = document.createElement('video');
      video.src = url;
      video.addEventListener('loadedmetadata', async () => {
        const poster = await generateThumbnail(video);
        setVideoPoster(poster);
        setDuration(video.duration);
        
        // Automatically enter fullscreen mode
        setFullscreenMode(true);
      });
      
      toast({
        title: "Video loaded",
        description: "Video loaded successfully. Opening in fullscreen mode.",
      });
    } catch (error) {
      toast({
        title: "Error loading video",
        description: "Failed to load the selected video file",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(event.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));
    
    if (videoFile) {
      handleFileSelect(videoFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please drop a video file (MP4, MOV, AVI)",
        variant: "destructive"
      });
    }
  };

  // Always use fullscreen mode for video analysis
  if (videoUrl) {
    return (
      <PhotoFinishFullscreen 
        videoUrl={videoUrl}
        currentVideo={currentVideo}
        onClose={() => {
          setFullscreenMode(false);
          setVideoUrl("");
          setCurrentVideo(null);
          setTimers([]);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto p-4 space-y-6">
        <BackNavigation />
        
        <div className="max-w-2xl mx-auto">
          {/* Header Card */}
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none mb-6">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Video className="h-8 w-8" />
                <CardTitle className="text-2xl font-bold">Photo Finish Analysis</CardTitle>
              </div>
              <p className="text-blue-100">
                Upload race videos and add precise timing overlays for professional analysis
              </p>
            </CardHeader>
          </Card>

          {/* Upload Area - Matching Design */}
          <Card className="bg-white border-none shadow-lg">
            <CardContent className="p-0">
              <div
                className={`
                  border-2 border-dashed border-blue-400 rounded-lg m-8 p-16 text-center transition-all duration-200 bg-gray-50
                  ${isDragging 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'hover:border-blue-500 hover:bg-blue-25'
                  }
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <Upload className="h-16 w-16 text-gray-400" />
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      Upload Race Video
                    </h3>
                    <p className="text-gray-600 text-lg mb-2">
                      Click to select a video file
                    </p>
                    <p className="text-gray-600 text-lg mb-4">
                      or drag and drop
                    </p>
                    <p className="text-gray-500 text-sm">
                      Supports MP4, MOV, AVI formats
                    </p>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium rounded-lg"
                      size="lg"
                    >
                      {uploading ? 'Loading...' : 'Choose File'}
                    </Button>
                  </div>

                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Video Library */}
              {savedVideos.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Videos</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {savedVideos.length} / {getVideoLimit()}
                      </span>
                      <VideoLimitsInfo />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {savedVideos.slice(0, 6).map((video) => (
                      <div
                        key={video.id}
                        className="group relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleFileSelect(video.file)}
                      >
                        <div className="aspect-video bg-gray-200 flex items-center justify-center">
                          {video.thumbnail ? (
                            <img 
                              src={video.thumbnail} 
                              alt={video.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Video className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {video.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTime(video.duration)}
                          </p>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              const updated = savedVideos.filter(v => v.id !== video.id);
                              setSavedVideos(updated);
                              saveVideosToStorage(updated);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
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