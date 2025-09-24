import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Download, Eye, Square } from 'lucide-react';
import { TrackingPoint, VelocityData, AnalysisResult } from '@shared/schema';

interface VideoPlayerWithOverlayProps {
  videoSrc: string | null;
  analysisResult: AnalysisResult | null;
  isAnalyzing: boolean;
  onExport: () => void;
}

export function VideoPlayerWithOverlay({ 
  videoSrc, 
  analysisResult, 
  isAnalyzing,
  onExport 
}: VideoPlayerWithOverlayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPath, setShowPath] = useState(true);
  const [showBoundingBox, setShowBoundingBox] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  // Update overlay canvas
  const updateOverlay = useCallback(() => {
    if (!canvasRef.current || !videoRef.current || !analysisResult) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to match container size and scale tracking points correctly
    const containerRect = video.parentElement?.getBoundingClientRect();
    
    if (containerRect) {
      canvas.width = containerRect.width;
      canvas.height = containerRect.height;
      
      // Calculate how video is actually displayed within container (object-contain behavior)
      const videoAspect = video.videoWidth / video.videoHeight;
      const containerAspect = containerRect.width / containerRect.height;
      
      let scaleX, scaleY, offsetX, offsetY;
      
      if (videoAspect > containerAspect) {
        // Video is wider - fit to container width, letterbox top/bottom
        const scale = containerRect.width / video.videoWidth;
        scaleX = scale;
        scaleY = scale;
        offsetX = 0;
        offsetY = (containerRect.height - video.videoHeight * scale) / 2;
      } else {
        // Video is taller - fit to container height, letterbox left/right
        const scale = containerRect.height / video.videoHeight;
        scaleX = scale;
        scaleY = scale;
        offsetX = (containerRect.width - video.videoWidth * scale) / 2;
        offsetY = 0;
      }
      
      // Apply the transformation to scale tracking points from video resolution to display size
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scaleX, scaleY);
      
      // Clear the canvas
      ctx.clearRect(-offsetX/scaleX, -offsetY/scaleY, canvas.width/scaleX, canvas.height/scaleY);
      
      if (showPath && analysisResult.trackingPoints.length > 0) {
        // Draw barbell path
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 3 / scaleX; // Scale line width
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        analysisResult.trackingPoints.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();

        // Draw tracking points
        ctx.fillStyle = '#ff6b6b';
        analysisResult.trackingPoints.forEach((point, index) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4 / scaleX, 0, 2 * Math.PI);
          ctx.fill();
          
          // Label first and last points
          if (index === 0 || index === analysisResult.trackingPoints.length - 1) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `${12 / scaleX}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(
              index === 0 ? 'Start' : 'End',
              point.x,
              point.y - 10 / scaleY
            );
            ctx.fillStyle = '#ff6b6b';
          }
        });
      }

      if (showBoundingBox && analysisResult.trackingPoints.length > 0) {
        // Calculate and draw bounding box
        const points = analysisResult.trackingPoints;
        const minX = Math.min(...points.map(p => p.x));
        const maxX = Math.max(...points.map(p => p.x));
        const minY = Math.min(...points.map(p => p.y));
        const maxY = Math.max(...points.map(p => p.y));
        
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 2 / scaleX;
        ctx.setLineDash([10 / scaleX, 5 / scaleX]);
        ctx.strokeRect(minX - 20, minY - 20, maxX - minX + 40, maxY - minY + 40);
        ctx.setLineDash([]);
      }

      // Draw velocity information
      if (analysisResult.velocityData) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10 / scaleX, 10 / scaleY, 200 / scaleX, 80 / scaleY);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = `${14 / scaleX}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText(`Mean Velocity: ${analysisResult.meanVelocity.toFixed(2)} m/s`, 20 / scaleX, 30 / scaleY);
        ctx.fillText(`Peak Velocity: ${analysisResult.peakVelocity.toFixed(2)} m/s`, 20 / scaleX, 50 / scaleY);
        ctx.fillText(`Power Zone: ${analysisResult.powerZone}`, 20 / scaleX, 70 / scaleY);
      }
      
      ctx.restore();
    }
  }, [analysisResult, showPath, showBoundingBox]);

  // Animation loop for overlay updates
  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        updateOverlay();
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      updateOverlay(); // Update once when paused
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, updateOverlay]);

  const handlePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const handleSeek = useCallback((value: number[]) => {
    if (videoRef.current && value.length > 0) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  }, []);

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {videoSrc ? (
          <div className="space-y-4">
            {/* Video Container */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                src={videoSrc}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
                style={{ mixBlendMode: 'multiply' }}
              />
              
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p>Analyzing video...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Video Controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePlay}
                  variant="outline"
                  size="sm"
                  data-testid="button-play-pause"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                
                <div className="flex-1">
                  <Slider
                    value={[currentTime]}
                    max={duration}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="w-full"
                  />
                </div>
                
                <span className="text-sm text-muted-foreground min-w-fit">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Overlay Controls */}
              {analysisResult && (
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showPath}
                      onChange={(e) => setShowPath(e.target.checked)}
                    />
                    Show Path
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showBoundingBox}
                      onChange={(e) => setShowBoundingBox(e.target.checked)}
                    />
                    Show Bounding Box
                  </label>
                  <Button
                    onClick={onExport}
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    data-testid="button-export-video"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Video preview will appear here</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}