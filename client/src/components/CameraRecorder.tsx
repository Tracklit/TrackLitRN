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
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
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
      
      // Wait for video element to be rendered
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
      
      // Add event handlers
      video.onloadedmetadata = () => {
        console.log('Video metadata loaded');
        video.play().then(() => {
          console.log('Video playing successfully');
          setIsVideoPlaying(true);
        }).catch(error => {
          console.error('Failed to play video:', error);
          setIsVideoPlaying(false);
        });
      };

      video.onerror = (error) => {
        console.error('Video element error:', error);
        toast({
          title: "Video Error",
          description: "Failed to display camera feed",
          variant: "destructive"
        });
      };

    } catch (error) {
      console.error('Camera access error:', error);
      let errorMessage = 'Failed to access camera';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera permissions.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported in this browser.';
        }
      }

      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive"
      });

      setIsStreaming(false);
      setStreamActive(false);
      setIsVideoPlaying(false);
    }
  }, [toast]);

  const startCamera = useCallback(async () => {
    await startCameraWithMode(facingMode);
  }, [startCameraWithMode, facingMode]);

  const stopCamera = useCallback(() => {
    console.log('🛑 Stopping camera');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
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
      toast({
        title: "No camera stream",
        description: "Please start the camera first",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🔴 Starting recording');
      setRecordedChunks([]);

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('⏹️ Recording stopped');
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);

      toast({
        title: "Recording started",
        description: "Recording your exercise video"
      });

    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "Recording failed",
        description: "Failed to start recording",
        variant: "destructive"
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('⏹️ Stopping recording');
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  const saveRecording = useCallback(() => {
    if (recordedChunks.length === 0) {
      toast({
        title: "No recording",
        description: "Please record a video first",
        variant: "destructive"
      });
      return;
    }

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    console.log('💾 Saving recording, size:', blob.size, 'bytes');
    
    onVideoRecorded(blob);
    setRecordedChunks([]);

    toast({
      title: "Video recorded",
      description: "Starting analysis of your exercise"
    });
  }, [recordedChunks, onVideoRecorded, toast]);

  const discardRecording = useCallback(() => {
    setRecordedChunks([]);
    console.log('🗑️ Recording discarded');
    
    toast({
      title: "Recording discarded",
      description: "Video has been deleted"
    });
  }, [toast]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Camera Recorder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Camera Preview */}
        <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden">
          {isStreaming && (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
          )}
          {!isStreaming && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Camera preview will appear here</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 justify-center">
          {!isStreaming ? (
            <Button onClick={startCamera} data-testid="button-start-camera">
              <Video className="h-4 w-4 mr-2" />
              Start Camera
            </Button>
          ) : (
            <>
              <Button onClick={stopCamera} variant="outline" data-testid="button-stop-camera">
                <Square className="h-4 w-4 mr-2" />
                Stop Camera
              </Button>
              <Button onClick={switchCamera} variant="outline" data-testid="button-switch-camera">
                <RotateCcw className="h-4 w-4 mr-2" />
                Switch Camera
              </Button>
            </>
          )}

          {isStreaming && !isRecording && (
            <Button onClick={startRecording} className="bg-red-600 hover:bg-red-700" data-testid="button-start-recording">
              <div className="w-4 h-4 bg-white rounded-full mr-2" />
              Record
            </Button>
          )}

          {isRecording && (
            <Button onClick={stopRecording} variant="destructive" data-testid="button-stop-recording">
              <Square className="h-4 w-4 mr-2" />
              Stop Recording
            </Button>
          )}
        </div>

        {/* Recording Actions */}
        {recordedChunks.length > 0 && (
          <div className="flex gap-2 justify-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 mb-2">Recording completed!</p>
            <div className="flex gap-2">
              <Button onClick={saveRecording} size="sm" data-testid="button-save-recording">
                Use This Recording
              </Button>
              <Button onClick={discardRecording} variant="outline" size="sm" data-testid="button-discard-recording">
                Record Again
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}