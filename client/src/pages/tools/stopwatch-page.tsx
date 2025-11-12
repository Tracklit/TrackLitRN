import { useState, useRef, useEffect } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Flag, Volume2, VolumeX } from "lucide-react";
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
    const initAudio = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContext.resume().then(() => {
          console.log("Audio context enabled by user interaction");
        });
      } catch (err) {
        console.error("Failed to initialize audio context:", err);
      }
    };
    
    const events = ['touchstart', 'mousedown', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, initAudio, { once: true });
    });
    
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
    const handleVolumeButton = (e: Event) => {
      const keyEvent = e as KeyboardEvent;
      console.log(`Key detected: ${keyEvent.key}, Code: ${keyEvent.code}, KeyCode: ${keyEvent.keyCode}`);
      
      if (
        keyEvent.key === 'AudioVolumeUp' || 
        keyEvent.key === 'VolumeUp' || 
        keyEvent.code === 'AudioVolumeUp' ||
        keyEvent.keyCode === 175 ||
        keyEvent.keyCode === 38 ||
        keyEvent.key === 'ArrowUp'
      ) {
        console.log('Volume up detected - toggling stopwatch!');
        e.preventDefault();
        handleStartStop();
        
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
    
    const handleMobileVolumeButton = () => {
      (window as any).handleVolumeButtonPress = () => {
        console.log('Volume button press detected via mobile bridge');
        handleStartStop();
      };
    };
    
    window.addEventListener('keydown', handleVolumeButton);
    
    if (typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Safari/i.test(navigator.userAgent)) {
      document.addEventListener('touchend', () => {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        ctx.resume().then(() => {
          console.log('Audio context enabled on iOS device');
        });
      }, { once: true });
    }
    
    handleMobileVolumeButton();
    
    return () => {
      window.removeEventListener('keydown', handleVolumeButton);
      
      if ((window as any).handleVolumeButtonPress) {
        (window as any).handleVolumeButtonPress = undefined;
      }
    };
  }, [isRunning, showTip, toast]);

  const playSound = (frequency: number, duration: number) => {
    const fallbackBeep = () => {
      try {
        const audio = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU9vT18AAAAA");
        audio.volume = 0.7;
        audio.play().catch(e => console.error("Fallback audio failed:", e));
        return true;
      } catch (err) {
        console.error("Fallback sound failed:", err);
        return false;
      }
    };

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContext.resume().then(() => {
        try {
          const oscillator = audioContext.createOscillator();
          oscillator.type = 'sine';
          oscillator.frequency.value = frequency;
          
          const gainNode = audioContext.createGain();
          gainNode.gain.value = 0.7;
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.start();
          
          setTimeout(() => {
            try {
              oscillator.stop();
              oscillator.disconnect();
              gainNode.disconnect();
              audioContext.close().catch(() => {/* ignore error */});
            } catch (e) {
              console.error("Error cleaning up audio:", e);
            }
          }, duration);
        } catch (innerError) {
          console.error("Error playing oscillator:", innerError);
          return fallbackBeep();
        }
      }).catch(e => {
        console.error("Could not resume audio context:", e);
        return fallbackBeep();
      });
      
      return true;
    } catch (e) {
      console.error("Error creating audio context:", e);
      return fallbackBeep();
    }
  };

  const handleStartStop = () => {
    const newRunningState = !isRunning;
    setIsRunning(newRunningState);
    
    if (!isMuted) {
      try {
        if (newRunningState) {
          const soundPlayed = playSound(1200, 150);
          if (!soundPlayed) {
            toast({
              title: "Sound playback",
              description: "Tap the screen to enable sounds for the stopwatch",
              duration: 3000
            });
          }
        } else {
          playSound(800, 150);
        }
      } catch (e) {
        console.error("Error playing sound:", e);
      }
    }
    
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white pb-20">
      <div className="container max-w-2xl mx-auto px-4 pt-20">
        
        {/* Main Timer Display and Controls */}
        <div className="relative mb-12">
          {/* Animated glow effect */}
          {isRunning && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-3xl blur-xl animate-pulse" />
          )}
          
          {/* Timer card - extended to include button */}
          <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl">
            {/* Timer Display */}
            <div className="text-center mb-6">
              <div className="text-7xl md:text-8xl font-bold font-mono tracking-tight bg-gradient-to-br from-white to-slate-300 bg-clip-text text-transparent leading-tight">
                {formatTime(time)}
              </div>
              {laps.length > 0 && (
                <div className="text-sm text-slate-400 mt-3 font-mono">
                  Lap {laps.length}: {formatTime(time - (laps[laps.length - 1] || 0))}
                </div>
              )}
            </div>

            {/* Massive Start/Stop Button */}
            <div className="flex justify-center">
              <button
                onClick={handleStartStop}
                data-testid="button-start-stop-timer"
                className={`
                  relative group w-72 h-72 rounded-full 
                  transition-all duration-500 ease-out
                  transform hover:scale-105 active:scale-95
                  focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-slate-950
                  drop-shadow-xl
                  ${isRunning 
                    ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-[0_0_40px_rgba(239,68,68,0.3)] focus:ring-red-500/50' 
                    : 'bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-[0_0_40px_rgba(59,130,246,0.3)] focus:ring-blue-500/50'
                  }
                `}
              >
                {/* Animated ring */}
                <div className={`
                  absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500
                  ${isRunning 
                    ? 'bg-gradient-to-br from-red-400 to-red-500' 
                    : 'bg-gradient-to-br from-blue-400 to-cyan-400'
                  }
                  animate-ping
                `} style={{ animationDuration: '2s' }} />
                
                {/* Button content */}
                <div className="relative flex flex-col items-center justify-center h-full">
                  {isRunning ? (
                    <>
                      <Pause className="h-24 w-24 mb-4 drop-shadow-2xl" strokeWidth={2.5} />
                      <span className="text-3xl font-bold uppercase tracking-wider drop-shadow-lg">
                        Stop
                      </span>
                    </>
                  ) : (
                    <>
                      <Play className="h-24 w-24 mb-4 drop-shadow-2xl ml-2" strokeWidth={2.5} />
                      <span className="text-3xl font-bold uppercase tracking-wider drop-shadow-lg">
                        Start
                      </span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-4 mb-6">
          <Button 
            onClick={handleLap} 
            disabled={!isRunning}
            data-testid="button-lap"
            size="lg"
            className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 backdrop-blur-xl text-white disabled:opacity-30 disabled:cursor-not-allowed px-8 h-14 text-base"
          >
            <Flag className="h-5 w-5 mr-2" />
            Lap
          </Button>
          <Button 
            onClick={handleReset}
            data-testid="button-reset"
            size="lg"
            className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 backdrop-blur-xl text-white px-8 h-14 text-base"
          >
            <RotateCcw className="h-5 w-5 mr-2" />
            Reset
          </Button>
        </div>

        {/* Sound Toggle */}
        <div className="flex justify-center mb-8">
          <button
            onClick={toggleMute}
            data-testid="button-toggle-sound"
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
          >
            {isMuted ? (
              <>
                <VolumeX className="h-4 w-4" />
                <span>Sound Off</span>
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4" />
                <span>Sound On</span>
              </>
            )}
          </button>
        </div>

        {/* Volume Button Tip */}
        {showTip && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-8 backdrop-blur-xl">
            <p className="text-sm text-blue-300 text-center">
              💡 Pro tip: Use your volume up button to start/stop the timer hands-free
            </p>
          </div>
        )}

        {/* Laps Section */}
        {laps.length > 0 && (
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-xl">
            <h3 className="font-bold text-xl mb-4 flex items-center text-slate-200">
              <Flag className="h-5 w-5 mr-2 text-blue-400" />
              Lap Times
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {laps.slice().reverse().map((lapTime, index) => {
                const actualIndex = laps.length - 1 - index;
                const prevLapTime = actualIndex > 0 ? laps[actualIndex - 1] : 0;
                const relativeLapTime = lapTime - prevLapTime;
                
                return (
                  <div 
                    key={actualIndex}
                    className="flex justify-between items-center py-4 px-4 rounded-xl bg-slate-900/50 border border-slate-700/30 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-300">
                        {actualIndex + 1}
                      </div>
                      <div>
                        <div className="font-mono font-semibold text-lg text-white">
                          {formatTime(lapTime)}
                        </div>
                        <div className="text-sm text-slate-400 font-mono">
                          +{formatTime(relativeLapTime)}
                        </div>
                      </div>
                    </div>
                    {index === 0 && (
                      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold py-1.5 px-3 rounded-full">
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
    </div>
  );
}

// Protected route wrapper
export function Component() {
  return (
    <ProtectedRoute path="/tools/stopwatch" component={StopwatchPage} />
  );
}
