import { useState, useRef, useEffect } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Flag, Volume2, VolumeX } from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";

export default function StopwatchPage() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startSoundRef = useRef<HTMLAudioElement | null>(null);
  const stopSoundRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio on component mount
  useEffect(() => {
    startSoundRef.current = new Audio('/start-blip.mp3');
    stopSoundRef.current = new Audio('/stop-blip.mp3');
    
    // Create dummy audio files if they don't exist
    const startBlip = startSoundRef.current;
    const stopBlip = stopSoundRef.current;
    
    startBlip.volume = 0.7;
    stopBlip.volume = 0.7;
    
    return () => {
      if (startBlip) startBlip.pause();
      if (stopBlip) stopBlip.pause();
    };
  }, []);

  // Setup interval for timer
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 10);
      }, 10);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);
  
  // Setup volume button handler
  useEffect(() => {
    const handleVolumeButton = (e: KeyboardEvent) => {
      // Volume up button often maps to key code 38 (arrow up) on mobile
      if (e.key === 'ArrowUp' || e.keyCode === 38) {
        handleStartStop();
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleVolumeButton);
    
    return () => {
      window.removeEventListener('keydown', handleVolumeButton);
    };
  }, [isRunning]);

  const handleStartStop = () => {
    const newRunningState = !isRunning;
    setIsRunning(newRunningState);
    
    // Play appropriate sound if not muted
    if (!isMuted) {
      if (newRunningState && startSoundRef.current) {
        startSoundRef.current.currentTime = 0;
        startSoundRef.current.play().catch(e => console.error("Error playing start sound:", e));
      } else if (!newRunningState && stopSoundRef.current) {
        stopSoundRef.current.currentTime = 0;
        stopSoundRef.current.play().catch(e => console.error("Error playing stop sound:", e));
      }
    }
    
    // Hide tip after first use
    if (showTip) {
      setShowTip(false);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setLaps([]);
  };

  const handleLap = () => {
    setLaps([...laps, time]);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    const milliseconds = Math.floor((time % 1000) / 10);

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Training Tools", href: "/training-tools" },
    { label: "Stopwatch", href: "/tools/stopwatch" },
  ];

  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-16 pb-20">
      <Breadcrumb items={breadcrumbItems} />
      
      <PageHeader
        title="Stopwatch"
        description="Track your time with precision"
      />

      <Card className="w-full max-w-xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            {/* Large timer display */}
            <div className="text-6xl font-mono font-bold my-6 tracking-wider">
              {formatTime(time)}
            </div>
            
            {/* Large circular start/stop button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={handleStartStop}
                className={`w-32 h-32 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 focus:outline-none focus:ring-4 ${
                  isRunning 
                    ? "bg-destructive hover:bg-destructive/90 text-white focus:ring-destructive/20" 
                    : "bg-primary hover:bg-primary/90 text-white focus:ring-primary/20"
                }`}
              >
                <div className="flex flex-col items-center">
                  {isRunning ? (
                    <Pause className="h-10 w-10 mb-1" />
                  ) : (
                    <Play className="h-10 w-10 mb-1" />
                  )}
                  <span className="text-lg font-medium">{isRunning ? "STOP" : "START"}</span>
                </div>
              </button>
            </div>
            
            {/* Controls */}
            <div className="flex justify-center space-x-4 mb-2">
              <Button 
                variant="outline" 
                size="lg"
                onClick={handleLap} 
                disabled={!isRunning}
                className="flex items-center px-5"
              >
                <Flag className="h-5 w-5 mr-2" />
                Lap
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={handleReset}
                className="flex items-center px-5"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Reset
              </Button>
            </div>
            
            {/* Sound toggle */}
            <div className="flex justify-center mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-muted-foreground"
              >
                {isMuted ? <VolumeX className="h-4 w-4 mr-1" /> : <Volume2 className="h-4 w-4 mr-1" />}
                {isMuted ? "Unmute" : "Mute"}
              </Button>
            </div>
            
            {/* Volume button tip */}
            {showTip && (
              <div className="bg-primary/10 rounded-md p-3 text-sm mb-4">
                <p>Tip: You can also use the volume up button on your phone to start/stop the timer</p>
              </div>
            )}

            {/* Laps */}
            {laps.length > 0 && (
              <div className="border rounded-md p-4 mt-2">
                <h3 className="font-medium mb-2">Laps</h3>
                <div className="max-h-40 overflow-y-auto">
                  {laps.map((lapTime, index) => (
                    <div key={index} className="flex justify-between py-1.5 border-b last:border-0">
                      <span className="font-medium">Lap {laps.length - index}</span>
                      <span className="font-mono">{formatTime(lapTime)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Protected route wrapper
export function Component() {
  return (
    <ProtectedRoute path="/tools/stopwatch" component={StopwatchPage} />
  );
}