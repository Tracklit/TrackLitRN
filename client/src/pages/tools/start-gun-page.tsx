import { useState, useRef, useEffect } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Volume2, 
  VolumeX, 
  Zap, 
  Camera, 
  Timer, 
  Dices, 
  Play, 
  StopCircle
} from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Types for camera permissions
interface CameraPermissions {
  camera: boolean;
  microphone: boolean;
  flashlight: boolean;
}

export default function StartGunPage() {
  // State for audio settings
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<'idle' | 'on-your-marks' | 'set' | 'gun'>('idle');
  
  // State for timing settings
  const [marksToSetDelay, setMarksToSetDelay] = useState(2);
  const [setToGunDelay, setSetToGunDelay] = useState(1.5); 
  const [useRandomizer, setUseRandomizer] = useState(true);
  const [currentSetToGunDelay, setCurrentSetToGunDelay] = useState(0);
  
  // State for device capabilities
  const [useFlash, setUseFlash] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  const [recordDuration, setRecordDuration] = useState("5");
  const [cameraPermissions, setCameraPermissions] = useState<CameraPermissions>({
    camera: false,
    microphone: false,
    flashlight: false
  });
  const [hasFlash, setHasFlash] = useState(false);
  
  // Refs for audio and timers
  const audioContext = useRef<AudioContext | null>(null);
  const timerRefs = useRef<{
    setTimer: NodeJS.Timeout | null;
    gunTimer: NodeJS.Timeout | null;
  }>({
    setTimer: null,
    gunTimer: null
  });
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const flashlightRef = useRef<any>(null);
  
  const { toast } = useToast();
  
  // Initialize Audio Context and load sounds
  useEffect(() => {
    // Initialize audio API early on page load to minimize autoplay restrictions
    if (typeof window !== 'undefined') {
      try {
        // Set up audio context for potential use - needed for oscillator fallback
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
        
        console.log("Audio system initialized");
      } catch (error) {
        console.error("Error setting up audio:", error);
      }
    }
    
    // Check for camera and flash capabilities
    const checkDeviceCapabilities = async () => {
      try {
        // Check if the device has camera support
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasCamera = devices.some(device => device.kind === 'videoinput');
          
          // Check if the device has flash support (this is harder to detect reliably)
          let flashSupport = false;
          if (hasCamera && 'ImageCapture' in window) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
              const track = stream.getVideoTracks()[0];
              if (track) {
                // @ts-ignore - ImageCapture might not be recognized by TypeScript
                const imageCapture = new (window as any).ImageCapture(track);
                const capabilities = await imageCapture.getPhotoCapabilities();
                flashSupport = capabilities && capabilities.fillLightMode && capabilities.fillLightMode.includes('flash');
              }
              // Clean up
              stream.getTracks().forEach(track => track.stop());
            } catch (err) {
              console.log("Could not detect flash capability", err);
            }
          }
          
          setHasFlash(flashSupport);
        }
      } catch (error) {
        console.error("Error checking device capabilities:", error);
      }
    };
    
    checkDeviceCapabilities();
    
    // Cleanup function
    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
      
      if (timerRefs.current.setTimer) {
        clearTimeout(timerRefs.current.setTimer);
      }
      
      if (timerRefs.current.gunTimer) {
        clearTimeout(timerRefs.current.gunTimer);
      }
      
      // Release camera if active
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);
  
  // Function to flash the camera light
  const triggerFlash = async () => {
    if (!useFlash || !hasFlash) return;
    
    try {
      // This requires the user to have already granted camera permissions
      if (!flashlightRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            // @ts-ignore
            advanced: [{ torch: true }] 
          }
        });
        
        const track = stream.getVideoTracks()[0];
        if (track) {
          flashlightRef.current = track;
          
          // Try to turn on the flashlight
          try {
            // @ts-ignore - Not all browsers support this
            await track.applyConstraints({ advanced: [{ torch: true }] });
            
            // Turn off after a short delay
            setTimeout(() => {
              try {
                // @ts-ignore
                track.applyConstraints({ advanced: [{ torch: false }] });
              } catch (err) {
                console.error("Error turning off flash:", err);
              }
            }, 500); // Flash for half a second
          } catch (err) {
            console.error("Error controlling flash:", err);
          }
        }
      } else {
        // Reuse existing track
        try {
          // @ts-ignore
          await flashlightRef.current.applyConstraints({ advanced: [{ torch: true }] });
          
          // Turn off after a short delay
          setTimeout(() => {
            try {
              // @ts-ignore
              flashlightRef.current.applyConstraints({ advanced: [{ torch: false }] });
            } catch (err) {
              console.error("Error turning off flash:", err);
            }
          }, 500);
        } catch (err) {
          console.error("Error controlling flash:", err);
        }
      }
    } catch (error) {
      console.error("Error accessing camera for flash:", error);
    }
  };
  
  // Function to start video recording
  const startRecording = async () => {
    if (!useCamera) return;
    
    try {
      // Request camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true
      });
      
      mediaStreamRef.current = stream;
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        // Create a blob from the recorded chunks
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        recordedChunksRef.current = [];
        
        // Create a URL for the blob
        const url = URL.createObjectURL(blob);
        
        // Offer the recording for download
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `race-start-${new Date().toISOString()}.webm`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        
        // Stop all tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
      };
      
      // Start recording
      mediaRecorder.start();
      
      // Set permissions state
      setCameraPermissions({
        camera: true,
        microphone: true,
        flashlight: hasFlash
      });
      
      // Schedule recording to stop after the specified duration
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, parseInt(recordDuration) * 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Camera access denied",
        description: "Please grant camera permissions to use this feature",
        variant: "destructive"
      });
    }
  };
  
  // Create a realistic gun sound using oscillators when audio files fail
  const createGunOscillator = () => {
    if (!audioContext.current) return;
    
    try {
      console.log("Creating gun oscillator fallback sound");
      // Create multiple oscillators for a more complex gun sound
      const mainOscillator = audioContext.current.createOscillator();
      const subOscillator = audioContext.current.createOscillator();
      const noiseNode = audioContext.current.createBufferSource();
      
      // Create a gain node for volume control
      const gainNode = audioContext.current.createGain();
      gainNode.gain.value = volume / 100;
      
      // Main oscillator - short burst
      mainOscillator.type = 'square';
      mainOscillator.frequency.value = 120;
      
      // Sub oscillator - lower tone
      subOscillator.type = 'sawtooth';
      subOscillator.frequency.value = 60;
      
      // Create white noise for realistic gun sound
      const noiseBuffer = audioContext.current.createBuffer(
        1, audioContext.current.sampleRate * 0.1, audioContext.current.sampleRate
      );
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      noiseNode.buffer = noiseBuffer;
      
      // Connect all sources to gain node
      mainOscillator.connect(gainNode);
      subOscillator.connect(gainNode);
      noiseNode.connect(gainNode);
      
      // Connect gain to output
      gainNode.connect(audioContext.current.destination);
      
      // Schedule the sound
      const now = audioContext.current.currentTime;
      
      // Start oscillators
      mainOscillator.start(now);
      subOscillator.start(now);
      noiseNode.start(now);
      
      // Stop oscillators after short duration
      mainOscillator.stop(now + 0.1);
      subOscillator.stop(now + 0.2);
      noiseNode.stop(now + 0.3);
      
      console.log("Gun oscillator sound created successfully");
    } catch (error) {
      console.error("Error creating gun oscillator sound:", error);
    }
  };

  // Simple function to play an audio file with proper error handling
  const playAudioFile = (filepath: string) => {
    return new Promise<void>((resolve, reject) => {
      try {
        console.log(`Attempting to play audio file: ${filepath}`);
        const audio = new Audio(filepath);
        audio.volume = isMuted ? 0 : volume / 100;
        
        // Set up event listeners
        audio.addEventListener('canplaythrough', () => {
          const playPromise = audio.play();
          if (playPromise) {
            playPromise
              .then(() => {
                console.log(`Successfully playing: ${filepath}`);
                resolve();
              })
              .catch(err => {
                console.error(`Error playing audio file ${filepath}:`, err);
                reject(err);
              });
          } else {
            resolve(); // No promise returned (older browsers)
          }
        }, { once: true });
        
        audio.addEventListener('error', (e: Event) => {
          console.error(`Error loading audio file ${filepath}:`, e);
          reject(e);
        }, { once: true });
        
        // Force load attempt
        audio.load();
      } catch (error) {
        console.error(`Exception trying to play ${filepath}:`, error);
        reject(error);
      }
    });
  };
  
  // Function to start the sequence
  const startSequence = () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    setStatus('on-your-marks');
    
    const executeSequence = async () => {
      try {
        // On your marks
        console.log("Playing: On your marks");
        try {
          await playAudioFile('/sounds/on-your-marks.mp3');
        } catch (err) {
          console.error("Failed to play On Your Marks, using speech synthesis fallback");
          // Use speech synthesis as fallback
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance("On your marks");
            utterance.volume = volume / 100;
            window.speechSynthesis.speak(utterance);
          }
        }
        
        // Set command after delay
        await new Promise(resolve => {
          timerRefs.current.setTimer = setTimeout(() => {
            setStatus('set');
            resolve(null);
          }, marksToSetDelay * 1000);
        });
        
        // Play Set
        console.log("Playing: Set");
        try {
          await playAudioFile('/sounds/set.mp3');
        } catch (err) {
          console.error("Failed to play Set, using speech synthesis fallback");
          // Use speech synthesis as fallback
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance("Set");
            utterance.volume = volume / 100;
            window.speechSynthesis.speak(utterance);
          }
        }
        
        // Calculate gun delay with randomization if enabled
        let finalDelay = setToGunDelay;
        if (useRandomizer) {
          const randomOffset = (Math.random() * 2 - 1) * 1.0;
          finalDelay = Math.max(0.1, setToGunDelay + randomOffset);
        }
        setCurrentSetToGunDelay(finalDelay);
        
        // Gun sound after delay
        await new Promise(resolve => {
          timerRefs.current.gunTimer = setTimeout(() => {
            setStatus('gun');
            resolve(null);
          }, finalDelay * 1000);
        });
        
        // Play gun sound
        console.log("Playing: Bang");
        try {
          await playAudioFile('/sounds/bang.mp3');
        } catch (err) {
          console.error("Failed to play Bang, using oscillator fallback", err);
          // Use oscillator as fallback
          createGunOscillator();
        }
        
        // Flash and record if enabled
        triggerFlash();
        if (useCamera) {
          startRecording();
        }
        
        // Reset state after sequence completes
        setTimeout(() => {
          setIsPlaying(false);
          setStatus('idle');
        }, 2000);
        
      } catch (error) {
        console.error("Error in race start sequence:", error);
        // Always reset to idle state in case of errors
        setTimeout(() => {
          setIsPlaying(false);
          setStatus('idle');
        }, 1000);
      }
    };
    
    // Start the sequence
    executeSequence();
  };
  
  // Function to cancel the sequence
  const cancelSequence = () => {
    // Clear all timers
    if (timerRefs.current.setTimer) {
      clearTimeout(timerRefs.current.setTimer);
      timerRefs.current.setTimer = null;
    }
    
    if (timerRefs.current.gunTimer) {
      clearTimeout(timerRefs.current.gunTimer);
      timerRefs.current.gunTimer = null;
    }
    
    // Reset state
    setIsPlaying(false);
    setStatus('idle');
    
    // Show feedback
    toast({
      title: "Cancelled",
      description: "Race start sequence cancelled",
      duration: 2000
    });
  };
  
  // Toggle mute/unmute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // Content for the help dialog
  const helpContent = (
    <div className="space-y-4 text-sm">
      <h3 className="font-bold text-lg">How to use the Race Start Gun</h3>
      
      <div>
        <h4 className="font-semibold">Timing Settings</h4>
        <p>Adjust the timing between commands to match official race standards or your preference.</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li><span className="font-medium">Marks to Set:</span> Time (in seconds) between "On your marks" and "Set"</li>
          <li><span className="font-medium">Set to Gun:</span> Time between "Set" and the gun sound</li>
          <li><span className="font-medium">Randomize:</span> Adds unpredictability to the gun timing (recommended for realistic practice)</li>
        </ul>
      </div>
      
      <div>
        <h4 className="font-semibold">Device Options</h4>
        <p>Take advantage of your device's capabilities:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li><span className="font-medium">Camera Flash:</span> Provides visual feedback when the gun fires (if your device has a flash)</li>
          <li><span className="font-medium">Record Video:</span> Records your start for analysis</li>
          <li><span className="font-medium">Record Duration:</span> How long to record after the gun fires</li>
        </ul>
      </div>
      
      <div>
        <h4 className="font-semibold">Tips</h4>
        <ul className="list-disc pl-5 space-y-1">
          <li>For the most realistic experience, use headphones and set a realistic volume</li>
          <li>Practice with randomized timing to improve your reaction to the gun</li>
          <li>Review recorded videos to analyze and improve your starting technique</li>
          <li>Use this tool with a training partner for added accountability</li>
        </ul>
      </div>
    </div>
  );
  
  // Render status indicator color
  const getStatusColor = () => {
    switch (status) {
      case 'on-your-marks':
        return 'bg-yellow-500';
      case 'set':
        return 'bg-orange-500';
      case 'gun':
        return 'bg-red-500';
      default:
        return 'bg-gray-300 dark:bg-gray-700';
    }
  };
  
  // Render status text
  const getStatusText = () => {
    switch (status) {
      case 'on-your-marks':
        return 'On Your Marks';
      case 'set':
        return 'Set';
      case 'gun':
        return 'GO!';
      default:
        return 'Ready';
    }
  };
  
  return (
    <div className="container mx-auto px-4 pb-16">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Training Tools', href: '/training-tools' },
        { label: 'Race Start Gun', href: '/tools/start-gun' }
      ]} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Race Start Gun
          </h1>
          <p className="text-muted-foreground mt-1">
            Practice your starts with a realistic race start sequence.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Main card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-6 w-6" />
              Race Start Simulator
            </CardTitle>
            <CardDescription>
              Train your reaction time with a realistic race start experience
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center justify-center">
            {/* Status display */}
            <div className="mb-8 text-center">
              <div className={`w-20 h-20 rounded-full mx-auto mb-2 flex items-center justify-center ${getStatusColor()} transition-colors duration-300`}>
                <span className="text-white font-bold">
                  {status === 'gun' ? <Zap size={32} /> : null}
                </span>
              </div>
              <h3 className="text-xl font-bold">{getStatusText()}</h3>
              {status === 'set' && currentSetToGunDelay > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  (Randomized delay: {currentSetToGunDelay.toFixed(2)}s)
                </p>
              )}
            </div>
            
            {/* Controls */}
            <div className="w-full max-w-md">
              <div className="flex gap-4 justify-center mb-8">
                <Button
                  className={`w-32 h-32 rounded-full text-lg font-bold ${
                    isPlaying 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-primary hover:bg-primary/90 pulse-animation shadow-lg'
                  }`}
                  onClick={isPlaying ? cancelSequence : startSequence}
                  disabled={false}
                >
                  {isPlaying ? <StopCircle size={32} /> : <Play size={32} />}
                  <span className="sr-only">{isPlaying ? 'Cancel' : 'Start'}</span>
                </Button>
              </div>
              
              {/* Volume controls */}
              <div className="flex items-center gap-4 mb-6">
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Settings
            </CardTitle>
            <CardDescription>
              Customize your race start experience
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Timing settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Timing</h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="marks-to-set">Marks to Set (s)</Label>
                  <span className="text-sm">{marksToSetDelay}s</span>
                </div>
                <Slider
                  id="marks-to-set"
                  min={1}
                  max={5}
                  step={0.1}
                  value={[marksToSetDelay]}
                  onValueChange={([val]) => setMarksToSetDelay(val)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="set-to-gun">Set to Gun (s)</Label>
                  <span className="text-sm">{setToGunDelay}s</span>
                </div>
                <Slider
                  id="set-to-gun"
                  min={0.5}
                  max={3}
                  step={0.1}
                  value={[setToGunDelay]}
                  onValueChange={([val]) => setSetToGunDelay(val)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="randomize"
                  checked={useRandomizer}
                  onCheckedChange={setUseRandomizer}
                />
                <Label htmlFor="randomize" className="flex items-center gap-2">
                  <Dices className="h-4 w-4" />
                  Randomize gun timing
                </Label>
              </div>
            </div>
            
            {/* Device settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Device Options</h3>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="use-flash"
                  checked={useFlash}
                  onCheckedChange={setUseFlash}
                  disabled={!hasFlash}
                />
                <Label 
                  htmlFor="use-flash" 
                  className={`flex items-center gap-2 ${!hasFlash ? 'text-muted-foreground' : ''}`}
                >
                  <Zap className="h-4 w-4" />
                  Use camera flash
                  {!hasFlash && <span className="text-xs">(Not available)</span>}
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="use-camera"
                  checked={useCamera}
                  onCheckedChange={setUseCamera}
                />
                <Label htmlFor="use-camera" className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Record video
                </Label>
              </div>
              
              {useCamera && (
                <div className="pl-6">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="record-duration">Record for</Label>
                    <Select value={recordDuration} onValueChange={setRecordDuration}>
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 seconds</SelectItem>
                        <SelectItem value="5">5 seconds</SelectItem>
                        <SelectItem value="10">10 seconds</SelectItem>
                        <SelectItem value="15">15 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    How to use
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="w-80">
                  {helpContent}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// Export also as a component for dynamic routes
export function Component() {
  return <StartGunPage />;
}