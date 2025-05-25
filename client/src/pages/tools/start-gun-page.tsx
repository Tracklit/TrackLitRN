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

interface AudioBuffers {
  onYourMarks: AudioBuffer | null;
  set: AudioBuffer | null;
  gun: AudioBuffer | null;
}

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
  const audioBuffers = useRef<AudioBuffers>({
    onYourMarks: null,
    set: null,
    gun: null
  });
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
        
        // Create and preload audio elements for better playback
        const preloadAudio = (src: string) => {
          const audio = new Audio(src);
          audio.preload = 'auto';
          
          // Add event listeners for better debugging
          audio.addEventListener('canplaythrough', () => {
            console.log(`Audio loaded successfully: ${src}`);
          });
          
          audio.addEventListener('error', (e) => {
            console.error(`Audio loading error for ${src}:`, e);
          });
          
          // Force load
          audio.load();
          return audio;
        };
        
        // Preload all audio files with absolute URLs
        const baseUrl = window.location.origin;
        preloadAudio(`${baseUrl}/sounds/on-your-marks.mp3`);
        preloadAudio(`${baseUrl}/sounds/set.mp3`);
        preloadAudio(`${baseUrl}/sounds/gun-shot.mp3`);
        
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
  
  // Function to play audio buffer - using a more reliable approach for mobile
  const playSound = (buffer: AudioBuffer | null) => {
    if (!buffer || isMuted) return;
    
    try {
      // Resume audio context if suspended (important for mobile)
      if (audioContext.current && audioContext.current.state === 'suspended') {
        audioContext.current.resume().catch(e => console.error("Failed to resume audio context:", e));
      }
      
      // Create a new audio context if needed - more reliable on mobile
      const ctx = audioContext.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      
      console.log(`Playing sound with volume ${volume/100}, audio context state: ${ctx.state}`);
      
      // Create buffer source
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      
      // Create gain node for volume control
      const gainNode = ctx.createGain();
      gainNode.gain.value = volume / 100;
      
      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Play the sound
      source.start(0);
      
      // Show visual feedback to user
      toast({
        title: "Playing sound",
        description: status === 'on-your-marks' ? "On your marks" : 
                    status === 'set' ? "Set" : 
                    status === 'gun' ? "Gun!" : "",
        duration: 1000
      });
    } catch (error) {
      console.error("Error playing sound:", error);
      
      // Fallback for cases where audio context doesn't work
      try {
        const fallbackAudio = new Audio();
        fallbackAudio.volume = volume / 100;
        
        // Create oscillator sound as fallback
        if (status === 'on-your-marks') {
          fallbackAudio.src = "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAiBMAAESsAAACABAAZGF0YRAAAAAAAAAAAAAAAAAAAAAAAA==";
        } else if (status === 'set') {
          fallbackAudio.src = "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAiBMAAESsAAACABAAZGF0YRAAAAAAAAAAAAAAAAAAAAAAAA==";
        } else {
          fallbackAudio.src = "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAiBMAAESsAAACABAAZGF0YRAAAAAAAAAAAAAAAAAAAAAAAA==";
        }
        
        fallbackAudio.play().catch(e => console.error("Failed to play fallback audio:", e));
      } catch (fallbackError) {
        console.error("Even fallback audio failed:", fallbackError);
      }
    }
  };
  
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
  
  // Function to start the sequence
  const startSequence = () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    setStatus('on-your-marks');
    
    // Create audio elements with direct paths to sound files - use absolute URLs
    // Using a real gun sound with powerful reverb for the final shot
    const baseUrl = window.location.origin;
    const audioFiles = {
      onYourMarks: new Audio(`${baseUrl}/sounds/on-your-marks.mp3`),
      set: new Audio(`${baseUrl}/sounds/set.mp3`),
      gun: new Audio(`${baseUrl}/sounds/gun-shot-reverb.mp3`) // Using gun sound with stadium-like reverb
    };
    
    // Use speech synthesis for more natural voice commands if available
    const speakCommand = (text: string) => {
      if ('speechSynthesis' in window) {
        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure voice (deeper male voice works best for race commands)
        utterance.volume = volume / 100;
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 0.8; // Deeper voice
        
        // Get male voice if available
        const voices = window.speechSynthesis.getVoices();
        const maleVoice = voices.find(voice => 
          voice.name.includes('Male') || 
          voice.name.includes('Eric') || 
          voice.name.includes('Guy')
        );
        
        if (maleVoice) {
          utterance.voice = maleVoice;
        }
        
        // Speak the command
        window.speechSynthesis.speak(utterance);
        
        return true;
      }
      return false;
    };
    
    // Configure all audio elements
    Object.values(audioFiles).forEach(audio => {
      audio.volume = isMuted ? 0 : volume / 100;
      // Preload audio
      audio.load();
    });
    
    // Function to play a specific audio and show visual feedback
    const playAudioWithFeedback = (type: 'onYourMarks' | 'set' | 'gun') => {
      // Show visual feedback immediately
      toast({
        title: type === 'onYourMarks' ? "On your marks" : 
              type === 'set' ? "Set" : "Gun!",
        description: type === 'gun' ? "Race started!" : undefined,
        variant: type === 'gun' ? "destructive" : "default",
        duration: 1500
      });
      
      // Try to play audio if not muted - with user interaction handling
      if (!isMuted) {
        // Use audio context for more reliable playback across browsers
        if (!audioContext.current || audioContext.current.state === 'suspended') {
          try {
            // Create or resume audio context with user interaction
            if (!audioContext.current) {
              audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            } else {
              audioContext.current.resume();
            }
          } catch (err) {
            console.error("Failed to initialize audio context:", err);
          }
        }
        
        // For voice commands, try speech synthesis first
        if (type !== 'gun') {
          const text = type === 'onYourMarks' ? "On your marks" : "Set";
          const spokeSucessfully = speakCommand(text);
          
          // If speech synthesis didn't work, fall back to audio files
          if (!spokeSucessfully) {
            playAudioFile(type);
          }
        } else {
          // For gun sound, use a direct approach for maximum compatibility
          try {
            // Create a brand new audio element for each playback - more reliable
            const gunSound = new Audio(`${window.location.origin}/gun-shot-reverb.mp3`);
            gunSound.volume = volume / 100;
            
            // Add event handlers for better debugging
            gunSound.addEventListener('canplaythrough', () => {
              console.log("Gun sound loaded successfully and ready to play");
              // Play immediately when ready
              const playPromise = gunSound.play();
              playPromise.catch(e => {
                console.error("Gun sound play failed:", e);
                // Try alternative approach if this fails
                playAudioFile(type);
              });
            });
            
            gunSound.addEventListener('error', (e) => {
              console.error("Gun sound loading error:", e);
              // Fall back to oscillator sound as last resort
              if (audioContext.current) {
                createGunOscillator();
              }
            });
            
            // Force load
            gunSound.load();
          } catch (error) {
            console.error("Error with direct gun sound:", error);
            // Fall back to regular audio method
            playAudioFile(type);
          }
        }
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
    
    // Function to play audio file with fallbacks
    const playAudioFile = (type: 'onYourMarks' | 'set' | 'gun') => {
      // Play audio with both methods for best compatibility
      const audio = audioFiles[type];
      
      // Method 1: Standard HTML5 Audio
      try {
        // Ensure audio is loaded
        audio.load();
        audio.currentTime = 0;
        
        // Force unmute and set volume
        audio.muted = false;
        audio.volume = volume / 100;
        
        // Play with error handling
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.error(`HTML5 Audio playback failed for ${type}:`, e);
            
            // Method 2: Create a backup oscillator tone as last resort
            try {
              if (audioContext.current) {
                const oscillator = audioContext.current.createOscillator();
                const gainNode = audioContext.current.createGain();
                
                // Different frequencies for different commands
                oscillator.frequency.value = type === 'onYourMarks' ? 200 : 
                                          type === 'set' ? 400 : 800;
                
                gainNode.gain.value = volume / 100;
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.current.destination);
                
                // Short beep
                oscillator.start();
                setTimeout(() => oscillator.stop(), 300);
              }
            } catch (oscError) {
              console.error("Even oscillator fallback failed:", oscError);
            }
          });
        }
      } catch (error) {
        console.error(`Error playing ${type} sound:`, error);
      }
    };
    
    // Start the sequence - play "On your marks"
    playAudioWithFeedback('onYourMarks');
    
    // Set timer for "Set" command after the specified delay
    timerRefs.current.setTimer = setTimeout(() => {
      setStatus('set');
      playAudioWithFeedback('set');
      
      // Calculate final delay - either exact or randomized
      let finalDelay = setToGunDelay;
      
      if (useRandomizer) {
        // Add randomization of +/- 1 second
        const randomOffset = (Math.random() * 2 - 1) * 1.0; // Random value between -1 and +1
        finalDelay = Math.max(0.1, setToGunDelay + randomOffset); // Ensure minimum 0.1s delay
      }
      
      setCurrentSetToGunDelay(finalDelay);
      
      // Set timer for gun sound
      timerRefs.current.gunTimer = setTimeout(() => {
        setStatus('gun');
        playAudioWithFeedback('gun');
        triggerFlash();
        
        // Start recording if enabled
        if (useCamera) {
          startRecording();
        }
        
        // Reset state after a short delay
        setTimeout(() => {
          setIsPlaying(false);
          setStatus('idle');
        }, 2000);
      }, finalDelay * 1000);
    }, marksToSetDelay * 1000);
  };
  
  // Function to stop the sequence
  const stopSequence = () => {
    if (!isPlaying) return;
    
    // Clear timers
    if (timerRefs.current.setTimer) {
      clearTimeout(timerRefs.current.setTimer);
      timerRefs.current.setTimer = null;
    }
    
    if (timerRefs.current.gunTimer) {
      clearTimeout(timerRefs.current.gunTimer);
      timerRefs.current.gunTimer = null;
    }
    
    // Stop recording if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    // Release camera if active
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Reset state
    setIsPlaying(false);
    setStatus('idle');
  };
  
  // Function to request permissions for camera and flash
  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true
      });
      
      // Update permissions state
      setCameraPermissions({
        camera: true,
        microphone: true,
        flashlight: hasFlash
      });
      
      // Stop tracks after permission check
      stream.getTracks().forEach(track => track.stop());
      
      toast({
        title: "Permissions granted",
        description: "Camera and microphone access allowed",
      });
    } catch (error) {
      console.error("Error requesting permissions:", error);
      setCameraPermissions({
        camera: false,
        microphone: false,
        flashlight: false
      });
      
      toast({
        title: "Permission denied",
        description: "Please allow camera and microphone access to use advanced features",
        variant: "destructive"
      });
    }
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };
  
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Training Tools", href: "/training-tools" },
    { label: "Start Gun", href: "/tools/start-gun" },
  ];
  
  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-16 pb-20">
      <Breadcrumb items={breadcrumbItems} />
      
      <PageHeader
        title="Race Start Simulator"
        description="Professional race starter with voice commands and gun sound"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Main control card */}
        <Card className="lg:col-span-2 w-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" /> 
              Race Start Control
            </CardTitle>
            <CardDescription>
              Press the button to begin the start sequence
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="relative my-8 text-center">
              {/* Status display */}
              <div className="mb-5 text-3xl font-bold tracking-tight">
                {status === 'idle' ? (
                  "Ready"
                ) : status === 'on-your-marks' ? (
                  "On Your Marks"
                ) : status === 'set' ? (
                  "Set"
                ) : (
                  "GO!"
                )}
              </div>
              
              {/* Main button */}
              <Button 
                size="lg" 
                className={`w-40 h-40 rounded-full text-xl flex flex-col items-center justify-center transition-all
                  ${isPlaying ? 'bg-destructive hover:bg-destructive' : 'bg-primary'}`}
                onClick={isPlaying ? stopSequence : startSequence}
              >
                {isPlaying ? (
                  <>
                    <StopCircle className="h-10 w-10 mb-2" />
                    <span>STOP</span>
                  </>
                ) : (
                  <>
                    <Play className="h-10 w-10 mb-2" />
                    <span>START</span>
                  </>
                )}
              </Button>
            </div>
            
            {/* Currently active timing display */}
            {isPlaying && (
              <div className="mt-4 text-center">
                <div className="text-sm font-medium text-muted-foreground">
                  {status === 'on-your-marks' ? (
                    `Waiting ${marksToSetDelay}s for "Set" command...`
                  ) : status === 'set' ? (
                    useRandomizer ? 
                      `Random delay: ~${currentSetToGunDelay.toFixed(1)}s...` :
                      `Fixed delay: ${setToGunDelay}s...`
                  ) : (
                    useCamera ? 
                      `Recording for ${recordDuration}s...` : 
                      "Completed!"
                  )}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground w-full text-center">
              {useRandomizer ? 
                `The gun will fire after a random delay around ${setToGunDelay}s (±1s) from the "Set" command` : 
                `The gun will fire exactly ${setToGunDelay}s after the "Set" command`}
            </p>
          </CardFooter>
        </Card>
        
        {/* Settings card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Timer className="h-5 w-5 mr-2" />
              Timing Settings
            </CardTitle>
            <CardDescription>
              Configure the race start sequence timing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Marks to Set delay slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Set Timer</Label>
                <span className="text-sm font-medium">{marksToSetDelay}s</span>
              </div>
              <Slider 
                value={[marksToSetDelay]} 
                min={1}
                max={20}
                step={1}
                onValueChange={(value) => setMarksToSetDelay(value[0])}
                disabled={isPlaying}
              />
              <p className="text-xs text-muted-foreground">
                Delay between "On Your Marks" and "Set" commands
              </p>
            </div>
            
            {/* Bangomizer - Set to Gun delay with randomizer */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="flex items-center">
                  Bangomizer 
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="ml-1 text-muted-foreground cursor-help text-xs">(?)</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        Time from "Set" to gun sound
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">{setToGunDelay}s</span>
                  {useRandomizer && <Dices className="h-4 w-4 text-primary" />}
                </div>
              </div>
              <Slider 
                value={[setToGunDelay]} 
                min={0.5}
                max={3}
                step={0.1}
                onValueChange={(value) => setSetToGunDelay(value[0])}
                disabled={isPlaying}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {useRandomizer 
                    ? "Randomizes ±1s from set value" 
                    : "Fixed delay from Set to gun"}
                </p>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="randomizer" className="text-xs cursor-pointer">Randomize</Label>
                  <Switch 
                    id="randomizer"
                    checked={useRandomizer}
                    onCheckedChange={setUseRandomizer}
                    disabled={isPlaying}
                  />
                </div>
              </div>
            </div>
            
            {/* Volume control */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between">
                <Label>Volume</Label>
                <span className="text-sm font-medium">{volume}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={toggleMute}
                  className="shrink-0"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Slider 
                  value={[volume]} 
                  max={100} 
                  step={1}
                  onValueChange={handleVolumeChange}
                  disabled={isMuted}
                />
              </div>
            </div>
            
            {/* Device capabilities */}
            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-sm font-medium">Camera Features</h3>
              
              {/* Flash toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="flash">Flash on Gun</Label>
                  <p className="text-xs text-muted-foreground">
                    Flash the camera light when gun fires
                  </p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Switch
                          id="flash"
                          checked={useFlash}
                          onCheckedChange={(checked) => {
                            if (checked && !cameraPermissions.camera) {
                              requestPermissions();
                            }
                            setUseFlash(checked);
                          }}
                          disabled={!hasFlash || isPlaying}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {!hasFlash ? "Flash not available on this device" : "Camera permission required"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {/* Camera recording toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="camera">Record Race Start</Label>
                  <p className="text-xs text-muted-foreground">
                    Start recording video on gun signal
                  </p>
                </div>
                <Switch
                  id="camera"
                  checked={useCamera}
                  onCheckedChange={(checked) => {
                    if (checked && !cameraPermissions.camera) {
                      requestPermissions();
                    }
                    setUseCamera(checked);
                  }}
                  disabled={isPlaying}
                />
              </div>
              
              {/* Recording duration */}
              {useCamera && (
                <div className="flex items-center space-x-2">
                  <Label htmlFor="record-duration">Record for</Label>
                  <Select
                    value={recordDuration}
                    onValueChange={setRecordDuration}
                    disabled={isPlaying}
                  >
                    <SelectTrigger id="record-duration" className="w-24">
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
              )}
              
              {/* Permission status */}
              {(useFlash || useCamera) && !cameraPermissions.camera && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={requestPermissions}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Grant Camera Permissions
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Protected route wrapper
export function Component() {
  return (
    <ProtectedRoute path="/tools/start-gun" component={StartGunPage} />
  );
}