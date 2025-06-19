import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Maximize, 
  X,
  Eye,
  Activity,
  Target,
  Gauge,
  Timer,
  Footprints,
  Sparkles,
  Zap,
  Crown
} from "lucide-react";

interface BiomechanicalOverlay {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  enabled: boolean;
  type: 'skeleton' | 'angles' | 'velocity' | 'stride' | 'contact';
}

interface BiomechanicalVideoPlayerProps {
  videoUrl: string;
  videoName: string;
  onAnalyze: (promptId: string) => void;
  isAnalyzing: boolean;
  biomechanicalData?: any;
}

export function BiomechanicalVideoPlayer({ 
  videoUrl, 
  videoName, 
  onAnalyze, 
  isAnalyzing,
  biomechanicalData 
}: BiomechanicalVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);

  // Real-time pose tracking data
  const [poseData, setPoseData] = useState<any>(null);
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const [overlays, setOverlays] = useState<BiomechanicalOverlay[]>([
    {
      id: 'skeleton',
      label: 'Pose Skeleton',
      icon: Activity,
      color: '#8b5cf6',
      enabled: true,
      type: 'skeleton'
    },
    {
      id: 'angles',
      label: 'Joint Angles',
      icon: Target,
      color: '#06b6d4',
      enabled: false,
      type: 'angles'
    },
    {
      id: 'velocity',
      label: 'Velocity Vector',
      icon: Gauge,
      color: '#f59e0b',
      enabled: false,
      type: 'velocity'
    },
    {
      id: 'stride',
      label: 'Stride Analysis',
      icon: Timer,
      color: '#10b981',
      enabled: false,
      type: 'stride'
    },
    {
      id: 'contact',
      label: 'Ground Contact',
      icon: Footprints,
      color: '#ef4444',
      enabled: false,
      type: 'contact'
    }
  ]);

  const analysisPrompts = [
    {
      id: "sprint-form",
      title: "Sprint Form",
      description: "Technique analysis",
      icon: Sparkles,
    },
    {
      id: "block-start",
      title: "Block Start", 
      description: "Starting mechanics",
      icon: Zap,
    },
    {
      id: "stride-length",
      title: "Stride Analysis",
      description: "Movement patterns",
      icon: Crown,
    }
  ];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', () => setIsPlaying(false));

    // Show first frame
    video.addEventListener('loadeddata', () => {
      video.currentTime = 0.1;
    });

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', () => setIsPlaying(false));
      video.removeEventListener('loadeddata', () => {});
    };
  }, []);

  // WebSocket connection for real-time pose tracking
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected for pose tracking');
      setIsConnected(true);
      setWebSocket(ws);
      
      // Start pose tracking for the current video
      ws.send(JSON.stringify({
        type: 'start_pose_tracking',
        videoPath: videoUrl
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'pose_frame' && data.landmarks) {
          setPoseData(data);
        }
      } catch (error) {
        console.error('Error parsing pose data:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setWebSocket(null);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'stop_pose_tracking' }));
        ws.close();
      }
    };
  }, [videoUrl]);

  // Draw biomechanical overlays on canvas
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      const container = containerRef.current;
      if (!container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const drawOverlays = () => {
      if (!video.videoWidth || !video.videoHeight) {
        requestAnimationFrame(drawOverlays);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate video display dimensions and position
      const videoAspect = video.videoWidth / video.videoHeight;
      const containerAspect = canvas.width / canvas.height;
      
      let displayWidth, displayHeight, offsetX, offsetY;
      
      if (videoAspect > containerAspect) {
        displayWidth = canvas.width;
        displayHeight = canvas.width / videoAspect;
        offsetX = 0;
        offsetY = (canvas.height - displayHeight) / 2;
      } else {
        displayWidth = canvas.height * videoAspect;
        displayHeight = canvas.height;
        offsetX = (canvas.width - displayWidth) / 2;
        offsetY = 0;
      }

      // Only draw if video is loaded and overlays are enabled
      if (video.readyState >= 2) {
        overlays.forEach(overlay => {
          if (overlay.enabled) {
            drawBiomechanicalOverlay(ctx, overlay, displayWidth, displayHeight, offsetX, offsetY);
          }
        });
      }
      
      requestAnimationFrame(drawOverlays);
    };

    drawOverlays();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [overlays]);

  const drawBiomechanicalOverlay = (
    ctx: CanvasRenderingContext2D, 
    overlay: BiomechanicalOverlay,
    width: number,
    height: number,
    offsetX: number,
    offsetY: number
  ) => {
    ctx.strokeStyle = overlay.color;
    ctx.fillStyle = overlay.color;
    ctx.lineWidth = 2;

    // Generate simulated pose data positioned within video bounds
    const centerX = offsetX + width * 0.5;
    const centerY = offsetY + height * 0.6;
    const scale = Math.min(width, height) * 0.15;

    switch (overlay.type) {
      case 'skeleton':
        drawPoseSkeleton(ctx, centerX, centerY, scale);
        break;
      case 'angles':
        drawJointAngles(ctx, centerX, centerY, scale);
        break;
      case 'velocity':
        drawVelocityVectors(ctx, centerX, centerY, scale);
        break;
      case 'stride':
        drawStrideAnalysis(ctx, width, height, offsetX, offsetY);
        break;
      case 'contact':
        drawGroundContact(ctx, centerX, centerY + scale * 1.5, scale);
        break;
    }
  };

  const drawPoseSkeleton = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
    // Head
    ctx.beginPath();
    ctx.arc(x, y - scale * 0.8, scale * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Body connections
    const connections = [
      [0, -0.8, 0, -0.3], // head to torso
      [0, -0.3, -0.3, 0], // torso to left arm
      [0, -0.3, 0.3, 0],  // torso to right arm
      [-0.3, 0, -0.5, 0.3], // left arm extension
      [0.3, 0, 0.5, 0.3],   // right arm extension
      [0, -0.3, 0, 0.5],    // torso to hips
      [0, 0.5, -0.2, 1.2],  // hips to left leg
      [0, 0.5, 0.2, 1.2],   // hips to right leg
      [-0.2, 1.2, -0.1, 1.5], // left knee to ankle
      [0.2, 1.2, 0.1, 1.5],   // right knee to ankle
    ];

    ctx.beginPath();
    connections.forEach(([x1, y1, x2, y2]) => {
      ctx.moveTo(x + x1 * scale, y + y1 * scale);
      ctx.lineTo(x + x2 * scale, y + y2 * scale);
    });
    ctx.stroke();

    // Joint points
    const joints = [
      [0, -0.3], [-0.3, 0], [0.3, 0], [-0.5, 0.3], [0.5, 0.3],
      [0, 0.5], [-0.2, 1.2], [0.2, 1.2], [-0.1, 1.5], [0.1, 1.5]
    ];

    joints.forEach(([jx, jy]) => {
      ctx.beginPath();
      ctx.arc(x + jx * scale, y + jy * scale, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawJointAngles = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
    const leftKnee = { x: x - scale * 0.2, y: y + scale * 1.2 };
    const rightKnee = { x: x + scale * 0.2, y: y + scale * 1.2 };
    
    ctx.font = '14px monospace';
    ctx.fillText(`L: 142°`, leftKnee.x - 25, leftKnee.y - 10);
    ctx.fillText(`R: 138°`, rightKnee.x - 25, rightKnee.y - 10);
    ctx.fillText(`Hip: 165°`, x - 30, y + scale * 0.3);
    ctx.fillText(`Trunk: 85°`, x - 35, y - scale * 0.5);
  };

  const drawVelocityVectors = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
    const velocity = biomechanicalData?.velocity || 8.5;
    const vectorLength = Math.min(scale * 0.8, velocity * 10);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + vectorLength, y - vectorLength * 0.3);
    ctx.stroke();

    // Arrow head
    ctx.beginPath();
    ctx.moveTo(x + vectorLength, y - vectorLength * 0.3);
    ctx.lineTo(x + vectorLength - 15, y - vectorLength * 0.3 - 5);
    ctx.moveTo(x + vectorLength, y - vectorLength * 0.3);
    ctx.lineTo(x + vectorLength - 15, y - vectorLength * 0.3 + 5);
    ctx.stroke();

    ctx.font = '16px monospace';
    ctx.fillText(`${velocity.toFixed(1)} m/s`, x + 10, y - 10);
  };

  const drawStrideAnalysis = (ctx: CanvasRenderingContext2D, width: number, height: number, offsetX?: number, offsetY?: number) => {
    const oX = offsetX || 0;
    const oY = offsetY || 0;
    const strideLength = biomechanicalData?.stride_length || 2.1;
    const frequency = biomechanicalData?.stride_rate || 185;
    
    const stridePixels = (strideLength / 3) * width * 0.6;
    const baseY = oY + height * 0.9;
    
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(oX + width * 0.2, baseY);
    ctx.lineTo(oX + width * 0.2 + stridePixels, baseY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '14px monospace';
    ctx.fillText(`Stride: ${strideLength.toFixed(1)}m`, oX + width * 0.05, oY + height * 0.85);
    ctx.fillText(`Rate: ${frequency} spm`, oX + width * 0.05, oY + height * 0.88);
  };

  const drawGroundContact = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
    const contactTime = biomechanicalData?.contact_time || 0.18;
    const flightTime = biomechanicalData?.flight_time || 0.12;
    
    ctx.beginPath();
    ctx.arc(x - scale * 0.1, y, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x + scale * 0.1, y, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '12px monospace';
    ctx.fillText(`CT: ${(contactTime * 1000).toFixed(0)}ms`, x - 40, y + 25);
    ctx.fillText(`FT: ${(flightTime * 1000).toFixed(0)}ms`, x - 40, y + 40);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const toggleOverlay = (overlayId: string) => {
    setOverlays(prev => prev.map(overlay => 
      overlay.id === overlayId 
        ? { ...overlay, enabled: !overlay.enabled }
        : overlay
    ));
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Main Video Area - Full Screen */}
      <div className="relative w-full h-full">
        <div 
          ref={containerRef}
          className="absolute inset-0 bg-black flex items-center justify-center"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          {/* Video Element */}
          <video
            ref={videoRef}
            src={videoUrl}
            className="max-w-full max-h-full object-contain"
            preload="metadata"
          />
          
          {/* Overlay Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ 
              mixBlendMode: 'normal',
              width: '100%',
              height: '100%'
            }}
          />

          {/* Video Controls */}
          {showControls && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 z-10">
              {/* Progress Bar */}
              <div className="mb-4">
                <Slider
                  value={[currentTime]}
                  max={duration}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-white mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const video = videoRef.current;
                    if (video) {
                      video.currentTime = 0;
                      setCurrentTime(0);
                    }
                  }}
                  className="text-white hover:bg-white/20"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-white" />
                  <Slider
                    value={[volume]}
                    max={1}
                    step={0.1}
                    onValueChange={(value) => {
                      setVolume(value[0]);
                      if (videoRef.current) {
                        videoRef.current.volume = value[0];
                      }
                    }}
                    className="w-20"
                  />
                </div>

                <select
                  value={playbackRate}
                  onChange={(e) => {
                    const rate = parseFloat(e.target.value);
                    setPlaybackRate(rate);
                    if (videoRef.current) {
                      videoRef.current.playbackRate = rate;
                    }
                  }}
                  className="bg-black/50 text-white text-sm rounded px-3 py-1 border border-gray-600"
                >
                  <option value={0.25}>0.25x</option>
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Control Panel */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 to-transparent p-4 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-white" />
            <h1 className="text-white font-semibold truncate">{videoName}</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Biomechanical Overlay Controls */}
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-white font-medium mb-2">
            <Eye className="h-4 w-4" />
            Overlays
          </h3>
          <div className="flex flex-wrap gap-2">
            {overlays.map((overlay) => {
              const Icon = overlay.icon;
              return (
                <Button
                  key={overlay.id}
                  variant={overlay.enabled ? "default" : "outline"}
                  onClick={() => toggleOverlay(overlay.id)}
                  size="sm"
                  className={`flex items-center gap-2 ${
                    overlay.enabled ? 'border-2' : ''
                  }`}
                  style={{
                    borderColor: overlay.enabled ? overlay.color : undefined,
                    backgroundColor: overlay.enabled ? `${overlay.color}20` : undefined
                  }}
                >
                  <Icon className="h-3 w-3" style={{ color: overlay.color }} />
                  <span className="text-xs">{overlay.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Analysis Controls */}
        <div>
          <h3 className="flex items-center gap-2 text-white font-medium mb-2">
            <Sparkles className="h-4 w-4" />
            Analysis
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysisPrompts.map((prompt) => {
              const Icon = prompt.icon;
              return (
                <Button
                  key={prompt.id}
                  onClick={() => onAnalyze(prompt.id)}
                  disabled={isAnalyzing}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-white border-gray-600 hover:bg-gray-800"
                >
                  <Icon className="h-3 w-3" />
                  <span className="text-xs">{prompt.title}</span>
                </Button>
              );
            })}
          </div>
          
          {isAnalyzing && (
            <div className="mt-2 flex items-center gap-2">
              <Sparkles className="h-3 w-3 animate-spin text-white" />
              <span className="text-xs text-white">Analyzing video...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}