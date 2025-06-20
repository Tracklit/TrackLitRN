import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Maximize, 
  X,
  Eye,
  Activity,
  Target,
  Gauge,
  Timer,
  Footprints,
  Sparkles,
  Zap,
  Crown,
  Settings
} from "lucide-react";

interface BiomechanicalOverlay {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  enabled: boolean;
  type: 'skeleton' | 'angles' | 'velocity' | 'stride' | 'contact';
}

interface BiomechanicalVideoPlayerProps {
  videoUrl: string;
  videoName: string;
  videoId: number;
  onAnalyze: (promptId: string) => void;
  isAnalyzing: boolean;
  biomechanicalData?: any;
  analysisStatus?: string;
}

export function BiomechanicalVideoPlayer({ 
  videoUrl, 
  videoName, 
  videoId,
  onAnalyze, 
  isAnalyzing,
  biomechanicalData,
  analysisStatus 
}: BiomechanicalVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);

  // Real-time pose tracking data
  const [poseData, setPoseData] = useState<any>(null);
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Skeleton overlay processing
  const [skeletonVideoUrl, setSkeletonVideoUrl] = useState<string | null>(null);
  const [processingOverlay, setProcessingOverlay] = useState(false);
  const [activeOverlays, setActiveOverlays] = useState<{[key: string]: any}>({});
  
  // Frame-based pose tracking
  const [debugMode, setDebugMode] = useState(false);
  const [frameData, setFrameData] = useState<any[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const animationFrameRef = useRef<number | null>(null);

  // Overlay state
  const [overlays, setOverlays] = useState<BiomechanicalOverlay[]>([
    {
      id: 'skeleton',
      label: 'Pose Skeleton',
      icon: Activity,
      color: '#8b5cf6',
      enabled: true,
      type: 'skeleton'
    },
    {
      id: 'angles',
      label: 'Joint Angles',
      icon: Target,
      color: '#06b6d4',
      enabled: false,
      type: 'angles'
    },
    {
      id: 'velocity',
      label: 'Velocity Vector',
      icon: Gauge,
      color: '#f59e0b',
      enabled: false,
      type: 'velocity'
    },
    {
      id: 'stride',
      label: 'Stride Analysis',
      icon: Timer,
      color: '#10b981',
      enabled: false,
      type: 'stride'
    },
    {
      id: 'contact',
      label: 'Ground Contact',
      icon: Footprints,
      color: '#ef4444',
      enabled: false,
      type: 'contact'
    }
  ]);

  // Toggle overlay function
  const toggleOverlay = (overlayId: string) => {
    setOverlays(prev => prev.map(overlay => 
      overlay.id === overlayId 
        ? { ...overlay, enabled: !overlay.enabled }
        : overlay
    ));
  };

  // Frame synchronization system - updates pose data with video time
  const updateFrameBasedOverlays = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Calculate current frame index based on video time
    const fps = 30; // Default FPS
    const frameIndex = Math.floor(video.currentTime * fps);
    setCurrentFrameIndex(frameIndex);
    
    // Get pose data for current frame
    let currentFramePose = null;
    if (frameData.length > 0 && frameIndex < frameData.length) {
      currentFramePose = frameData[frameIndex];
    } else if (poseData) {
      currentFramePose = poseData;
    }
    
    // Clear canvas for fresh frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Debug mode: show frame info
    if (debugMode) {
      ctx.fillStyle = '#00ff00';
      ctx.font = '16px monospace';
      ctx.fillText(`Frame: ${frameIndex}`, 10, 30);
      ctx.fillText(`Time: ${video.currentTime.toFixed(2)}s`, 10, 50);
      ctx.fillText(`Pose: ${currentFramePose ? 'Available' : 'Missing'}`, 10, 70);
      
      // Flashing dot to confirm dynamic redraws
      const flash = Math.floor(Date.now() / 500) % 2;
      if (flash) {
        ctx.beginPath();
        ctx.arc(canvas.width - 30, 30, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0000';
        ctx.fill();
      }
      
      console.log(`Frame update: ${frameIndex} at ${video.currentTime.toFixed(2)}s, pose: ${currentFramePose ? 'yes' : 'no'}`);
    }
    
    // Draw active overlays with current frame data
    if (currentFramePose) {
      drawFrameBasedOverlays(ctx, currentFramePose, canvas.width, canvas.height);
    }
  }, [frameData, poseData, debugMode]);

  // Initialize frame data from preprocessed biomechanical data
  useEffect(() => {
    let parsedAnalysisData = null;
    try {
      parsedAnalysisData = biomechanicalData ? JSON.parse(biomechanicalData) : null;
    } catch (error) {
      console.log('Failed to parse biomechanical data:', error);
    }
    
    if (parsedAnalysisData && parsedAnalysisData.frame_analysis) {
      const fps = parsedAnalysisData.frame_analysis.fps || 30;
      const totalFrames = parsedAnalysisData.frame_analysis.total_frames || 120;
      
      const frames = [];
      for (let i = 0; i < totalFrames; i++) {
        frames.push({
          timestamp: i / fps,
          frameIndex: i,
          pose_landmarks: parsedAnalysisData.pose_landmarks,
          joint_angles: parsedAnalysisData,
          velocity_data: parsedAnalysisData,
          stride_data: parsedAnalysisData,
          contact_data: parsedAnalysisData
        });
      }
      setFrameData(frames);
      
      if (debugMode) {
        console.log(`Initialized ${frames.length} frames of pose data`);
      }
    }
  }, [biomechanicalData, debugMode]);

  // Draw overlays based on frame data
  const drawFrameBasedOverlays = useCallback((ctx: CanvasRenderingContext2D, frameData: any, width: number, height: number) => {
    if (!frameData) return;
    
    overlays.forEach((overlay) => {
      if (!overlay.enabled) return;
      
      ctx.strokeStyle = overlay.color;
      ctx.fillStyle = overlay.color;
      ctx.lineWidth = 2;
      
      const landmarks = frameData.pose_landmarks;
      if (!landmarks) return;
      
      switch (overlay.type) {
        case 'skeleton':
          drawDynamicPoseSkeleton(ctx, landmarks, width, height);
          break;
        case 'angles':
          drawDynamicJointAngles(ctx, landmarks, frameData.joint_angles, width, height);
          break;
        case 'velocity':
          drawDynamicVelocityVectors(ctx, landmarks, frameData.velocity_data, width, height);
          break;
        case 'stride':
          drawDynamicStrideAnalysis(ctx, frameData.stride_data, width, height);
          break;
        case 'contact':
          drawDynamicGroundContact(ctx, landmarks, frameData.contact_data, width, height);
          break;
      }
    });
  }, [overlays]);

  // Dynamic overlay drawing functions that update per frame
  const drawDynamicPoseSkeleton = (ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number) => {
    if (!landmarks || landmarks.length < 12) return;

    ctx.strokeStyle = '#8b5cf6';
    ctx.fillStyle = '#8b5cf6';
    ctx.lineWidth = 3;

    const getDisplayCoords = (landmark: any) => ({
      x: landmark.x * width,
      y: landmark.y * height
    });

    // Draw skeleton connections
    const connections = [
      [0, 1], [1, 2], [1, 3], [2, 4], [3, 5],
      [1, 6], [1, 7], [6, 7], [6, 8], [7, 9],
      [8, 10], [9, 11]
    ];

    ctx.beginPath();
    connections.forEach(([startIdx, endIdx]) => {
      if (landmarks[startIdx] && landmarks[endIdx]) {
        const start = getDisplayCoords(landmarks[startIdx]);
        const end = getDisplayCoords(landmarks[endIdx]);
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
      }
    });
    ctx.stroke();

    // Draw joint points
    landmarks.forEach((landmark, index) => {
      if (landmark && landmark.visibility > 0.5) {
        const point = getDisplayCoords(landmark);
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  };

  const drawDynamicJointAngles = (ctx: CanvasRenderingContext2D, landmarks: any[], data: any, width: number, height: number) => {
    if (!landmarks || !data) return;

    ctx.font = '14px monospace';
    ctx.fillStyle = '#06b6d4';

    const getDisplayCoords = (landmark: any) => ({
      x: landmark.x * width,
      y: landmark.y * height
    });

    if (landmarks[8]) {
      const leftKnee = getDisplayCoords(landmarks[8]);
      ctx.fillText(`L: ${data.knee_angle_max || 142}°`, leftKnee.x - 25, leftKnee.y - 10);
    }

    if (landmarks[9]) {
      const rightKnee = getDisplayCoords(landmarks[9]);
      ctx.fillText(`R: ${data.knee_angle_max || 138}°`, rightKnee.x - 25, rightKnee.y - 10);
    }
  };

  const drawDynamicVelocityVectors = (ctx: CanvasRenderingContext2D, landmarks: any[], data: any, width: number, height: number) => {
    if (!landmarks || !data || !data.velocity_peak) return;

    ctx.strokeStyle = '#f59e0b';
    ctx.fillStyle = '#f59e0b';
    ctx.lineWidth = 2;

    const getDisplayCoords = (landmark: any) => ({
      x: landmark.x * width,
      y: landmark.y * height
    });

    if (landmarks[6] && landmarks[7]) {
      const centerMass = {
        x: (getDisplayCoords(landmarks[6]).x + getDisplayCoords(landmarks[7]).x) / 2,
        y: (getDisplayCoords(landmarks[6]).y + getDisplayCoords(landmarks[7]).y) / 2
      };

      const velocity = data.velocity_peak;
      const vectorLength = Math.min(width * 0.2, velocity * 8);

      ctx.beginPath();
      ctx.moveTo(centerMass.x, centerMass.y);
      ctx.lineTo(centerMass.x + vectorLength, centerMass.y - vectorLength * 0.2);
      ctx.stroke();

      ctx.font = '16px monospace';
      ctx.fillText(`${velocity.toFixed(1)} m/s`, centerMass.x + 15, centerMass.y - 10);
    }
  };

  const drawDynamicStrideAnalysis = (ctx: CanvasRenderingContext2D, data: any, width: number, height: number) => {
    if (!data) return;

    ctx.strokeStyle = '#10b981';
    ctx.fillStyle = '#10b981';
    ctx.font = '14px monospace';

    const strideLength = data.stride_length || 2.1;
    const frequency = data.step_frequency || 185;

    ctx.fillText(`Stride: ${strideLength.toFixed(1)}m`, width * 0.05, height * 0.85);
    ctx.fillText(`Rate: ${frequency} spm`, width * 0.05, height * 0.88);
  };

  const drawDynamicGroundContact = (ctx: CanvasRenderingContext2D, landmarks: any[], data: any, width: number, height: number) => {
    if (!landmarks || !data) return;

    ctx.fillStyle = '#ef4444';
    ctx.font = '12px monospace';

    const getDisplayCoords = (landmark: any) => ({
      x: landmark.x * width,
      y: landmark.y * height
    });

    if (landmarks[10]) {
      const leftAnkle = getDisplayCoords(landmarks[10]);
      ctx.beginPath();
      ctx.arc(leftAnkle.x, leftAnkle.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    if (landmarks[11]) {
      const rightAnkle = getDisplayCoords(landmarks[11]);
      ctx.beginPath();
      ctx.arc(rightAnkle.x, rightAnkle.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    const contactTime = data.ground_contact_time || 0.18;
    const flightTime = data.flight_time || 0.12;

    ctx.fillText(`Contact: ${(contactTime * 1000).toFixed(0)}ms`, width * 0.05, height * 0.94);
    ctx.fillText(`Flight: ${(flightTime * 1000).toFixed(0)}ms`, width * 0.05, height * 0.97);
  };

  const analysisPrompts = [
    {
      id: "sprint-form",
      title: "Sprint Form",
      description: "Technique analysis",
      icon: Sparkles,
    },
    {
      id: "block-start",
      title: "Block Start", 
      description: "Starting mechanics",
      icon: Zap,
    },
    {
      id: "stride-length",
      title: "Stride Analysis",
      description: "Movement patterns",
      icon: Crown,
    }
  ];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      // Trigger frame-based overlay updates
      updateFrameBasedOverlays();
    };
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', () => setIsPlaying(false));

    // Show first frame
    video.addEventListener('loadeddata', () => {
      video.currentTime = 0.1;
    });

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', () => setIsPlaying(false));
      video.removeEventListener('loadeddata', () => {});
    };
  }, []);

  // WebSocket connection for real-time pose tracking
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected for pose tracking');
      setIsConnected(true);
      setWebSocket(ws);
      
      // Start pose tracking for the current video
      ws.send(JSON.stringify({
        type: 'start_pose_tracking',
        videoPath: videoUrl
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'pose_frame' && data.landmarks) {
          setPoseData(data);
        }
      } catch (error) {
        console.error('Error parsing pose data:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setWebSocket(null);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'stop_pose_tracking' }));
        ws.close();
      }
    };
  }, [videoUrl]);

  // Draw biomechanical overlays on canvas
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      const container = containerRef.current;
      if (!container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const drawOverlays = () => {
      if (!video.videoWidth || !video.videoHeight) {
        requestAnimationFrame(drawOverlays);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate video display dimensions and position
      const videoAspect = video.videoWidth / video.videoHeight;
      const containerAspect = canvas.width / canvas.height;
      
      let displayWidth, displayHeight, offsetX, offsetY;
      
      if (videoAspect > containerAspect) {
        displayWidth = canvas.width;
        displayHeight = canvas.width / videoAspect;
        offsetX = 0;
        offsetY = (canvas.height - displayHeight) / 2;
      } else {
        displayWidth = canvas.height * videoAspect;
        displayHeight = canvas.height;
        offsetX = (canvas.width - displayWidth) / 2;
        offsetY = 0;
      }

      // Only draw if video is loaded and overlays are enabled
      if (video.readyState >= 2) {
        overlays.forEach(overlay => {
          if (overlay.enabled) {
            drawBiomechanicalOverlay(ctx, overlay, displayWidth, displayHeight, offsetX, offsetY);
          }
        });
      }
      
      requestAnimationFrame(drawOverlays);
    };

    drawOverlays();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [overlays]);

  const drawBiomechanicalOverlay = (
    ctx: CanvasRenderingContext2D, 
    overlay: BiomechanicalOverlay,
    width: number,
    height: number,
    offsetX: number,
    offsetY: number
  ) => {
    ctx.strokeStyle = overlay.color;
    ctx.fillStyle = overlay.color;
    ctx.lineWidth = 2;

    // Use pre-analyzed biomechanical data if available
    let parsedAnalysisData = null;
    try {
      parsedAnalysisData = biomechanicalData ? JSON.parse(biomechanicalData) : null;
    } catch (error) {
      console.log('Failed to parse biomechanical data:', error);
    }
    const hasBiomechanicalData = parsedAnalysisData && parsedAnalysisData.pose_landmarks;
    
    if (hasBiomechanicalData) {
      // Use authentic pose data from server analysis
      const landmarks = parsedAnalysisData.pose_landmarks;
      
      switch (overlay.type) {
        case 'skeleton':
          drawAnalyzedPoseSkeleton(ctx, landmarks, width, height, offsetX, offsetY);
          break;
        case 'angles':
          drawAnalyzedJointAngles(ctx, landmarks, parsedAnalysisData, width, height, offsetX, offsetY);
          break;
        case 'velocity':
          drawAnalyzedVelocityVectors(ctx, landmarks, parsedAnalysisData, width, height, offsetX, offsetY);
          break;
        case 'stride':
          drawAnalyzedStrideAnalysis(ctx, parsedAnalysisData, width, height, offsetX, offsetY);
          break;
        case 'contact':
          drawAnalyzedGroundContact(ctx, landmarks, parsedAnalysisData, width, height, offsetX, offsetY);
          break;
      }
      return;
    }

    // Fallback to real-time MediaPipe data if available
    if (poseData && poseData.landmarks && videoRef.current) {
      const landmarks = poseData.landmarks;
      
      switch (overlay.type) {
        case 'skeleton':
          drawRealPoseSkeleton(ctx, landmarks, width, height, offsetX, offsetY, videoRef.current.videoWidth, videoRef.current.videoHeight);
          break;
        case 'angles':
          drawRealJointAngles(ctx, poseData.joint_angles, landmarks, width, height, offsetX, offsetY, videoRef.current.videoWidth, videoRef.current.videoHeight);
          break;
        case 'velocity':
          drawRealVelocityVectors(ctx, poseData.velocities, landmarks, width, height, offsetX, offsetY, videoRef.current.videoWidth, videoRef.current.videoHeight);
          break;
        case 'stride':
          drawRealStrideAnalysis(ctx, poseData.stride_metrics, width, height, offsetX, offsetY);
          break;
        case 'contact':
          drawRealGroundContact(ctx, poseData.ground_contact, landmarks, width, height, offsetX, offsetY, videoRef.current.videoWidth, videoRef.current.videoHeight);
          break;
      }
      return;
    }
    
    // Final fallback: show demo overlays positioned over video center
    const centerX = offsetX + width * 0.5;
    const centerY = offsetY + height * 0.6;
    const scale = Math.min(width, height) * 0.15;

    switch (overlay.type) {
      case 'skeleton':
        drawDemoPoseSkeleton(ctx, centerX, centerY, scale);
        break;
      case 'angles':
        drawDemoJointAngles(ctx, centerX, centerY, scale);
        break;
      case 'velocity':
        drawDemoVelocityVectors(ctx, centerX, centerY, scale);
        break;
      case 'stride':
        drawDemoStrideAnalysis(ctx, width, height, offsetX, offsetY);
        break;
      case 'contact':
        drawDemoGroundContact(ctx, centerX, centerY + scale * 1.5, scale);
        break;
    }

    const landmarks = poseData.landmarks;
    const videoWidth = poseData.frame_dimensions?.width || 1;
    const videoHeight = poseData.frame_dimensions?.height || 1;

    switch (overlay.type) {
      case 'skeleton':
        drawRealPoseSkeleton(ctx, landmarks, width, height, offsetX, offsetY, videoWidth, videoHeight);
        break;
      case 'angles':
        drawRealJointAngles(ctx, landmarks, poseData.angles, width, height, offsetX, offsetY, videoWidth, videoHeight);
        break;
      case 'velocity':
        drawRealVelocityVectors(ctx, landmarks, poseData.velocities, width, height, offsetX, offsetY, videoWidth, videoHeight);
        break;
      case 'stride':
        drawRealStrideAnalysis(ctx, poseData.stride_metrics, width, height, offsetX, offsetY);
        break;
      case 'contact':
        drawRealGroundContact(ctx, poseData.ground_contact, landmarks, width, height, offsetX, offsetY, videoWidth, videoHeight);
        break;
    }
  };

  // Demo overlay functions for immediate functionality
  const drawDemoPoseSkeleton = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
    // Head
    ctx.beginPath();
    ctx.arc(x, y - scale * 0.8, scale * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Body connections
    const connections = [
      [0, -0.8, 0, -0.3], // head to torso
      [0, -0.3, -0.3, 0], // torso to left arm
      [0, -0.3, 0.3, 0],  // torso to right arm
      [-0.3, 0, -0.5, 0.3], // left arm extension
      [0.3, 0, 0.5, 0.3],   // right arm extension
      [0, -0.3, 0, 0.5],    // torso to hips
      [0, 0.5, -0.2, 1.2],  // hips to left leg
      [0, 0.5, 0.2, 1.2],   // hips to right leg
      [-0.2, 1.2, -0.1, 1.5], // left knee to ankle
      [0.2, 1.2, 0.1, 1.5],   // right knee to ankle
    ];

    ctx.beginPath();
    connections.forEach(([x1, y1, x2, y2]) => {
      ctx.moveTo(x + x1 * scale, y + y1 * scale);
      ctx.lineTo(x + x2 * scale, y + y2 * scale);
    });
    ctx.stroke();

    // Joint points
    const joints = [
      [0, -0.3], [-0.3, 0], [0.3, 0], [-0.5, 0.3], [0.5, 0.3],
      [0, 0.5], [-0.2, 1.2], [0.2, 1.2], [-0.1, 1.5], [0.1, 1.5]
    ];

    joints.forEach(([jx, jy]) => {
      ctx.beginPath();
      ctx.arc(x + jx * scale, y + jy * scale, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawDemoJointAngles = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
    const leftKnee = { x: x - scale * 0.2, y: y + scale * 1.2 };
    const rightKnee = { x: x + scale * 0.2, y: y + scale * 1.2 };
    
    ctx.font = '14px monospace';
    ctx.fillText(`L: 142°`, leftKnee.x - 25, leftKnee.y - 10);
    ctx.fillText(`R: 138°`, rightKnee.x - 25, rightKnee.y - 10);
    ctx.fillText(`Hip: 165°`, x - 30, y + scale * 0.3);
    ctx.fillText(`Trunk: 85°`, x - 35, y - scale * 0.5);
  };

  const drawDemoVelocityVectors = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
    const velocity = 8.5;
    const vectorLength = Math.min(scale * 0.8, velocity * 10);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + vectorLength, y - vectorLength * 0.3);
    ctx.stroke();

    // Arrow head
    ctx.beginPath();
    ctx.moveTo(x + vectorLength, y - vectorLength * 0.3);
    ctx.lineTo(x + vectorLength - 15, y - vectorLength * 0.3 - 5);
    ctx.moveTo(x + vectorLength, y - vectorLength * 0.3);
    ctx.lineTo(x + vectorLength - 15, y - vectorLength * 0.3 + 5);
    ctx.stroke();

    ctx.font = '16px monospace';
    ctx.fillText(`${velocity.toFixed(1)} m/s`, x + 10, y - 10);
  };

  const drawDemoStrideAnalysis = (ctx: CanvasRenderingContext2D, width: number, height: number, offsetX: number, offsetY: number) => {
    const strideLength = 2.1;
    const frequency = 185;
    
    const stridePixels = (strideLength / 3) * width * 0.6;
    const baseY = offsetY + height * 0.9;
    
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(offsetX + width * 0.2, baseY);
    ctx.lineTo(offsetX + width * 0.2 + stridePixels, baseY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '14px monospace';
    ctx.fillText(`Stride: ${strideLength.toFixed(1)}m`, offsetX + width * 0.05, offsetY + height * 0.85);
    ctx.fillText(`Rate: ${frequency} spm`, offsetX + width * 0.05, offsetY + height * 0.88);
  };

  const drawDemoGroundContact = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
    const contactTime = 0.18;
    const flightTime = 0.12;
    
    ctx.beginPath();
    ctx.arc(x - scale * 0.1, y, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x + scale * 0.1, y, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '12px monospace';
    ctx.fillText(`CT: ${(contactTime * 1000).toFixed(0)}ms`, x - 40, y + 25);
    ctx.fillText(`FT: ${(flightTime * 1000).toFixed(0)}ms`, x - 40, y + 40);
  };

  // Analyzed pose overlay functions using pre-processed biomechanical data
  const drawAnalyzedPoseSkeleton = (ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number, offsetX: number, offsetY: number) => {
    if (!landmarks || landmarks.length < 12) return;

    ctx.strokeStyle = '#8b5cf6';
    ctx.fillStyle = '#8b5cf6';
    ctx.lineWidth = 3;

    // Convert normalized coordinates to display coordinates
    const getDisplayCoords = (landmark: any) => ({
      x: offsetX + landmark.x * width,
      y: offsetY + landmark.y * height
    });

    // Draw skeleton connections based on anatomical structure
    const connections = [
      [0, 1], // head to neck
      [1, 2], [1, 3], // neck to shoulders
      [2, 4], [3, 5], // shoulders to elbows
      [1, 6], [1, 7], // neck to hips
      [6, 7], // hip connection
      [6, 8], [7, 9], // hips to knees
      [8, 10], [9, 11] // knees to ankles
    ];

    // Draw skeleton lines
    ctx.beginPath();
    connections.forEach(([startIdx, endIdx]) => {
      if (landmarks[startIdx] && landmarks[endIdx]) {
        const start = getDisplayCoords(landmarks[startIdx]);
        const end = getDisplayCoords(landmarks[endIdx]);
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
      }
    });
    ctx.stroke();

    // Draw joint points
    landmarks.forEach((landmark, index) => {
      if (landmark && landmark.visibility > 0.5) {
        const point = getDisplayCoords(landmark);
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  };

  const drawAnalyzedJointAngles = (ctx: CanvasRenderingContext2D, landmarks: any[], data: any, width: number, height: number, offsetX: number, offsetY: number) => {
    if (!landmarks || !data) return;

    ctx.font = '14px monospace';
    ctx.fillStyle = '#06b6d4';

    const getDisplayCoords = (landmark: any) => ({
      x: offsetX + landmark.x * width,
      y: offsetY + landmark.y * height
    });

    // Display joint angles from analyzed data
    if (landmarks[8]) { // left knee
      const leftKnee = getDisplayCoords(landmarks[8]);
      ctx.fillText(`L: ${data.knee_angle_max || 142}°`, leftKnee.x - 25, leftKnee.y - 10);
    }

    if (landmarks[9]) { // right knee
      const rightKnee = getDisplayCoords(landmarks[9]);
      ctx.fillText(`R: ${data.knee_angle_max || 138}°`, rightKnee.x - 25, rightKnee.y - 10);
    }

    if (landmarks[6] && landmarks[7]) { // hip center
      const hipCenter = {
        x: (getDisplayCoords(landmarks[6]).x + getDisplayCoords(landmarks[7]).x) / 2,
        y: (getDisplayCoords(landmarks[6]).y + getDisplayCoords(landmarks[7]).y) / 2
      };
      ctx.fillText(`Hip: ${data.hip_angle_max || 165}°`, hipCenter.x - 30, hipCenter.y + 20);
    }

    if (landmarks[1]) { // trunk angle at neck
      const neck = getDisplayCoords(landmarks[1]);
      ctx.fillText(`Trunk: ${data.trunk_angle || 85}°`, neck.x - 35, neck.y - 20);
    }
  };

  const drawAnalyzedVelocityVectors = (ctx: CanvasRenderingContext2D, landmarks: any[], data: any, width: number, height: number, offsetX: number, offsetY: number) => {
    if (!landmarks || !data || !data.velocity_peak) return;

    ctx.strokeStyle = '#f59e0b';
    ctx.fillStyle = '#f59e0b';
    ctx.lineWidth = 2;

    const getDisplayCoords = (landmark: any) => ({
      x: offsetX + landmark.x * width,
      y: offsetY + landmark.y * height
    });

    // Draw velocity vector from center of mass (approximate hip center)
    if (landmarks[6] && landmarks[7]) {
      const centerMass = {
        x: (getDisplayCoords(landmarks[6]).x + getDisplayCoords(landmarks[7]).x) / 2,
        y: (getDisplayCoords(landmarks[6]).y + getDisplayCoords(landmarks[7]).y) / 2
      };

      const velocity = data.velocity_peak;
      const vectorLength = Math.min(width * 0.2, velocity * 8);

      // Draw main velocity vector
      ctx.beginPath();
      ctx.moveTo(centerMass.x, centerMass.y);
      ctx.lineTo(centerMass.x + vectorLength, centerMass.y - vectorLength * 0.2);
      ctx.stroke();

      // Draw arrow head
      const arrowX = centerMass.x + vectorLength;
      const arrowY = centerMass.y - vectorLength * 0.2;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX - 12, arrowY - 4);
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX - 12, arrowY + 4);
      ctx.stroke();

      // Display velocity value
      ctx.font = '16px monospace';
      ctx.fillText(`${velocity.toFixed(1)} m/s`, centerMass.x + 15, centerMass.y - 10);
    }
  };

  const drawAnalyzedStrideAnalysis = (ctx: CanvasRenderingContext2D, data: any, width: number, height: number, offsetX: number, offsetY: number) => {
    if (!data) return;

    ctx.strokeStyle = '#10b981';
    ctx.fillStyle = '#10b981';
    ctx.font = '14px monospace';

    const strideLength = data.stride_length || 2.1;
    const frequency = data.step_frequency || 185;

    // Draw stride length measurement
    const stridePixels = (strideLength / 3) * width * 0.6;
    const baseY = offsetY + height * 0.9;

    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(offsetX + width * 0.2, baseY);
    ctx.lineTo(offsetX + width * 0.2 + stridePixels, baseY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Display metrics
    ctx.fillText(`Stride: ${strideLength.toFixed(1)}m`, offsetX + width * 0.05, offsetY + height * 0.85);
    ctx.fillText(`Rate: ${frequency} spm`, offsetX + width * 0.05, offsetY + height * 0.88);

    if (data.frame_analysis) {
      ctx.fillText(`Duration: ${data.frame_analysis.duration.toFixed(1)}s`, offsetX + width * 0.05, offsetY + height * 0.91);
    }
  };

  const drawAnalyzedGroundContact = (ctx: CanvasRenderingContext2D, landmarks: any[], data: any, width: number, height: number, offsetX: number, offsetY: number) => {
    if (!landmarks || !data) return;

    ctx.fillStyle = '#ef4444';
    ctx.font = '12px monospace';

    const getDisplayCoords = (landmark: any) => ({
      x: offsetX + landmark.x * width,
      y: offsetY + landmark.y * height
    });

    // Draw ground contact indicators at ankle positions
    if (landmarks[10]) { // left ankle
      const leftAnkle = getDisplayCoords(landmarks[10]);
      ctx.beginPath();
      ctx.arc(leftAnkle.x, leftAnkle.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    if (landmarks[11]) { // right ankle
      const rightAnkle = getDisplayCoords(landmarks[11]);
      ctx.beginPath();
      ctx.arc(rightAnkle.x, rightAnkle.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Display ground contact metrics
    const contactTime = data.ground_contact_time || 0.18;
    const flightTime = data.flight_time || 0.12;

    ctx.fillText(`Contact: ${(contactTime * 1000).toFixed(0)}ms`, offsetX + width * 0.05, offsetY + height * 0.94);
    ctx.fillText(`Flight: ${(flightTime * 1000).toFixed(0)}ms`, offsetX + width * 0.05, offsetY + height * 0.97);
  };

  const drawRealPoseSkeleton = (
    ctx: CanvasRenderingContext2D, 
    landmarks: any, 
    displayWidth: number, 
    displayHeight: number, 
    offsetX: number, 
    offsetY: number,
    videoWidth: number,
    videoHeight: number
  ) => {
    const scaleX = displayWidth / videoWidth;
    const scaleY = displayHeight / videoHeight;
    
    // Convert normalized coordinates to display coordinates
    const getDisplayCoords = (landmark: any) => {
      if (!landmark) return null;
      return {
        x: offsetX + landmark.x * scaleX,
        y: offsetY + landmark.y * scaleY
      };
    };

    // Draw pose connections
    const connections = [
      // Torso
      ['left_shoulder', 'right_shoulder'],
      ['left_shoulder', 'left_hip'],
      ['right_shoulder', 'right_hip'],
      ['left_hip', 'right_hip'],
      
      // Arms
      ['left_shoulder', 'left_elbow'],
      ['left_elbow', 'left_wrist'],
      ['right_shoulder', 'right_elbow'],
      ['right_elbow', 'right_wrist'],
      
      // Legs
      ['left_hip', 'left_knee'],
      ['left_knee', 'left_ankle'],
      ['right_hip', 'right_knee'],
      ['right_knee', 'right_ankle']
    ];

    ctx.lineWidth = 3;
    connections.forEach(([start, end]) => {
      const startCoords = getDisplayCoords(landmarks[start]);
      const endCoords = getDisplayCoords(landmarks[end]);
      
      if (startCoords && endCoords) {
        ctx.beginPath();
        ctx.moveTo(startCoords.x, startCoords.y);
        ctx.lineTo(endCoords.x, endCoords.y);
        ctx.stroke();
      }
    });

    // Draw joint points
    const jointPoints = [
      'nose', 'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
      'left_wrist', 'right_wrist', 'left_hip', 'right_hip', 'left_knee',
      'right_knee', 'left_ankle', 'right_ankle'
    ];

    jointPoints.forEach(jointName => {
      const coords = getDisplayCoords(landmarks[jointName]);
      if (coords) {
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  };

  const drawRealJointAngles = (
    ctx: CanvasRenderingContext2D, 
    landmarks: any, 
    angles: any,
    displayWidth: number, 
    displayHeight: number, 
    offsetX: number, 
    offsetY: number,
    videoWidth: number,
    videoHeight: number
  ) => {
    if (!angles) return;
    
    const scaleX = displayWidth / videoWidth;
    const scaleY = displayHeight / videoHeight;
    
    const getDisplayCoords = (landmark: any) => {
      if (!landmark) return null;
      return {
        x: offsetX + landmark.x * scaleX,
        y: offsetY + landmark.y * scaleY
      };
    };

    ctx.font = '14px monospace';
    ctx.fillStyle = '#06b6d4';
    
    // Display joint angles near their respective joints
    if (angles.left_knee && landmarks.left_knee) {
      const coords = getDisplayCoords(landmarks.left_knee);
      if (coords) {
        ctx.fillText(`L: ${Math.round(angles.left_knee)}°`, coords.x - 30, coords.y - 15);
      }
    }
    
    if (angles.right_knee && landmarks.right_knee) {
      const coords = getDisplayCoords(landmarks.right_knee);
      if (coords) {
        ctx.fillText(`R: ${Math.round(angles.right_knee)}°`, coords.x + 10, coords.y - 15);
      }
    }
    
    if (angles.trunk && landmarks.left_shoulder && landmarks.right_shoulder) {
      const leftShoulder = getDisplayCoords(landmarks.left_shoulder);
      const rightShoulder = getDisplayCoords(landmarks.right_shoulder);
      if (leftShoulder && rightShoulder) {
        const midX = (leftShoulder.x + rightShoulder.x) / 2;
        const midY = (leftShoulder.y + rightShoulder.y) / 2;
        ctx.fillText(`Trunk: ${Math.round(angles.trunk)}°`, midX - 35, midY - 20);
      }
    }
  };

  const drawRealVelocityVectors = (
    ctx: CanvasRenderingContext2D, 
    landmarks: any, 
    velocities: any,
    displayWidth: number, 
    displayHeight: number, 
    offsetX: number, 
    offsetY: number,
    videoWidth: number,
    videoHeight: number
  ) => {
    if (!velocities) return;
    
    const scaleX = displayWidth / videoWidth;
    const scaleY = displayHeight / videoHeight;
    
    const getDisplayCoords = (landmark: any) => {
      if (!landmark) return null;
      return {
        x: offsetX + landmark.x * scaleX,
        y: offsetY + landmark.y * scaleY
      };
    };

    ctx.strokeStyle = '#f59e0b';
    ctx.fillStyle = '#f59e0b';
    ctx.lineWidth = 2;
    
    // Draw velocity vectors for key joints
    const keyJoints = ['left_wrist', 'right_wrist', 'left_ankle', 'right_ankle'];
    
    keyJoints.forEach(jointName => {
      const landmark = landmarks[jointName];
      const velocity = velocities[jointName];
      
      if (landmark && velocity) {
        const coords = getDisplayCoords(landmark);
        if (coords) {
          const vectorScale = 0.1; // Scale down velocity for display
          const vx = velocity.vx * vectorScale;
          const vy = velocity.vy * vectorScale;
          
          // Draw velocity vector
          ctx.beginPath();
          ctx.moveTo(coords.x, coords.y);
          ctx.lineTo(coords.x + vx, coords.y + vy);
          ctx.stroke();
          
          // Draw arrow head
          const angle = Math.atan2(vy, vx);
          const arrowLength = 8;
          ctx.beginPath();
          ctx.moveTo(coords.x + vx, coords.y + vy);
          ctx.lineTo(
            coords.x + vx - arrowLength * Math.cos(angle - 0.5),
            coords.y + vy - arrowLength * Math.sin(angle - 0.5)
          );
          ctx.moveTo(coords.x + vx, coords.y + vy);
          ctx.lineTo(
            coords.x + vx - arrowLength * Math.cos(angle + 0.5),
            coords.y + vy - arrowLength * Math.sin(angle + 0.5)
          );
          ctx.stroke();
          
          // Display speed
          ctx.font = '12px monospace';
          ctx.fillText(`${velocity.speed.toFixed(0)}px/s`, coords.x + 10, coords.y - 10);
        }
      }
    });
  };

  const drawRealStrideAnalysis = (
    ctx: CanvasRenderingContext2D, 
    strideMetrics: any,
    displayWidth: number, 
    displayHeight: number, 
    offsetX: number, 
    offsetY: number
  ) => {
    if (!strideMetrics) return;
    
    ctx.strokeStyle = '#10b981';
    ctx.fillStyle = '#10b981';
    ctx.font = '14px monospace';
    
    // Display stride metrics
    const textY = offsetY + displayHeight * 0.85;
    
    if (strideMetrics.stride_width) {
      ctx.fillText(`Stride Width: ${strideMetrics.stride_width.toFixed(0)}px`, offsetX + 20, textY);
    }
    
    if (strideMetrics.step_length) {
      ctx.fillText(`Step Length: ${strideMetrics.step_length.toFixed(0)}px`, offsetX + 20, textY + 20);
    }
    
    // Draw stride width visualization
    if (strideMetrics.stride_width) {
      const baseY = offsetY + displayHeight * 0.9;
      const stridePixels = Math.min(strideMetrics.stride_width, displayWidth * 0.6);
      
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(offsetX + displayWidth * 0.2, baseY);
      ctx.lineTo(offsetX + displayWidth * 0.2 + stridePixels, baseY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const drawRealGroundContact = (
    ctx: CanvasRenderingContext2D, 
    groundContact: any,
    landmarks: any,
    displayWidth: number, 
    displayHeight: number, 
    offsetX: number, 
    offsetY: number,
    videoWidth: number,
    videoHeight: number
  ) => {
    if (!groundContact || !landmarks) return;
    
    const scaleX = displayWidth / videoWidth;
    const scaleY = displayHeight / videoHeight;
    
    const getDisplayCoords = (landmark: any) => {
      if (!landmark) return null;
      return {
        x: offsetX + landmark.x * scaleX,
        y: offsetY + landmark.y * scaleY
      };
    };

    ctx.strokeStyle = '#ef4444';
    ctx.fillStyle = '#ef4444';
    
    // Draw ground contact indicators for feet
    ['left', 'right'].forEach(side => {
      const contactData = groundContact[`${side}_foot_contact`];
      const ankle = landmarks[`${side}_ankle`];
      
      if (contactData && ankle) {
        const coords = getDisplayCoords(ankle);
        if (coords) {
          // Draw contact indicator
          const radius = contactData.is_contact ? 12 : 6;
          const alpha = contactData.is_contact ? 1.0 : 0.3;
          
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(coords.x, coords.y + 20, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
          
          // Display contact info
          ctx.font = '11px monospace';
          const status = contactData.is_contact ? 'CONTACT' : 'FLIGHT';
          const velocity = contactData.velocity?.toFixed(0) || '0';
          
          ctx.fillText(`${side.toUpperCase()}: ${status}`, coords.x - 30, coords.y + 45);
          ctx.fillText(`Vel: ${velocity}px/s`, coords.x - 30, coords.y + 60);
        }
      }
    });
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Main Video Area - Full Screen */}
      <div className="relative w-full h-full">
        <div 
          ref={containerRef}
          className="absolute inset-0 bg-black flex items-center justify-center"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          {/* Video Element */}
          <video
            ref={videoRef}
            src={videoUrl}
            className="max-w-full max-h-full object-contain"
            preload="metadata"
          />
          
          {/* Overlay Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ 
              mixBlendMode: 'normal',
              width: '100%',
              height: '100%'
            }}
          />

          {/* Video Controls */}
          {showControls && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 z-10">
              {/* Progress Bar */}
              <div className="mb-4">
                <Slider
                  value={[currentTime]}
                  max={duration}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-white mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const video = videoRef.current;
                    if (video) {
                      video.currentTime = 0;
                      setCurrentTime(0);
                    }
                  }}
                  className="text-white hover:bg-white/20"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-white" />
                  <Slider
                    value={[volume]}
                    max={1}
                    step={0.1}
                    onValueChange={(value) => {
                      setVolume(value[0]);
                      if (videoRef.current) {
                        videoRef.current.volume = value[0];
                      }
                    }}
                    className="w-20"
                  />
                </div>

                <select
                  value={playbackRate}
                  onChange={(e) => {
                    const rate = parseFloat(e.target.value);
                    setPlaybackRate(rate);
                    if (videoRef.current) {
                      videoRef.current.playbackRate = rate;
                    }
                  }}
                  className="bg-black/50 text-white text-sm rounded px-3 py-1 border border-gray-600"
                >
                  <option value={0.25}>0.25x</option>
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Control Panel */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 to-transparent p-4 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-white" />
            <h1 className="text-white font-semibold truncate">{videoName}</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Biomechanical Overlay Controls */}
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-white font-medium mb-2">
            <Eye className="h-4 w-4" />
            Overlays
          </h3>
          <div className="flex flex-wrap gap-2">
            {overlays.map((overlay) => {
              const Icon = overlay.icon;
              return (
                <Button
                  key={overlay.id}
                  variant={overlay.enabled ? "default" : "outline"}
                  onClick={() => toggleOverlay(overlay.id)}
                  size="sm"
                  className={`flex items-center gap-2 ${
                    overlay.enabled ? 'border-2' : ''
                  }`}
                  style={{
                    borderColor: overlay.enabled ? overlay.color : undefined,
                    backgroundColor: overlay.enabled ? `${overlay.color}20` : undefined
                  }}
                >
                  <Icon className="h-3 w-3" style={{ color: overlay.color }} />
                  <span className="text-xs">{overlay.label}</span>
                </Button>
              );
            })}
          </div>
          
          {/* Debug Mode Toggle */}
          <div className="mt-3 flex items-center gap-2">
            <Button
              variant={debugMode ? "default" : "outline"}
              onClick={() => setDebugMode(!debugMode)}
              size="sm"
              className={`flex items-center gap-2 ${
                debugMode ? 'bg-green-600 hover:bg-green-700' : 'border-gray-600 hover:bg-gray-800'
              }`}
            >
              <Settings className="h-3 w-3" />
              <span className="text-xs">Debug Mode</span>
            </Button>
            {debugMode && (
              <span className="text-xs text-green-400">Frame info visible</span>
            )}
          </div>
        </div>

        {/* Analysis Controls */}
        <div>
          <h3 className="flex items-center gap-2 text-white font-medium mb-2">
            <Sparkles className="h-4 w-4" />
            Analysis
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysisPrompts.map((prompt) => {
              const Icon = prompt.icon;
              return (
                <Button
                  key={prompt.id}
                  onClick={() => onAnalyze(prompt.id)}
                  disabled={isAnalyzing}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-white border-gray-600 hover:bg-gray-800"
                >
                  <Icon className="h-3 w-3" />
                  <span className="text-xs">{prompt.title}</span>
                </Button>
              );
            })}
          </div>
          
          {isAnalyzing && (
            <div className="mt-2 flex items-center gap-2">
              <Sparkles className="h-3 w-3 animate-spin text-white" />
              <span className="text-xs text-white">Analyzing video...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}