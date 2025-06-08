import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Video, 
  Clock, 
  Trash2, 
  Upload, 
  Play, 
  Pause,
  Save,
  FolderOpen,
  Maximize,
  X,
  Info,
  Brain,
  Zap
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BackNavigation } from "@/components/back-navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import PhotoFinishFullscreen from './photo-finish-fullscreen';
import trackImagePath from "@assets/IMG_4075.JPG?url";

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
  
  // AI Analysis state
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [selectedAnalysisType, setSelectedAnalysisType] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  
  const queryClient = useQueryClient();
  
  const analysisTypes = [
    { id: 'sprint_form', name: 'Sprint Form Analysis', icon: '🏃‍♂️' },
    { id: 'block_start', name: 'Block Start Analysis', icon: '🚀' },
    { id: 'stride_length', name: 'Stride Length Analysis', icon: '📏' },
    { id: 'stride_frequency', name: 'Stride Frequency Analysis', icon: '⚡' },
    { id: 'ground_contact_time', name: 'Ground Contact Time', icon: '👟' },
    { id: 'flight_time', name: 'Flight Time Analysis', icon: '🦅' }
  ];
  
  // AI Analysis mutation
  const analyzeVideoMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/video-analysis/analyze', 'POST', data),
    onSuccess: () => {
      toast({
        title: "Analysis Started",
        description: "Sprinthia is analyzing your video. Check your analysis history for results."
      });
      setShowAIDialog(false);
      setSelectedAnalysisType('');
      setCustomPrompt('');
      setVideoTitle('');
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to start video analysis",
        variant: "destructive"
      });
    }
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [showVideoLibrary, setShowVideoLibrary] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  
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
        <Button variant="ghost" size="sm" className="p-1">
          <Info className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Video Storage Limits</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <div className="text-sm text-muted-foreground">
              Current Plan: {user?.isPremium ? 'Pro' : 'Free'}
            </div>
            <div className="text-sm">
              Videos saved: {savedVideos.length} / {getVideoLimit()}
            </div>
          </div>
          
          {!user?.isPremium && (
            <div className="border border-yellow-200 bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Upgrade to Pro</strong> to save up to 20 videos and unlock advanced timing features.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  // Format time as MM•SS•TH (minutes, seconds, hundredths with bullet separators)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.floor(Math.abs(seconds) % 60);
    const hundredths = Math.floor((Math.abs(seconds) % 1) * 100);
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${mins.toString().padStart(2, '0')}•${secs.toString().padStart(2, '0')}•${hundredths.toString().padStart(2, '0')}`;
  };

  // Video controls
  const togglePlayback = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (newTime: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Pan state for video navigation
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  const handleVideoPanStart = (clientX: number, clientY: number) => {
    setIsPanning(true);
    setLastPanPoint({ x: clientX, y: clientY });
  };

  const handleVideoPanMove = (clientX: number, clientY: number) => {
    if (!isPanning || !containerRef.current) return;
    
    const deltaX = clientX - lastPanPoint.x;
    const deltaY = clientY - lastPanPoint.y;
    
    containerRef.current.scrollLeft -= deltaX;
    containerRef.current.scrollTop -= deltaY;
    
    setLastPanPoint({ x: clientX, y: clientY });
  };

  const handleVideoPanEnd = () => {
    setIsPanning(false);
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.button === 0) { // Left mouse button
      handleVideoPanStart(event.clientX, event.clientY);
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    handleVideoPanMove(event.clientX, event.clientY);
  };

  const handleMouseUp = () => {
    handleVideoPanEnd();
    setLastPanPoint({ x: 0, y: 0 });
  };

  // Video file handling
  const handleVideoUpload = (file: File) => {
    setUploading(true);
    setCurrentVideo(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setVideoPoster(""); // Reset poster for new video
    setFullscreenMode(true); // Automatically enable fullscreen mode
    
    // Reset overlays when new video is loaded
    setTimers([]);
    setSelectedTool('none');
    
    // Loading will be cleared when video metadata loads
  };

  // Generate video thumbnail from first frame
  const generateVideoThumbnail = (video: HTMLVideoElement): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } else {
        resolve('');
      }
    });
  };

  // Handle video metadata loaded
  const handleVideoLoadedMetadata = useCallback(async () => {
    if (!videoRef.current || !currentVideo) return;
    
    setDuration(videoRef.current.duration);
    setCurrentTime(0);
    setUploading(false);
    
    // Generate and set poster image
    try {
      const thumbnail = await generateVideoThumbnail(videoRef.current);
      setVideoPoster(thumbnail);
    } catch (error) {
      console.error('Failed to generate video thumbnail:', error);
    }
  }, [currentVideo]);

  // Draw timer overlays on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const container = containerRef.current;
    if (!canvas || !video || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Update canvas size to match video container
    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw timer overlays with proper scaling
    timers.forEach(timer => {
      const elapsedTime = currentTime - timer.startTime;
      const posX = (timer.x / 100) * canvas.width;
      const posY = (timer.y / 100) * canvas.height;
      
      // Scale font size based on canvas width
      const baseFontSize = Math.min(canvas.width / 20, 48);
      const fontSize = Math.max(18, baseFontSize);
      
      // Format time in MM•SS•TH format
      const text = formatTime(elapsedTime);
      
      // Set up text styling
      ctx.font = `900 ${fontSize}px 'Inter', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Measure text for background
      const metrics = ctx.measureText(text);
      const textWidth = metrics.width;
      const textHeight = fontSize * 0.8;
      
      // Scale padding with font size
      const paddingX = fontSize * 0.6;
      const paddingY = fontSize * 0.4;
      const bgWidth = textWidth + (paddingX * 2);
      const bgHeight = textHeight + (paddingY * 2);
      const cornerRadius = Math.min(fontSize * 0.3, 16);
      
      // Draw background with rounded corners
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.beginPath();
      ctx.roundRect(
        posX - bgWidth / 2,
        posY - bgHeight / 2,
        bgWidth,
        bgHeight,
        cornerRadius
      );
      ctx.fill();
      
      // Add subtle shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;
      
      // Redraw background with shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.beginPath();
      ctx.roundRect(
        posX - bgWidth / 2,
        posY - bgHeight / 2,
        bgWidth,
        bgHeight,
        cornerRadius
      );
      ctx.fill();
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      // Draw main text in white
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(text, posX, posY);
    });
  }, [timers, currentTime, duration]);

  const handleVideoTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  }, []);

  const handleVideoPlay = () => setIsPlaying(true);
  const handleVideoPause = () => setIsPlaying(false);

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  // Handle canvas click for adding overlays
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100; // Convert to percentage
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    if (selectedTool === 'timer') {
      const newTimer: TimerOverlay = {
        id: `timer-${Date.now()}`,
        x,
        y,
        startTime: currentTime,
        visible: true
      };
      setTimers(prev => [...prev, newTimer]);
      setSelectedTool('none');
      
      toast({
        title: "Timer added",
        description: `Race timer placed at ${formatTime(currentTime)}`,
      });
    }
  };

  // Clear all overlays
  const clearOverlays = () => {
    setTimers([]);
    setSelectedTool('none');
    
    toast({
      title: "Overlays cleared",
      description: "All timers have been removed",
    });
  };

  // Save current video
  const saveVideo = async () => {
    if (!currentVideo) return;

    const videoLimit = getVideoLimit();
    if (videoLimit > 0 && savedVideos.length >= videoLimit) {
      toast({
        title: "Cannot save video",
        description: `Storage limit reached. Upgrade to save more videos.`,
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate thumbnail
      let thumbnail = videoPoster;
      if (!thumbnail && videoRef.current) {
        thumbnail = await generateVideoThumbnail(videoRef.current);
      }

      const savedVideo: SavedVideo = {
        id: `video-${Date.now()}`,
        name: currentVideo.name,
        file: currentVideo,
        thumbnail,
        duration,
        createdAt: new Date()
      };

      setSavedVideos(prev => [...prev, savedVideo]);
      
      toast({
        title: "Video saved",
        description: "Video has been saved to your library",
      });
    } catch (error) {
      toast({
        title: "Failed to save video",
        description: "An error occurred while saving the video",
        variant: "destructive"
      });
    }
  };

  // Load saved video
  const loadSavedVideo = (savedVideo: SavedVideo) => {
    setCurrentVideo(savedVideo.file);
    const url = URL.createObjectURL(savedVideo.file);
    setVideoUrl(url);
    setFullscreenMode(true); // Automatically enable fullscreen mode
    setShowVideoLibrary(false);
    
    // Reset overlays
    setTimers([]);
    setSelectedTool('none');
  };

  // Draw overlays on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size to match video container
    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Draw timers
    timers.forEach(timer => {
      if (!timer.visible) return;

      const timerTime = currentTime - timer.startTime;
      const x = (timer.x / 100) * canvas.width;
      const y = (timer.y / 100) * canvas.height;

      // Format time in MM•SS•TH format (minutes, seconds, tenths+hundredths)
      const sign = timerTime < 0 ? '-' : '';
      const absSeconds = Math.abs(timerTime);
      const mins = Math.floor(absSeconds / 60);
      const secs = Math.floor(absSeconds % 60);
      const hundredths = Math.floor((absSeconds % 1) * 100);
      const text = `${sign}${mins.toString().padStart(2, '0')}•${secs.toString().padStart(2, '0')}•${hundredths.toString().padStart(2, '0')}`;

      // Sleek timer design matching the provided image
      const fontSize = 48; // Large, bold numbers
      
      ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      
      // Measure text for background sizing
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;
      
      // Background padding
      const paddingX = 24;
      const paddingY = 12;
      const bgWidth = textWidth + (paddingX * 2);
      const bgHeight = textHeight + (paddingY * 2);
      const cornerRadius = 20; // Rounded corners for modern look
      
      // Add subtle shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;
      
      // Redraw background with shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.roundRect(
        x - bgWidth / 2,
        y - bgHeight / 2,
        bgWidth,
        bgHeight,
        cornerRadius
      );
      ctx.fill();
      
      // Reset shadow for text
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      // Draw crisp white text
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(text, x - textWidth / 2, y + fontSize / 3);
    });

  }, [currentTime, timers]);

  // Always use fullscreen mode for video analysis
  if (videoUrl) {
    return (
      <div className="fixed inset-0 bg-black text-white overflow-hidden z-50">
        <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFullscreenMode(false);
                  setVideoUrl("");
                  setCurrentVideo(null);
                  setTimers([]);
                }}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVideoLibrary(!showVideoLibrary)}
                className="text-white hover:bg-white/20"
              >
                <FolderOpen className="w-5 h-5" />
              </Button>
            </div>

            <div className="text-white font-medium">
              {currentVideo?.name || 'Race Analysis'}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={saveVideo}
                className="text-white hover:bg-white/20"
              >
                <Save className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {showVideoLibrary && (
          <div className="absolute top-0 left-0 w-80 h-full bg-black/90 backdrop-blur-sm z-40 border-r border-gray-800">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Video Library</h3>
                <div className="flex items-center gap-2">
                  <VideoLimitsInfo />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowVideoLibrary(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {savedVideos.map((video) => (
                  <div
                    key={video.id}
                    className="bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-700 transition-colors"
                    onClick={() => loadSavedVideo(video)}
                  >
                    <div className="text-sm font-medium text-white truncate">
                      {video.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatTime(video.duration)} • {video.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                ))}
                
                {savedVideos.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No saved videos</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="h-full w-full flex items-center justify-center relative overflow-hidden pt-16 pb-32">
          <div className="relative">
            <video
              ref={videoRef}
              src={videoUrl}
              poster={videoPoster}
              preload="metadata"
              className="max-h-full max-w-full object-contain"
              onLoadedMetadata={handleVideoLoadedMetadata}
              onLoadedData={() => {
                // Ensure video shows first frame
                if (videoRef.current) {
                  videoRef.current.currentTime = 0.1;
                }
              }}
              onTimeUpdate={handleVideoTimeUpdate}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              onEnded={handleVideoEnded}
            />
            
            {/* Timer overlay canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              onClick={(e) => {
                if (mode === 'timer') {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  
                  const newTimer = {
                    id: Date.now().toString(),
                    x,
                    y,
                    startTime: currentTime,
                    visible: true
                  };
                  
                  setTimers(prev => [...prev, newTimer]);
                  setActiveTimer(newTimer.id);
                  setMode(null);
                  
                  // Show toast notification
                  const mins = Math.floor(currentTime / 60);
                  const secs = (currentTime % 60).toFixed(2);
                  toast({
                    title: "Timer added",
                    description: `Timer placed at ${mins}:${secs.padStart(5, '0')}`,
                  });
                }
              }}
              style={{ pointerEvents: mode === 'timer' ? 'auto' : 'none' }}
            />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button
              variant={mode === 'timer' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode(mode === 'timer' ? null : 'timer')}
              className="text-white hover:bg-white/20"
            >
              <Clock className="w-4 h-4 mr-2" />
              Add Timer
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTimers([]);
                setActiveTimer(null);
              }}
              className="text-white hover:bg-white/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
            
            {currentVideo && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAIDialog(true)}
                className="text-white hover:bg-white/20"
              >
                <Brain className="w-4 h-4 mr-2" />
                AI Analysis
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlayback}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            
            <div className="text-sm text-white font-mono">
              {formatTime(currentTime)}
            </div>
            
            <div className="flex-1 relative">
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #ffffff 0%, #ffffff ${(currentTime / duration) * 100}%, #4a5568 ${(currentTime / duration) * 100}%, #4a5568 100%)`
                }}
              />
            </div>
            
            <div className="text-sm text-white font-mono">
              {formatTime(duration)}
            </div>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-30"
          style={{ top: '64px', bottom: '128px' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <BackNavigation />
        
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white shadow-xl border-0">
            <CardHeader className="text-center space-y-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <div className="flex items-center justify-center gap-3">
                <Video className="w-8 h-8" />
                <CardTitle className="text-2xl font-bold">Photo Finish Analysis</CardTitle>
              </div>
              <p className="text-blue-100">
                Upload race videos and add precise timing overlays for professional analysis
              </p>
            </CardHeader>
            
            <CardContent className="p-8">
              {!currentVideo ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-blue-400 transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        Upload Race Video
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Click to select a video file or drag and drop
                      </p>
                      <p className="text-sm text-gray-400">
                        Supports MP4, MOV, AVI formats
                      </p>
                    </div>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleVideoUpload(file);
                        }
                      }}
                      className="hidden"
                    />
                  </div>

                  {savedVideos.length > 0 && (
                    <div className="border-t pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Saved Videos</h3>
                        <VideoLimitsInfo />
                      </div>
                      
                      <div className="grid gap-3">
                        {savedVideos.map((video) => (
                          <div
                            key={video.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => loadSavedVideo(video)}
                          >
                            <div className="flex items-center gap-3">
                              <Video className="w-5 h-5 text-gray-500" />
                              <div>
                                <div className="font-medium">{video.name}</div>
                                <div className="text-sm text-gray-500">
                                  {formatTime(video.duration)} • {video.createdAt.toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Play className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {uploading && (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-gray-600">Loading video...</p>
                    </div>
                  )}

                  {!uploading && (
                    <div>
                      <div className="relative bg-black rounded-lg overflow-hidden">
                        <video
                          ref={videoRef}
                          src={videoUrl}
                          poster={videoPoster}
                          className="w-full h-auto max-h-[600px] object-contain"
                          onLoadedMetadata={handleVideoLoadedMetadata}
                          onTimeUpdate={handleVideoTimeUpdate}
                          onPlay={handleVideoPlay}
                          onPause={handleVideoPause}
                          onEnded={handleVideoEnded}
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseUp}
                        />

                        {duration === 0 && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <div className="text-white text-center">
                              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                              <p>Loading video...</p>
                            </div>
                          </div>
                        )}

                        <canvas
                          ref={canvasRef}
                          className="absolute inset-0 w-full h-full cursor-crosshair"
                          onClick={handleCanvasClick}
                          style={{ pointerEvents: selectedTool !== 'none' ? 'auto' : 'none' }}
                        />
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center gap-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={togglePlayback}
                            className="flex items-center gap-2"
                          >
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            {isPlaying ? 'Pause' : 'Play'}
                          </Button>
                          
                          <div className="text-sm font-mono min-w-[140px] text-center">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="video-scrubber" className="text-sm font-medium">
                            Video Timeline
                          </Label>
                          <input
                            id="video-scrubber"
                            type="range"
                            min={0}
                            max={duration || 0}
                            step={0.01}
                            value={currentTime}
                            onChange={(e) => handleSeek(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          />
                        </div>

                        <div className="border-t pt-6">
                          <h3 className="text-lg font-semibold mb-4">Analysis Tools</h3>
                          
                          <div className="flex items-center gap-4 flex-wrap">
                            <Button
                              variant={selectedTool === 'timer' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setSelectedTool(selectedTool === 'timer' ? 'none' : 'timer')}
                              className="flex items-center gap-2"
                            >
                              <Clock className="h-4 w-4" />
                              Race Timer
                            </Button>
                            
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={clearOverlays}
                              className="flex items-center gap-2 ml-auto"
                              disabled={timers.length === 0}
                            >
                              <Trash2 className="h-4 w-4" />
                              Clear All
                            </Button>
                          </div>

                          {timers.length > 0 && (
                            <div className="text-sm text-muted-foreground mt-4">
                              Active overlays: {timers.length} timer{timers.length !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* AI Analysis Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Sprinthia AI Video Analysis
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="video-title">Video Title *</Label>
              <Input
                id="video-title"
                placeholder="e.g., 100m Sprint Training"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Analysis Type *</Label>
              <Select value={selectedAnalysisType} onValueChange={setSelectedAnalysisType}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose analysis type" />
                </SelectTrigger>
                <SelectContent>
                  {analysisTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-prompt">Custom Instructions (Optional)</Label>
              <Textarea
                id="custom-prompt"
                placeholder="Add specific areas you'd like Sprinthia to focus on..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-blue-700">
                Analysis requires 10 spikes. Results will appear in your analysis history.
              </span>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAIDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!videoTitle || !selectedAnalysisType) {
                    toast({
                      title: "Missing Information",
                      description: "Please fill in all required fields",
                      variant: "destructive"
                    });
                    return;
                  }

                  analyzeVideoMutation.mutate({
                    videoUrl: videoUrl,
                    videoTitle,
                    analysisType: selectedAnalysisType,
                    customPrompt: customPrompt || undefined
                  });
                }}
                disabled={analyzeVideoMutation.isPending || !videoTitle || !selectedAnalysisType}
              >
                {analyzeVideoMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Starting Analysis...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Analyze with Sprinthia
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function Component() {
  return <PhotoFinishPage />;
}