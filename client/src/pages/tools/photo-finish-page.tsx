import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Video, 
  Upload, 
  Play, 
  Pause,
  Save,
  FolderOpen,
  ArrowRight,
  Info,
  X,
  Square
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import trackImagePath from "@assets/IMG_4075.JPG?url";

interface TimerOverlay {
  id: string;
  x: number;
  y: number;
  startTime: number; // in seconds relative to video start
  visible: boolean;
}

interface FinishLineNode {
  id: string;
  x: number;
  y: number;
}

interface FinishLine {
  id: string;
  nodes: FinishLineNode[];
  visible: boolean;
}

interface SavedVideo {
  id: string;
  name: string;
  file: File;
  thumbnail: string;
  duration: number;
  createdAt: Date;
}

export default function PhotoFinishPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  // Video state
  const [currentVideo, setCurrentVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoPoster, setVideoPoster] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  // UI state
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const generateVideoThumbnail = (video: HTMLVideoElement): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      video.currentTime = 1; // Seek to 1 second for thumbnail
      
      video.addEventListener('seeked', () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        }
      }, { once: true });
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file.",
        variant: "destructive",
      });
      return;
    }

    // Start processing after file selection
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("Processing video...");

    try {
      setUploadProgress(25);
      setUploadStatus("Reading video file...");
      
      // Validate file size (limit to 500MB)
      if (file.size > 500 * 1024 * 1024) {
        throw new Error('File too large. Please select a video under 500MB.');
      }
      
      setUploadProgress(40);
      setUploadStatus("Processing video data...");
      
      // Store minimal video data without converting to buffer to avoid memory issues
      const videoData = {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        thumbnail: ''
      };
      
      setUploadProgress(70);
      setUploadStatus("Preparing analysis...");
      
      // Store file reference temporarily and create object URL
      const tempUrl = URL.createObjectURL(file);
      sessionStorage.setItem('photoFinishVideoData', JSON.stringify(videoData));
      sessionStorage.setItem('photoFinishVideoUrl', tempUrl);
      
      setUploadProgress(90);
      setUploadStatus("Launching analysis...");
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setUploadProgress(100);
      setUploadStatus("Complete!");
      
      // Navigate to fullscreen analysis
      setTimeout(() => {
        navigate('/tools/photo-finish/analysis');
      }, 300);
      
    } catch (error) {
      console.error('Error processing video:', error);
      setIsUploading(false);
      setUploadProgress(0);
      
      let errorMessage = "There was an error processing your video. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleVideoLoad = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setCurrentTime(0);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  const saveVideo = async () => {
    if (!currentVideo) return;

    const thumbnail = videoPoster || '';
    const savedVideo: SavedVideo = {
      id: Date.now().toString(),
      name: currentVideo.name,
      file: currentVideo,
      thumbnail,
      duration,
      createdAt: new Date(),
    };

    setSavedVideos(prev => [...prev, savedVideo]);
    
    toast({
      title: "Video saved",
      description: `${currentVideo.name} has been added to your library.`,
    });
  };

  const loadSavedVideo = (savedVideo: SavedVideo) => {
    setCurrentVideo(savedVideo.file);
    const url = URL.createObjectURL(savedVideo.file);
    setVideoUrl(url);
    setVideoPoster(savedVideo.thumbnail);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: true
      });
      
      if (cameraPreviewRef.current) {
        cameraPreviewRef.current.srcObject = stream;
        streamRef.current = stream;
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Access Error",
        description: "Please allow camera access to record video",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setIsRecording(false);
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    const mediaRecorder = new MediaRecorder(streamRef.current);
    const chunks: BlobPart[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'video/webm' });
      
      setCurrentVideo(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      stopCamera();
      
      // Auto-open fullscreen analysis
      navigate('/tools/photo-finish/fullscreen', { 
        state: { 
          videoUrl: url, 
          videoFile: file,
          fromRecording: true 
        } 
      });
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="container mx-auto px-4 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Video className="h-6 w-6" />
            Photo Finish
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyze race videos with precision timing and finish line overlay tools.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
          >
            <FolderOpen className="h-4 w-4" />
            Video Library ({savedVideos.length})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Upload/Analysis Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Video Upload & Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isUploading ? (
                <div className="p-8 text-center space-y-4">
                  <div className="flex items-center justify-center mb-4">
                    <Video className="h-12 w-12 text-primary animate-pulse" />
                  </div>
                  <h3 className="text-lg font-medium">Processing Video</h3>
                  <p className="text-muted-foreground">{uploadStatus}</p>
                  <div className="w-full max-w-md mx-auto space-y-2">
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground">{uploadProgress}% complete</p>
                  </div>
                </div>
              ) : showCamera ? (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={cameraPreviewRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full aspect-video"
                    />
                    
                    {isRecording && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        Recording
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-center gap-4">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={stopCamera}
                    >
                      <span className="text-lg">✕</span>
                      Cancel
                    </Button>
                    
                    {!isRecording ? (
                      <Button
                        size="lg"
                        onClick={startRecording}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        <Video className="h-5 w-5 mr-2" />
                        Start Recording
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        onClick={stopRecording}
                        variant="destructive"
                      >
                        <span className="text-lg">⏹</span>
                        Stop Recording
                      </Button>
                    )}
                  </div>
                </div>
              ) : !currentVideo ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">Upload Race Video</p>
                    <p className="text-muted-foreground mb-4">Choose how to add your video</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-20 flex flex-col gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FolderOpen className="h-6 w-6" />
                      <span>Photo Library</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-20 flex flex-col gap-2"
                      onClick={startCamera}
                    >
                      <Video className="h-6 w-6" />
                      <span>Record Video</span>
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground text-center">
                    Video will automatically open in fullscreen analysis mode
                  </p>
                  
                  {/* Simplified file input for photo library */}
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-lg font-medium mb-2">
                      Ready to analyze: {currentVideo.name}
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCurrentVideo(null);
                          setVideoUrl("");
                        }}
                      >
                        Upload Different Video
                      </Button>
                      <Button
                        onClick={() => navigate('/tools/photo-finish/analysis')}
                        className="flex items-center gap-2"
                      >
                        <ArrowRight className="h-4 w-4" />
                        Open Analysis
                      </Button>
                    </div>
                  </div>

                  {/* Basic Video Preview */}
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      poster={videoPoster}
                      className="w-full h-full object-contain"
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleVideoLoad}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      controls={false}
                      disablePictureInPicture
                      controlsList="nodownload nofullscreen noremoteplayback"
                      playsInline
                    />
                    
                    {/* Basic Controls */}
                    <div className="absolute bottom-4 left-4 right-4 bg-black/50 rounded-lg p-2">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={togglePlayPause}
                          className="text-white hover:bg-white/20"
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <div className="text-white text-sm">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-sm text-muted-foreground">
                    Video uploaded successfully! Click "Open Analysis" above to start analyzing.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Video Library Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Video Library
              </CardTitle>
            </CardHeader>
            <CardContent>
              {savedVideos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No saved videos yet</p>
                  <p className="text-sm">Upload and save videos to build your library</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {savedVideos.map((video, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() => loadSavedVideo(video)}
                    >
                      <div className="flex items-center gap-3">
                        {video.thumbnail && (
                          <img
                            src={video.thumbnail}
                            alt="Video thumbnail"
                            className="w-12 h-8 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {video.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {video.createdAt.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Export also as a component for dynamic routes
export function Component() {
  return <PhotoFinishPage />;
}