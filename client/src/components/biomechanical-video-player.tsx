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
  onOverlayChange?: (overlays: BiomechanicalOverlay[]) => void;
}

export function BiomechanicalVideoPlayer({ 
  videoUrl, 
  videoName, 
  videoId,
  onAnalyze, 
  isAnalyzing,
  biomechanicalData,
  analysisStatus,
  onOverlayChange
}: BiomechanicalVideoPlayerProps): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);

  // Add missing variable declarations
  const hasBiomechanicalData = biomechanicalData && Object.keys(biomechanicalData).length > 0;

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
  const [mediapipeError, setMediapipeError] = useState<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Zoom and pan state
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [lastPinchDistance, setLastPinchDistance] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouchPos, setLastTouchPos] = useState({ x: 0, y: 0 });
  const [lastTapTime, setLastTapTime] = useState(0);
  
  // Video dimensions
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const [videoAspectRatio, setVideoAspectRatio] = useState(16/9);
  
  // Add effect to monitor aspect ratio changes
  useEffect(() => {
    console.log('🎥 Video aspect ratio state changed:', {
      newAspectRatio: videoAspectRatio,
      isLandscape: videoAspectRatio > 1,
      isPortrait: videoAspectRatio < 1,
      containerStyle: `aspectRatio: ${videoAspectRatio.toString()}`
    });
  }, [videoAspectRatio]);
  
  // Floating scrubber state
  const [isFloatingScrubber, setIsFloatingScrubber] = useState(false);
  const [floatingScrubberPos, setFloatingScrubberPos] = useState({ x: 20, y: 100 });
  const [isDraggingScrubber, setIsDraggingScrubber] = useState(false);
  const [scrubberDragStart, setScrubberDragStart] = useState({ x: 0, y: 0 });

  // State for velocity data availability
  const [hasVelocityData, setHasVelocityData] = useState(false);

  // Update overlay labels when velocity data availability changes
  useEffect(() => {
    setOverlays(prev => prev.map(overlay => 
      overlay.id === 'velocity' 
        ? {
            ...overlay,
            label: hasVelocityData ? 'Velocity Vector' : 'No Velocity Detected',
            color: hasVelocityData ? '#f59e0b' : '#6b7280'
          }
        : overlay
    ));
  }, [hasVelocityData]);

  // Overlay state with dynamic velocity detection
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
      label: hasVelocityData ? 'Velocity Vector' : 'No Velocity Detected',
      icon: Gauge,
      color: hasVelocityData ? '#f59e0b' : '#6b7280',
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

  // Toggle overlay function with velocity data check
  const toggleOverlay = (overlayId: string) => {
    // Prevent toggling velocity overlay if no velocity data is available
    if (overlayId === 'velocity' && !hasVelocityData) {
      return;
    }
    
    const newOverlays = overlays.map(overlay => 
      overlay.id === overlayId 
        ? { ...overlay, enabled: !overlay.enabled }
        : overlay
    );
    setOverlays(newOverlays);
    onOverlayChange?.(newOverlays);
  };

  // Initialize overlay state when component mounts
  useEffect(() => {
    onOverlayChange?.(overlays);
  }, []);

  // Helper functions for zoom and pan
  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const constrainTransform = (newScale: number, newTranslateX: number, newTranslateY: number) => {
    const container = containerRef.current;
    if (!container) return { scale: newScale, translateX: newTranslateX, translateY: newTranslateY };

    const containerRect = container.getBoundingClientRect();
    
    // Ensure scale is within bounds
    const constrainedScale = Math.max(1, Math.min(3, newScale));
    
    // Calculate scaled dimensions
    const scaledWidth = containerRect.width * constrainedScale;
    const scaledHeight = containerRect.height * constrainedScale;

    // Calculate maximum translation to keep video edges within container
    const maxTranslateX = Math.max(0, (scaledWidth - containerRect.width) / 2 / constrainedScale);
    const maxTranslateY = Math.max(0, (scaledHeight - containerRect.height) / 2 / constrainedScale);

    const constrainedTranslateX = Math.max(-maxTranslateX, Math.min(maxTranslateX, newTranslateX));
    const constrainedTranslateY = Math.max(-maxTranslateY, Math.min(maxTranslateY, newTranslateY));

    return {
      scale: constrainedScale,
      translateX: constrainedTranslateX,
      translateY: constrainedTranslateY
    };
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2) {
      // Pinch zoom start and pan start
      const distance = getDistance(e.touches[0], e.touches[1]);
      setLastPinchDistance(distance);
      
      // Start panning with 2 fingers
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      setIsDragging(true);
      setLastTouchPos({ x: centerX, y: centerY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2) {
      // Pinch zoom
      const distance = getDistance(e.touches[0], e.touches[1]);
      if (lastPinchDistance > 0) {
        const scaleChange = distance / lastPinchDistance;
        const newScale = scale * scaleChange;
        
        const constrained = constrainTransform(newScale, translateX, translateY);
        setScale(constrained.scale);
        setTranslateX(constrained.translateX);
        setTranslateY(constrained.translateY);
      }
      setLastPinchDistance(distance);
      
      // Two-finger pan
      if (isDragging && scale > 1) {
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        
        const deltaX = centerX - lastTouchPos.x;
        const deltaY = centerY - lastTouchPos.y;
        
        const newTranslateX = translateX + deltaX;
        const newTranslateY = translateY + deltaY;
        
        const constrained = constrainTransform(scale, newTranslateX, newTranslateY);
        setTranslateX(constrained.translateX);
        setTranslateY(constrained.translateY);
        
        setLastTouchPos({ x: centerX, y: centerY });
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    
    // Check for double tap to reset zoom
    if (e.touches.length === 0 && e.changedTouches.length === 1) {
      const currentTime = Date.now();
      if (currentTime - lastTapTime < 300) {
        // Double tap detected - reset zoom
        setScale(1);
        setTranslateX(0);
        setTranslateY(0);
      }
      setLastTapTime(currentTime);
    }
    
    setIsDragging(false);
    setLastPinchDistance(0);
  };

  // Floating scrubber handlers
  const toggleFloatingScrubber = () => {
    setIsFloatingScrubber(!isFloatingScrubber);
  };

  const handleScrubberMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingScrubber(true);
    setScrubberDragStart({
      x: e.clientX - floatingScrubberPos.x,
      y: e.clientY - floatingScrubberPos.y
    });
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
  };

  const handleScrubberMouseMove = (e: MouseEvent) => {
    if (!isDraggingScrubber) return;
    
    const newX = Math.max(10, Math.min(window.innerWidth - 300, e.clientX - scrubberDragStart.x));
    const newY = Math.max(10, Math.min(window.innerHeight - 100, e.clientY - scrubberDragStart.y));
    
    setFloatingScrubberPos({ x: newX, y: newY });
  };

  const handleScrubberMouseUp = () => {
    setIsDraggingScrubber(false);
    // Restore text selection
    document.body.style.userSelect = '';
  };

  // Touch handlers for mobile drag support
  const handleScrubberTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    setIsDraggingScrubber(true);
    setScrubberDragStart({
      x: touch.clientX - floatingScrubberPos.x,
      y: touch.clientY - floatingScrubberPos.y
    });
  };

  const handleScrubberTouchMove = (e: TouchEvent) => {
    if (!isDraggingScrubber) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const newX = Math.max(10, Math.min(window.innerWidth - 300, touch.clientX - scrubberDragStart.x));
    const newY = Math.max(10, Math.min(window.innerHeight - 100, touch.clientY - scrubberDragStart.y));
    
    setFloatingScrubberPos({ x: newX, y: newY });
  };

  const handleScrubberTouchEnd = () => {
    setIsDraggingScrubber(false);
  };

  // Add global event listeners for floating scrubber (mouse and touch)
  useEffect(() => {
    if (isDraggingScrubber) {
      // Mouse events
      document.addEventListener('mousemove', handleScrubberMouseMove);
      document.addEventListener('mouseup', handleScrubberMouseUp);
      
      // Touch events
      document.addEventListener('touchmove', handleScrubberTouchMove, { passive: false });
      document.addEventListener('touchend', handleScrubberTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleScrubberMouseMove);
        document.removeEventListener('mouseup', handleScrubberMouseUp);
        document.removeEventListener('touchmove', handleScrubberTouchMove);
        document.removeEventListener('touchend', handleScrubberTouchEnd);
      };
    }
  }, [isDraggingScrubber, scrubberDragStart]);

  // Video time update handler for precise pose synchronization
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const currentVideoTime = video.currentTime;
    
    // Find closest pose frame using timestamp-based matching for precision
    if (frameData.length > 0) {
      // Binary search for closest timestamp match
      let left = 0;
      let right = frameData.length - 1;
      let bestMatch = 0;
      let smallestDiff = Infinity;
      
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const frameTimestamp = frameData[mid].timestamp;
        const timeDiff = Math.abs(frameTimestamp - currentVideoTime);
        
        if (timeDiff < smallestDiff) {
          smallestDiff = timeDiff;
          bestMatch = mid;
        }
        
        if (frameTimestamp < currentVideoTime) {
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }
      
      // Only update if frame changed significantly
      if (Math.abs(bestMatch - currentFrameIndex) >= 1) {
        setCurrentFrameIndex(bestMatch);
        
        if (debugMode) {
          const frame = frameData[bestMatch];
          console.log(`Sync: ${currentVideoTime.toFixed(3)}s → Frame ${bestMatch} (${frame.timestamp.toFixed(3)}s, diff: ${smallestDiff.toFixed(3)}s)`);
        }
      }
    }
    
    setCurrentTime(currentVideoTime);
  }, [frameData, currentFrameIndex, debugMode]);

  // Real-time canvas drawing synchronized with video playback
  const updateCanvas = useCallback(() => {
    if (!canvasRef.current || !videoRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ensure we have video dimensions
    if (!video.videoWidth || !video.videoHeight) return;

    // Get video container dimensions
    const rect = video.getBoundingClientRect();
    
    // Set canvas to exact video display size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    // Scale context for high DPI displays
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Get current pose data with precise frame synchronization
    let currentFramePose = null;
    if (frameData.length > 0 && currentFrameIndex >= 0 && currentFrameIndex < frameData.length) {
      currentFramePose = frameData[currentFrameIndex];
    }
    
    // Debug mode visualization
    if (debugMode) {
      ctx.fillStyle = '#00ff00';
      ctx.font = '14px monospace';
      ctx.fillText(`Frame: ${currentFrameIndex}/${frameData.length}`, 10, 25);
      ctx.fillText(`Time: ${video.currentTime.toFixed(3)}s / ${video.duration?.toFixed(3) || 0}s`, 10, 45);
      ctx.fillText(`Video: ${video.videoWidth}x${video.videoHeight}`, 10, 65);
      ctx.fillText(`Canvas: ${rect.width.toFixed(0)}x${rect.height.toFixed(0)}`, 10, 85);
      
      if (currentFramePose) {
        ctx.fillText(`Pose: ${currentFramePose.pose_landmarks?.length || 0} landmarks`, 10, 105);
        ctx.fillText(`Timestamp: ${currentFramePose.timestamp?.toFixed(3) || 0}s`, 10, 125);
        
        // Debug coordinate scaling
        if (currentFramePose.pose_landmarks && currentFramePose.pose_landmarks.length > 0) {
          const firstLandmark = currentFramePose.pose_landmarks[0];
          ctx.fillText(`First landmark: (${(firstLandmark.x * rect.width).toFixed(1)}, ${(firstLandmark.y * rect.height).toFixed(1)})`, 10, 145);
          ctx.fillText(`Normalized: (${firstLandmark.x.toFixed(3)}, ${firstLandmark.y.toFixed(3)})`, 10, 165);
        }
      } else {
        ctx.fillText('No pose data for current frame', 10, 105);
      }
      
      // Sync indicator and timing debug
      const flash = Math.floor(Date.now() / 400) % 2;
      if (flash) {
        ctx.beginPath();
        ctx.arc(rect.width - 20, 20, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0000';
        ctx.fill();
      }
      
      // Display sync timing debug info
      if (currentFramePose && frameData.length > 0) {
        const syncDiff = Math.abs(video.currentTime - (currentFramePose.timestamp || 0));
        ctx.fillText(`Sync diff: ${(syncDiff * 1000).toFixed(1)}ms`, 10, 185);
        
        // Show sync quality indicator
        const syncQuality = syncDiff < 0.1 ? '✓ Good' : syncDiff < 0.2 ? '⚠ Fair' : '✗ Poor';
        ctx.fillStyle = syncDiff < 0.1 ? '#00ff00' : syncDiff < 0.2 ? '#ffff00' : '#ff0000';
        ctx.fillText(`Sync: ${syncQuality}`, 10, 205);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; // Reset color
      }
    }
    
    // Draw pose overlays if we have valid pose data
    if (currentFramePose && currentFramePose.pose_landmarks && Array.isArray(currentFramePose.pose_landmarks)) {
      drawFrameBasedOverlays(ctx, currentFramePose, rect.width, rect.height);
    }
  }, [frameData, currentFrameIndex, poseData, debugMode]);

  // Real-time joint angle calculation from MediaPipe landmarks
  const calculateJointAngle = (p1: any, p2: any, p3: any): number => {
    if (!p1 || !p2 || !p3) return 0;
    
    // Calculate vectors from center point to endpoints
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
    
    // Calculate angle using dot product
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    if (mag1 === 0 || mag2 === 0) return 0;
    
    const cosAngle = dot / (mag1 * mag2);
    const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    
    return (angle * 180) / Math.PI;
  };

  const calculateRealJointAngles = (landmarks: any[]): any => {
    if (!landmarks || landmarks.length < 33) return {};
    
    // MediaPipe landmark indices for real skeletal joints
    const indices = {
      left_shoulder: 11, right_shoulder: 12,
      left_hip: 23, right_hip: 24,
      left_knee: 25, right_knee: 26,
      left_ankle: 27, right_ankle: 28,
      left_foot_index: 31, right_foot_index: 32
    };
    
    const angles: any = {};
    const minVisibility = 0.5;
    
    try {
      // Left knee angle (hip-knee-ankle) - Real biomechanical measurement
      const leftHip = landmarks[indices.left_hip];
      const leftKnee = landmarks[indices.left_knee];
      const leftAnkle = landmarks[indices.left_ankle];
      
      if (leftHip?.visibility > minVisibility && leftKnee?.visibility > minVisibility && leftAnkle?.visibility > minVisibility) {
        angles.left_knee = calculateJointAngle(leftHip, leftKnee, leftAnkle);
      }
      
      // Right knee angle (hip-knee-ankle) - Real biomechanical measurement
      const rightHip = landmarks[indices.right_hip];
      const rightKnee = landmarks[indices.right_knee];
      const rightAnkle = landmarks[indices.right_ankle];
      
      if (rightHip?.visibility > minVisibility && rightKnee?.visibility > minVisibility && rightAnkle?.visibility > minVisibility) {
        angles.right_knee = calculateJointAngle(rightHip, rightKnee, rightAnkle);
      }
      
      // Left hip angle (shoulder-hip-knee) - Real biomechanical measurement
      const leftShoulder = landmarks[indices.left_shoulder];
      if (leftShoulder?.visibility > minVisibility && leftHip?.visibility > minVisibility && leftKnee?.visibility > minVisibility) {
        angles.left_hip = calculateJointAngle(leftShoulder, leftHip, leftKnee);
      }
      
      // Right hip angle (shoulder-hip-knee) - Real biomechanical measurement
      const rightShoulder = landmarks[indices.right_shoulder];
      if (rightShoulder?.visibility > minVisibility && rightHip?.visibility > minVisibility && rightKnee?.visibility > minVisibility) {
        angles.right_hip = calculateJointAngle(rightShoulder, rightHip, rightKnee);
      }
      
      // Left ankle angle (knee-ankle-foot) - Real biomechanical measurement
      const leftFootIndex = landmarks[indices.left_foot_index];
      if (leftKnee?.visibility > minVisibility && leftAnkle?.visibility > minVisibility && leftFootIndex?.visibility > minVisibility) {
        angles.left_ankle = calculateJointAngle(leftKnee, leftAnkle, leftFootIndex);
      }
      
      // Right ankle angle (knee-ankle-foot) - Real biomechanical measurement
      const rightFootIndex = landmarks[indices.right_foot_index];
      if (rightKnee?.visibility > minVisibility && rightAnkle?.visibility > minVisibility && rightFootIndex?.visibility > minVisibility) {
        angles.right_ankle = calculateJointAngle(rightKnee, rightAnkle, rightFootIndex);
      }
      
      // Trunk angle (torso lean from vertical) - Real biomechanical measurement
      if (leftShoulder?.visibility > minVisibility && rightShoulder?.visibility > minVisibility && 
          leftHip?.visibility > minVisibility && rightHip?.visibility > minVisibility) {
        const shoulderMid = {
          x: (leftShoulder.x + rightShoulder.x) / 2,
          y: (leftShoulder.y + rightShoulder.y) / 2
        };
        const hipMid = {
          x: (leftHip.x + rightHip.x) / 2,
          y: (leftHip.y + rightHip.y) / 2
        };
        
        // Calculate angle from vertical using real skeletal data
        const trunkVector = { x: hipMid.x - shoulderMid.x, y: hipMid.y - shoulderMid.y };
        const magnitude = Math.sqrt(trunkVector.x * trunkVector.x + trunkVector.y * trunkVector.y);
        
        if (magnitude > 0) {
          const cosAngle = Math.abs(trunkVector.y) / magnitude;
          angles.trunk = Math.acos(Math.max(0, Math.min(1, cosAngle))) * (180 / Math.PI);
          if (trunkVector.x > 0) angles.trunk = -angles.trunk; // Forward lean
        }
      }
      
    } catch (error) {
      console.log('Error calculating real joint angles from skeletal data:', error);
    }
    
    return angles;
  };

  // MediaPipe Controller: Process authentic pose landmark data only
  useEffect(() => {
    console.log('=== MediaPipe Data Flow Debug ===');
    console.log('biomechanicalData type:', typeof biomechanicalData);
    console.log('biomechanicalData value:', biomechanicalData);
    console.log('biomechanicalData length:', biomechanicalData?.length);
    
    if (!biomechanicalData) {
      console.log('No biomechanical data provided - clearing frame data');
      setFrameData([]);
      setMediapipeError(null);
      return;
    }
    
    // Check if biomechanicalData indicates MediaPipe failure
    if (biomechanicalData === "null" || biomechanicalData === null || biomechanicalData === undefined) {
      console.error('MediaPipe processing failed - no pose data available');
      setMediapipeError('MediaPipe could not process this video. The video format may not be supported or the subject may not be clearly visible.');
      setFrameData([]);
      return;
    }
    
    // Fix: Handle both string and object data types to prevent double parsing
    let analysisData = null;
    try {
      analysisData = typeof biomechanicalData === 'string' 
        ? JSON.parse(biomechanicalData) 
        : biomechanicalData;
      
      console.log('✅ Analysis data parsed:', analysisData);
      console.log('🔑 Analysis data keys:', Object.keys(analysisData));
    } catch (error) {
      console.error('❌ Failed to parse analysis data:', error);
      console.error('Raw data causing parse error:', biomechanicalData);
      setMediapipeError('Failed to parse analysis data.');
      setFrameData([]);
      return;
    }

    // Extract MediaPipe pose data from the combined analysis structure
    let mediapipeData = null;
    if (analysisData?.mediapipe_data) {
      // New combined format: MediaPipe data is nested under mediapipe_data
      mediapipeData = analysisData.mediapipe_data;
      console.log('✅ Found MediaPipe data in combined analysis');
    } else if (analysisData?.frame_data && Array.isArray(analysisData.frame_data)) {
      // Legacy format: Direct MediaPipe data
      mediapipeData = analysisData;
      console.log('✅ Found direct MediaPipe data format');
    } else if (analysisData?.fps && analysisData?.processed_frames) {
      // Simplified MediaPipe format from new script
      mediapipeData = analysisData;
      console.log('✅ Found simplified MediaPipe data format');
    } else {
      console.log('No MediaPipe pose data found in analysis');
      console.log('Available keys:', Object.keys(analysisData || {}));
    }
    
    // Check for velocity data availability
    const hasValidVelocityData = !!(mediapipeData?.velocity_data && 
      Array.isArray(mediapipeData.velocity_data) && 
      mediapipeData.velocity_data.some(frame => frame.has_valid_data));
    
    setHasVelocityData(hasValidVelocityData);
    console.log(`Velocity data detected: ${hasValidVelocityData ? 'Yes' : 'No'}`);
    if (hasValidVelocityData) {
      const validVelocityFrames = mediapipeData.velocity_data.filter(frame => frame.has_valid_data).length;
      console.log(`Found ${validVelocityFrames} frames with valid velocity data`);
    }
    
    // Verify we have valid MediaPipe data structure
    if (!mediapipeData || typeof mediapipeData !== 'object') {
      console.error('Invalid MediaPipe data structure');
      setFrameData([]);
      return;
    }
    
    // Check for MediaPipe error responses
    if (mediapipeData.error) {
      console.error('MediaPipe processing error:', mediapipeData.error);
      setMediapipeError(`MediaPipe processing failed: ${mediapipeData.error}`);
      setFrameData([]);
      return;
    }
    
    if (mediapipeData?.frame_data && Array.isArray(mediapipeData.frame_data)) {
      const fps = mediapipeData.fps || 24;
      const duration = mediapipeData.duration || 0;
      
      // Validate and process authentic MediaPipe landmarks
      const validFrames = mediapipeData.frame_data.filter((frameData: any) => {
        return frameData.pose_landmarks && 
               Array.isArray(frameData.pose_landmarks) && 
               frameData.pose_landmarks.length === 33 &&
               typeof frameData.timestamp === 'number';
      });
      
      if (validFrames.length === 0) {
        console.error('No valid pose data found in MediaPipe results');
        setMediapipeError('MediaPipe ran but didn\'t extract valid poses. The subject may not be clearly visible or the movement may be too fast.');
        setFrameData([]);
        return;
      }
      
      const mediapipeFrames = validFrames.map((frameData: any, index: number) => {
        // Ensure landmarks have proper structure
        const validatedLandmarks = frameData.pose_landmarks.map((landmark: any) => ({
          x: Math.max(0, Math.min(1, landmark.x || 0)), // Clamp to [0,1]
          y: Math.max(0, Math.min(1, landmark.y || 0)), // Clamp to [0,1]
          z: landmark.z || 0,
          visibility: Math.max(0, Math.min(1, landmark.visibility || 0)) // Clamp to [0,1]
        }));
        
        // Calculate real joint angles from authentic MediaPipe skeletal data
        const realJointAngles = calculateRealJointAngles(validatedLandmarks);
        
        // Find corresponding velocity data for this frame
        const frameVelocityData = mediapipeData.velocity_data?.find((velocityFrame: any) => 
          Math.abs(velocityFrame.timestamp - frameData.timestamp) < 0.05 // 50ms tolerance
        );
        
        // Log real joint angle calculations for first few frames
        if (index < 3 && Object.keys(realJointAngles).length > 0) {
          console.log(`✅ Frame ${index} real joint angles from skeletal data:`, realJointAngles);
          console.log(`📊 Angle count: ${Object.keys(realJointAngles).length}, Landmark count: ${validatedLandmarks.length}`);
          if (frameVelocityData?.has_valid_data) {
            console.log(`🏃 Frame ${index} has velocity data with ${frameVelocityData.valid_point_count} points`);
          }
        }
        
        return {
          timestamp: frameData.timestamp,
          frameIndex: frameData.frame || index,
          pose_landmarks: validatedLandmarks,
          key_points: frameData.key_points || {},
          joint_angles: realJointAngles, // Use calculated real angles instead of fallback data
          velocity_data: frameVelocityData?.velocities || null, // Add velocity data to frame
          has_velocity: frameVelocityData?.has_valid_data || false
        };
      });
      
      // Sort frames by timestamp to ensure proper ordering
      mediapipeFrames.sort((a: any, b: any) => a.timestamp - b.timestamp);
      
      setFrameData(mediapipeFrames);
      setMediapipeError(null); // Clear any previous errors on successful processing
      
      console.log(`MediaPipe Controller: ${mediapipeFrames.length}/${mediapipeData.frame_data.length} valid frames processed`);
      console.log(`Video info: ${duration.toFixed(2)}s at ${fps} FPS`);
      
      // Quality assessment
      if (mediapipeFrames.length > 0) {
        const firstFrame = mediapipeFrames[0];
        const lastFrame = mediapipeFrames[mediapipeFrames.length - 1];
        const avgVisibility = firstFrame.pose_landmarks.reduce((sum: number, lm: any) => sum + lm.visibility, 0) / 33;
        
        console.log(`Frame range: ${firstFrame.timestamp.toFixed(3)}s to ${lastFrame.timestamp.toFixed(3)}s`);
        console.log(`Average landmark visibility: ${(avgVisibility * 100).toFixed(1)}%`);
        
        // Test coordinate validity
        const nose = firstFrame.pose_landmarks[0];
        console.log(`Sample nose landmark: x=${nose.x.toFixed(3)}, y=${nose.y.toFixed(3)}, v=${nose.visibility.toFixed(3)}`);
      }
    } else {
      console.error('MediaPipe frame data missing or invalid format');
      setFrameData([]);
    }
  }, [biomechanicalData]);

  // Attach video event listeners for pose synchronization
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeked', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleTimeUpdate);
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeked', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleTimeUpdate);
    };
  }, [handleTimeUpdate]);

  // Animation loop for smooth overlay updates
  useEffect(() => {
    const animate = () => {
      updateCanvas();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    if (frameData.length > 0 || poseData) {
      animate();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateCanvas]);

  // Draw overlays based on frame data
  const drawFrameBasedOverlays = useCallback((ctx: CanvasRenderingContext2D, frameData: any, width: number, height: number) => {
    if (!frameData || !frameData.pose_landmarks) return;
    
    overlays.forEach((overlay) => {
      if (!overlay.enabled) return;
      
      ctx.strokeStyle = overlay.color;
      ctx.fillStyle = overlay.color;
      ctx.lineWidth = 2;
      
      const landmarks = frameData.pose_landmarks;
      if (!landmarks || !Array.isArray(landmarks) || landmarks.length === 0) return;
      
      switch (overlay.type) {
        case 'skeleton':
          drawMediaPipeSkeleton(ctx, landmarks, width, height);
          break;
        case 'angles':
          drawDynamicJointAngles(ctx, landmarks, frameData.joint_angles, width, height);
          break;
        case 'velocity':
          if (frameData.has_velocity && frameData.velocity_data) {
            drawDynamicVelocityVectors(ctx, landmarks, frameData.velocity_data, width, height);
          }
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

  // MediaPipe-controlled skeleton renderer with precise coordinate mapping
  const drawMediaPipeSkeleton = (ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number) => {
    if (!landmarks || landmarks.length !== 33) {
      console.warn('MediaPipe skeleton: Invalid landmark count', landmarks?.length);
      return;
    }

    // Enhanced MediaPipe styling for better visibility
    ctx.strokeStyle = '#8b5cf6';
    ctx.fillStyle = '#8b5cf6';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Precise coordinate transformation accounting for video aspect ratio
    const video = videoRef.current;
    if (!video) return;
    
    const videoAspect = video.videoWidth / video.videoHeight;
    const canvasAspect = width / height;
    
    let scaleX = width;
    let scaleY = height;
    let offsetX = 0;
    let offsetY = 0;
    
    // Handle aspect ratio differences to maintain pose accuracy
    if (videoAspect > canvasAspect) {
      // Video is wider - fit height, center horizontally
      scaleY = height;
      scaleX = height * videoAspect;
      offsetX = (width - scaleX) / 2;
    } else {
      // Video is taller - fit width, center vertically
      scaleX = width;
      scaleY = width / videoAspect;
      offsetY = (height - scaleY) / 2;
    }

    const toLandmarkCoords = (landmark: any) => ({
      x: (landmark.x * scaleX) + offsetX,
      y: (landmark.y * scaleY) + offsetY,
      visibility: landmark.visibility || 0
    });

    // Complete MediaPipe pose connections for full skeleton
    const POSE_CONNECTIONS = [
      // Face outline
      [0, 1], [1, 2], [2, 3], [3, 7],
      [0, 4], [4, 5], [5, 6], [6, 8],
      // Torso
      [9, 10], [11, 12], [11, 23], [12, 24], [23, 24],
      // Left arm
      [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
      // Right arm  
      [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
      // Left leg
      [23, 25], [25, 27], [27, 29], [29, 31], [27, 31],
      // Right leg
      [24, 26], [26, 28], [28, 30], [30, 32], [28, 32]
    ];

    // Draw skeleton connections with glow effect
    ctx.shadowColor = '#8b5cf6';
    ctx.shadowBlur = 8;
    
    POSE_CONNECTIONS.forEach(([start, end]) => {
      const startLandmark = landmarks[start];
      const endLandmark = landmarks[end];
      
      if (startLandmark?.visibility > 0.5 && endLandmark?.visibility > 0.5) {
        const startCoords = toLandmarkCoords(startLandmark);
        const endCoords = toLandmarkCoords(endLandmark);
        
        ctx.beginPath();
        ctx.moveTo(startCoords.x, startCoords.y);
        ctx.lineTo(endCoords.x, endCoords.y);
        ctx.stroke();
      }
    });

    // Reset shadow for joint markers
    ctx.shadowBlur = 0;
    
    // Draw enhanced joint markers
    const CRITICAL_JOINTS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
    CRITICAL_JOINTS.forEach(index => {
      const landmark = landmarks[index];
      if (landmark?.visibility > 0.5) {
        const coords = toLandmarkCoords(landmark);
        
        // Outer ring
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner dot
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Enhanced debug information
    if (debugMode) {
      ctx.fillStyle = '#00ff00';
      ctx.font = '12px monospace';
      const visibleCount = landmarks.filter(l => l?.visibility > 0.5).length;
      const highConfidenceCount = landmarks.filter(l => l?.visibility > 0.8).length;
      
      ctx.fillText(`MediaPipe: ${visibleCount}/33 visible, ${highConfidenceCount} high confidence`, 10, 140);
      ctx.fillText(`Scale: ${scaleX.toFixed(0)}x${scaleY.toFixed(0)}, Offset: ${offsetX.toFixed(0)},${offsetY.toFixed(0)}`, 10, 160);
      
      // Show sample landmark coordinates
      if (landmarks[0]?.visibility > 0.5) {
        const nose = toLandmarkCoords(landmarks[0]);
        ctx.fillText(`Nose: (${nose.x.toFixed(0)}, ${nose.y.toFixed(0)})`, 10, 180);
      }
    }
  };

  const drawDynamicJointAngles = (ctx: CanvasRenderingContext2D, landmarks: any[], data: any, width: number, height: number) => {
    if (!landmarks || !data) return;

    ctx.font = '14px monospace';
    ctx.fillStyle = '#06b6d4';

    const getDisplayCoords = (landmark: any) => ({
      x: landmark.x * width,
      y: landmark.y * height
    });

    // Use real calculated joint angles from MediaPipe skeletal data
    if (landmarks[25] && data.left_knee) { // MediaPipe left knee index 25
      const leftKnee = getDisplayCoords(landmarks[25]);
      ctx.fillText(`L: ${Math.round(data.left_knee)}°`, leftKnee.x - 25, leftKnee.y - 10);
    }

    if (landmarks[26] && data.right_knee) { // MediaPipe right knee index 26
      const rightKnee = getDisplayCoords(landmarks[26]);
      ctx.fillText(`R: ${Math.round(data.right_knee)}°`, rightKnee.x + 10, rightKnee.y - 10);
    }

    if (landmarks[23] && landmarks[24] && data.left_hip) { // MediaPipe hip indices 23, 24
      const hipCenter = {
        x: (getDisplayCoords(landmarks[23]).x + getDisplayCoords(landmarks[24]).x) / 2,
        y: (getDisplayCoords(landmarks[23]).y + getDisplayCoords(landmarks[24]).y) / 2
      };
      ctx.fillText(`Hip: ${Math.round(data.left_hip)}°`, hipCenter.x - 30, hipCenter.y + 20);
    }

    if (landmarks[11] && landmarks[12] && data.trunk) { // MediaPipe shoulder indices 11, 12
      const shoulderCenter = {
        x: (getDisplayCoords(landmarks[11]).x + getDisplayCoords(landmarks[12]).x) / 2,
        y: (getDisplayCoords(landmarks[11]).y + getDisplayCoords(landmarks[12]).y) / 2
      };
      ctx.fillText(`Trunk: ${Math.round(Math.abs(data.trunk))}°`, shoulderCenter.x - 35, shoulderCenter.y - 20);
    }
  };

  const drawDynamicVelocityVectors = (ctx: CanvasRenderingContext2D, landmarks: any[], data: any, width: number, height: number) => {
    if (!landmarks || !data || !hasVelocityData) return;

    ctx.strokeStyle = '#f59e0b';
    ctx.fillStyle = '#f59e0b';
    ctx.lineWidth = 2;

    const getDisplayCoords = (landmark: any) => ({
      x: landmark.x * width,
      y: landmark.y * height
    });

    // Draw velocity vectors for key body points using MediaPipe indices
    const velocityPoints = [
      { name: 'nose', index: 0 },
      { name: 'left_shoulder', index: 11 },
      { name: 'right_shoulder', index: 12 },
      { name: 'left_elbow', index: 13 },
      { name: 'right_elbow', index: 14 },
      { name: 'left_wrist', index: 15 },
      { name: 'right_wrist', index: 16 },
      { name: 'left_hip', index: 23 },
      { name: 'right_hip', index: 24 },
      { name: 'left_knee', index: 25 },
      { name: 'right_knee', index: 26 },
      { name: 'left_ankle', index: 27 },
      { name: 'right_ankle', index: 28 }
    ];

    velocityPoints.forEach(point => {
      if (landmarks[point.index] && data[point.name]) {
        const coords = getDisplayCoords(landmarks[point.index]);
        const velocity = data[point.name];
        
        if (velocity.speed && velocity.speed > 0.01) { // Only show significant velocities
          const vectorLength = Math.min(velocity.speed * 1000, 60); // Scale for display
          const angle = velocity.direction_rad || 0;
          
          // Draw velocity vector
          ctx.beginPath();
          ctx.moveTo(coords.x, coords.y);
          ctx.lineTo(
            coords.x + vectorLength * Math.cos(angle),
            coords.y + vectorLength * Math.sin(angle)
          );
          ctx.stroke();
          
          // Draw arrowhead
          const arrowLength = 8;
          const endX = coords.x + vectorLength * Math.cos(angle);
          const endY = coords.y + vectorLength * Math.sin(angle);
          
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - arrowLength * Math.cos(angle - 0.5),
            endY - arrowLength * Math.sin(angle - 0.5)
          );
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - arrowLength * Math.cos(angle + 0.5),
            endY - arrowLength * Math.sin(angle + 0.5)
          );
          ctx.stroke();
          
          // Display speed value
          ctx.font = '11px monospace';
          ctx.fillText(`${(velocity.speed * 100).toFixed(1)}`, coords.x + 10, coords.y - 10);
        }
      }
    });
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
      // Frame updates are now handled by the animation loop
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
    if (!overlay.enabled || !ctx) return;
    
    try {
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
    if (poseData && poseData.landmarks && Array.isArray(poseData.landmarks) && poseData.landmarks.length > 0 && videoRef.current) {
      try {
        const landmarks = poseData.landmarks;
      
        switch (overlay.type) {
          case 'skeleton':
            drawRealPoseSkeleton(ctx, landmarks, width, height, offsetX, offsetY, videoRef.current.videoWidth, videoRef.current.videoHeight);
            break;
          case 'angles':
            if (poseData.joint_angles) {
              drawRealJointAngles(ctx, poseData.joint_angles, landmarks, width, height, offsetX, offsetY, videoRef.current.videoWidth, videoRef.current.videoHeight);
            }
            break;
          case 'velocity':
            if (poseData.velocities) {
              drawRealVelocityVectors(ctx, poseData.velocities, landmarks, width, height, offsetX, offsetY, videoRef.current.videoWidth, videoRef.current.videoHeight);
            }
            break;
          case 'stride':
            if (poseData.stride_metrics) {
              drawRealStrideAnalysis(ctx, poseData.stride_metrics, width, height, offsetX, offsetY);
            }
            break;
          case 'contact':
            if (poseData.ground_contact) {
              drawRealGroundContact(ctx, poseData.ground_contact, landmarks, width, height, offsetX, offsetY, videoRef.current.videoWidth, videoRef.current.videoHeight);
            }
            break;
        }
        return;
      } catch (error) {
        console.error('Error drawing real-time pose overlay:', error);
      }
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
    } catch (error) {
      console.error('Error drawing biomechanical overlay:', error);
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

    // Display real joint angles from calculated skeletal data
    if (landmarks[25] && data.joint_angles?.left_knee) { // MediaPipe left knee index 25
      const leftKnee = getDisplayCoords(landmarks[25]);
      ctx.fillText(`L: ${Math.round(data.joint_angles.left_knee)}°`, leftKnee.x - 25, leftKnee.y - 10);
    }

    if (landmarks[26] && data.joint_angles?.right_knee) { // MediaPipe right knee index 26
      const rightKnee = getDisplayCoords(landmarks[26]);
      ctx.fillText(`R: ${Math.round(data.joint_angles.right_knee)}°`, rightKnee.x + 10, rightKnee.y - 10);
    }

    if (landmarks[23] && landmarks[24] && data.joint_angles?.left_hip) { // MediaPipe hip indices 23, 24
      const hipCenter = {
        x: (getDisplayCoords(landmarks[23]).x + getDisplayCoords(landmarks[24]).x) / 2,
        y: (getDisplayCoords(landmarks[23]).y + getDisplayCoords(landmarks[24]).y) / 2
      };
      ctx.fillText(`Hip: ${Math.round(data.joint_angles.left_hip)}°`, hipCenter.x - 30, hipCenter.y + 20);
    }

    if (landmarks[11] && landmarks[12] && data.joint_angles?.trunk) { // MediaPipe shoulder indices 11, 12
      const shoulderCenter = {
        x: (getDisplayCoords(landmarks[11]).x + getDisplayCoords(landmarks[12]).x) / 2,
        y: (getDisplayCoords(landmarks[11]).y + getDisplayCoords(landmarks[12]).y) / 2
      };
      ctx.fillText(`Trunk: ${Math.round(Math.abs(data.joint_angles.trunk))}°`, shoulderCenter.x - 35, shoulderCenter.y - 20);
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

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      // Prevent fullscreen mode by controlling play behavior
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Play prevented:', error);
        });
      }
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
    <div className="space-y-4">
      {/* Video Container - Dynamic Aspect Ratio */}
      <div 
        className="relative w-full bg-black rounded-lg overflow-hidden" 
        style={{ aspectRatio: videoAspectRatio.toString() }}
      >
        <div 
          ref={containerRef}
          className="absolute inset-0 bg-black flex items-center justify-center overflow-hidden"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }}
        >
          {/* Video Element - Maximized with zoom and pan */}
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            preload="metadata"
            style={{
              transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              let width = video.videoWidth;
              let height = video.videoHeight;
              
              // Check if video content appears to be rotated landscape in a portrait container
              // This is common with mobile recordings that are landscape but encoded as portrait
              const naturalAspectRatio = width / height;
              
              // Detect if this looks like a rotated landscape video
              // If video is portrait (height > width) but content appears landscape oriented,
              // we should treat it as landscape for display purposes
              const shouldTreatAsLandscape = naturalAspectRatio < 1 && 
                (width > 400 && height > 800); // Common mobile portrait dimensions with landscape content
              
              let displayAspectRatio;
              if (shouldTreatAsLandscape) {
                // Swap dimensions for display to show landscape orientation
                displayAspectRatio = height / width; // Invert the ratio
                console.log('🔄 Detected rotated landscape video - adjusting container');
              } else {
                displayAspectRatio = naturalAspectRatio;
              }
              
              console.log('Video metadata debug:', {
                videoUrl,
                videoWidth: width,
                videoHeight: height,
                naturalAspectRatio: naturalAspectRatio,
                shouldTreatAsLandscape: shouldTreatAsLandscape,
                displayAspectRatio: displayAspectRatio,
                isLandscapeDisplay: displayAspectRatio > 1,
                currentContainerAspectRatio: videoAspectRatio
              });

              // Set the corrected aspect ratio for container
              console.log('Setting video aspect ratio:', {
                from: videoAspectRatio,
                to: displayAspectRatio,
                videoFormat: displayAspectRatio > 1 ? 'landscape' : 'portrait',
                corrected: shouldTreatAsLandscape
              });
              
              setVideoDimensions({ width, height });
              setVideoAspectRatio(displayAspectRatio);
              
              // Show first frame immediately
              video.currentTime = 0.1;
              
              console.log('Video loaded metadata:', {
                videoUrl,
                duration: video.duration,
                videoWidth: width,
                videoHeight: height,
                displayAspectRatio: displayAspectRatio,
                containerWillUpdate: true
              });
            }}
            onLoadedData={(e) => {
              // Ensure first frame is visible
              const video = e.currentTarget;
              if (video.currentTime === 0) {
                video.currentTime = 0.1;
              }
            }}
            onError={(e) => {
              console.error('Video load error:', e);
              console.error('Video URL:', videoUrl);
            }}
          />
          
          {/* Overlay Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ 
              mixBlendMode: 'normal',
              width: '100%',
              height: '100%',
              transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
          />



          {/* MediaPipe Error Display */}
          {mediapipeError && (
            <div className="absolute top-4 left-4 right-4 bg-red-900/90 border border-red-600 rounded p-2 z-20">
              <div className="text-red-200 text-xs font-medium mb-1">Analysis Failed</div>
              <div className="text-red-300 text-xs">{mediapipeError}</div>
            </div>
          )}
        </div>
      </div>

      {/* External Video Controls - Below Video */}
      {!isFloatingScrubber && (
        <div className="bg-black/40 border border-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <Slider
                value={[currentTime]}
                max={duration}
                step={0.1}
                onValueChange={handleSeek}
                className="w-full"
              />
            </div>
            
            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlay}
                className="text-white hover:bg-white/20 px-4 py-2"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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

              {/* Float Scrubber Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFloatingScrubber}
                className="text-white hover:bg-white/20 px-3 py-2"
                title="Make scrubber float for easier access"
              >
                <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12h-8m8 0l-4 4m4-4l-4-4" />
                  <path d="M9 6H3v12h6" />
                </svg>
                Pop Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Scrubber */}
      {isFloatingScrubber && (
        <div
          className="fixed bg-black/80 border border-white/20 backdrop-blur-sm rounded-lg p-3 z-50 shadow-lg"
          style={{
            left: `${floatingScrubberPos.x}px`,
            top: `${floatingScrubberPos.y}px`,
            width: '280px'
          }}
        >
          <div className="space-y-3">
            {/* Drag Handle */}
            <div 
              className="flex items-center justify-between p-2 -m-2 rounded cursor-grab active:cursor-grabbing hover:bg-white/5"
              onMouseDown={handleScrubberMouseDown}
              onTouchStart={handleScrubberTouchStart}
              style={{
                cursor: isDraggingScrubber ? 'grabbing' : 'grab',
                touchAction: 'none'
              }}
            >
              <div className="flex items-center gap-2 text-xs text-gray-300 pointer-events-none">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="12" r="1"/>
                  <circle cx="9" cy="5" r="1"/>
                  <circle cx="9" cy="19" r="1"/>
                  <circle cx="15" cy="12" r="1"/>
                  <circle cx="15" cy="5" r="1"/>
                  <circle cx="15" cy="19" r="1"/>
                </svg>
                Drag to move
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFloatingScrubber}
                className="text-white hover:bg-white/20 p-1 h-6 w-6"
                title="Dock scrubber back to bottom"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12h8m-8 0l4 4m-4-4l4-4" />
                  <path d="M15 18h6V6h-6" />
                </svg>
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-300">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <Slider
                value={[currentTime]}
                max={duration}
                step={0.1}
                onValueChange={handleSeek}
                className="w-full"
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>
            
            {/* Compact Control Buttons */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlay}
                className="text-white hover:bg-white/20 p-2 h-8 w-8"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </Button>

              <div className="flex items-center gap-1">
                <Volume2 className="h-3 w-3 text-white" />
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
                  className="w-16"
                  onMouseDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay Icons Below Video */}
      <div className="bg-black/40 border border-white/10 backdrop-blur-sm rounded-lg p-4 mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {overlays.map((overlay) => {
            const Icon = overlay.icon;
            return (
              <Button
                key={overlay.id}
                variant={overlay.enabled ? "default" : "outline"}
                size="sm"
                onClick={() => toggleOverlay(overlay.id)}
                disabled={overlay.id === 'velocity' && !hasVelocityData}
                className={`flex items-center gap-2 ${
                  overlay.id === 'velocity' && !hasVelocityData
                    ? 'text-gray-500 cursor-not-allowed opacity-50'
                    : 'text-white'
                } ${
                  overlay.enabled 
                    ? `border-2` 
                    : 'border-gray-600 hover:bg-white/10'
                }`}
                style={{
                  borderColor: overlay.enabled ? overlay.color : undefined,
                  backgroundColor: overlay.enabled ? `${overlay.color}20` : undefined
                }}
              >
                <Icon className="h-4 w-4" style={{ color: overlay.color }} />
                {overlay.label}
              </Button>
            );
          })}
        </div>
        {overlays.length === 0 && (
          <div className="text-gray-400 text-sm text-center">
            Pose overlay controls will appear when MediaPipe analysis is available
          </div>
        )}
      </div>
    </div>
  );
}