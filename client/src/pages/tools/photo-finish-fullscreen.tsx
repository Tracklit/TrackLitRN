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
  Trash2,
  Brain,
  Sparkles
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
  const [videoPoster, setVideoPoster] = useState<string>("");
  
  // UI state
  const [showVideoLibrary, setShowVideoLibrary] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [mode, setMode] = useState<'timer' | 'finishline' | null>(null);
  const [showSprinthiaPanel, setShowSprinthiaPanel] = useState(false);
  
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
  const { data: savedVideos = [] } = useQuery<PhotoFinishVideo[]>({
    queryKey: ['/api/photo-finish-videos'],
    enabled: showVideoLibrary
  });

  // Sprinthia AI queries
  const { data: analysisTypes = [] } = useQuery({
    queryKey: ['/api/sprinthia/analysis-types'],
    enabled: showSprinthiaPanel
  });

  const { data: sprinthiaLimits } = useQuery({
    queryKey: ['/api/sprinthia/limits'],
    enabled: showSprinthiaPanel
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

  // Sprinthia AI analysis mutation
  const analyzeMutation = useMutation({
    mutationFn: (data: { videoName: string; analysisType: string; videoTimestamp?: number }) =>
      apiRequest('POST', '/api/sprinthia/analyze', data),
    onSuccess: (result) => {
      toast({ title: 'Analysis complete!' });
      queryClient.invalidateQueries({ queryKey: ['/api/sprinthia/limits'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Analysis failed', 
        description: error.message || 'Unable to analyze video',
        variant: 'destructive' 
      });
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
      // Sleek timer implementation matching the design
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
        
        // Setup bold, clean font
        ctx.font = `900 ${fontSize}px 'Inter', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const metrics = ctx.measureText(text);
        const textWidth = metrics.width;
        const textHeight = fontSize * 0.8; // Better text height calculation
        
        // Generous padding for sleek look
        const paddingX = 48; // Larger for fullscreen
        const paddingY = 28;
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
        
        // Add subtle shadow effect
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
        
        // Reset shadow for text
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw crisp white text
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(text, posX, posY);
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
    } else if (event.touches.length === 1) {
      // Single finger - check for finish line drag
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const touch = event.touches[0];
      const x = ((touch.clientX - rect.left) / rect.width) * 100;
      const y = ((touch.clientY - rect.top) / rect.height) * 100;
      // Check if touching a finish line (expanded hit area)
      const clickedLine = finishLines.find(line => {
        const lineX = line.x;
        const hitAreaWidth = 8; // Larger hit area for easier touch
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
      
      // Handle panning when zoomed
      if (videoScale > 1) {
        const deltaX = centerX - lastPanPoint.x;
        const deltaY = centerY - lastPanPoint.y;
        
        setVideoTranslate(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));
      }
      
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
          ? { ...line, x: Math.max(1, Math.min(99, x)) }
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
    // Don't place new elements if we're dragging
    if (isDraggingFinishLine) return;
    
    const canvas = canvasRef.current;
    if (!canvas || !mode) return;
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
    }
    // Finish line functionality disabled
    // else if (mode === 'finishline') {
    //   // Functionality temporarily disabled
    // }
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
      timers,
      finishLines
    });
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
  // Handle video metadata load and generate thumbnail
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
              {(savedVideos as PhotoFinishVideo[]).map((video: PhotoFinishVideo) => (
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
          poster={videoPoster}
          className="w-full h-full object-contain"
          style={{
            transform: `scale(${videoScale}) translate(${videoTranslate.x}px, ${videoTranslate.y}px)`,
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
            variant="ghost"
            size="sm"
            disabled={true}
            className="text-gray-500 cursor-not-allowed opacity-50"
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

          <Button
            variant={showSprinthiaPanel ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setShowSprinthiaPanel(!showSprinthiaPanel)}
            className="text-white hover:bg-white/20"
          >
            <Brain className="w-4 h-4 mr-2" />
            Sprinthia AI
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
            {`${Math.floor(currentTime / 60)}:${(currentTime % 60).toFixed(2).padStart(5, '0')}`}
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
            {`${Math.floor(duration / 60)}:${(duration % 60).toFixed(2).padStart(5, '0')}`}
          </div>
        </div>
      </div>

      {/* Sprinthia AI Analysis Panel */}
      {showSprinthiaPanel && (
        <div className="fixed top-0 right-0 w-96 h-full bg-black/95 border-l border-gray-700 z-50 overflow-y-auto">
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

            {/* User Limits Display */}
            {sprinthiaLimits && (
              <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-300 mb-2">
                  Tier: <span className="text-white capitalize">{sprinthiaLimits.tier}</span>
                </div>
                <div className="text-sm text-gray-300">
                  Remaining: {
                    sprinthiaLimits.remainingPrompts === 'unlimited' 
                      ? 'Unlimited' 
                      : `${sprinthiaLimits.remainingPrompts} prompts`
                  }
                </div>
                {sprinthiaLimits.costSpikes > 0 && (
                  <div className="text-sm text-yellow-400 mt-2">
                    Next analysis: {sprinthiaLimits.costSpikes} Spikes
                  </div>
                )}
              </div>
            )}

            {/* Analysis Types */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white mb-4">Choose Analysis Type</h3>
              {analysisTypes.map((type: any) => (
                <div key={type.type} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-white mb-1">{type.title}</h4>
                      <p className="text-sm text-gray-300 mb-3">{type.description}</p>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (!currentVideo?.title) {
                            toast({ 
                              title: 'No video selected', 
                              description: 'Please select a video first',
                              variant: 'destructive' 
                            });
                            return;
                          }
                          
                          analyzeMutation.mutate({
                            videoName: currentVideo.title,
                            analysisType: type.type,
                            videoTimestamp: currentTime
                          });
                        }}
                        disabled={analyzeMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {analyzeMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Analyzing...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Analyze
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Analysis Results */}
            {analyzeMutation.data && (
              <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <h4 className="font-medium text-green-400 mb-2">Analysis Complete</h4>
                <div className="text-sm text-gray-300 whitespace-pre-wrap">
                  {analyzeMutation.data.analysis}
                </div>
                {analyzeMutation.data.costSpikes > 0 && (
                  <div className="text-xs text-yellow-400 mt-2">
                    Cost: {analyzeMutation.data.costSpikes} Spikes
                  </div>
                )}
              </div>
            )}

            {/* Error Display */}
            {analyzeMutation.error && (
              <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <h4 className="font-medium text-red-400 mb-2">Analysis Failed</h4>
                <div className="text-sm text-gray-300">
                  {analyzeMutation.error.message || 'Unable to analyze video'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
