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
  Clock,
  Trash2
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

  // Video pan and zoom state
  const [videoScale, setVideoScale] = useState(1);
  const [videoPosition, setVideoPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [isSlowMo, setIsSlowMo] = useState(false);
  
  // Touch handling for pinch zoom
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialScale, setInitialScale] = useState(1);
  
  // Timer dragging state
  const [isDraggingTimer, setIsDraggingTimer] = useState(false);
  const [draggedTimerId, setDraggedTimerId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Preview frame functionality
  const [previewTime, setPreviewTime] = useState<number | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

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

  // Format timeline markers to show XX.XX format (seconds.tenths hundredths)
  const formatTimelineTime = (seconds: number) => {
    return seconds.toFixed(2);
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
    return seconds.toFixed(2);
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

  const handleTimelineHover = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const time = percentage * (duration || 0);
    setPreviewTime(time);
  };

  const handleTimelineLeave = () => {
    setPreviewTime(null);
  };



  // Timer drag handlers
  const handleTimerMouseDown = (event: React.MouseEvent, timerId: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    const timer = timers.find(t => t.id === timerId);
    if (!timer) return;
    
    setIsDraggingTimer(true);
    setDraggedTimerId(timerId);
    
    const container = videoContainerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const timerX = (timer.x / 100) * rect.width;
    const timerY = (timer.y / 100) * rect.height;
    
    setDragOffset({
      x: event.clientX - timerX,
      y: event.clientY - timerY
    });
  };

  const handleTimerTouchStart = (event: React.TouchEvent, timerId: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    const timer = timers.find(t => t.id === timerId);
    if (!timer) return;
    
    const touch = event.touches[0];
    setIsDraggingTimer(true);
    setDraggedTimerId(timerId);
    
    const container = videoContainerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const timerX = (timer.x / 100) * rect.width;
    const timerY = (timer.y / 100) * rect.height;
    
    setDragOffset({
      x: touch.clientX - timerX,
      y: touch.clientY - timerY
    });
  };

  // Delete timer function
  const deleteTimer = (timerId: string) => {
    setTimers(prev => prev.filter(timer => timer.id !== timerId));
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
    
    // Reset position if zooming back to 100%
    if (newScale === 1) {
      setVideoPosition({ x: 0, y: 0 });
    }
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
      
      // Calculate boundaries to keep video within container
      const container = videoContainerRef.current;
      if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const scaledWidth = containerWidth * videoScale;
        const scaledHeight = containerHeight * videoScale;
        
        const maxX = (scaledWidth - containerWidth) / 2;
        const maxY = (scaledHeight - containerHeight) / 2;
        
        setVideoPosition(prev => ({
          x: Math.max(-maxX, Math.min(maxX, prev.x + deltaX)),
          y: Math.max(-maxY, Math.min(maxY, prev.y + deltaY))
        }));
      }
      
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
    // Prevent page zoom/scroll for all touch interactions on video
    event.preventDefault();
    event.stopPropagation();
    
    if (event.touches.length === 2) {
      // Pinch zoom start
      const distance = getTouchDistance(event.touches[0], event.touches[1]);
      setInitialPinchDistance(distance);
      setInitialScale(videoScale);
      setIsPanning(false);
      
      // Set initial pan point for two-finger pan
      const midX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
      const midY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
      setLastPanPoint({ x: midX, y: midY });
    }
  };

  const handleVideoTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    // Prevent page zoom/scroll for all touch interactions
    event.preventDefault();
    event.stopPropagation();
    
    if (event.touches.length === 2 && initialPinchDistance !== null) {
      // Pinch zoom
      const currentDistance = getTouchDistance(event.touches[0], event.touches[1]);
      const scale = (currentDistance / initialPinchDistance) * initialScale;
      const newScale = Math.max(1, Math.min(5, scale));
      setVideoScale(newScale);
      
      // Reset position if zooming back to 100%
      if (newScale === 1) {
        setVideoPosition({ x: 0, y: 0 });
      }
      
      // Two-finger pan when zoomed
      if (videoScale > 1) {
        const midX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
        const midY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
        const deltaX = midX - lastPanPoint.x;
        const deltaY = midY - lastPanPoint.y;
        
        // Calculate boundaries to keep video within container
        const container = videoContainerRef.current;
        if (container) {
          const containerWidth = container.clientWidth;
          const containerHeight = container.clientHeight;
          const scaledWidth = containerWidth * videoScale;
          const scaledHeight = containerHeight * videoScale;
          
          const maxX = (scaledWidth - containerWidth) / 2;
          const maxY = (scaledHeight - containerHeight) / 2;
          
          setVideoPosition(prev => ({
            x: Math.max(-maxX, Math.min(maxX, prev.x + deltaX)),
            y: Math.max(-maxY, Math.min(maxY, prev.y + deltaY))
          }));
        }
        
        setLastPanPoint({ x: midX, y: midY });
      }
    }
  };

  const handleVideoTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    // Prevent page zoom/scroll for all touch interactions
    event.preventDefault();
    event.stopPropagation();
    
    setIsPanning(false);
    setInitialPinchDistance(null);
    setInitialScale(1);
  };

  // Prevent page zoom globally when in photo finish mode
  useEffect(() => {
    const preventPageZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const preventPagePinch = (e: Event) => {
      e.preventDefault();
    };

    // Add global touch event listeners to prevent page zoom
    document.addEventListener('touchstart', preventPageZoom, { passive: false });
    document.addEventListener('touchmove', preventPageZoom, { passive: false });
    document.addEventListener('gesturestart', preventPagePinch, { passive: false });
    document.addEventListener('gesturechange', preventPagePinch, { passive: false });
    document.addEventListener('gestureend', preventPagePinch, { passive: false });

    // Add CSS to body to prevent zoom
    document.body.style.touchAction = 'pan-x pan-y';
    document.body.style.userSelect = 'none';
    document.documentElement.style.touchAction = 'pan-x pan-y';

    return () => {
      // Clean up event listeners
      document.removeEventListener('touchstart', preventPageZoom);
      document.removeEventListener('touchmove', preventPageZoom);
      document.removeEventListener('gesturestart', preventPagePinch);
      document.removeEventListener('gesturechange', preventPagePinch);
      document.removeEventListener('gestureend', preventPagePinch);

      // Reset body styles
      document.body.style.touchAction = '';
      document.body.style.userSelect = '';
      document.documentElement.style.touchAction = '';
    };
  }, []);

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

  // Global mouse and touch handlers for timer dragging
  useEffect(() => {
    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (!isDraggingTimer || !draggedTimerId) return;
      
      const container = videoContainerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - dragOffset.x) / rect.width) * 100;
      const y = ((event.clientY - dragOffset.y) / rect.height) * 100;
      
      // Constrain timer within container bounds
      const constrainedX = Math.max(0, Math.min(100, x));
      const constrainedY = Math.max(0, Math.min(100, y));
      
      setTimers(prev => prev.map(timer => 
        timer.id === draggedTimerId 
          ? { ...timer, x: constrainedX, y: constrainedY }
          : timer
      ));
    };

    const handleGlobalMouseUp = () => {
      setIsDraggingTimer(false);
      setDraggedTimerId(null);
    };

    const handleGlobalTouchMove = (event: TouchEvent) => {
      if (!isDraggingTimer || !draggedTimerId || event.touches.length !== 1) return;
      
      const touch = event.touches[0];
      const container = videoContainerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const x = ((touch.clientX - dragOffset.x) / rect.width) * 100;
      const y = ((touch.clientY - dragOffset.y) / rect.height) * 100;
      
      // Constrain timer within container bounds
      const constrainedX = Math.max(0, Math.min(100, x));
      const constrainedY = Math.max(0, Math.min(100, y));
      
      setTimers(prev => prev.map(timer => 
        timer.id === draggedTimerId 
          ? { ...timer, x: constrainedX, y: constrainedY }
          : timer
      ));
    };

    const handleGlobalTouchEnd = () => {
      setIsDraggingTimer(false);
      setDraggedTimerId(null);
    };

    if (isDraggingTimer) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchmove', handleGlobalTouchMove);
      document.addEventListener('touchend', handleGlobalTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDraggingTimer, draggedTimerId, dragOffset]);

  // Handle video metadata load
  const handleVideoLoad = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setCurrentTime(0);
      // Show first frame immediately
      videoRef.current.currentTime = 0;
    }
  };



  return (
    <div 
      className="fixed inset-0 bg-black text-white flex flex-col"
      style={{ 
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    >
      {/* Close Button - Fixed Position */}
      <button
        onClick={onClose}
        className="fixed top-16 left-4 z-[9999] bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded font-medium text-sm border border-white shadow-lg"
        style={{ zIndex: 9999 }}
      >
        ✕ Close
      </button>
      
      {/* Video Title */}
      <div className="fixed top-16 left-24 z-[9998] bg-black/60 backdrop-blur-sm px-3 py-1 rounded">
        <h1 className="text-base font-semibold text-white">{videoName}</h1>
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
        style={{ 
          cursor: isPanning ? 'grabbing' : (videoScale > 1 ? 'grab' : 'default'),
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          msTouchAction: 'none'
        }}
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
          className="absolute inset-0 w-full h-full pointer-events-none"
          width={1920}
          height={1080}
          style={{ 
            transform: `scale(${videoScale}) translate(${videoPosition.x / videoScale}px, ${videoPosition.y / videoScale}px)`,
            transformOrigin: 'center center'
          }}
        />
        
        {/* Timer overlays - larger, moveable timers showing relative time */}
        {timers.map((timer) => {
          const relativeTime = currentTime - timer.startTime;
          
          return (
            <div
              key={timer.id}
              className="absolute bg-black/70 text-white px-4 py-2 text-lg font-mono cursor-move select-none group"
              style={{
                left: `${timer.x}%`,
                top: `${timer.y}%`,
                borderRadius: '6px',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                fontSize: '18px',
                fontWeight: 'bold',
                minWidth: '80px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseDown={(e) => handleTimerMouseDown(e, timer.id)}
              onTouchStart={(e) => handleTimerTouchStart(e, timer.id)}
            >
              <span>{relativeTime >= 0 ? '+' : ''}{formatTimerTime(relativeTime)}</span>
              <button
                className="opacity-70 hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  deleteTimer(timer.id);
                }}
                style={{ pointerEvents: 'auto' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
        
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
            className={`text-white text-xs ${isSlowMo ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-700'}`}
          >
            {isSlowMo ? '0.25x' : '1.0x'}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Automatically place timer at center of video when button is tapped
              const newTimer: VideoTimer = {
                id: Date.now().toString(),
                x: 50, // Center position
                y: 50,
                startTime: currentTime // Start from current video position
              };
              setTimers(prev => [...prev, newTimer]);
            }}
            className="text-white hover:bg-gray-700"
          >
            <Clock className="w-4 h-4" />
          </Button>
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
              onMouseMove={(e) => {
                handleTimelineMouseMove(e);
                handleTimelineHover(e);
              }}
              onMouseUp={handleTimelineMouseUp}
              onMouseLeave={handleTimelineLeave}
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
              
              {/* Time labels every 0.5 seconds using XX.XX format */}
              {duration && Array.from({ length: Math.floor(duration * 2) + 1 }, (_, i) => {
                const timeValue = i * 0.5;
                const timePosition = (timeValue / duration) * 100;
                const timeLabel = formatTimelineTime(timeValue);
                // Only show labels for whole seconds and half seconds
                if (i % 2 === 0 || timeValue % 1 === 0.5) {
                  return (
                    <div
                      key={`label-${i}`}
                      className="absolute bottom-1 text-xs text-gray-300 transform -translate-x-1/2 z-20"
                      style={{ left: `${timePosition}%` }}
                    >
                      {timeLabel}
                    </div>
                  );
                }
                return null;
              }).filter(Boolean)}
              
              {/* Preview time tooltip */}
              {previewTime !== null && (
                <div
                  className="absolute -top-8 bg-black text-white px-2 py-1 rounded text-xs font-mono transform -translate-x-1/2 z-30 pointer-events-none"
                  style={{ left: `${(previewTime / duration) * 100}%` }}
                >
                  {formatTimelineTime(previewTime)}
                </div>
              )}
              
              {/* Progress indicator */}
              <div
                className="absolute top-0 h-full bg-red-500 w-1 transform -translate-x-1/2 z-30 shadow-lg"
                style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
              
              {/* Current time indicator on scrubber */}
              <div
                className="absolute -top-6 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded z-30"
                style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              >
                {formatTimelineTime(currentTime)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}