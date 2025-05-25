import { useState, useRef, useEffect } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Flag, Volume2, VolumeX } from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";
import { StopwatchBackground } from "@/components/stopwatch-background";

export default function StopwatchPage() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startSoundRef = useRef<any>(null);
  const stopSoundRef = useRef<any>(null);
  
  // Setup audio context and sounds - using a simpler approach for mobile compatibility
  useEffect(() => {
    // Function to play a beep with the given frequency using a new audio context each time
    const playBeep = (frequency: number, duration: number) => {
      try {
        // Create a fresh audio context each time to avoid issues on mobile
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gainNode.gain.value = 0.7;
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Start the sound
        oscillator.start();
        
        // Stop the sound after duration
        setTimeout(() => {
          oscillator.stop();
          // Clean up
          oscillator.disconnect();
          gainNode.disconnect();
          audioContext.close().catch(e => console.error("Error closing audio context:", e));
        }, duration);
        
        return true; // Successfully played
      } catch (e) {
        console.error("Error creating audio:", e);
        return false; // Failed to play
      }
    };
    
    // Store the play functions
    startSoundRef.current = {
      play: () => playBeep(1200, 150) // Higher pitch for start
    };
    
    stopSoundRef.current = {
      play: () => playBeep(800, 150)  // Lower pitch for stop
    };
    
    // We don't need cleanup since we create a new context each time
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
  
  // Setup volume button handler for mobile devices
  useEffect(() => {
    // Attempt to initialize audio context on first user interaction
    const initAudio = () => {
      try {
        // Create a silent audio context to initialize audio on mobile
        const tempContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        tempContext.resume().then(() => {
          console.log("Audio context initialized on user interaction");
        });
      } catch (e) {
        console.error("Failed to initialize audio:", e);
      }
    };

    // Handle various volume button mappings across different devices
    const handleVolumeButton = (e: KeyboardEvent) => {
      console.log(`Key pressed: ${e.key}, Code: ${e.code}, KeyCode: ${e.keyCode}`);
      
      // Check for various volume key representations
      if (
        e.key === 'AudioVolumeUp' || 
        e.key === 'VolumeUp' || 
        e.code === 'AudioVolumeUp' ||
        e.keyCode === 175 ||  // Common code for volume up
        e.keyCode === 38 ||   // Arrow up (sometimes mapped to volume)
        e.key === 'ArrowUp'   // Arrow up key
      ) {
        console.log('Volume up detected!');
        e.preventDefault();
        handleStartStop();
      }
    };
    
    // Add touch event to initialize audio on first touch
    document.addEventListener('touchstart', initAudio, { once: true });
    
    // Add both keydown and keyup listeners to increase chances of capturing the event
    window.addEventListener('keydown', handleVolumeButton);
    window.addEventListener('keyup', handleVolumeButton);
    
    return () => {
      document.removeEventListener('touchstart', initAudio);
      window.removeEventListener('keydown', handleVolumeButton);
      window.removeEventListener('keyup', handleVolumeButton);
    };
  }, [isRunning]);

  const handleStartStop = () => {
    const newRunningState = !isRunning;
    setIsRunning(newRunningState);
    
    // Play appropriate sound if not muted
    if (!isMuted) {
      try {
        if (newRunningState && startSoundRef.current) {
          startSoundRef.current.play();
        } else if (!newRunningState && stopSoundRef.current) {
          stopSoundRef.current.play();
        }
      } catch (e) {
        console.error("Error playing sound:", e);
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
            {/* Classic stopwatch display with timer */}
            <div className="relative mx-auto my-8 w-64 h-64 flex items-center justify-center">
              {/* Stopwatch background */}
              <StopwatchBackground />
              
              {/* Timer display */}
              <div className="relative z-10 bg-gradient-to-b from-[hsl(215,70%,13%)] to-[hsl(220,80%,4%)] rounded-xl px-6 py-3 border border-gray-700 shadow-inner">
                <div className="text-6xl font-mono font-bold tracking-wider text-white">
                  {formatTime(time)}
                </div>
              </div>
            </div>
            
            {/* Extra large circular start/stop button with enhanced shadow */}
            <div className="flex justify-center mb-8">
              <button
                onClick={handleStartStop}
                className={`w-48 h-48 rounded-full flex items-center justify-center shadow-[0_10px_25px_-5px_rgba(0,0,0,0.2)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.3)] transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 ${
                  isRunning 
                    ? "bg-destructive hover:bg-destructive/90 text-white focus:ring-destructive/20 danger-pulse-effect" 
                    : "bg-[hsl(215,70%,13%)] hover:bg-[hsl(215,70%,20%)] text-white focus:ring-primary/20 pulse-effect"
                }`}
              >
                <div className="flex flex-col items-center">
                  {isRunning ? (
                    <Pause className="h-16 w-16 mb-2" />
                  ) : (
                    <Play className="h-16 w-16 mb-2" />
                  )}
                  <span className="text-2xl font-bold">{isRunning ? "STOP" : "START"}</span>
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
              <div className="border border-gray-200 rounded-xl p-5 mt-4 bg-gradient-to-b from-white to-gray-50 shadow-sm">
                <h3 className="font-bold text-lg mb-3 text-primary/80 flex items-center">
                  <Flag className="h-5 w-5 mr-2" />
                  Lap Times
                </h3>
                <div className="max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {laps.map((lapTime, index) => {
                    // Calculate relative lap times
                    const prevLapTime = index > 0 ? laps[index - 1] : 0;
                    const relativeLapTime = lapTime - prevLapTime;
                    
                    return (
                      <div 
                        key={index} 
                        className="flex justify-between py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 px-2 rounded-md"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 font-bold text-primary">
                            {laps.length - index}
                          </div>
                          <div className="text-left">
                            <div className="font-medium">{formatTime(lapTime)}</div>
                            <div className="text-xs text-muted-foreground">
                              +{formatTime(relativeLapTime)}
                            </div>
                          </div>
                        </div>
                        {index === 0 && (
                          <div className="bg-primary/10 text-primary text-xs font-medium py-1 px-2 rounded-full self-center">
                            Latest
                          </div>
                        )}
                      </div>
                    );
                  })}
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