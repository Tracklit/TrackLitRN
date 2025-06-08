import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { X, Play, Pause, Timer, FolderOpen, Save, MoreHorizontal, Brain } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface PhotoFinishVideo {
  id: number;
  title: string;
  videoUrl: string;
  createdAt: string;
}

interface RaceTimer {
  id: string;
  x: number;
  y: number;
  startTime: number;
}

interface PhotoFinishFullscreenProps {
  videoUrl: string | null;
  currentVideo: PhotoFinishVideo | null;
  onClose: () => void;
}

export default function PhotoFinishFullscreen({ 
  videoUrl, 
  currentVideo, 
  onClose 
}: PhotoFinishFullscreenProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // UI state
  const [showVideoLibrary, setShowVideoLibrary] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [mode, setMode] = useState<'timer' | null>(null);
  const [showSprinthiaPanel, setShowSprinthiaPanel] = useState(false);
  
  // Analysis state
  const [timers, setTimers] = useState<RaceTimer[]>([]);
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  
  // Zoom and pan state
  const [videoScale, setVideoScale] = useState(1);
  const [videoPosition, setVideoPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // Saved videos query
  const { data: savedVideos = [] } = useQuery({
    queryKey: ['/api/photo-finish-videos']
  });

  // Save video mutation
  const saveVideoMutation = useMutation({
    mutationFn: async (data: { title: string; timers: RaceTimer[] }) => {
      return apiRequest('/api/photo-finish-videos', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/photo-finish-videos'] });
      toast({ title: 'Video saved successfully' });
    }
  });

  // Format time in MM•SS•TH format
  const formatTime = (seconds: number) => {
    const sign = seconds < 0 ? '-' : '';
    const absSeconds = Math.abs(seconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = Math.floor(absSeconds % 60);
    const hundredths = Math.floor((absSeconds % 1) * 100);
    return `${sign}${mins.toString().padStart(2, '0')}•${secs.toString().padStart(2, '0')}•${hundredths.toString().padStart(2, '0')}`;
  };

  // Canvas overlay drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw timers
    timers.forEach(timer => {
      const posX = (timer.x / 100) * canvas.width;
      const posY = (timer.y / 100) * canvas.height;
      
      const elapsedTime = currentTime - timer.startTime;
      const text = formatTime(elapsedTime);
      
      const fontSize = 24;
      const paddingX = 12;
      const paddingY = 8;
      
      ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const metrics = ctx.measureText(text);
      const textWidth = metrics.width;
      const textHeight = fontSize;
      
      const bgWidth = textWidth + (paddingX * 2);
      const bgHeight = textHeight + (paddingY * 2);
      
      // Draw 50% transparent black background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.roundRect(
        posX - bgWidth / 2,
        posY - bgHeight / 2,
        bgWidth,
        bgHeight,
        8
      );
      ctx.fill();
      
      // Draw white text
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(text, posX, posY);
    });
  }, [timers, currentTime]);

  // Touch handlers for pinch-to-zoom and panning
  const [lastDistance, setLastDistance] = useState(0);
  
  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleCanvasTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (event.touches.length === 2) {
      event.preventDefault();
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      const distance = getDistance(touch1, touch2);
      
      setIsPanning(true);
      setLastPanPoint({ x: centerX, y: centerY });
      setLastDistance(distance);
    }
  };

  const handleCanvasTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (event.touches.length === 2 && isPanning) {
      event.preventDefault();
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      const distance = getDistance(touch1, touch2);

      // Handle zoom
      if (lastDistance > 0) {
        const scaleFactor = distance / lastDistance;
        const newScale = Math.max(0.5, Math.min(5, videoScale * scaleFactor));
        setVideoScale(newScale);
      }

      // Handle pan
      const deltaX = centerX - lastPanPoint.x;
      const deltaY = centerY - lastPanPoint.y;
      setVideoPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));

      setLastPanPoint({ x: centerX, y: centerY });
      setLastDistance(distance);
    }
  };

  const handleCanvasTouchEnd = () => {
    setIsPanning(false);
  };

  // Canvas click handler for adding timers
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode === 'timer') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      
      const newTimer: RaceTimer = {
        id: Date.now().toString(),
        x,
        y,
        startTime: currentTime
      };
      
      setTimers(prev => [...prev, newTimer]);
      setActiveTimer(newTimer.id);
      setMode(null);
    }
  };

  // Scrubber handlers
  const handleSliderInteraction = (clientX: number, element: HTMLDivElement) => {
    const rect = element.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const time = percentage * (duration || 0);
    
    if (videoRef.current && time >= 0 && time <= (duration || 0)) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
    handleSliderInteraction(event.clientX, event.currentTarget);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleSliderInteraction(event.clientX, event.currentTarget);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Play/pause toggle
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  // Save video
  const handleSaveVideo = () => {
    if (!currentVideo) return;
    
    saveVideoMutation.mutate({
      title: currentVideo.title,
      timers
    });
  };

  // Handle video metadata load
  const handleVideoLoad = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setCurrentTime(0);
      // Set video to first frame
      videoRef.current.currentTime = 0;
    }
  };

  // Auto-hide controls
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [showControls]);

  return (
    <div 
      className="fixed inset-0 bg-black z-50"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Top Controls Bar */}
      <div className={`absolute top-0 left-0 right-0 z-50 transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      } bg-gradient-to-b from-black/80 to-transparent p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
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
            {currentVideo?.title || 'Race Analysis'}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSprinthiaPanel(!showSprinthiaPanel)}
              className="text-white hover:bg-white/20"
            >
              <Brain className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveVideo}
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
            <h3 className="text-lg font-medium mb-4 text-white">Video Library</h3>
            <div className="space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto">
              {(savedVideos as PhotoFinishVideo[]).map((video: PhotoFinishVideo) => (
                <div
                  key={video.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    currentVideo?.id === video.id
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => {
                    setShowVideoLibrary(false);
                  }}
                >
                  <div className="text-sm font-medium text-white truncate">
                    {video.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(video.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Video Container */}
      <div className="w-full h-full relative" ref={containerRef}>
        <video
          ref={videoRef}
          src={videoUrl || ''}
          className="w-full h-full object-contain"
          style={{
            transform: `scale(${videoScale}) translate(${videoPosition.x}px, ${videoPosition.y}px)`,
          }}
          onLoadedMetadata={handleVideoLoad}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime);
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          controls={false}
          preload="metadata"
        />
        
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-auto cursor-crosshair"
          onClick={handleCanvasClick}
          onTouchStart={handleCanvasTouchStart}
          onTouchMove={handleCanvasTouchMove}
          onTouchEnd={handleCanvasTouchEnd}
        />
      </div>

      {/* Bottom Controls */}
      <div className={`absolute bottom-0 left-0 right-0 z-50 transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      } bg-gradient-to-t from-black/80 to-transparent p-4`}>
        <div className="flex items-center gap-4 mb-4">
          {/* Timer Mode Button */}
          <Button
            variant={mode === 'timer' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode(mode === 'timer' ? null : 'timer')}
            className="text-white hover:bg-white/20"
          >
            <Timer className="w-4 h-4 mr-2" />
            Timer
          </Button>
        </div>

        {/* Video Scrubber */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePlayPause}
            className="text-white hover:bg-white/20"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          
          <div className="text-sm text-white font-mono">
            {formatTime(currentTime)}
          </div>
          
          <div 
            className="flex-1 h-2 bg-gray-600 rounded-full cursor-pointer relative"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <div 
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            />
          </div>
          
          <div className="text-sm text-white font-mono">
            {formatTime(duration)}
          </div>
        </div>
      </div>

      {/* Sprinthia AI Analysis Panel */}
      {showSprinthiaPanel && (
        <div className="absolute top-0 right-0 w-96 h-full bg-black/95 border-l border-gray-700 z-50 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Sprinthia AI</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSprinthiaPanel(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="text-center text-gray-400 py-8">
              AI video analysis feature will be available soon
            </div>
          </div>
        </div>
      )}
    </div>
  );
}