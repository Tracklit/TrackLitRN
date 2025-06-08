import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Video, 
  Clock, 
  Target, 
  Trash2, 
  Upload, 
  Play, 
  Pause,
  RotateCcw,
  Save,
  FolderOpen,
  Maximize,
  X,
  Info
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BackNavigation } from "@/components/back-navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import PhotoFinishFullscreen from './photo-finish-fullscreen';
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
  
  // Video poster/thumbnail state
  const [videoPoster, setVideoPoster] = useState<string>("");
  
  // Overlay state
  const [timers, setTimers] = useState<TimerOverlay[]>([]);
  const [finishLines, setFinishLines] = useState<FinishLine[]>([]);
  const [selectedTool, setSelectedTool] = useState<'none' | 'timer' | 'finish-line'>('none');
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [currentLineId, setCurrentLineId] = useState<string | null>(null);
  const [mode, setMode] = useState<'timer' | 'finishline' | null>(null);
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [activeFinishLine, setActiveFinishLine] = useState<string | null>(null);
  
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
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Info className="h-4 w-4 mr-2" />
          Video Library Info
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Video Library Limits</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your subscription tier determines how many race videos you can save in your personal library:
          </p>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
              <span className="font-medium">Free Plan</span>
              <span className="text-sm text-muted-foreground">1 saved video</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
              <span className="font-medium">Pro Plan</span>
              <span className="text-sm text-muted-foreground">20 saved videos</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
              <span className="font-medium">Star Plan</span>
              <span className="text-sm text-muted-foreground">Unlimited videos</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            You can always upload and analyze videos temporarily. Library storage lets you save your analysis for future reference.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Format time for display with hundredths precision
  const formatTime = (seconds: number) => {
    const sign = seconds < 0 ? '-' : '';
    const absSeconds = Math.abs(seconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = Math.floor(absSeconds % 60);
    const hundredths = Math.floor((absSeconds % 1) * 100);
    return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
  };

  // Missing functions for fullscreen mode
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleDurationChange = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Handle video file upload
  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file",
        description: "Please select a video file",
        variant: "destructive"
      });
      return;
    }

    // Check video limit
    const limit = getVideoLimit();
    if (limit > 0 && savedVideos.length >= limit) {
      toast({
        title: "Video limit reached",
        description: `${user?.isPremium ? 'Pro' : 'Free'} users can save up to ${limit} video${limit === 1 ? '' : 's'}. Upgrade to save more!`,
        variant: "destructive"
      });
      return;
    }

    setCurrentVideo(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setVideoPoster(""); // Reset poster for new video
    
    // Reset overlays when new video is loaded
    setTimers([]);
    setFinishLines([]);
    setSelectedTool('none');
    
    // Automatically switch to fullscreen mode
    setFullscreenMode(true);
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
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataURL);
      }
    });
  };

  // Handle video metadata load
  const handleVideoLoad = async () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setCurrentTime(0);
      
      // Generate thumbnail from first frame
      try {
        videoRef.current.currentTime = 0;
        await new Promise<void>(resolve => {
          const onSeeked = () => {
            videoRef.current?.removeEventListener('seeked', onSeeked);
            resolve();
          };
          videoRef.current?.addEventListener('seeked', onSeeked);
        });
        
        const thumbnail = await generateVideoThumbnail(videoRef.current);
        setVideoPoster(thumbnail);
      } catch (error) {
        console.error('Failed to generate video thumbnail:', error);
      }
    }
  };

  // Handle video time update with smooth frame-rate syncing
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  // Smooth animation loop for precise timer updates
  useEffect(() => {
    let animationFrame: number;
    
    const updateTime = () => {
      if (videoRef.current && isPlaying) {
        setCurrentTime(videoRef.current.currentTime);
      }
      animationFrame = requestAnimationFrame(updateTime);
    };
    
    if (isPlaying) {
      animationFrame = requestAnimationFrame(updateTime);
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlaying]);

  // Toggle play/pause
  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle video scrubbing with frame-rate precision
  const handleScrub = (event: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(event.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
      
      // Force immediate time update for smooth scrubbing
      requestAnimationFrame(() => {
        if (videoRef.current) {
          setCurrentTime(videoRef.current.currentTime);
        }
      });
    }
  };

  // State for tracking drag
  const [isDragging, setIsDragging] = useState(false);
  
  // Video zoom and pan state
  const [videoScale, setVideoScale] = useState(1);
  const [videoTranslate, setVideoTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // Handle slider interaction - smart play/pause behavior
  const handleSliderInteraction = (clientX: number, element: HTMLDivElement) => {
    const rect = element.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const time = percentage * (duration || 0);
    
    if (videoRef.current && time >= 0 && time <= (duration || 0)) {
      // Set the video time
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // State for tracking if user has started video once
  const [hasStartedVideo, setHasStartedVideo] = useState(false);

  // Mouse handlers
  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
    
    // Auto-start video only on first interaction
    if (videoRef.current && !hasStartedVideo) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setHasStartedVideo(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    } else if (videoRef.current && !videoRef.current.paused) {
      // Pause during scrubbing
      videoRef.current.pause();
    }
    
    handleSliderInteraction(event.clientX, event.currentTarget);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleSliderInteraction(event.clientX, event.currentTarget);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Keep video paused after scrubbing - user controls playback
  };

  // Touch handlers
  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
    
    // Auto-start video only on first interaction
    if (videoRef.current && !hasStartedVideo) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setHasStartedVideo(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    } else if (videoRef.current && !videoRef.current.paused) {
      // Pause during scrubbing
      videoRef.current.pause();
    }
    
    const touch = event.touches[0];
    handleSliderInteraction(touch.clientX, event.currentTarget);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isDragging && event.touches[0]) {
      const touch = event.touches[0];
      handleSliderInteraction(touch.clientX, event.currentTarget);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // Keep video paused after scrubbing - user controls playback
  };

  // Global mouse up handler
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        // Resume video if it was playing
        if (videoRef.current && isPlaying) {
          videoRef.current.play();
        }
      }
    };
    
    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mouseleave', handleGlobalMouseUp);
      document.addEventListener('touchend', handleGlobalMouseUp);
    }
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mouseleave', handleGlobalMouseUp);  
      document.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDragging, isPlaying]);

  // Video zoom and pan handlers
  const handleVideoWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(0.5, Math.min(3, videoScale + delta));
    setVideoScale(newScale);
  };

  const handleVideoPanStart = (clientX: number, clientY: number) => {
    setIsPanning(true);
    setLastPanPoint({ x: clientX, y: clientY });
  };

  const handleVideoPanMove = (clientX: number, clientY: number) => {
    if (!isPanning) return;
    
    const deltaX = clientX - lastPanPoint.x;
    const deltaY = clientY - lastPanPoint.y;
    
    setVideoTranslate(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    setLastPanPoint({ x: clientX, y: clientY });
  };

  const handleVideoPanEnd = () => {
    setIsPanning(false);
  };

  // Touch gesture handlers for video
  const handleVideoTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      handleVideoPanStart(touch.clientX, touch.clientY);
    }
  };

  const handleVideoTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    if (event.touches.length === 1 && isPanning) {
      const touch = event.touches[0];
      handleVideoPanMove(touch.clientX, touch.clientY);
    } else if (event.touches.length === 2) {
      // Pinch to zoom
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      if (lastPanPoint.x !== 0) {
        const lastDistance = lastPanPoint.x;
        const scale = distance / lastDistance;
        const newScale = Math.max(0.5, Math.min(3, videoScale * scale));
        setVideoScale(newScale);
      }
      setLastPanPoint({ x: distance, y: 0 });
    }
  };

  const handleVideoTouchEnd = () => {
    handleVideoPanEnd();
    setLastPanPoint({ x: 0, y: 0 });
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
    } else if (selectedTool === 'finish-line') {
      if (!isDrawingLine) {
        // Start new finish line
        const lineId = `line-${Date.now()}`;
        const newLine: FinishLine = {
          id: lineId,
          nodes: [{ id: `node-${Date.now()}`, x, y }],
          visible: true
        };
        setFinishLines(prev => [...prev, newLine]);
        setIsDrawingLine(true);
        setCurrentLineId(lineId);
      } else if (currentLineId) {
        // Add node to current line
        const newNode: FinishLineNode = {
          id: `node-${Date.now()}`,
          x,
          y
        };
        setFinishLines(prev => prev.map(line => 
          line.id === currentLineId 
            ? { ...line, nodes: [...line.nodes, newNode] }
            : line
        ));
      }
    }
  };

  // Finish drawing line
  const finishDrawingLine = () => {
    setIsDrawingLine(false);
    setCurrentLineId(null);
    setSelectedTool('none');
    
    toast({
      title: "Finish line created",
      description: "Finish line has been placed on the video",
    });
  };

  // Clear all overlays
  const clearOverlays = () => {
    setTimers([]);
    setFinishLines([]);
    setIsDrawingLine(false);
    setCurrentLineId(null);
    setSelectedTool('none');
    
    toast({
      title: "Overlays cleared",
      description: "All timers and finish lines have been removed",
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

    // Generate thumbnail
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (videoRef.current && ctx) {
      canvas.width = 160;
      canvas.height = 90;
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const thumbnail = canvas.toDataURL('image/jpeg', 0.8);

      const savedVideo: SavedVideo = {
        id: `video-${Date.now()}`,
        name: currentVideo.name,
        file: currentVideo,
        thumbnail,
        duration,
        createdAt: new Date()
      };

      setSavedVideos(prev => [savedVideo, ...prev]);
      
      toast({
        title: "Video saved",
        description: `${currentVideo.name} has been saved to your library`,
      });
    }
  };

  // Load saved video
  const loadSavedVideo = (savedVideo: SavedVideo) => {
    setCurrentVideo(savedVideo.file);
    const url = URL.createObjectURL(savedVideo.file);
    setVideoUrl(url);
    setShowVideoLibrary(false);
    
    // Reset overlays
    setTimers([]);
    setFinishLines([]);
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

    // Set canvas size to match video
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;

    // Draw timers
    timers.forEach(timer => {
      if (!timer.visible) return;

      const timerTime = currentTime - timer.startTime;
      const x = (timer.x / 100) * canvas.width;
      const y = (timer.y / 100) * canvas.height;

      // Calculate timer size as 10% of video width with proper proportions
      const timerSize = Math.max(canvas.width * 0.1, 80); // Minimum 80px
      const timerWidth = timerSize * 2.2;
      const timerHeight = timerSize * 0.7;
      const fontSize = timerSize * 0.35;
      
      // Draw transparent timer text with shadow only
      ctx.font = `bold ${fontSize}px Inter, system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Add drop shadow for visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // Draw only white text - no background or border
      ctx.fillStyle = '#ffffff';
      ctx.fillText(formatTime(timerTime), x, y);
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    });

    // Draw finish lines
    finishLines.forEach(line => {
      if (!line.visible || line.nodes.length < 2) return;

      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 4;
      ctx.setLineDash([]);

      // Draw line segments
      ctx.beginPath();
      for (let i = 0; i < line.nodes.length - 1; i++) {
        const node1 = line.nodes[i];
        const node2 = line.nodes[i + 1];
        const x1 = (node1.x / 100) * canvas.width;
        const y1 = (node1.y / 100) * canvas.height;
        const x2 = (node2.x / 100) * canvas.width;
        const y2 = (node2.y / 100) * canvas.height;

        if (i === 0) {
          ctx.moveTo(x1, y1);
        }
        ctx.lineTo(x2, y2);
      }
      ctx.stroke();

      // Draw nodes
      line.nodes.forEach(node => {
        const x = (node.x / 100) * canvas.width;
        const y = (node.y / 100) * canvas.height;

        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    });
  }, [currentTime, timers, finishLines]);

  // Full-screen video analysis mode (like inspiration image)
  if (fullscreenMode && videoUrl) {
    return (
      <div className="fixed inset-0 bg-black text-white overflow-hidden z-50">
        {/* Top Controls Bar */}
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
                  setFinishLines([]);
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

        {/* Video Library Sidebar */}
        {showVideoLibrary && (
          <div className="absolute top-0 left-0 w-80 h-full bg-black/90 backdrop-blur-sm z-40 border-r border-gray-800">
            <div className="p-4 pt-20">
              <h3 className="text-lg font-medium mb-4">Video Library</h3>
              <div className="space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto">
                {savedVideos.map((video, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg border cursor-pointer transition-colors border-gray-600 hover:border-gray-500"
                    onClick={() => {
                      // Load saved video functionality would go here
                      setShowVideoLibrary(false);
                    }}
                  >
                    <div className="text-sm font-medium text-white truncate">
                      Saved Video {index + 1}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date().toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Video Container */}
        <div 
          ref={containerRef} 
          className="w-full h-full relative cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
          onWheel={handleVideoWheel}
          onMouseDown={(e) => handleVideoPanStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleVideoPanMove(e.clientX, e.clientY)}
          onMouseUp={handleVideoPanEnd}
          onTouchStart={handleVideoTouchStart}
          onTouchMove={handleVideoTouchMove}
          onTouchEnd={handleVideoTouchEnd}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            poster={videoPoster}
            className="w-full h-full object-contain"
            style={{
              transform: `scale(${videoScale}) translate(${videoTranslate.x}px, ${videoTranslate.y}px)`,
            }}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleVideoLoad}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            controls={false}
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            playsInline
            webkit-playsinline="true"
            preload="metadata"
          />
          
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-auto cursor-crosshair"
            width={1920}
            height={1080}
            onClick={(e) => {
              if (mode === 'timer') {
                const rect = canvasRef.current?.getBoundingClientRect();
                if (rect) {
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  
                  const newTimer: TimerOverlay = {
                    id: Date.now().toString(),
                    x,
                    y,
                    startTime: currentTime,
                    visible: true
                  };
                  
                  setTimers(prev => [...prev, newTimer]);
                  setActiveTimer(newTimer.id);
                  setMode(null);
                }
              } else if (mode === 'finishline') {
                const rect = canvasRef.current?.getBoundingClientRect();
                if (rect) {
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const y = ((e.clientY - rect.top) / rect.height) * 100;
                  
                  const newFinishLine: FinishLine = {
                    id: Date.now().toString(),
                    nodes: [
                      { id: `node-${Date.now()}-1`, x: x - 2, y: y - 25 },
                      { id: `node-${Date.now()}-2`, x: x + 2, y: y + 25 }
                    ],
                    visible: true
                  };
                  
                  setFinishLines(prev => [...prev, newFinishLine]);
                  setActiveFinishLine(newFinishLine.id);
                  setMode(null);
                }
              }
            }}
          />
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Tools Bar */}
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
              variant={mode === 'finishline' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode(mode === 'finishline' ? null : 'finishline')}
              className="text-white hover:bg-white/20"
            >
              <Target className="w-4 h-4 mr-2" />
              Finish Line
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTimers([]);
                setFinishLines([]);
                setActiveTimer(null);
                setActiveFinishLine(null);
              }}
              className="text-white hover:bg-white/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>

          {/* Video Controls */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlayPause}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            
            <div className="text-sm text-white font-mono">
              {formatTime(currentTime)}
            </div>
            
            {/* Scrubber */}
            <div className="flex-1 relative">
              <div
                className="h-2 bg-gray-600 rounded-full cursor-pointer"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div
                  className="h-full bg-white rounded-full relative"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                >
                  <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-black" />
                </div>
              </div>
            </div>
            
            <div className="text-sm text-white font-mono">
              {formatTime(duration)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pb-16">
      <BackNavigation />
      
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
            onClick={() => setShowVideoLibrary(!showVideoLibrary)}
            className="flex items-center gap-2"
          >
            <FolderOpen className="h-4 w-4" />
            Video Library ({savedVideos.length})
          </Button>
          {currentVideo && (
            <Button
              onClick={saveVideo}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Video
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Video Library Sidebar */}
        {showVideoLibrary && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Video Library</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {`${savedVideos.length}/${getVideoLimit()}`} videos saved
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {savedVideos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No saved videos</p>
                  </div>
                ) : (
                  savedVideos.map(video => (
                    <div
                      key={video.id}
                      className="border rounded-lg p-3 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => loadSavedVideo(video)}
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.name}
                        className="w-full h-20 object-cover rounded mb-2"
                      />
                      <p className="font-medium text-sm truncate">{video.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(video.duration)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Video Area */}
        <div className={showVideoLibrary ? "lg:col-span-3" : "lg:col-span-4"}>
          <Card>
            <CardContent className="p-6">
              {!currentVideo ? (
                <div className="h-96 flex flex-col overflow-hidden">
                  {/* Header Image - Top Half */}
                  <div 
                    className="h-1/2 bg-cover bg-center bg-no-repeat relative"
                    style={{ backgroundImage: `url(${trackImagePath})` }}
                  >
                    <div className="absolute inset-0 bg-black/40" />
                  </div>
                  
                  {/* Content - Bottom Half */}
                  <div className="h-1/2 flex flex-col justify-center items-center text-center p-6 bg-background">
                    <h3 className="text-lg font-medium mb-2">Upload a race video</h3>
                    <p className="text-muted-foreground mb-4 text-sm">
                      Add timing overlays and finish line analysis to your race footage
                    </p>
                    
                    <div className="flex flex-col items-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        size="lg"
                        className="flex items-center gap-2"
                        disabled={uploading}
                      >
                        {uploading ? (
                          <>
                            <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-5 w-5" />
                            Upload Video
                          </>
                        )}
                      </Button>
                      
                      <VideoLimitsInfo />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Video Player Container */}
                  <div 
                    ref={containerRef} 
                    className="relative bg-black rounded-lg overflow-hidden cursor-grab active:cursor-grabbing w-full"
                    style={{ 
                      aspectRatio: '16/9',
                      touchAction: 'none',
                      height: 'auto',
                      maxHeight: '80vh'
                    }}
                    onWheel={handleVideoWheel}
                    onMouseDown={(e) => handleVideoPanStart(e.clientX, e.clientY)}
                    onMouseMove={(e) => handleVideoPanMove(e.clientX, e.clientY)}
                    onMouseUp={handleVideoPanEnd}
                    onTouchStart={handleVideoTouchStart}
                    onTouchMove={handleVideoTouchMove}
                    onTouchEnd={handleVideoTouchEnd}
                  >
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="w-full h-full object-cover"
                      onLoadedMetadata={handleVideoLoad}
                      onTimeUpdate={handleTimeUpdate}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      playsInline
                      disablePictureInPicture
                      controlsList="nodownload nofullscreen noremoteplayback"
                      webkit-playsinline="true"
                      style={{
                        transform: `scale(${videoScale}) translate(${videoTranslate.x}px, ${videoTranslate.y}px)`,
                        transformOrigin: 'center center',
                        transition: isPanning ? 'none' : 'transform 0.2s ease-out',
                        pointerEvents: 'none'
                      }}
                    />
                    
                    {/* Overlay Canvas */}
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full cursor-crosshair"
                      onClick={handleCanvasClick}
                      style={{ pointerEvents: selectedTool !== 'none' ? 'auto' : 'none' }}
                    />
                    
                    {/* Finish line drawing indicator */}
                    {isDrawingLine && (
                      <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                        Click to add nodes • Double-click to finish
                      </div>
                    )}
                  </div>

                  {/* Video Controls */}
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

                    {/* Custom Mobile-Friendly Video Scrub Slider */}
                    <div className="px-2">
                      <div className="relative py-2">
                        <div 
                          className="w-full h-6 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer relative overflow-hidden select-none"
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onTouchStart={handleTouchStart}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          style={{ touchAction: 'none' }}
                        >
                          {/* Progress bar */}
                          <div 
                            className="h-full bg-blue-500 rounded-lg transition-all duration-75"
                            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                          />
                          
                          {/* Slider thumb */}
                          <div 
                            className="absolute top-1/2 transform -translate-y-1/2 w-6 h-6 bg-blue-500 border-3 border-white rounded-full shadow-lg"
                            style={{ 
                              left: `calc(${(currentTime / (duration || 1)) * 100}% - 12px)`,
                              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)'
                            }}
                          />
                        </div>
                        
                        {/* Time markers */}
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>0:00.00</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Overlay Tools */}
                    <div className="flex flex-wrap items-center gap-2 p-4 bg-muted rounded-lg">
                      <Label className="font-medium">Overlay Tools:</Label>
                      
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
                        variant={selectedTool === 'finish-line' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTool(selectedTool === 'finish-line' ? 'none' : 'finish-line')}
                        className="flex items-center gap-2"
                      >
                        <Target className="h-4 w-4" />
                        Finish Line
                      </Button>
                      
                      {isDrawingLine && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={finishDrawingLine}
                          className="flex items-center gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Finish Line
                        </Button>
                      )}
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={clearOverlays}
                        className="flex items-center gap-2 ml-auto"
                        disabled={timers.length === 0 && finishLines.length === 0}
                      >
                        <Trash2 className="h-4 w-4" />
                        Clear All
                      </Button>
                    </div>

                    {/* Active Overlays Info */}
                    {(timers.length > 0 || finishLines.length > 0) && (
                      <div className="text-sm text-muted-foreground">
                        Active overlays: {timers.length} timer{timers.length !== 1 ? 's' : ''}, {finishLines.length} finish line{finishLines.length !== 1 ? 's' : ''}
                      </div>
                    )}
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