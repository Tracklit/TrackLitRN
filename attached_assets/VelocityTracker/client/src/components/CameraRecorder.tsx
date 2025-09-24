import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Square, Camera, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CameraRecorderProps {
  onVideoRecorded: (videoBlob: Blob) => void;
}

export function CameraRecorder({ onVideoRecorded }: CameraRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();

  const switchCamera = useCallback(async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    console.log(`📱 Switching camera from ${facingMode} to ${newFacingMode}`);
    
    if (isStreaming) {
      // Stop current stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsStreaming(false);
      setIsVideoPlaying(false);
      setStreamActive(false);
      
      // Update facing mode
      setFacingMode(newFacingMode);
      
      // Small delay to ensure camera is fully released and state is updated
      setTimeout(async () => {
        await startCameraWithMode(newFacingMode);
      }, 300);
    }
  }, [facingMode, isStreaming]);

  const startCameraWithMode = useCallback(async (mode: 'user' | 'environment') => {
    console.log('🎥 Starting camera with mode:', mode);
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      // Check for available video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('📹 Found video devices:', videoDevices.length);
      
      if (videoDevices.length === 0) {
        throw new Error('No camera found on this device');
      }

      console.log('🔌 Requesting camera stream with facing mode:', mode);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      console.log('✅ Camera stream obtained:', stream);
      
      // Store stream first
      streamRef.current = stream;
      
      // Set streaming state immediately to render the video element
      setIsStreaming(true);
      setStreamActive(true);
      
      // Wait for video element to be rendered, try multiple times if needed
      let retries = 0;
      while (!videoRef.current && retries < 10) {
        await new Promise(resolve => setTimeout(resolve, 50));
        retries++;
        console.log(`Waiting for video element... attempt ${retries}`);
      }
      
      if (!videoRef.current) {
        console.error('❌ Video ref still null after multiple retries');
        return;
      }

      const video = videoRef.current;
      console.log('🎬 Setting video source...');
      video.srcObject = stream;
      
      // Track stream status
      stream.getTracks().forEach(track => {
        console.log('Track:', track.kind, track.enabled, track.readyState);
      });
      
      // Add comprehensive event handlers
      video.onloadedmetadata = () => {
        console.log('Video metadata loaded', {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          duration: video.duration,
          readyState: video.readyState
        });
        video.play().then(() => {
          console.log('Video playing successfully');
          setIsVideoPlaying(true);
        }).catch(error => {
          console.error('Failed to play video:', error);
          setIsVideoPlaying(false);
        });
      };
      
      video.onloadeddata = () => {
        console.log('Video data loaded');
      };
      
      video.oncanplay = () => {
        console.log('Video can play');
      };
      
      video.onplay = () => {
        console.log('Video play event');
        setIsVideoPlaying(true);
      };
      
      video.onpause = () => {
        console.log('Video pause event');
        setIsVideoPlaying(false);
      };
      
      video.onerror = (error) => {
        console.error('Video error:', error);
        setIsVideoPlaying(false);
      };
      
      // Force immediate play attempt
      setTimeout(() => {
        if (video.readyState >= 1) { // HAVE_METADATA
          console.log('🚀 Force play attempt...');
          video.play().then(() => {
            console.log('✅ Force play successful');
            setIsVideoPlaying(true);
          }).catch(error => {
            console.error('❌ Force play failed:', error);
          });
        }
      }, 100);

      toast({
        title: "Camera started",
        description: `Using ${mode === 'user' ? 'front' : 'back'} camera`
      });

    } catch (error) {
      console.error('Error accessing camera:', error);
      
      let errorTitle = "Camera Error";
      let errorDescription = "Failed to access camera";
      
      if (error instanceof Error) {
        const errorName = (error as any).name || '';
        const errorMessage = error.message;
        
        switch (errorName) {
          case 'NotAllowedError':
            errorTitle = "Camera Permission Denied";
            errorDescription = "Please allow camera access in your browser settings and try again.";
            break;
          case 'NotFoundError':
            errorTitle = "No Camera Found";
            errorDescription = "No camera detected on this device. Please connect a camera and try again.";
            break;
          case 'NotReadableError':
            errorTitle = "Camera In Use";
            errorDescription = "Camera is already being used by another application. Close other apps and try again.";
            break;
          case 'OverconstrainedError':
            errorTitle = "Camera Configuration Error";
            errorDescription = `${mode === 'environment' ? 'Back' : 'Front'} camera not available. Try the other camera.`;
            break;
          case 'SecurityError':
            errorTitle = "Security Error";
            errorDescription = "Camera access blocked for security reasons. Make sure you're using HTTPS.";
            break;
          default:
            if (errorMessage.includes('not supported')) {
              errorTitle = "Browser Not Supported";
              errorDescription = "Your browser doesn't support camera access. Try Chrome, Firefox, or Safari.";
            } else if (errorMessage.includes('No camera found')) {
              errorTitle = "No Camera Found";
              errorDescription = "No camera detected on this device.";
            } else {
              errorDescription = `${errorMessage}. Check permissions and try again.`;
            }
        }
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
    }
  }, [toast]);

  const startCamera = useCallback(async () => {
    await startCameraWithMode(facingMode);
  }, [facingMode, startCameraWithMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setIsVideoPlaying(false);
    setStreamActive(false);
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) {
      startCamera();
      return;
    }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorderRef.current = mediaRecorder;
      setRecordedChunks([]);

      // Use a local chunks array to avoid React closure issues
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('📊 Data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunks.push(event.data);
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('🔴 Recording stopped, chunks:', chunks.length);
        const totalSize = chunks.reduce((sum, chunk) => sum + (chunk as Blob).size, 0);
        console.log('📦 Total recorded data:', totalSize, 'bytes');
        
        const recordedBlob = new Blob(chunks, { type: 'video/webm' });
        console.log('✅ Created blob:', recordedBlob.size, 'bytes');
        
        onVideoRecorded(recordedBlob);
        setRecordedChunks([]);
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      console.log('🔴 Recording started with codec:', mediaRecorder.mimeType);

      toast({
        title: "Recording started",
        description: "Recording barbell movement..."
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to start recording",
        variant: "destructive"
      });
    }
  }, [startCamera, onVideoRecorded, recordedChunks, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "Recording stopped",
        description: "Video saved for analysis"
      });
    }
  }, [isRecording, toast]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Video className="text-primary mr-2 h-5 w-5" />
          Record Video
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Camera Preview */}
        <div className="aspect-video bg-muted rounded-lg border-2 border-dashed border-border overflow-hidden relative">
          {isStreaming ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                controls={false}
                className="w-full h-full object-cover"
                data-testid="camera-preview"
                style={{ transform: 'scaleX(-1)' }} // Mirror the preview like a typical camera
                onCanPlay={() => {
                  console.log('Video can play event');
                  // Force play if video is ready but not playing
                  if (videoRef.current && videoRef.current.paused) {
                    videoRef.current.play().catch(console.error);
                  }
                }}
              />
              
              {/* Debug Status Overlay */}
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs p-2 rounded">
                <div>Stream: {streamActive ? '✓ Active' : '✗ Inactive'}</div>
                <div>Video: {isVideoPlaying ? '✓ Playing' : '✗ Not Playing'}</div>
                <div>Video Size: {videoRef.current?.videoWidth || 0} x {videoRef.current?.videoHeight || 0}</div>
                <div>Ready State: {videoRef.current?.readyState || 0}</div>
                <button 
                  onClick={() => {
                    if (videoRef.current) {
                      console.log('Manual play attempt');
                      videoRef.current.play().catch(console.error);
                    }
                  }}
                  className="mt-1 px-2 py-1 bg-blue-600 text-white rounded text-xs"
                >
                  Force Play
                </button>
              </div>
              
              {/* Show loading message only if stream is active but video dimensions aren't available yet */}
              {streamActive && !isVideoPlaying && videoRef.current?.videoWidth === 0 && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="bg-blue-600/90 text-white p-3 rounded-lg text-center text-sm">
                    <p>Loading video...</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Camera preview will appear here</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Click "Start Camera" to begin
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Recording Controls */}
        <div className="flex space-x-2">
          {!isStreaming ? (
            <Button
              onClick={startCamera}
              className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              data-testid="button-start-camera"
            >
              <Camera className="mr-2 h-4 w-4" />
              Start Camera
            </Button>
          ) : (
            <>
              <Button
                onClick={toggleRecording}
                className={`flex-1 font-medium transition-colors ${
                  isRecording 
                    ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
                data-testid="button-toggle-recording"
              >
                {isRecording ? (
                  <>
                    <Square className="mr-2 h-4 w-4" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <div className="mr-2 h-4 w-4 rounded-full bg-current pulse-record" />
                    Start Recording
                  </>
                )}
              </Button>
              <Button
                onClick={switchCamera}
                variant="outline"
                size="icon"
                title={`Switch to ${facingMode === 'user' ? 'back' : 'front'} camera`}
                data-testid="button-switch-camera"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                onClick={stopCamera}
                variant="outline"
                size="icon"
                data-testid="button-stop-camera"
              >
                <Square className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Position camera for side-view of barbell movement
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
