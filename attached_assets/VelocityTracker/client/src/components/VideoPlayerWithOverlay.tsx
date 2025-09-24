import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Download, Eye, Square } from 'lucide-react';
import { TrackingPoint, VelocityData, AnalysisResult } from '@/types/vbt';

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
      
      console.log(`🎯 OVERLAY DEBUG:`);
      console.log(`  Container: ${containerRect.width.toFixed(1)}x${containerRect.height.toFixed(1)}`);
      console.log(`  Video: ${video.videoWidth}x${video.videoHeight}`);
      console.log(`  Video aspect: ${videoAspect.toFixed(3)}, Container aspect: ${containerAspect.toFixed(3)}`);
      console.log(`  Transform: scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)}), translate(${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`);
      
      // Debug: log a few tracking points to see their coordinates
      if (analysisResult.trackingPoints.length > 0) {
        const samplePoint = analysisResult.trackingPoints[Math.floor(analysisResult.trackingPoints.length / 2)];
        const transformedX = samplePoint.x * scaleX + offsetX;
        const transformedY = samplePoint.y * scaleY + offsetY;
        console.log(`  Sample point: (${samplePoint.x.toFixed(1)}, ${samplePoint.y.toFixed(1)}) -> (${transformedX.toFixed(1)}, ${transformedY.toFixed(1)})`);
      }
    } else {
      // Fallback to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.save();
    }

    // Clear canvas (use video dimensions since we're in transformed coordinates)
    ctx.clearRect(0, 0, video.videoWidth, video.videoHeight);
    

    const currentFrame = Math.floor((currentTime / duration) * analysisResult.trackingPoints.length);
    const currentPoints = analysisResult.trackingPoints.slice(0, currentFrame);

    // Draw bar path - double the thickness
    if (showPath && currentPoints.length > 1) {
      ctx.strokeStyle = '#00ff00'; // Bright green for debugging
      ctx.lineWidth = 12; // Double from 6
      ctx.setLineDash([]);
      ctx.beginPath();
      
      currentPoints.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
          console.log(`🎨 Path start: video(${point.x.toFixed(1)}, ${point.y.toFixed(1)})`);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
      
      // Draw tracking points - larger and more visible
      currentPoints.forEach((point, index) => {
        const isRecent = index >= currentPoints.length - 5;
        ctx.fillStyle = isRecent ? '#ff4444' : '#44ff44'; // Bright red and green
        ctx.beginPath();
        ctx.arc(point.x, point.y, isRecent ? 12 : 8, 0, 2 * Math.PI); // Much larger circles
        ctx.fill();
        
        // White outline for better visibility
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    // Draw bounding box - make it much larger and more visible
    if (showBoundingBox && currentPoints.length > 0) {
      const latestPoint = currentPoints[currentPoints.length - 1];
      // Double the box sizing as requested
      const boxWidth = video.videoWidth * 0.50; // Doubled from 0.25
      const boxHeight = video.videoHeight * 0.90; // Doubled from 0.45
      
      console.log(`🎨 Box: center(${latestPoint.x.toFixed(1)}, ${latestPoint.y.toFixed(1)}), size(${boxWidth.toFixed(1)}, ${boxHeight.toFixed(1)})`);
      
      ctx.strokeStyle = '#00ffff'; // Bright cyan for better contrast
      ctx.lineWidth = 16; // Double the thickness
      ctx.setLineDash([10, 5]); // Dashed pattern for better visibility
      ctx.strokeRect(
        latestPoint.x - boxWidth / 2,
        latestPoint.y - boxHeight / 2,
        boxWidth,
        boxHeight
      );
      
      // Label with better visibility and larger text
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px Arial bold';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      const labelText = 'BARBELL ZONE';
      const labelX = latestPoint.x - boxWidth / 2;
      const labelY = latestPoint.y - boxHeight / 2 - 20;
      ctx.strokeText(labelText, labelX, labelY);
      ctx.fillText(labelText, labelX, labelY);
    }
    
    // Restore canvas transform
    ctx.restore();
  }, [currentTime, duration, analysisResult, showPath, showBoundingBox]);

  // Animation loop for real-time updates
  const animate = useCallback(() => {
    if (videoRef.current && isPlaying) {
      setCurrentTime(videoRef.current.currentTime);
      updateOverlay();
    }
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [isPlaying, updateOverlay]);

  useEffect(() => {
    if (isPlaying) {
      animate();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, animate]);

  const togglePlayback = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
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
    if (videoRef.current) {
      const newTime = (value[0] / 100) * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      updateOverlay();
    }
  }, [duration, updateOverlay]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCurrentVelocity = (): number => {
    if (!analysisResult?.velocityData.instant) return 0;
    const frameIndex = Math.floor((currentTime / duration) * analysisResult.velocityData.instant.length);
    return analysisResult.velocityData.instant[frameIndex] || 0;
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        {/* Header Controls */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Analysis Player</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowPath(!showPath)}
              className={showPath ? 'bg-primary text-primary-foreground' : ''}
              data-testid="button-toggle-path"
            >
              <Eye className="mr-1 h-3 w-3" />
              Path
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowBoundingBox(!showBoundingBox)}
              className={showBoundingBox ? 'bg-primary text-primary-foreground' : ''}
              data-testid="button-toggle-box"
            >
              <Square className="mr-1 h-3 w-3" />
              Box
            </Button>
            <Button
              onClick={onExport}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              size="sm"
              disabled={!analysisResult}
              data-testid="button-export"
            >
              <Download className="mr-1 h-3 w-3" />
              Export
            </Button>
          </div>
        </div>

        {/* Video Container - mobile-responsive */}
        <div className="relative bg-black rounded-lg overflow-hidden w-full max-w-full aspect-video max-h-[400px] sm:max-h-[500px]">
          {videoSrc ? (
            <>
              <video
                ref={videoRef}
                src={videoSrc}
                className="w-full h-full object-contain block max-w-full max-h-full"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                controlsList="nodownload nofullscreen noremoteplaybook"
                disablePictureInPicture={true}
                disableRemotePlaybook={true}
                playsInline={true}
                data-testid="video-player"
              />
              
              {/* Overlay Canvas */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full max-w-full max-h-full pointer-events-none"
                style={{ zIndex: 10 }}
                data-testid="overlay-canvas"
              />

              {/* Velocity Display Card */}
              {analysisResult && (
                <div className="absolute top-2 right-2 sm:top-4 sm:right-4 velocity-card px-2 py-1 sm:px-3 sm:py-2 rounded-lg shadow-lg min-w-32 sm:min-w-48 max-w-[calc(100%-1rem)]">
                  <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-1 sm:mb-2">Real-time Velocity</h4>
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Current:</span>
                      <span className="text-xs sm:text-sm font-mono text-chart-1" data-testid="text-current-velocity">
                        {getCurrentVelocity().toFixed(2)} m/s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Peak:</span>
                      <span className="text-xs sm:text-sm font-mono text-chart-2" data-testid="text-peak-velocity">
                        {analysisResult.peakVelocity.toFixed(2)} m/s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">Mean:</span>
                      <span className="text-xs sm:text-sm font-mono text-chart-3" data-testid="text-mean-velocity">
                        {analysisResult.meanVelocity.toFixed(2)} m/s
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis Progress Overlay */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="bg-card/90 backdrop-blur-sm rounded-lg p-6 text-center">
                    <div className="analysis-progress h-2 rounded-full w-48 mb-3"></div>
                    <p className="text-sm text-foreground">Processing video frames...</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-muted-foreground">No video loaded</p>
            </div>
          )}
        </div>

        {/* Video Controls */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlayback}
              disabled={!videoSrc}
              data-testid="button-play-pause"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            
            <div className="flex-1">
              <Slider
                value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="w-full"
                disabled={!videoSrc || duration === 0}
                data-testid="slider-progress"
              />
            </div>
            
            <span className="text-sm text-muted-foreground font-mono" data-testid="text-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
