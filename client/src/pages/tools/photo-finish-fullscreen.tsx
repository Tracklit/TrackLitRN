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
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw timers - transparent background, white text with drop shadow only
      timers.forEach(timer => {
        const timerTime = currentTime - timer.startTime;
        const x = (timer.x / 100) * canvas.width;
        const y = (timer.y / 100) * canvas.height;

        // Calculate font size based on video width
        const fontSize = Math.max(canvas.width * 0.04, 32);
        
        // Set up text properties
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Apply drop shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // Draw only the white text - no background, no border
        ctx.fillStyle = '#ffffff';
        ctx.fillText(formatTime(timerTime), x, y);
        
        // Clear shadow settings
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      });

      // Draw finish lines
      finishLines.forEach(line => {
        const x = (line.x / 100) * canvas.width;
        const y = (line.y / 100) * canvas.height;
        const width = (line.width / 100) * canvas.width;
        const height = (line.height / 100) * canvas.height;

        ctx.strokeStyle = activeFinishLine === line.id ? '#ff0000' : '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);
      });
    };

    drawOverlays();
  }, [timers, finishLines, currentTime, activeTimer, activeFinishLine]);

  // Handle canvas interactions
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
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
    } else if (mode === 'finishline') {
      const newFinishLine: FinishLine = {
        id: Date.now().toString(),
        x: x - 2,
        y: y - 25,
        width: 4,
        height: 50
      };
      setFinishLines(prev => [...prev, newFinishLine]);
      setActiveFinishLine(newFinishLine.id);
    }
    
    setMode(null);
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
          src={videoUrl}
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