import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Play, 
  Pause, 
  FolderOpen, 
  Save, 
  MoreHorizontal,
  Upload,
  Timer,
  MapPin,
  Trash2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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

interface FinishLine {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
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
  const [showVideoLibrary, setShowVideoLibrary] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [mode, setMode] = useState<'timer' | 'finishline' | null>(null);
  
  // Analysis state
  const [timers, setTimers] = useState<RaceTimer[]>([]);
  const [finishLines, setFinishLines] = useState<FinishLine[]>([]);
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [activeFinishLine, setActiveFinishLine] = useState<string | null>(null);
  
  // Zoom and pan state
  const [videoScale, setVideoScale] = useState(1);
  const [videoTranslate, setVideoTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // Load saved videos
  const { data: savedVideos = [] } = useQuery({
    queryKey: ['/api/photo-finish-videos'],
    enabled: showVideoLibrary
  });

  // Save video mutation
  const saveVideoMutation = useMutation({
    mutationFn: (data: { title: string; timers: RaceTimer[]; finishLines: FinishLine[] }) =>
      apiRequest('POST', '/api/photo-finish-videos', data),
    onSuccess: () => {
      toast({ title: 'Video saved successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/photo-finish-videos'] });
    },
    onError: () => {
      toast({ title: 'Failed to save video', variant: 'destructive' });
    }
  });

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
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

