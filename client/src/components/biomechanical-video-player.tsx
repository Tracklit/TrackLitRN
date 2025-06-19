import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Maximize, 
  Settings,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Crown,
  Activity,
  Target,
  Gauge,
  Timer,
  Footprints
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const [overlays, setOverlays] = useState<BiomechanicalOverlay[]>([
    {
      id: 'skeleton',
      label: 'Pose Skeleton',
      icon: Activity,
      color: '#8b5cf6',
      enabled: false,
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

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, []);

  // Draw biomechanical overlays on canvas
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to video
    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;

    const drawOverlays = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Only draw if video is loaded and overlays are enabled
      if (video.readyState >= 2) {
        overlays.forEach(overlay => {
          if (overlay.enabled) {
            drawBiomechanicalOverlay(ctx, overlay, canvas.width, canvas.height);
          }
        });
      }
      
      requestAnimationFrame(drawOverlays);
    };

    drawOverlays();
  }, [overlays]);

  const drawBiomechanicalOverlay = (
    ctx: CanvasRenderingContext2D, 
    overlay: BiomechanicalOverlay,
    width: number,
    height: number
  ) => {
    ctx.strokeStyle = overlay.color;
    ctx.fillStyle = overlay.color;
    ctx.lineWidth = 2;

    // Generate simulated pose data for demonstration
    const centerX = width * 0.5;
    const centerY = height * 0.6;
    const scale = Math.min(width, height) * 0.2;

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
        drawStrideAnalysis(ctx, width, height);
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
    // Knee angles
    const leftKnee = { x: x - scale * 0.2, y: y + scale * 1.2 };
    const rightKnee = { x: x + scale * 0.2, y: y + scale * 1.2 };
    
    ctx.font = '14px monospace';
    ctx.fillText(`L: 142°`, leftKnee.x - 25, leftKnee.y - 10);
    ctx.fillText(`R: 138°`, rightKnee.x - 25, rightKnee.y - 10);

    // Hip angles
    ctx.fillText(`Hip: 165°`, x - 30, y + scale * 0.3);
    
    // Trunk angle
    ctx.fillText(`Trunk: 85°`, x - 35, y - scale * 0.5);
  };

  const drawVelocityVectors = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
    // Center of mass velocity
    const velocity = biomechanicalData?.velocity || 8.5; // m/s
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

    // Velocity label
    ctx.font = '16px monospace';
    ctx.fillText(`${velocity.toFixed(1)} m/s`, x + 10, y - 10);
  };

  const drawStrideAnalysis = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const strideLength = biomechanicalData?.stride_length || 2.1; // meters
    const frequency = biomechanicalData?.stride_rate || 185; // spm
    
    // Stride length visualization
    const stridePixels = (strideLength / 3) * width * 0.6; // normalize to video width
    const baseY = height * 0.9;
    
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(width * 0.2, baseY);
    ctx.lineTo(width * 0.2 + stridePixels, baseY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.font = '14px monospace';
    ctx.fillText(`Stride: ${strideLength.toFixed(1)}m`, width * 0.05, height * 0.85);
    ctx.fillText(`Rate: ${frequency} spm`, width * 0.05, height * 0.88);
  };

  const drawGroundContact = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
    // Ground contact indicators
    const contactTime = biomechanicalData?.contact_time || 0.18; // seconds
    const flightTime = biomechanicalData?.flight_time || 0.12; // seconds
    
    // Left foot contact
    ctx.beginPath();
    ctx.arc(x - scale * 0.1, y, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Right foot contact
    ctx.beginPath();
    ctx.arc(x + scale * 0.1, y, 8, 0, Math.PI * 2);
    ctx.fill();

    // Contact time labels
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

  return (
    <div className="space-y-4">
      {/* Video Player Container */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {videoName}
            </span>
            <Badge variant="outline">Biomechanical Analysis</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={containerRef}
            className="relative bg-black rounded-lg overflow-hidden aspect-video"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            {/* Video Element */}
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              preload="metadata"
            />
            
            {/* Overlay Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ mixBlendMode: 'normal' }}
            />

            {/* Video Controls */}
            {showControls && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={togglePlay}
                      className="text-white hover:bg-white/20"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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

                    <div className="flex items-center gap-2 ml-4">
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
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={playbackRate}
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value);
                        setPlaybackRate(rate);
                        if (videoRef.current) {
                          videoRef.current.playbackRate = rate;
                        }
                      }}
                      className="bg-black/50 text-white text-xs rounded px-2 py-1"
                    >
                      <option value={0.25}>0.25x</option>
                      <option value={0.5}>0.5x</option>
                      <option value={1}>1x</option>
                      <option value={1.25}>1.25x</option>
                      <option value={1.5}>1.5x</option>
                      <option value={2}>2x</option>
                    </select>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Biomechanical Overlay Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Biomechanical Overlays
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {overlays.map((overlay) => {
              const Icon = overlay.icon;
              return (
                <Button
                  key={overlay.id}
                  variant={overlay.enabled ? "default" : "outline"}
                  onClick={() => toggleOverlay(overlay.id)}
                  className={`h-auto p-3 flex flex-col items-center gap-2 ${
                    overlay.enabled ? 'border-2' : ''
                  }`}
                  style={{
                    borderColor: overlay.enabled ? overlay.color : undefined,
                    backgroundColor: overlay.enabled ? `${overlay.color}20` : undefined
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: overlay.color }} />
                  <div className="text-center">
                    <div className="text-xs font-medium">{overlay.label}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Video Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analysisPrompts.map((prompt) => {
              const Icon = prompt.icon;
              return (
                <Button
                  key={prompt.id}
                  onClick={() => onAnalyze(prompt.id)}
                  disabled={isAnalyzing}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center gap-3"
                >
                  <Icon className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">{prompt.title}</div>
                    <div className="text-xs text-muted-foreground">{prompt.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
          
          {isAnalyzing && (
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 animate-spin" />
                <span className="text-sm">Analyzing video with enhanced biomechanical data...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}