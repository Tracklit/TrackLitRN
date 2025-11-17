import { useState, useRef, useEffect } from "react";
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
  RotateCcw
} from "lucide-react";

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
  const [sequenceCancelled, setSequenceCancelled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
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
  const marksAudioRef = useRef<HTMLAudioElement | null>(null);
  const setAudioRef = useRef<HTMLAudioElement | null>(null);
  const bangAudioRef = useRef<HTMLAudioElement | null>(null);
  
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
  const activeAudioElements = useRef<HTMLAudioElement[]>([]);
  const sequenceCancelledRef = useRef(false);
  const audioUnlockedRef = useRef(false);
  const isPlayingRef = useRef(false); // Immediate synchronous check to prevent rapid taps
  const [isStarting, setIsStarting] = useState(false); // Track button press state
  
  // Sequence ID system to invalidate old callbacks
  const currentSequenceId = useRef(0);
  const lastActionTimestamp = useRef(0);
  
  // Initialize Audio Context and preload audio
  useEffect(() => {
    // Initialize audio API early on page load to minimize autoplay restrictions
    if (typeof window !== 'undefined') {
      try {
        // Set up audio context for potential use - needed for oscillator fallback
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Preload audio files with proper deployment paths (lowercase for consistency)
        marksAudioRef.current = new Audio('/on-your-marks.mp3');
        setAudioRef.current = new Audio('/set.mp3');
        bangAudioRef.current = new Audio('/bang.mp3');
        
        // Configure audio elements for Samsung device compatibility
        [marksAudioRef.current, setAudioRef.current, bangAudioRef.current].forEach(audio => {
          if (audio) {
            audio.preload = 'auto';
            // Set playsInline attribute for mobile compatibility
            (audio as any).playsInline = true;
            // Samsung devices benefit from explicit muted preload then unmute
            audio.muted = true;
            audio.load();
            // Unmute after loading
            setTimeout(() => {
              if (audio) audio.muted = false;
            }, 100);
          }
        });
        
        // Enhanced user interaction handler for Samsung devices
        const handleUserInteraction = async () => {
          if (audioUnlockedRef.current) return; // Already unlocked
          
          console.log("User interaction detected, unlocking audio for first use");
          
          try {
            // Resume audio context
            if (audioContext.current && audioContext.current.state === 'suspended') {
              await audioContext.current.resume();
              console.log("AudioContext resumed on user interaction");
            }
            
            // Test play and pause each audio element to unlock them
            const unlockPromises = [marksAudioRef.current, setAudioRef.current, bangAudioRef.current].map((audio, index) => {
              if (audio) {
                const audioNames = ['marks', 'set', 'bang'];
                return new Promise<void>((resolve) => {
                  audio.volume = 0.01; // Very quiet test
                  audio.play().then(() => {
                    console.log(`${audioNames[index]} audio unlocked`);
                    audio.pause();
                    audio.currentTime = 0;
                    resolve();
                  }).catch(e => {
                    console.log(`Could not unlock ${audioNames[index]} audio:`, e);
                    resolve(); // Continue even if one fails
                  });
                });
              }
              return Promise.resolve();
            });
            
            await Promise.all(unlockPromises);
            audioUnlockedRef.current = true;
            console.log("All audio elements unlocked and ready");
          } catch (e) {
            console.error("Error during audio unlock:", e);
          }
        };
        
        // Listen for various user interaction events
        ['click', 'touchstart', 'keydown'].forEach(eventType => {
          document.addEventListener(eventType, handleUserInteraction, { once: true });
        });
        
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
  }, []);
  
  // Function to play audio - optimized for Samsung/Android devices
  const playAudio = (audioType: 'marks' | 'set' | 'bang', onEnded?: () => void) => {
    if (isMuted) {
      // Even when muted, we need to trigger the callback for timing purposes
      if (onEnded) {
        const estimatedDurations = { marks: 2000, set: 1000, bang: 500 };
        setTimeout(onEnded, estimatedDurations[audioType]);
      }
      return;
    }
    
    // Ensure audio context is resumed (critical for Samsung devices)
    if (audioContext.current && audioContext.current.state === 'suspended') {
      audioContext.current.resume().then(() => {
        console.log("AudioContext resumed for", audioType);
        playAudioInternal(audioType, onEnded);
      }).catch(err => {
        console.error("Failed to resume AudioContext:", err);
        if (onEnded) onEnded();
      });
    } else {
      playAudioInternal(audioType, onEnded);
    }
  };

  // Internal audio playback function using preloaded elements
  const playAudioInternal = (audioType: 'marks' | 'set' | 'bang', onEnded?: () => void) => {
    let audioElement: HTMLAudioElement | null = null;
    let audioName = '';
    
    // Use the preloaded audio elements instead of creating new ones
    switch (audioType) {
      case 'marks':
        audioElement = marksAudioRef.current;
        audioName = 'on-your-marks.mp3';
        break;
      case 'set':
        audioElement = setAudioRef.current;
        audioName = 'set.mp3';
        break;
      case 'bang':
        audioElement = bangAudioRef.current;
        audioName = 'bang.mp3';
        break;
    }
    
    if (!audioElement) {
      console.error(`Audio element not found for ${audioType}`);
      if (onEnded) onEnded();
      return;
    }
    
    try {
      console.log(`Playing ${audioName}`);
      
      // Stop the audio completely before restarting to prevent overlaps
      audioElement.pause();
      audioElement.currentTime = 0;
      audioElement.volume = volume / 100;
      
      // Note: We can't remove anonymous listeners, so we'll rely on the hasCompleted flag
      // to prevent duplicate callbacks
      
      // Set up completion detection with multiple fallbacks for Samsung devices
      let hasCompleted = false;
      let completionTimer: NodeJS.Timeout | null = null;
      
      const triggerCompletion = () => {
        if (hasCompleted) return;
        hasCompleted = true;
        
        console.log(`${audioName} completed (via ${hasCompleted ? 'event' : 'timer'})`);
        
        // Clean up
        if (completionTimer) {
          clearTimeout(completionTimer);
          completionTimer = null;
        }
        audioElement!.removeEventListener('ended', endedHandler);
        audioElement!.removeEventListener('error', errorHandler);
        audioElement!.removeEventListener('pause', pauseHandler);
        
        // Only trigger callback if sequence hasn't been cancelled
        if (onEnded && !sequenceCancelledRef.current) {
          onEnded();
        }
      };
      
      // Set up the ended callback
      const endedHandler = () => {
        console.log(`${audioName} ended event fired`);
        triggerCompletion();
      };
      
      // Set up error handler
      const errorHandler = (e: any) => {
        console.error(`Error playing ${audioName}:`, e);
        triggerCompletion();
      };
      
      // Set up pause handler (sometimes paused instead of ended on Samsung)
      const pauseHandler = () => {
        // Only treat as completion if we're at the end of the audio
        if (audioElement && audioElement.currentTime >= audioElement.duration - 0.1) {
          console.log(`${audioName} paused at end, treating as completion`);
          triggerCompletion();
        }
      };
      
      audioElement.addEventListener('ended', endedHandler);
      audioElement.addEventListener('error', errorHandler);
      audioElement.addEventListener('pause', pauseHandler);
      
      // Start playback with proper promise handling for Samsung devices
      const playPromise = audioElement.play();
      if (playPromise) {
        playPromise.then(() => {
          console.log(`${audioName} started successfully`);
          
          // Set up a backup timer in case the ended event doesn't fire
          // Use the audio duration + small buffer as fallback
          if (audioElement && audioElement.duration && !isNaN(audioElement.duration)) {
            completionTimer = setTimeout(() => {
              if (!hasCompleted) {
                console.log(`${audioName} completion timer fired as fallback`);
                triggerCompletion();
              }
            }, (audioElement.duration + 0.2) * 1000); // Add 200ms buffer
          } else {
            // If duration is not available, use estimated durations
            const estimatedDurations = { marks: 2000, set: 1000, bang: 500 };
            completionTimer = setTimeout(() => {
              if (!hasCompleted) {
                console.log(`${audioName} estimated completion timer fired as fallback`);
                triggerCompletion();
              }
            }, estimatedDurations[audioType] || 1000);
          }
        }).catch(err => {
          console.error(`Error starting ${audioName}:`, err);
          // Samsung devices may need a slight delay and retry
          setTimeout(() => {
            if (audioElement && audioElement.paused && !hasCompleted) {
              console.log(`Retrying ${audioName} for Samsung device`);
              audioElement.play().catch(retryErr => {
                console.error(`Retry failed for ${audioName}:`, retryErr);
                triggerCompletion();
              });
            }
          }, 50);
        });
      } else {
        // If no promise returned, set up fallback timer immediately
        const estimatedDurations = { marks: 2000, set: 1000, bang: 500 };
        completionTimer = setTimeout(() => {
          if (!hasCompleted) {
            console.log(`${audioName} fallback timer fired (no play promise)`);
            triggerCompletion();
          }
        }, estimatedDurations[audioType] || 1000);
      }
    } catch (error) {
      console.error(`Exception playing ${audioName}:`, error);
      if (onEnded) onEnded();
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
      // Camera access denied - user will see browser permission prompt
    }
  };
  
  // Function to unlock audio on first button press if needed
  const ensureAudioUnlocked = async () => {
    if (audioUnlockedRef.current) return; // Already unlocked
    
    console.log("First button press - unlocking audio");
    
    try {
      // Resume audio context
      if (audioContext.current && audioContext.current.state === 'suspended') {
        await audioContext.current.resume();
        console.log("AudioContext resumed");
      }
      
      // Unlock all audio elements synchronously before starting sequence
      const unlockPromises = [marksAudioRef.current, setAudioRef.current, bangAudioRef.current].map((audio) => {
        if (audio) {
          return new Promise<void>((resolve) => {
            const originalVolume = audio.volume;
            audio.volume = 0.01;
            audio.play().then(() => {
              audio.pause();
              audio.currentTime = 0;
              audio.volume = originalVolume;
              resolve();
            }).catch(() => resolve()); // Continue even if unlock fails
          });
        }
        return Promise.resolve();
      });
      
      await Promise.all(unlockPromises);
      audioUnlockedRef.current = true;
      console.log("Audio unlocked successfully");
    } catch (e) {
      console.error("Error unlocking audio:", e);
    }
  };
  
  // Wrapper to handle start clicks with immediate blocking and cooldown
  const handleStartClick = (e: React.MouseEvent | React.PointerEvent) => {
    const now = Date.now();
    const timeSinceLastAction = now - lastActionTimestamp.current;
    
    // Enforce 600ms cooldown between ANY button actions
    if (timeSinceLastAction < 600) {
      console.log(`Button blocked: cooldown active (${timeSinceLastAction}ms since last action)`);
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Check ref FIRST - this is synchronous and immediate
    if (isPlayingRef.current) {
      console.log("Button blocked: sequence already running");
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // Update timestamp
    lastActionTimestamp.current = now;
    
    // IMMEDIATELY lock the button by setting isPlaying state
    isPlayingRef.current = true;
    setIsPlaying(true);
    
    // Now start the sequence
    startSequence();
  };

  // Function to start the sequence - prevent multiple sequences with ID system
  const startSequence = async () => {
    // Create a new sequence ID and increment the global counter
    currentSequenceId.current++;
    const mySequenceId = currentSequenceId.current;
    console.log(`Starting sequence #${mySequenceId}`);
    
    // Ensure audio is unlocked on first button press
    await ensureAudioUnlocked();
    
    // Set status
    setStatus('on-your-marks');
    setSequenceCancelled(false);
    sequenceCancelledRef.current = false;
    
    // Play on your marks sound and wait for it to end before continuing
    playAudio('marks', () => {
      // Check if this sequence is still valid
      if (currentSequenceId.current !== mySequenceId) {
        console.log(`Sequence #${mySequenceId} invalidated (current: ${currentSequenceId.current})`);
        return;
      }
      if (sequenceCancelledRef.current) return;
      console.log(`Sequence #${mySequenceId}: 'On your marks' audio ended, waiting for delay`);
      
      // After the marks audio completes, wait for the set delay
      timerRefs.current.setTimer = setTimeout(() => {
        if (currentSequenceId.current !== mySequenceId) return;
        if (sequenceCancelledRef.current) return;
        setStatus('set');
        
        // Play the set command and wait for it to end
        playAudio('set', () => {
          if (currentSequenceId.current !== mySequenceId) return;
          if (sequenceCancelledRef.current) return;
          console.log(`Sequence #${mySequenceId}: 'Set' audio ended, waiting for gun delay`);
          
          // Calculate gun delay with randomization if enabled
          let finalDelay = setToGunDelay;
          if (useRandomizer) {
            const randomOffset = (Math.random() * 2 - 1) * 1.0;
            finalDelay = Math.max(0.1, setToGunDelay + randomOffset);
          }
          setCurrentSetToGunDelay(finalDelay);
          
          // After the set audio completes, wait for the gun delay
          timerRefs.current.gunTimer = setTimeout(() => {
            if (currentSequenceId.current !== mySequenceId) return;
            if (sequenceCancelledRef.current) return;
            setStatus('gun');
            
            // Play the bang sound
            playAudio('bang', () => {
              if (currentSequenceId.current !== mySequenceId) return;
              if (sequenceCancelledRef.current) return;
              console.log(`Sequence #${mySequenceId}: 'Bang' audio ended`);
              
              // Reset state after bang audio completes
              setTimeout(() => {
                if (currentSequenceId.current !== mySequenceId) return;
                if (sequenceCancelledRef.current) return;
                setIsPlaying(false);
                isPlayingRef.current = false;
                setStatus('idle');
              }, 1000);
            });
            
            // Flash and record if enabled (these should happen with the bang sound)
            triggerFlash();
            if (useCamera) {
              startRecording();
            }
          }, finalDelay * 1000);
        });
      }, marksToSetDelay * 1000);
    });
  };
  
  // Function to reset sequence - invalidates all previous sequences and stops audio
  const resetSequence = () => {
    const now = Date.now();
    const timeSinceLastAction = now - lastActionTimestamp.current;
    
    // Enforce cooldown to prevent rapid reset spam
    if (timeSinceLastAction < 600) {
      console.log(`Reset blocked: cooldown active (${timeSinceLastAction}ms since last action)`);
      return;
    }
    
    // Update timestamp
    lastActionTimestamp.current = now;
    
    console.log(`Resetting sequence (invalidating #${currentSequenceId.current})`);
    
    // IMMEDIATELY invalidate all previous sequences by incrementing the ID
    currentSequenceId.current++;
    console.log(`New sequence ID: ${currentSequenceId.current}`);
    
    // Set cancellation flag to prevent callbacks from executing
    setSequenceCancelled(true);
    sequenceCancelledRef.current = true;
    
    // Clear all timers
    if (timerRefs.current.setTimer) {
      clearTimeout(timerRefs.current.setTimer);
      timerRefs.current.setTimer = null;
    }
    
    if (timerRefs.current.gunTimer) {
      clearTimeout(timerRefs.current.gunTimer);
      timerRefs.current.gunTimer = null;
    }
    
    // Stop all active audio elements
    activeAudioElements.current.forEach(audio => {
      try {
        audio.pause();
        audio.currentTime = 0;
        // Remove all event listeners to prevent callbacks
        audio.removeEventListener('ended', audio.onended as any);
        audio.removeEventListener('error', audio.onerror as any);
        audio.removeEventListener('pause', audio.onpause as any);
      } catch (error) {
        console.log("Error stopping audio:", error);
      }
    });
    
    // Clear the active audio elements array
    activeAudioElements.current = [];
    
    // Also stop the preloaded audio refs if they exist
    if (marksAudioRef.current) {
      try {
        marksAudioRef.current.pause();
        marksAudioRef.current.currentTime = 0;
      } catch (e) {
        console.log("Error stopping marks audio:", e);
      }
    }
    if (setAudioRef.current) {
      try {
        setAudioRef.current.pause();
        setAudioRef.current.currentTime = 0;
      } catch (e) {
        console.log("Error stopping set audio:", e);
      }
    }
    if (bangAudioRef.current) {
      try {
        bangAudioRef.current.pause();
        bangAudioRef.current.currentTime = 0;
      } catch (e) {
        console.log("Error stopping bang audio:", e);
      }
    }
    
    // Reset state immediately
    setStatus('idle');
    setIsPlaying(false);
    isPlayingRef.current = false;
  };
  
  // Toggle mute/unmute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // Content for the help dialog
  const helpContent = (
    <div className="space-y-4 text-sm">
      <h3 className="font-bold text-lg">How to use the Start Gun</h3>
      
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
        return 'bg-primary';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-20">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
            <Zap className="h-7 w-7 text-purple-400" />
            Start Gun
          </h1>
        </div>

        {/* Main Control Card with Gradient Border */}
        <div className="relative mb-6">
          {/* Animated gradient border */}
          <div className="absolute -inset-[2px] bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-2xl opacity-75 blur-sm animate-gradient-xy"></div>
          
          <div className="relative bg-gradient-to-br from-gray-800 to-gray-850 rounded-2xl p-8 shadow-2xl">
            {/* Control Buttons - Start and Reset Stacked */}
            <div className="flex flex-col items-center gap-4 mb-8">
              {/* Start Button - Completely locked when playing */}
              <div className="relative w-36 h-36">
                {/* Pulsing glow effect - only when not playing */}
                {!isPlaying && (
                  <div 
                    className="absolute -inset-4 rounded-full opacity-75 animate-pulse"
                    style={{
                      background: 'radial-gradient(circle, rgba(168, 85, 247, 0.6) 0%, rgba(236, 72, 153, 0.4) 50%, transparent 70%)',
                      filter: 'blur(20px)'
                    }}
                  ></div>
                )}
                <button
                  onPointerDown={handleStartClick}
                  disabled={isPlaying}
                  data-testid="button-start-gun"
                  style={{
                    background: isPlaying 
                      ? 'linear-gradient(to bottom right, rgb(147, 51, 234), rgb(219, 39, 119))'
                      : 'linear-gradient(to bottom right, rgb(168, 85, 247), rgb(236, 72, 153))'
                  }}
                  className="relative w-full h-full rounded-full font-bold text-white shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:pointer-events-none"
                >
                  <Play className="h-14 w-14" style={{ marginLeft: '4px' }} />
                </button>
              </div>
              
              {/* Reset Button - Smaller, under start button */}
              <button
                onClick={resetSequence}
                disabled={!isPlaying}
                data-testid="button-reset-gun"
                style={{
                  background: 'linear-gradient(to bottom right, rgb(55, 65, 81), rgb(31, 41, 55))'
                }}
                className="relative w-24 h-24 rounded-full font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none"
              >
                <RotateCcw className="h-8 w-8" />
                <span className="text-[10px] font-semibold">RESET</span>
              </button>
            </div>

            {/* Volume Controls */}
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleMute}
                  data-testid="button-toggle-mute"
                  className="shrink-0 p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
                <div className="flex-1 relative h-4">
                  <div className="absolute inset-0 bg-gray-700 rounded-full"></div>
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                    style={{ width: `${volume}%` }}
                  ></div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    disabled={isMuted}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg transition-all pointer-events-none"
                    style={{ left: `calc(${volume}% - 16px)` }}
                  ></div>
                </div>
                <span className="w-12 text-center text-sm font-medium text-gray-300">{volume}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Toggle Button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          data-testid="button-toggle-settings"
          className="w-full mb-4 bg-gradient-to-r from-gray-800 to-gray-850 hover:from-gray-750 hover:to-gray-800 text-white rounded-xl p-4 border border-gray-700/50 transition-all flex items-center justify-between shadow-lg"
        >
          <span className="flex items-center gap-2 font-semibold">
            <Timer className="h-5 w-5 text-purple-400" />
            Settings & Options
          </span>
          <span className="text-gray-400 transition-transform" style={{ transform: showSettings ? 'rotate(180deg)' : 'rotate(0deg)' }}>⌄</span>
        </button>

        {/* Collapsible Settings */}
        {showSettings && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-xl p-6 border border-gray-700/50 shadow-lg space-y-6">
            
            {/* Timing Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Timing
              </h3>
              
              <div className="space-y-2 bg-gray-900/30 rounded-lg p-3 border border-gray-700/30">
                <div className="flex items-center justify-between mb-3">
                  <Label htmlFor="marks-to-set" className="text-gray-300 text-sm">Marks to Set</Label>
                  <span className="text-sm font-semibold text-white">{marksToSetDelay}s</span>
                </div>
                <div className="relative h-4">
                  <div className="absolute inset-0 bg-gray-700 rounded-full"></div>
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                    style={{ width: `${((marksToSetDelay - 1) / (20 - 1)) * 100}%` }}
                  ></div>
                  <input
                    id="marks-to-set"
                    type="range"
                    min={1}
                    max={20}
                    step={0.5}
                    value={marksToSetDelay}
                    onChange={(e) => setMarksToSetDelay(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg transition-all pointer-events-none"
                    style={{ left: `calc(${((marksToSetDelay - 1) / (20 - 1)) * 100}% - 16px)` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2 bg-gray-900/30 rounded-lg p-3 border border-gray-700/30">
                <div className="flex items-center justify-between mb-3">
                  <Label htmlFor="set-to-gun" className="text-gray-300 text-sm">Set to Gun</Label>
                  <span className="text-sm font-semibold text-white">{setToGunDelay}s</span>
                </div>
                <div className="relative h-4">
                  <div className="absolute inset-0 bg-gray-700 rounded-full"></div>
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                    style={{ width: `${((setToGunDelay - 0.5) / (10 - 0.5)) * 100}%` }}
                  ></div>
                  <input
                    id="set-to-gun"
                    type="range"
                    min={0.5}
                    max={10}
                    step={0.5}
                    value={setToGunDelay}
                    onChange={(e) => setSetToGunDelay(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  />
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg transition-all pointer-events-none"
                    style={{ left: `calc(${((setToGunDelay - 0.5) / (10 - 0.5)) * 100}% - 16px)` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 bg-gray-900/30 rounded-lg p-3 border border-gray-700/30">
                <Switch
                  id="randomize"
                  checked={useRandomizer}
                  onCheckedChange={setUseRandomizer}
                  className="data-[state=checked]:bg-blue-900"
                />
                <Label htmlFor="randomize" className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
                  <Dices className="h-4 w-4 text-purple-400" />
                  Randomize gun timing
                </Label>
              </div>
            </div>
            
            {/* Device Options */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-pink-300 flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Device Options
              </h3>
              
              <div className="flex items-center space-x-3 bg-gray-900/30 rounded-lg p-3 border border-gray-700/30">
                <Switch
                  id="use-flash"
                  checked={useFlash}
                  onCheckedChange={setUseFlash}
                  disabled={!hasFlash}
                />
                <Label 
                  htmlFor="use-flash" 
                  className={`flex items-center gap-2 text-sm cursor-pointer ${!hasFlash ? 'text-gray-500' : 'text-gray-300'}`}
                >
                  <Zap className="h-4 w-4" />
                  Use camera flash
                  {!hasFlash && <span className="text-xs text-gray-500">(Not available)</span>}
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 bg-gray-900/30 rounded-lg p-3 border border-gray-700/30">
                <Switch
                  id="use-camera"
                  checked={useCamera}
                  onCheckedChange={setUseCamera}
                />
                <Label htmlFor="use-camera" className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
                  <Camera className="h-4 w-4" />
                  Record video
                </Label>
              </div>
              
              {useCamera && (
                <div className="pl-6 bg-gray-900/30 rounded-lg p-3 border border-gray-700/30">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="record-duration" className="text-gray-300 text-sm">Record for</Label>
                    <Select value={recordDuration} onValueChange={setRecordDuration}>
                      <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
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

            {/* Help Section */}
            <div className="pt-4 border-t border-gray-700/50">
              <details className="group">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 transition-colors list-none flex items-center gap-2">
                  <span className="group-open:rotate-90 transition-transform">▶</span>
                  How to use
                </summary>
                <div className="mt-3 text-sm text-gray-400 space-y-3 pl-5">
                  <div>
                    <p className="font-semibold text-gray-300">Timing Settings</p>
                    <p className="text-xs">Adjust delays between commands to match official standards or your preference.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-300">Tips</p>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      <li>Use headphones for the most realistic experience</li>
                      <li>Practice with randomized timing to improve reaction</li>
                      <li>Review recorded videos to analyze your technique</li>
                    </ul>
                  </div>
                </div>
              </details>
            </div>
          </div>
        )}
      </div>

      {/* Add gradient animation styles */}
      <style>{`
        @keyframes gradient-xy {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-xy {
          background-size: 200% 200%;
          animation: gradient-xy 3s ease infinite;
        }
      `}</style>
    </div>
  );
}

// Export also as a component for dynamic routes
export function Component() {
  return <StartGunPage />;
}