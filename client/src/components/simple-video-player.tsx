import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface SimpleVideoPlayerProps {
  videoUrl: string;
  videoName: string;
  videoId: number;
  onAnalyze?: (promptId: string) => void;
  isAnalyzing?: boolean;
  biomechanicalData?: any;
  analysisStatus?: string;
  onOverlayChange?: (overlays: any[]) => void;
}

export function SimpleVideoPlayer({ 
  videoUrl, 
  videoName,
  videoId,
  onAnalyze,
  isAnalyzing = false,
  biomechanicalData,
  analysisStatus,
  onOverlayChange
}: SimpleVideoPlayerProps): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Control handlers
  const handlePlayPause = () => {
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

    const time = value[0];
    video.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value[0];
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full bg-black rounded-lg overflow-hidden"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      data-testid="video-player-container"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        onClick={handlePlayPause}
        data-testid="video-element"
      />

      {/* Analysis Status */}
      {analysisStatus && (
        <div className="absolute top-4 right-4 bg-blue-500/80 text-white px-3 py-1 rounded-md text-sm z-20">
          📊 {analysisStatus}
        </div>
      )}

      {/* Loading Indicator */}
      {isAnalyzing && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
          <div className="bg-white/90 text-black px-4 py-2 rounded-lg flex items-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            Analyzing video...
          </div>
        </div>
      )}

      {/* Controls */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-20">
          {/* Progress Bar */}
          <div className="mb-4" data-testid="progress-container">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full cursor-pointer"
              data-testid="progress-slider"
            />
            <div className="flex justify-between text-white text-xs mt-1">
              <span data-testid="current-time">{formatTime(currentTime)}</span>
              <span data-testid="total-time">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlayPause}
                className="text-white hover:bg-white/20"
                data-testid="play-pause-button"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>

              {/* Volume Control */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                  data-testid="mute-button"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
                <div className="w-20">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.1}
                    onValueChange={handleVolumeChange}
                    className="cursor-pointer"
                    data-testid="volume-slider"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Analyze Button */}
              {onAnalyze && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAnalyze('biomechanical')}
                  disabled={isAnalyzing}
                  className="text-white border-white/30 hover:bg-white/20"
                  data-testid="analyze-button"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                </Button>
              )}

              {/* Playback Rate */}
              <select
                value={playbackRate}
                onChange={(e) => {
                  const rate = parseFloat(e.target.value);
                  setPlaybackRate(rate);
                  if (videoRef.current) {
                    videoRef.current.playbackRate = rate;
                  }
                }}
                className="bg-transparent text-white text-sm border border-white/30 rounded px-2 py-1"
                data-testid="playback-rate-select"
              >
                <option value={0.25} className="text-black">0.25x</option>
                <option value={0.5} className="text-black">0.5x</option>
                <option value={1} className="text-black">1x</option>
                <option value={1.25} className="text-black">1.25x</option>
                <option value={1.5} className="text-black">1.5x</option>
                <option value={2} className="text-black">2x</option>
              </select>

              {/* Fullscreen Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFullscreen}
                className="text-white hover:bg-white/20"
                data-testid="fullscreen-button"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}