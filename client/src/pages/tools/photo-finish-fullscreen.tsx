import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Play, 
  Pause, 
  SkipBack,
  SkipForward,
  Volume2,
  Timer,
  Zap,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VideoTimer {
  id: string;
  x: number;
  y: number;
  startTime: number;
}

interface PhotoFinishFullscreenProps {
  videoUrl: string;
  videoName: string;
  onClose: () => void;
}

export default function PhotoFinishFullscreen({ 
  videoUrl, 
  videoName,
  onClose 
}: PhotoFinishFullscreenProps) {
  const { toast } = useToast();
  
  // Video refs
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [timers, setTimers] = useState<VideoTimer[]>([]);
  const [isTimerMode, setIsTimerMode] = useState(false);

  // Video pan and zoom state
  const [videoScale, setVideoScale] = useState(1);
  const [videoPosition, setVideoPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [isSlowMo, setIsSlowMo] = useState(false);
  
  // Touch handling for pinch zoom
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialScale, setInitialScale] = useState(1);

  // Timeline refs
  const timelineRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Video control functions
  const togglePlayPause = async () => {
    if (videoRef.current && videoUrl) {
      try {
        const video = videoRef.current;
        if (isPlaying) {
          video.pause();
        } else {
          if (video.readyState >= 2) {
            await video.play();
          } else {
            toast({
              title: "Video Loading",
              description: "Please wait for the video to load completely.",
              variant: "default",
            });
          }
        }
      } catch (error) {
        console.error('Error toggling video playback:', error);
        toast({
          title: "Playback Error", 
          description: "Unable to play video. The video file may be corrupted or unsupported.",
          variant: "destructive",
        });
      }
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
    }
  };

  const toggleSlowMo = () => {
    if (videoRef.current) {
      const newSlowMo = !isSlowMo;
      setIsSlowMo(newSlowMo);
      videoRef.current.playbackRate = newSlowMo ? 0.25 : 1.0;
    }
  };

  const formatTimerTime = (seconds: number) => {
    return seconds.toFixed(3) + 's';
  };

  // Timeline handlers  
  const handleTimelineInteraction = (clientX: number, element: HTMLDivElement) => {
    const rect = element.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const time = percentage * (duration || 0);
    
    if (videoRef.current && time >= 0 && time <= (duration || 0)) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Video canvas click handler for timer placement
  const handleVideoClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isTimerMode) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    const newTimer: VideoTimer = {
      id: Date.now().toString(),
      x,
      y,
      startTime: currentTime
    };
    
    setTimers(prev => [...prev, newTimer]);
    setIsTimerMode(false);
  };

  const handleTimelineMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
    handleTimelineInteraction(event.clientX, event.currentTarget);
  };

  const handleTimelineMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleTimelineInteraction(event.clientX, event.currentTarget);
    }
  };

  const handleTimelineMouseUp = () => {
    setIsDragging(false);
  };

  const handleTimelineTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
    const touch = event.touches[0];
    handleTimelineInteraction(touch.clientX, event.currentTarget);
  };

  const handleTimelineTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (isDragging && event.touches.length === 1) {
      event.preventDefault();
      const touch = event.touches[0];
      handleTimelineInteraction(touch.clientX, event.currentTarget);
    }
  };

  const handleTimelineTouchEnd = () => {
    setIsDragging(false);
  };

  // Video zoom and pan handlers
  const handleVideoWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY * -0.01;
    const newScale = Math.max(1, Math.min(5, videoScale + delta));
    setVideoScale(newScale);
  };

  const handleVideoMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (videoScale > 1) {
      setIsPanning(true);
      setLastPanPoint({ x: event.clientX, y: event.clientY });
    }
  };

  const handleVideoMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning && videoScale > 1) {
      const deltaX = event.clientX - lastPanPoint.x;
      const deltaY = event.clientY - lastPanPoint.y;
      
      setVideoPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastPanPoint({ x: event.clientX, y: event.clientY });
    }
  };

  const handleVideoMouseUp = () => {
    setIsPanning(false);
  };

  // Helper function to get distance between two touches
  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Touch handlers for mobile zoom and pan
  const handleVideoTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) {
      // Pinch zoom start
      const distance = getTouchDistance(event.touches[0], event.touches[1]);
      setInitialPinchDistance(distance);
      setInitialScale(videoScale);
      setIsPanning(false);
    } else if (event.touches.length === 1 && videoScale > 1) {
      // Single touch pan
      setIsPanning(true);
      const touch = event.touches[0];
      setLastPanPoint({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleVideoTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    if (event.touches.length === 2 && initialPinchDistance !== null) {
      // Pinch zoom
      const currentDistance = getTouchDistance(event.touches[0], event.touches[1]);
      const scale = (currentDistance / initialPinchDistance) * initialScale;
      const newScale = Math.max(1, Math.min(5, scale));
      setVideoScale(newScale);
    } else if (isPanning && event.touches.length === 1 && videoScale > 1) {
      // Single touch pan
      const touch = event.touches[0];
      const deltaX = touch.clientX - lastPanPoint.x;
      const deltaY = touch.clientY - lastPanPoint.y;
      
      setVideoPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastPanPoint({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleVideoTouchEnd = () => {
    setIsPanning(false);
    setInitialPinchDistance(null);
    setInitialScale(1);
  };

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoUrl]);

  // Handle video metadata load
  const handleVideoLoad = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setCurrentTime(0);
    }
  };

  // Draw timer overlays on canvas
  useEffect(() => {
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
      
      // Format time
      const sign = elapsedTime < 0 ? '-' : '';
      const absSeconds = Math.abs(elapsedTime);
      const mins = Math.floor(absSeconds / 60);
      const secs = Math.floor(absSeconds % 60);
      const hundredths = Math.floor((absSeconds % 1) * 100);
      const text = `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
      
      // Draw timer background
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      const metrics = ctx.measureText(text);
      const padding = 8;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(
        posX - metrics.width/2 - padding,
        posY - 10 - padding,
        metrics.width + padding * 2,
        20 + padding * 2
      );
      
      // Draw timer text
      ctx.fillStyle = 'white';
      ctx.fillText(text, posX, posY);
    });
  }, [timers, currentTime]);

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">{videoName}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={isTimerMode ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsTimerMode(!isTimerMode)}
            className="text-white hover:bg-white/20"
          >
            <Timer className="w-5 h-5 mr-2" />
            Timer
          </Button>
        </div>
      </div>

      {/* Video Container - takes remaining space */}
      <div 
        ref={videoContainerRef}
        className="flex-1 relative bg-black flex items-center justify-center overflow-hidden"
        onWheel={handleVideoWheel}
        onMouseDown={handleVideoMouseDown}
        onMouseMove={handleVideoMouseMove}
        onMouseUp={handleVideoMouseUp}
        onTouchStart={handleVideoTouchStart}
        onTouchMove={handleVideoTouchMove}
        onTouchEnd={handleVideoTouchEnd}
        style={{ cursor: isPanning ? 'grabbing' : (videoScale > 1 ? 'grab' : 'default') }}
      >
        <video
          ref={videoRef}
          src={videoUrl || ''}
          className="max-w-full max-h-full object-contain pointer-events-none"
          style={{
            transform: `scale(${videoScale}) translate(${videoPosition.x / videoScale}px, ${videoPosition.y / videoScale}px)`,
            transformOrigin: 'center center'
          }}
          preload="metadata"
          playsInline
          onLoadedMetadata={handleVideoLoad}
          onLoadedData={() => {
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
            }
          }}
          onTimeUpdate={() => {
            if (videoRef.current) {
              setCurrentTime(videoRef.current.currentTime);
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={(e) => {
            console.error('Video error:', e);
            toast({
              title: "Video Error",
              description: "Failed to load the video file.",
              variant: "destructive",
            });
          }}
          controls={false}
        />
        
        {/* Canvas overlay for timers */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-auto"
          width={1920}
          height={1080}
          onClick={handleVideoClick}
          style={{ 
            cursor: isTimerMode ? 'crosshair' : 'inherit',
            transform: `scale(${videoScale}) translate(${videoPosition.x / videoScale}px, ${videoPosition.y / videoScale}px)`,
            transformOrigin: 'center center'
          }}
        />
        
        {/* Timer overlays */}
        {timers.map((timer) => (
          <div
            key={timer.id}
            className="absolute bg-red-500 text-white px-2 py-1 rounded text-sm font-mono pointer-events-none"
            style={{
              left: `${timer.x}%`,
              top: `${timer.y}%`,
              transform: `scale(${videoScale}) translate(${videoPosition.x / videoScale}px, ${videoPosition.y / videoScale}px)`,
              transformOrigin: 'center center'
            }}
          >
            {formatTimerTime(timer.startTime)}
          </div>
        ))}
        
        {/* Zoom indicator */}
        {videoScale > 1 && (
          <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
            {Math.round(videoScale * 100)}%
          </div>
        )}
      </div>

      {/* Controls above timeline */}
      <div className="bg-gray-900 border-t border-gray-700 px-6 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePlayPause}
            className="text-white hover:bg-gray-700"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSlowMo}
            className={`text-white ${isSlowMo ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-700'}`}
          >
            <Zap className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsTimerMode(!isTimerMode)}
            className={`text-white ${isTimerMode ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-gray-700'}`}
          >
            <Clock className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="text-white text-sm font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Timeline Scrubber - No background bar */}
      <div className="bg-gray-900 h-32 flex-shrink-0">
        <div className="p-6 h-full">
          {/* Timeline with vertical markers */}
          <div className="h-full relative">
            <div
              ref={timelineRef}
              className="h-full cursor-pointer relative"
              onMouseDown={handleTimelineMouseDown}
              onMouseMove={handleTimelineMouseMove}
              onMouseUp={handleTimelineMouseUp}
              onTouchStart={handleTimelineTouchStart}
              onTouchMove={handleTimelineTouchMove}
              onTouchEnd={handleTimelineTouchEnd}
            >
              {/* Vertical time markers (every 0.5 seconds) */}
              {duration && Array.from({ length: Math.floor(duration * 2) }, (_, i) => {
                const timePosition = (i * 0.5) / duration * 100;
                const isSecondMark = i % 2 === 0;
                return (
                  <div
                    key={i}
                    className={`absolute top-0 z-10 ${isSecondMark ? 'h-full bg-gray-400' : 'h-3/4 bg-gray-500'} w-px`}
                    style={{ left: `${timePosition}%` }}
                  />
                );
              })}
              
              {/* Time labels every 5 seconds */}
              {duration && Array.from({ length: Math.floor(duration / 5) + 1 }, (_, i) => {
                const timePosition = (i * 5) / duration * 100;
                const timeLabel = formatTime(i * 5);
                return (
                  <div
                    key={`label-${i}`}
                    className="absolute bottom-1 text-xs text-gray-300 transform -translate-x-1/2 z-20"
                    style={{ left: `${timePosition}%` }}
                  >
                    {timeLabel}
                  </div>
                );
              })}
              
              {/* Progress indicator */}
              <div
                className="absolute top-0 h-full bg-red-500 w-1 transform -translate-x-1/2 z-30 shadow-lg"
                style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
              
              {/* Current time indicator */}
              <div
                className="absolute -top-6 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded z-30"
                style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              >
                {formatTime(currentTime)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}