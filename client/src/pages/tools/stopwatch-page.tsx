import { useState, useRef, useEffect } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Flag, Volume2, VolumeX } from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";
import { StopwatchBackground } from "@/components/stopwatch-background";
import { useToast } from "@/hooks/use-toast";

export default function StopwatchPage() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize AudioContext for mobile
  useEffect(() => {
    // Function to initialize audio context on mobile
    const initAudio = () => {
      try {
        // Create a temporary audio context to enable audio on first interaction
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContext.resume().then(() => {
          console.log("Audio context enabled by user interaction");
        });
      } catch (err) {
        console.error("Failed to initialize audio context:", err);
      }
    };
    
    // Add touch event to initialize audio on first interaction
    const events = ['touchstart', 'mousedown', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, initAudio, { once: true });
    });
    
    // Try it once on load just in case
    initAudio();
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, initAudio);
      });
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
  
  // Setup volume button handler for mobile devices
  useEffect(() => {
    // Handle various volume button mappings across different devices
    const handleVolumeButton = (e: KeyboardEvent) => {
      console.log(`Key detected: ${e.key}, Code: ${e.code}, KeyCode: ${e.keyCode}`);
      
      // Check for various volume key representations
      if (
        e.key === 'AudioVolumeUp' || 
        e.key === 'VolumeUp' || 
        e.code === 'AudioVolumeUp' ||
        e.keyCode === 175 ||  // Common code for volume up
        e.keyCode === 38 ||   // Arrow up (sometimes mapped to volume)
        e.key === 'ArrowUp'   // Arrow up key
      ) {
        console.log('Volume up detected - toggling stopwatch!');
        e.preventDefault();
        handleStartStop();
        
        // Show toast notification on first successful volume button press
        if (showTip) {
          toast({
            title: "Volume Button Active",
            description: "You can use the volume up button to start/stop the timer",
            duration: 3000
          });
          setShowTip(false);
        }
      }
    };
    
    // Add listeners for different key events to maximize compatibility
    const eventTypes = ['keydown', 'keyup', 'keypress'];
    eventTypes.forEach(eventType => {
      window.addEventListener(eventType, handleVolumeButton);
    });
    
    // Special handler for mobile - experiment with direct user media controls
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('play', () => {
          console.log('Media play button pressed');
          handleStartStop();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          console.log('Media pause button pressed');
          handleStartStop();
        });
      } catch (error) {
        console.error('Error setting up media session handlers:', error);
      }
    }
    
    return () => {
      // Clean up all event listeners
      eventTypes.forEach(eventType => {
        window.removeEventListener(eventType, handleVolumeButton);
      });
      
      // Clean up media session handlers if applicable
      if ('mediaSession' in navigator) {
        try {
          navigator.mediaSession.setActionHandler('play', null);
          navigator.mediaSession.setActionHandler('pause', null);
        } catch (error) {
          console.error('Error cleaning up media session handlers:', error);
        }
      }
    };
  }, [isRunning, showTip, toast]);

  // Create an audio context and sound on demand (better for mobile)
  const playSound = (frequency: number, duration: number) => {
    try {
      // Create a new audio context each time
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create oscillator for the beep
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      
      // Create gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.7;
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Play the sound
      oscillator.start();
      
      // Schedule stop and cleanup
      setTimeout(() => {
        oscillator.stop();
        oscillator.disconnect();
        gainNode.disconnect();
        audioContext.close().catch(e => console.error("Error closing audio context:", e));
      }, duration);
      
      return true;
    } catch (e) {
      console.error("Error playing sound:", e);
      return false;
    }
  };

  const handleStartStop = () => {
    const newRunningState = !isRunning;
    setIsRunning(newRunningState);
    
    // Play appropriate sound if not muted
    if (!isMuted) {
      try {
        if (newRunningState) {
          // Start sound (higher pitch)
          const soundPlayed = playSound(1200, 150);
          if (!soundPlayed) {
            toast({
              title: "Sound playback",
              description: "Tap the screen to enable sounds for the stopwatch",
              duration: 3000
            });
          }
        } else {
          // Stop sound (lower pitch)
          playSound(800, 150);
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