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
  StopCircle,
  Loader2
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
  const [setToGunDelayMin, setSetToGunDelayMin] = useState(1);
  const [setToGunDelayMax, setSetToGunDelayMax] = useState(3);
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
    // Create audio context
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContext.current = ctx;
    
    // Function to load and decode audio files
    const loadSound = async (url: string, key: keyof AudioBuffers) => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        audioBuffers.current[key] = audioBuffer;
      } catch (error) {
        console.error(`Error loading ${key} sound:`, error);
      }
    };
    
    // Synthesize sounds if files don't exist
    const generateVoiceSound = (text: string, key: keyof AudioBuffers) => {
      try {
        // Create oscillator for basic tone
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = key === 'onYourMarks' ? 200 : 250; // Different pitches
        gainNode.gain.value = 0.8;
        
        // Create short buffer for the voice sound
        const duration = key === 'onYourMarks' ? 1.0 : 0.5; // Longer for "on your marks"
        const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
        const channelData = buffer.getChannelData(0);
        
        // Fill with a simple synthesized "voice"
        for (let i = 0; i < buffer.length; i++) {
          // Create an envelope to shape the sound
          let envelope = 1;
          if (i < 0.1 * ctx.sampleRate) {
            envelope = i / (0.1 * ctx.sampleRate); // Attack
          } else if (i > buffer.length - 0.2 * ctx.sampleRate) {
            envelope = (buffer.length - i) / (0.2 * ctx.sampleRate); // Release
          }
          
          // Add some variation to sound more like speech
          const variation = Math.sin(i * (key === 'onYourMarks' ? 0.01 : 0.02)) * 0.2;
          channelData[i] = (Math.sin(i * 0.05) + variation) * envelope * 0.5;
        }
        
        audioBuffers.current[key] = buffer;
        console.log(`Generated ${key} sound`);
      } catch (error) {
        console.error(`Error generating ${key} sound:`, error);
      }
    };
    
    const generateGunSound = () => {
      try {
        // Create a short, loud "bang" sound
        const duration = 0.3;
        const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
        const channelData = buffer.getChannelData(0);
        
        // Fill with noise for the gun sound
        for (let i = 0; i < buffer.length; i++) {
          let envelope = 1;
          if (i < 0.01 * ctx.sampleRate) {
            envelope = i / (0.01 * ctx.sampleRate); // Very fast attack
          } else {
            envelope = Math.max(0, 1 - (i / (0.3 * ctx.sampleRate))); // Fast decay
          }
          
          // Random noise with sharp attack and decay
          channelData[i] = (Math.random() * 2 - 1) * envelope;
        }
        
        audioBuffers.current.gun = buffer;
        console.log("Generated gun sound");
      } catch (error) {
        console.error("Error generating gun sound:", error);
      }
    };
    
    // Try to load sounds or generate them
    const initSounds = async () => {
      try {
        // For a real app, we would load audio files here
        // For now, we'll generate synthetic sounds
        generateVoiceSound("On your marks", "onYourMarks");
        generateVoiceSound("Set", "set");
        generateGunSound();
      } catch (error) {
        console.error("Error initializing sounds:", error);
        toast({
          title: "Sound initialization failed",
          description: "Please refresh the page and try again",
          variant: "destructive"
        });
      }
    };
    
    initSounds();
    
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
  
  // Function to play audio buffer
  const playSound = (buffer: AudioBuffer | null) => {
    if (!buffer || !audioContext.current || isMuted) return;
    
    try {
      const source = audioContext.current.createBufferSource();
      source.buffer = buffer;
      
      // Create gain node for volume control
      const gainNode = audioContext.current.createGain();
      gainNode.gain.value = volume / 100;
      
      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(audioContext.current.destination);
      
      // Play the sound
      source.start();
    } catch (error) {
      console.error("Error playing sound:", error);
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
    
    // Resume audio context if it's suspended (needed for mobile)
    if (audioContext.current && audioContext.current.state === 'suspended') {
      audioContext.current.resume();
    }
    
    // Play "On your marks"
    playSound(audioBuffers.current.onYourMarks);
    
    // Set timer for "Set" command after the specified delay
    timerRefs.current.setTimer = setTimeout(() => {
      setStatus('set');
      playSound(audioBuffers.current.set);
      
      // Generate random delay between min and max for the gun
      const randomDelay = Math.random() * (setToGunDelayMax - setToGunDelayMin) + setToGunDelayMin;
      setCurrentSetToGunDelay(randomDelay);
      
      // Set timer for gun sound
      timerRefs.current.gunTimer = setTimeout(() => {
        setStatus('gun');
        playSound(audioBuffers.current.gun);
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
      }, randomDelay * 1000);
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
                    `Random delay: ${currentSetToGunDelay.toFixed(1)}s...`
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
              The gun will fire after a random delay between {setToGunDelayMin}-{setToGunDelayMax} seconds from the "Set" command
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
                <Label>On Your Marks → Set</Label>
                <span className="text-sm font-medium">{marksToSetDelay}s</span>
              </div>
              <Slider 
                value={[marksToSetDelay]} 
                min={1}
                max={5}
                step={0.5}
                onValueChange={(value) => setMarksToSetDelay(value[0])}
                disabled={isPlaying}
              />
              <p className="text-xs text-muted-foreground">
                Delay between "On Your Marks" and "Set" commands
              </p>
            </div>
            
            {/* Random Set to Gun delay sliders */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Set → Gun (Random)</Label>
                <span className="text-sm font-medium">{setToGunDelayMin}s - {setToGunDelayMax}s</span>
              </div>
              <div className="flex items-center gap-2">
                <Slider 
                  value={[setToGunDelayMin]} 
                  min={0.5}
                  max={setToGunDelayMax - 0.2}
                  step={0.1}
                  onValueChange={(value) => setSetToGunDelayMin(value[0])}
                  disabled={isPlaying}
                />
                <Dices className="h-4 w-4 text-muted-foreground" />
                <Slider 
                  value={[setToGunDelayMax]} 
                  min={setToGunDelayMin + 0.2}
                  max={5}
                  step={0.1}
                  onValueChange={(value) => setSetToGunDelayMax(value[0])}
                  disabled={isPlaying}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Random delay range between "Set" command and gun sound
              </p>
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