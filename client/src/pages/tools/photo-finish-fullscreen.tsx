import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Play, 
  Pause, 
  Timer,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RaceTimer {
  id: string;
  x: number;
  y: number;
  startTime: number;
}

interface PhotoFinishFullscreenProps {
  videoUrl: string | null;
  currentVideo: File | null;
  onClose: () => void;
}

export default function PhotoFinishFullscreen({ 
  videoUrl, 
  currentVideo, 
  onClose 
}: PhotoFinishFullscreenProps) {
  const { toast } = useToast();
  
  // Video refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasStartedVideo, setHasStartedVideo] = useState(false);
  
  // UI state
  const [showControls, setShowControls] = useState(true);
  const [mode, setMode] = useState<'timer' | null>(null);
  
  // Analysis state
  const [timers, setTimers] = useState<RaceTimer[]>([]);
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  
  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const hundredths = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
  };

  // Video control functions
  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
      setHasStartedVideo(true);
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const seekTo = useCallback((time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  // Timer management
  const addTimer = useCallback((x: number, y: number) => {
    const newTimer: RaceTimer = {
      id: `timer-${Date.now()}`,
      x,
      y,
      startTime: currentTime
    };
    setTimers(prev => [...prev, newTimer]);
    setActiveTimer(newTimer.id);
    
    toast({
      title: "Timer added",
      description: `Race timer placed at ${formatTime(currentTime)}`,
    });
  }, [currentTime, toast]);

  const removeTimer = useCallback((timerId: string) => {
    setTimers(prev => prev.filter(t => t.id !== timerId));
    if (activeTimer === timerId) {
      setActiveTimer(null);
    }
  }, [activeTimer]);

  const clearAllTimers = useCallback(() => {
    setTimers([]);
    setActiveTimer(null);
    toast({
      title: "Timers cleared",
      description: "All timers have been removed",
    });
  }, [toast]);

  // Canvas drawing
  const drawOverlays = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw timers
    timers.forEach(timer => {
      const elapsedTime = currentTime - timer.startTime;
      const posX = (timer.x / 100) * canvas.width;
      const posY = (timer.y / 100) * canvas.height;
      
      // Format time in MM•SS•TH format (minutes, seconds, tenths+hundredths)
      const sign = elapsedTime < 0 ? '-' : '';
      const absSeconds = Math.abs(elapsedTime);
      const mins = Math.floor(absSeconds / 60);
      const secs = Math.floor(absSeconds % 60);
      const hundredths = Math.floor((absSeconds % 1) * 100);
      const text = `${sign}${mins.toString().padStart(2, '0')}•${secs.toString().padStart(2, '0')}•${hundredths.toString().padStart(2, '0')}`;
      
      // Larger font for fullscreen mode
      const fontSize = 56; // Bigger for fullscreen
      
      // Set font
      ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Measure text for background
      const metrics = ctx.measureText(text);
      const textWidth = metrics.width;
      const textHeight = fontSize;
      const paddingX = 20;
      const paddingY = 16;
      const bgWidth = textWidth + (paddingX * 2);
      const bgHeight = textHeight + (paddingY * 2);
      const cornerRadius = 28; // More rounded corners for modern look
      
      // Draw 50% transparent black rounded background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
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
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;
      
      // Redraw background with shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
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
      
      // Draw text
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(text, posX, posY);
    });
  }, [currentTime, timers]);

  // Canvas click handler
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'timer') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    addTimer(x, y);
    setMode(null);
  }, [mode, addTimer]);

  // Video event handlers
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || isDragging) return;
    setCurrentTime(videoRef.current.currentTime);
  }, [isDragging]);

  const handleLoadedMetadata = useCallback(() => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    
    // Sync canvas size with video
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
    }
  }, []);

  // Progress bar handlers
  const handleProgressClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    seekTo(newTime);
  }, [duration, seekTo]);

  const handleProgressMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleProgressMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        togglePlayPause();
      } else if (event.code === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlayPause, onClose]);

  // Update canvas overlay
  useEffect(() => {
    drawOverlays();
  }, [drawOverlays]);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const hideControls = () => {
      if (isPlaying && hasStartedVideo) {
        setShowControls(false);
      }
    };
    
    const showControlsTemp = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(hideControls, 3000);
    };
    
    if (isPlaying && hasStartedVideo) {
      timeout = setTimeout(hideControls, 3000);
    }
    
    const handleMouseMove = () => {
      if (isPlaying && hasStartedVideo) {
        showControlsTemp();
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isPlaying, hasStartedVideo]);

  if (!videoUrl) return null;

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden z-50">
      {/* Video Container */}
      <div ref={containerRef} className="relative w-full h-full">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={togglePlayPause}
        />
        
        {/* Overlay Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-contain pointer-events-auto"
          style={{ 
            cursor: mode === 'timer' ? 'crosshair' : 'default',
            zIndex: 10
          }}
          onClick={handleCanvasClick}
        />
      </div>

      {/* Controls Overlay */}
      <div className={`
        absolute inset-0 pointer-events-none transition-opacity duration-300
        ${showControls ? 'opacity-100' : 'opacity-0'}
      `}>
        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4 pointer-events-auto">
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
            </div>

            <div className="text-white font-medium">
              Race Analysis
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={mode === 'timer' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode(mode === 'timer' ? null : 'timer')}
                className="text-white hover:bg-white/20"
              >
                <Timer className="w-5 h-5" />
              </Button>
              
              {timers.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllTimers}
                  className="text-white hover:bg-white/20"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-auto">
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

            <div className="flex-1 px-2">
              <div
                className="relative h-2 bg-white/20 rounded-full cursor-pointer"
                onClick={handleProgressClick}
                onMouseDown={handleProgressMouseDown}
                onMouseUp={handleProgressMouseUp}
              >
                <div
                  className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all duration-150"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="text-sm text-white font-mono">
              {formatTime(duration)}
            </div>
          </div>
        </div>
      </div>

      {/* Mode Instructions */}
      {mode === 'timer' && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 text-white px-4 py-2 rounded-lg">
          <p className="text-sm">Click on the video to place a timer</p>
        </div>
      )}
    </div>
  );
}