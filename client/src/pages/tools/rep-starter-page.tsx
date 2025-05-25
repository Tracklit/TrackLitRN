import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Volume2, 
  VolumeX, 
  Play, 
  StopCircle
} from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { useToast } from "@/hooks/use-toast";

export function Component() {
  // State for audio settings
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCount, setCurrentCount] = useState<number | null>(null);
  
  // State for timing settings
  const [countSpeed, setCountSpeed] = useState('1');  // 1, 0.5, or 0.25 seconds per count
  const [startCount, setStartCount] = useState('4');  // 4, 3, 2, or 1
  
  // Refs for audio and timers
  const audioContext = useRef<AudioContext | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();
  
  // Initialize Audio Context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Set up audio context
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Force a user interaction with audio context to unlock audio
        document.addEventListener('click', () => {
          if (audioContext.current && audioContext.current.state === 'suspended') {
            audioContext.current.resume().then(() => {
              console.log("AudioContext resumed on user interaction");
            }).catch(e => {
              console.error("Failed to resume AudioContext:", e);
            });
          }
        }, { once: true });
        
        console.log("Rep Starter audio system initialized");
      } catch (error) {
        console.error("Error setting up audio:", error);
      }
    }
    
    // Cleanup function
    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
      
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, []);
  
  // Function to play number audio
  const playNumberAudio = (number: number) => {
    if (isMuted) return;
    
    try {
      // Create a new audio element for this playback
      const audio = new Audio(`/number-${number}.mp3`);
      
      // Set properties
      audio.volume = volume / 100;
      audio.preload = 'auto';
      
      // Debug events
      audio.addEventListener('canplaythrough', () => {
        console.log(`Number ${number} audio is ready to play`);
      });
      
      audio.addEventListener('error', (e) => {
        console.error(`Error with number ${number} audio:`, e);
        speakNumber(number); // Fallback to speech synthesis
      });
      
      // Play the audio
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.then(() => {
          console.log(`Number ${number} playback started`);
        }).catch(err => {
          console.error(`Error playing number ${number}:`, err);
          speakNumber(number); // Fallback to speech synthesis
        });
      }
    } catch (error) {
      console.error(`Exception trying to play number ${number}:`, error);
      speakNumber(number); // Fallback to speech synthesis
    }
  };
  
  // Speech synthesis fallback
  const speakNumber = (number: number) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(number.toString());
      utterance.volume = volume / 100;
      window.speechSynthesis.speak(utterance);
    }
  };
  
  // Function to start the countdown
  const startCountdown = () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    
    // Get the starting count from the selector
    const count = parseInt(startCount);
    setCurrentCount(count);
    
    // Play the first number
    playNumberAudio(count);
    
    // Calculate interval based on the selected speed
    const interval = parseFloat(countSpeed) * 1000; // Convert to milliseconds
    
    // Set up the countdown loop
    let currentNum = count;
    
    const countdownLoop = () => {
      currentNum--;
      
      if (currentNum > 0) {
        setCurrentCount(currentNum);
        playNumberAudio(currentNum);
        
        countdownRef.current = setTimeout(countdownLoop, interval);
      } else {
        // We've reached 0 - finish up
        setCurrentCount(null);
        setIsPlaying(false);
        
        // Optional: Play a finish sound
        playFinishSound();
      }
    };
    
    // Start the loop after the first interval
    countdownRef.current = setTimeout(countdownLoop, interval);
  };
  
  // Function to play a finish sound
  const playFinishSound = () => {
    if (isMuted) return;
    
    try {
      // Try to play a finish sound (beep, whistle, etc.)
      const audio = new Audio('/finish-beep.mp3');
      audio.volume = volume / 100;
      
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(() => {
          // If we can't play the file, create a beep using the AudioContext
          createBeepSound();
        });
      }
    } catch (error) {
      createBeepSound();
    }
  };
  
  // Create a beep sound using oscillator
  const createBeepSound = () => {
    if (!audioContext.current) return;
    
    try {
      const oscillator = audioContext.current.createOscillator();
      const gainNode = audioContext.current.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 880; // A5 note
      gainNode.gain.value = volume / 100;
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.current.destination);
      
      const now = audioContext.current.currentTime;
      oscillator.start(now);
      oscillator.stop(now + 0.2); // Short beep
    } catch (error) {
      console.error("Error creating beep sound:", error);
    }
  };
  
  // Function to cancel the countdown
  const cancelCountdown = () => {
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
      countdownRef.current = null;
    }
    
    setCurrentCount(null);
    setIsPlaying(false);
    
    // Show feedback
    toast({
      title: "Cancelled",
      description: "Rep countdown cancelled",
      duration: 2000
    });
  };
  
  // Toggle mute/unmute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // Get the display text for the current state
  const getDisplayText = () => {
    if (currentCount === null) {
      return "Ready";
    } else {
      return currentCount.toString();
    }
  };
  
  return (
    <div className="container mx-auto px-4 pb-16">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Training Tools', href: '/training-tools' },
        { label: 'Rep Starter', href: '/tools/rep-starter' }
      ]} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Rep Starter
          </h1>
          <p className="text-muted-foreground mt-1">
            Countdown timer for repetition training.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Main card */}
        <Card className="md:col-span-2">
          <CardContent className="flex flex-col items-center justify-center pt-12 pb-12">
            {/* Countdown display (only shown when counting) */}
            {currentCount !== null && (
              <div className="text-7xl font-bold mb-10">
                {currentCount}
              </div>
            )}
            
            {/* Controls with good spacing and centering */}
            <div className="w-full max-w-md flex flex-col items-center">
              {/* Main start/stop button */}
              <div className="mb-12">
                <Button
                  className={`w-36 h-36 rounded-full text-lg font-bold ${
                    isPlaying 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-yellow-500 hover:bg-yellow-600 pulse-animation shadow-lg'
                  }`}
                  onClick={isPlaying ? cancelCountdown : startCountdown}
                  disabled={false}
                >
                  {isPlaying ? <StopCircle size={36} /> : <Play size={36} />}
                  <span className="sr-only">{isPlaying ? 'Cancel' : 'Start'}</span>
                </Button>
              </div>
              
              {/* Volume controls */}
              <div className="flex items-center gap-4 w-full px-2">
                <Button variant="outline" size="icon" onClick={toggleMute} className="shrink-0">
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                <Slider
                  disabled={isMuted}
                  min={0}
                  max={100}
                  step={1}
                  value={[volume]}
                  onValueChange={([val]) => setVolume(val)}
                  className="flex-1"
                />
                <span className="w-12 text-center">{volume}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Settings card */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Countdown settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Countdown Settings</h3>
              
              <div className="space-y-2">
                <Label htmlFor="start-count">Start Count From</Label>
                <Select value={startCount} onValueChange={setStartCount}>
                  <SelectTrigger id="start-count" className="w-full">
                    <SelectValue placeholder="Select count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="count-speed">Count Speed</Label>
                <Select value={countSpeed} onValueChange={setCountSpeed}>
                  <SelectTrigger id="count-speed" className="w-full">
                    <SelectValue placeholder="Select speed" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 per second</SelectItem>
                    <SelectItem value="0.5">1 per 0.5 seconds</SelectItem>
                    <SelectItem value="0.25">1 per 0.25 seconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}