  // Draw overlays on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawOverlays = () => {
      // Clear the entire canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // NEW TIMER IMPLEMENTATION: Pure white text with drop shadow only
      timers.forEach(timer => {
        const elapsedTime = currentTime - timer.startTime;
        const posX = (timer.x / 100) * canvas.width;
        const posY = (timer.y / 100) * canvas.height;

        // Calculate responsive font size
        const textSize = Math.max(canvas.width * 0.04, 28);
        
        // Setup font to match app design
        ctx.font = `bold ${textSize}px Inter, system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Apply subtle drop shadow for readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        // TRANSPARENT TIMER: Only white text with shadow
        ctx.fillStyle = '#ffffff';
        ctx.fillText(formatTime(elapsedTime), posX, posY);
        
        // DEBUG: Ensure no background drawing occurs
        
        // Reset shadow properties
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      });

      // Draw finish lines as vertical lines
      finishLines.forEach(line => {
        const x = (line.x / 100) * canvas.width;
        const y1 = (line.y / 100) * canvas.height;
        const y2 = ((line.y + line.height) / 100) * canvas.height;

        ctx.strokeStyle = activeFinishLine === line.id ? '#ff0000' : '#00ff00';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
        ctx.stroke();
      });
    };

    drawOverlays();
  }, [timers, finishLines, currentTime, activeTimer, activeFinishLine]);

  // Touch handlers for pinch-to-zoom, two-finger panning and one-finger finish line dragging
  const [lastDistance, setLastDistance] = useState(0);

  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleCanvasTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (event.touches.length === 2) {
      // Two-finger gestures (pinch-to-zoom and pan)
      event.preventDefault();
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      const distance = getDistance(touch1, touch2);
      
      setIsPanning(true);
      setLastPanPoint({ x: centerX, y: centerY });
      setLastDistance(distance);
    } else if (event.touches.length === 1 && videoScale > 1) {
      // Single finger - check for finish line drag when zoomed
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const touch = event.touches[0];
      const x = ((touch.clientX - rect.left) / rect.width) * 100;
      const y = ((touch.clientY - rect.top) / rect.height) * 100;

      // Check if touching a finish line (expanded hit area)
      const clickedLine = finishLines.find(line => {
        const lineX = line.x;
        const hitAreaWidth = 5; // Percentage-based hit area
        return x >= lineX - hitAreaWidth && x <= lineX + hitAreaWidth &&
               y >= line.y && y <= line.y + line.height;
      });

      if (clickedLine) {
        event.preventDefault();
        setIsDraggingFinishLine(true);
        setDraggedLineId(clickedLine.id);
        setActiveFinishLine(clickedLine.id);
      }
    }
  };

  const handleCanvasTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (event.touches.length === 2 && isPanning) {
      // Two-finger gestures (pinch-to-zoom and pan)
      event.preventDefault();
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      const distance = getDistance(touch1, touch2);
      
      // Handle pinch-to-zoom
      if (lastDistance > 0) {
        const scale = distance / lastDistance;
        const newScale = Math.max(0.5, Math.min(3, videoScale * scale));
        setVideoScale(newScale);
      }
      
      // Handle panning
      const deltaX = centerX - lastPanPoint.x;
      const deltaY = centerY - lastPanPoint.y;
      
      setVideoTranslate(prev => ({
        x: prev.x + deltaX / videoScale,
        y: prev.y + deltaY / videoScale
      }));
      
      setLastPanPoint({ x: centerX, y: centerY });
      setLastDistance(distance);
    } else if (event.touches.length === 1 && isDraggingFinishLine && draggedLineId) {
      // Single finger finish line dragging
      event.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const touch = event.touches[0];
      const x = ((touch.clientX - rect.left) / rect.width) * 100;

      // Move the finish line horizontally
      setFinishLines(prev => prev.map(line => 
        line.id === draggedLineId 
          ? { ...line, x: Math.max(0, Math.min(98, x)) }
          : line
      ));
    }
  };

  const handleCanvasTouchEnd = () => {
    setIsPanning(false);
    setIsDraggingFinishLine(false);
    setDraggedLineId(null);
  };

  // Mouse drag handlers for finish line movement
  const [isDraggingFinishLine, setIsDraggingFinishLine] = useState(false);
  const [draggedLineId, setDraggedLineId] = useState<string | null>(null);

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    // Check if clicking on a finish line (expanded hit area)
    const clickedLine = finishLines.find(line => {
      const lineX = line.x;
      const hitAreaWidth = 5; // Percentage-based hit area
      return x >= lineX - hitAreaWidth && x <= lineX + hitAreaWidth &&
             y >= line.y && y <= line.y + line.height;
    });

    if (clickedLine) {
      setIsDraggingFinishLine(true);
      setDraggedLineId(clickedLine.id);
      setActiveFinishLine(clickedLine.id);
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingFinishLine || !draggedLineId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;

    // Move the finish line horizontally
    setFinishLines(prev => prev.map(line => 
      line.id === draggedLineId 
        ? { ...line, x: Math.max(0, Math.min(98, x - 1)) }
        : line
    ));
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingFinishLine(false);
    setDraggedLineId(null);
  };

  // Handle canvas interactions
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    if (mode === 'timer') {
      const newTimer: RaceTimer = {
        id: Date.now().toString(),
        x,
        y,
        startTime: currentTime
      };
      setTimers(prev => [...prev, newTimer]);
      setActiveTimer(newTimer.id);
      setMode(null);
    } else if (mode === 'finishline') {
      // Only allow one finish line - replace existing one
      const newFinishLine: FinishLine = {
        id: Date.now().toString(),
        x: x - 1,
        y: 10,
        width: 2,
        height: 80
      };
      setFinishLines([newFinishLine]); // Replace all with single line
      setActiveFinishLine(newFinishLine.id);
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
    
    // Auto-start video only on first interaction
    if (videoRef.current && !hasStartedVideo) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        setHasStartedVideo(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    } else if (videoRef.current && !videoRef.current.paused) {
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
      timers,
      finishLines
    });
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
      className="fixed inset-0 bg-black text-white overflow-hidden"
      onMouseMove={() => setShowControls(true)}
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
              onClick={handleSaveVideo}
              className="text-white hover:bg-white/20"
            >
              <Save className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <MoreHorizontal className="w-5 h-5" />
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
              {savedVideos.map((video: PhotoFinishVideo) => (
                <div
                  key={video.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    currentVideo?.id === video.id
                      ? 'border-blue-500 bg-blue-500/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => {
                    // Load saved video logic would go here
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
            transform: `scale(${videoScale}) translate(${videoTranslate.x}px, ${videoTranslate.y}px)`,
          }}
        />
        
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-auto cursor-crosshair"
          width={1920}
          height={1080}
          onClick={handleCanvasClick}
          onTouchStart={handleCanvasTouchStart}
          onTouchMove={handleCanvasTouchMove}
          onTouchEnd={handleCanvasTouchEnd}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
        />

        {/* Play/Pause Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Button
            variant="ghost"
            size="lg"
            onClick={togglePlayPause}
            className={`pointer-events-auto transition-opacity duration-300 ${
              showControls && !isPlaying ? 'opacity-100' : 'opacity-0'
            } bg-black/50 hover:bg-black/70 text-white`}
          >
            <Play className="w-8 h-8" />
          </Button>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className={`absolute bottom-0 left-0 right-0 z-50 transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      } bg-gradient-to-t from-black/80 to-transparent p-4`}>
        
        {/* Tools Bar */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <Button
            variant={mode === 'timer' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode(mode === 'timer' ? null : 'timer')}
            className="text-white hover:bg-white/20"
          >
            <Timer className="w-4 h-4 mr-2" />
            Add Timer
          </Button>
          
          <Button
            variant={mode === 'finishline' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setMode(mode === 'finishline' ? null : 'finishline')}
            className="text-white hover:bg-white/20"
          >
            <MapPin className="w-4 h-4 mr-2" />
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
            Clear All
          </Button>
        </div>

        {/* Scrubber and Controls */}
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