import { useState, useCallback } from 'react';
import { CameraRecorder } from '@/components/CameraRecorder';
import { Uploader } from '@/components/Uploader';
import { VideoPlayerWithOverlay } from '@/components/VideoPlayerWithOverlay';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { SavedList } from '@/components/SavedList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Dumbbell, Ruler, Crosshair, Play, Settings, HelpCircle, Lightbulb, Camera, Gauge } from 'lucide-react';
import { AnalysisResult, SavedVideo, CalibrationSettings, TrackingSettings, ProcessingStatus } from '@/types/vbt';
import { CalibrationManager } from '@/utils/calibration';
import { VelocityCalculator } from '@/utils/velocity';
import { KLTTracker } from '@/utils/klt';
import { vbtStorage } from '@/utils/storage';
import { aiBarbellDetector } from '@/utils/ai-detection';
import { aiPoseDetector } from '@/utils/pose-detection';
import { AICalibrationDetector } from '@/utils/ai-calibration';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

export default function Home() {
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    progress: 0,
    currentStep: 'Ready'
  });

  // Initialize AI calibration detector
  const aiCalibrationDetector = new AICalibrationDetector();
  
  const [calibrationSettings, setCalibrationSettings] = useState<CalibrationSettings>({
    method: 'plate',
    plateDiameter: 450,
    pixelsPerMm: 1
  });

  // AI toggle state
  const [aiEnabled, setAiEnabled] = useState(false);
  
  const [trackingSettings, setTrackingSettings] = useState<TrackingSettings>({
    algorithm: 'klt',
    trackingPoints: 25, // Optimized for speed
    maxCorners: 25,
    qualityLevel: 0.01, // Balanced sensitivity vs speed
    minDistance: 8 // Optimized spacing
  });

  const { toast } = useToast();

  const analyzeVideoWithData = useCallback(async (videoUrl?: string, videoFile?: File) => {
    const videoToAnalyze = videoUrl || currentVideo;
    const fileToAnalyze = videoFile || currentFile;
    
    if (!videoToAnalyze || !fileToAnalyze) {
      toast({
        title: "No video",
        description: "Please record or upload a video first",
        variant: "destructive"
      });
      return;
    }

    // Clear any existing analysis result to wash previous overlays
    setAnalysisResult(null);
    setProcessingStatus({
      isProcessing: true,
      progress: 0,
      currentStep: 'Initializing analysis...'
    });

    try {
      const video = document.createElement('video');
      video.src = videoToAnalyze;
      
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          console.log(`📹 Video loaded: ${video.videoWidth}x${video.videoHeight}, duration: ${video.duration}s`);
          resolve();
        };
        video.load();
      });

      // Check if video has valid duration (recorded videos sometimes report 0)
      if (!video.duration || video.duration <= 0) {
        console.warn('⚠️ Video has invalid duration, attempting to estimate...');
        // For recorded videos, try to estimate duration by seeking to end
        video.currentTime = Number.MAX_SAFE_INTEGER;
        await new Promise(resolve => {
          video.onseeked = () => {
            console.log(`📏 Estimated duration: ${video.currentTime}s`);
            resolve(undefined);
          };
        });
        video.currentTime = 0;
        await new Promise(resolve => { video.onseeked = resolve; });
      }

      // Step 1: AI-powered calibration
      setProcessingStatus(prev => ({ ...prev, progress: 10, currentStep: 'AI calibration: analyzing scene scale...' }));
      
      let calibration;
      let calibrationMethod = 'traditional';
      
      // Try AI-powered calibration first (if enabled)
      if (aiEnabled) {
        console.log('🧠 AI Enhancement: ENABLED - Attempting AI calibration...');
        try {
          const aiCalibrationAvailable = await aiCalibrationDetector.isAvailable();
          
          if (aiCalibrationAvailable) {
          // Capture frame for calibration analysis
          const calibCanvas = document.createElement('canvas');
          calibCanvas.width = Math.min(video.videoWidth, 800); // Limit size for AI processing
          calibCanvas.height = Math.min(video.videoHeight, 600);
          const calibCtx = calibCanvas.getContext('2d');
          
          if (calibCtx) {
            video.currentTime = 0;
            await new Promise(resolve => { video.onseeked = resolve; });
            calibCtx.drawImage(video, 0, 0, calibCanvas.width, calibCanvas.height);
            
            const calibImageData = calibCtx.getImageData(0, 0, calibCanvas.width, calibCanvas.height);
            const aiCalibration = await aiCalibrationDetector.detectCalibration(calibImageData);
            
            if (aiCalibration.found && aiCalibration.pixelsPerMm && (aiCalibration.confidence || 0) > 0.4) {
              console.log('🎯 AI calibration successful:', aiCalibration.description);
              console.log('📏 Detected scale:', aiCalibration.pixelsPerMm, 'pixels/mm');
              console.log('🔍 Reference objects:', aiCalibration.referenceObjects);
              
              calibration = {
                pixelsPerMm: aiCalibration.pixelsPerMm,
                method: aiCalibration.method,
                confidence: aiCalibration.confidence
              };
              
              calibrationMethod = 'AI-powered';
              setProcessingStatus(prev => ({ ...prev, currentStep: `AI calibration: ${aiCalibration.description}` }));
            } else {
              console.log('🤖 AI calibration low confidence, using traditional method');
              calibration = CalibrationManager.calibrateFromPlate(video, calibrationSettings.plateDiameter);
              setProcessingStatus(prev => ({ ...prev, currentStep: 'AI calibration unclear, using plate diameter method...' }));
            }
          } else {
            // Fallback to traditional
            calibration = CalibrationManager.calibrateFromPlate(video, calibrationSettings.plateDiameter);
          }
          } else {
            // AI not available, use traditional
            console.log('🤖 AI calibration not available, using traditional method');
            calibration = CalibrationManager.calibrateFromPlate(video, calibrationSettings.plateDiameter);
          }
        } catch (error) {
          console.warn('❌ AI calibration failed, using traditional method:', error);
          calibration = CalibrationManager.calibrateFromPlate(video, calibrationSettings.plateDiameter);
          setProcessingStatus(prev => ({ ...prev, currentStep: 'AI calibration failed, using traditional method...' }));
        }
      } else {
        console.log('🔧 AI Enhancement: DISABLED - Using traditional calibration only');
        calibration = CalibrationManager.calibrateFromPlate(video, calibrationSettings.plateDiameter);
      }
      
      // Step 2: AI-enhanced detection (pose + barbell)
      setProcessingStatus(prev => ({ ...prev, progress: 15, currentStep: 'AI tracking: detecting person and barbell...' }));
      
      let barbellRegion = null;
      let aiDetectionUsed = false;
      
      // Check if AI detection is available and try combined approach (if enabled)
      if (aiEnabled) {
        console.log('🧠 AI Enhancement: ENABLED - Attempting AI tracking...');
        try {
          const aiAvailable = await aiBarbellDetector.isAvailable();
        
        if (aiAvailable) {
          // Capture first frame for AI analysis
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Set canvas to match video dimensions but scaled down for AI processing
            const maxDimension = 800; // Limit size for faster AI processing
            const scale = Math.min(maxDimension / video.videoWidth, maxDimension / video.videoHeight, 1);
            canvas.width = video.videoWidth * scale;
            canvas.height = video.videoHeight * scale;
            
            // Draw first frame
            video.currentTime = 0;
            await new Promise(resolve => { video.onseeked = resolve; });
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Step 2a: Pose detection for context
            setProcessingStatus(prev => ({ ...prev, currentStep: 'AI: analyzing person pose...' }));
            const poseResult = await aiPoseDetector.detectPose(imageData);
            
            // Step 2b: Direct barbell detection
            setProcessingStatus(prev => ({ ...prev, currentStep: 'AI: detecting barbell...' }));
            const barbellResult = await aiBarbellDetector.detectBarbell(imageData);
            
            // Combine results for best accuracy
            if (barbellResult.found && barbellResult.boundingBox) {
              console.log('🎯 AI TRACKING ACTIVATED: Barbell detected!');
              console.log('🤖 AI detected barbell:', barbellResult.description);
              console.log('📦 Barbell region:', barbellResult.boundingBox);
              
              // Use direct barbell detection as primary
              barbellRegion = {
                x: barbellResult.boundingBox.x / scale,
                y: barbellResult.boundingBox.y / scale,
                width: barbellResult.boundingBox.width / scale,
                height: barbellResult.boundingBox.height / scale
              };
              
              aiDetectionUsed = true;
              setProcessingStatus(prev => ({ ...prev, currentStep: `AI found barbell: ${barbellResult.description}` }));
              
            } else if (poseResult.found && poseResult.mainPersonBounds) {
              console.log('🎯 AI TRACKING ACTIVATED: Person pose detected!');
              console.log('🧍 AI detected person pose:', poseResult.description);
              
              // Fallback: estimate barbell region from pose
              const poseBasedRegion = aiPoseDetector.estimateBarbellRegionFromPose(
                poseResult, canvas.width, canvas.height
              );
              
              if (poseBasedRegion) {
                console.log('🎯 Estimated barbell region from pose:', poseBasedRegion);
                
                barbellRegion = {
                  x: poseBasedRegion.x / scale,
                  y: poseBasedRegion.y / scale,
                  width: poseBasedRegion.width / scale,
                  height: poseBasedRegion.height / scale
                };
                
                aiDetectionUsed = true;
                setProcessingStatus(prev => ({ ...prev, currentStep: 'AI estimated barbell from pose analysis' }));
              } else {
                console.log('🤖 Could not estimate barbell region from pose');
                setProcessingStatus(prev => ({ ...prev, currentStep: 'AI pose detected but barbell location unclear, using traditional tracking...' }));
              }
              
            } else {
              console.log('🤖 AI ANALYSIS COMPLETE: No confident detections, using traditional tracking');
              console.log('   Barbell found:', barbellResult.found, 'confidence:', barbellResult.confidence);
              console.log('   Pose found:', poseResult.found, 'confidence:', poseResult.confidence);
              setProcessingStatus(prev => ({ ...prev, currentStep: 'AI analysis complete - using traditional tracking for best accuracy...' }));
            }
          }
          } else {
            console.log('🤖 AI detection not available, using traditional tracking');
          }
        } catch (error) {
          console.warn('❌ AI tracking failed, using traditional tracking:', error);
          setProcessingStatus(prev => ({ ...prev, currentStep: 'AI detection failed, using traditional tracking...' }));
        }
      } else {
        console.log('🔧 AI Enhancement: DISABLED - Using traditional tracking only');
      }
      
      // Step 3: Initialize tracking (AI-enhanced or traditional)
      const trackingMethod = aiDetectionUsed ? 'AI-enhanced' : 'traditional';
      setProcessingStatus(prev => ({ ...prev, progress: 25, currentStep: `Initializing ${trackingMethod} tracking...` }));
      const tracker = new KLTTracker();
      
      const trackingPoints: any[] = [];
      let currentFrame = 0;
      let actualTotalFrames = 0;

      tracker.onTrackingResult = (points) => {
        trackingPoints.push(...points);
      };

      tracker.onError = (error) => {
        console.error('Tracking error:', error);
        setProcessingStatus(prev => ({ 
          ...prev, 
          error: `Tracking failed: ${error}`
        }));
      };

      // Initialize tracking with optional AI-detected region
      if (barbellRegion && aiDetectionUsed) {
        await tracker.initializeTrackingWithRegion(video, trackingSettings, barbellRegion);
      } else {
        await tracker.initializeTracking(video, trackingSettings);
      }

      // Step 4: Extract frames and track  
      setProcessingStatus(prev => ({ ...prev, progress: 25, currentStep: 'Starting frame extraction...' }));
      
      await KLTTracker.extractFrames(video, (imageData, timestamp, frameNumber, totalFrames) => {
        currentFrame = frameNumber;
        actualTotalFrames = totalFrames;
        
        console.log(`📊 Frame ${frameNumber + 1}/${totalFrames}: ${imageData.width}x${imageData.height} at ${timestamp.toFixed(0)}ms`);
        
        // Update progress based on actual frame progress
        const frameProgress = Math.min(90, 25 + (frameNumber / totalFrames) * 65);
        setProcessingStatus(prev => ({ 
          ...prev, 
          progress: frameProgress, 
          currentStep: `Processing frame ${frameNumber + 1}/${totalFrames}...`
        }));
        
        tracker.processFrame(imageData, frameNumber, timestamp);
      });

      // Step 5: Calculate velocities
      setProcessingStatus(prev => ({ ...prev, progress: 95, currentStep: 'Calculating velocity metrics...' }));
      
      if (aiDetectionUsed || calibrationMethod === 'AI-powered') {
        const aiFeatures = [];
        if (calibrationMethod === 'AI-powered') aiFeatures.push('AI calibration');
        if (aiDetectionUsed) aiFeatures.push('AI tracking');
        console.log(`🧠 AI ENHANCED ANALYSIS COMPLETE: ${aiFeatures.join(' + ')}`);
        console.log(`🎯 AI features used: ${aiFeatures.length}/2 total AI enhancements`);
      } else {
        console.log('🔧 TRADITIONAL ANALYSIS: High-precision computer vision tracking');
      }
      
      if (trackingPoints.length === 0) {
        throw new Error('No tracking points detected. Ensure the barbell is visible in the video.');
      }

      const velocityData = VelocityCalculator.analyzeVelocityData(
        trackingPoints,
        calibration.pixelsPerMm,
        30
      );

      const concentricPhase = VelocityCalculator.identifyConcentricPhase(trackingPoints, velocityData.instant);
      const pathDeviation = trackingPoints.length > 1 ? 
        Math.sqrt(trackingPoints.reduce((sum, point, i) => {
          if (i === 0) return 0;
          const prev = trackingPoints[i - 1];
          return sum + Math.pow(point.x - prev.x, 2);
        }, 0) / trackingPoints.length) / calibration.pixelsPerMm / 10 : 0;

      const rangeOfMotion = trackingPoints.length > 1 ?
        Math.abs(trackingPoints[trackingPoints.length - 1].y - trackingPoints[0].y) / calibration.pixelsPerMm / 10 : 0;

      // Calculate coherent barbell path from scattered tracking points
      console.log(`🔍 Processing ${trackingPoints.length} raw tracking points...`);
      const barbellPath = KLTTracker.calculateBarbellPath(trackingPoints);
      console.log(`✅ Generated ${barbellPath.length} barbell path points`);

      // Recalculate velocity with cleaned path
      const cleanVelocityData = VelocityCalculator.analyzeVelocityData(
        barbellPath,
        calibration.pixelsPerMm,
        15 // Using 15fps as set in our analysis
      );

      const cleanConcentricPhase = VelocityCalculator.identifyConcentricPhase(barbellPath, cleanVelocityData.instant);
      const cleanPathDeviation = barbellPath.length > 1 ? 
        Math.sqrt(barbellPath.reduce((sum, point, i) => {
          if (i === 0) return 0;
          const prev = barbellPath[i - 1];
          return sum + Math.pow(point.x - prev.x, 2);
        }, 0) / barbellPath.length) / calibration.pixelsPerMm / 10 : 0;

      const cleanRangeOfMotion = barbellPath.length > 1 ?
        Math.abs(barbellPath[barbellPath.length - 1].y - barbellPath[0].y) / calibration.pixelsPerMm / 10 : 0;

      const result: AnalysisResult = {
        meanVelocity: cleanVelocityData.mean,
        peakVelocity: cleanVelocityData.peak,
        repDuration: video.duration,
        concentricDuration: (cleanConcentricPhase.end - cleanConcentricPhase.start) / 15, // Convert frames to seconds (15fps)
        pathDeviation: cleanPathDeviation,
        rangeOfMotion: cleanRangeOfMotion,
        trackingPoints: barbellPath, // Use cleaned barbell path
        velocityData: cleanVelocityData,
        powerZone: VelocityCalculator.determinePowerZone(cleanVelocityData.mean)
      };

      setAnalysisResult(result);
      tracker.destroy();

      setProcessingStatus({
        isProcessing: false,
        progress: 100,
        currentStep: 'Analysis complete!'
      });

      const enhancementText = calibrationMethod === 'AI-powered' && aiDetectionUsed ? 
        ' (AI-enhanced)' : 
        calibrationMethod === 'AI-powered' || aiDetectionUsed ? ' (AI-assisted)' : '';
      
      toast({
        title: "Analysis complete" + enhancementText,
        description: `Mean velocity: ${result.meanVelocity.toFixed(2)} m/s`
      });

    } catch (error) {
      console.error('Analysis error:', error);
      setProcessingStatus({
        isProcessing: false,
        progress: 0,
        currentStep: 'Ready',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
    }
  }, [currentVideo, currentFile, calibrationSettings, trackingSettings, aiEnabled, toast]);

  const analyzeVideo = useCallback(async () => {
    return analyzeVideoWithData();
  }, [analyzeVideoWithData]);

  const handleVideoRecorded = useCallback((videoBlob: Blob) => {
    console.log('📹 Processing recorded video blob:', videoBlob.size, 'bytes');
    
    // Create File and URL from the recorded blob
    const videoFile = new File([videoBlob], `recording-${Date.now()}.webm`, { 
      type: 'video/webm'
    });
    const videoUrl = URL.createObjectURL(videoBlob); // Use original blob for URL
    
    console.log('✅ Video file created, starting analysis...');
    
    setCurrentVideo(videoUrl);
    setCurrentFile(videoFile);
    setAnalysisResult(null);
    
    // Start analysis immediately without pre-validation
    setTimeout(() => {
      analyzeVideoWithData(videoUrl, videoFile);
    }, 500);
  }, [analyzeVideoWithData]);

  const handleVideoUploaded = useCallback((videoFile: File | null) => {
    if (videoFile) {
      // Upload new video
      const videoUrl = URL.createObjectURL(videoFile);
      setCurrentVideo(videoUrl);
      setCurrentFile(videoFile);
      setAnalysisResult(null);
    } else {
      // Remove video and clear all data
      if (currentVideo) {
        URL.revokeObjectURL(currentVideo);
      }
      setCurrentVideo(null);
      setCurrentFile(null);
      setAnalysisResult(null);
      setProcessingStatus({
        isProcessing: false,
        progress: 0,
        currentStep: 'Ready'
      });
    }
  }, [currentVideo]);

  const handleVideoSelect = useCallback((savedVideo: SavedVideo) => {
    const videoUrl = URL.createObjectURL(savedVideo.videoBlob);
    setCurrentVideo(videoUrl);
    setCurrentFile(new File([savedVideo.videoBlob], savedVideo.name));
    setAnalysisResult(savedVideo.analysisResult);
  }, []);

  const saveAnalysis = useCallback(async () => {
    if (!analysisResult || !currentFile) return;

    try {
      await vbtStorage.init();
      
      const savedVideo: SavedVideo = {
        id: `analysis-${Date.now()}`,
        name: currentFile.name.replace(/\.[^/.]+$/, '') || 'Unnamed Analysis',
        timestamp: Date.now(),
        duration: analysisResult.repDuration,
        analysisResult,
        videoBlob: currentFile
      };

      await vbtStorage.saveVideo(savedVideo);
      
      toast({
        title: "Analysis saved",
        description: "Video analysis has been saved locally"
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save failed",
        description: "Failed to save analysis",
        variant: "destructive"
      });
    }
  }, [analysisResult, currentFile, toast]);

  const exportVideo = useCallback(async () => {
    if (!analysisResult || !currentVideo) {
      toast({
        title: "No analysis",
        description: "Complete video analysis before exporting",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Export started",
        description: "Creating video with overlays..."
      });

      const video = document.createElement('video');
      video.src = currentVideo;
      video.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
        video.load();
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Create MediaRecorder for the canvas
      const stream = canvas.captureStream(30); // 30 FPS
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const exportedBlob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(exportedBlob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `vbt-analysis-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Export complete",
          description: "Video with overlays has been downloaded"
        });
      };

      // Reset video to start
      video.currentTime = 0;
      let frameCount = 0;
      const totalFrames = Math.floor(video.duration * 30); // 30 FPS

      mediaRecorder.start();

      // Render each frame with overlays
      const renderFrame = () => {
        if (video.ended || video.currentTime >= video.duration || frameCount >= totalFrames) {
          mediaRecorder.stop();
          return;
        }

        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Calculate current frame index
        const frameIndex = Math.floor((video.currentTime / video.duration) * analysisResult.trackingPoints.length);
        const currentPoints = analysisResult.trackingPoints.slice(0, frameIndex);

        // Draw bar path
        if (currentPoints.length > 1) {
          ctx.strokeStyle = '#3b82f6'; // Blue
          ctx.lineWidth = 3;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          
          currentPoints.forEach((point, index) => {
            if (index === 0) {
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          });
          ctx.stroke();
          
          // Draw tracking points
          currentPoints.forEach((point, index) => {
            const isRecent = index >= currentPoints.length - 5;
            ctx.fillStyle = isRecent ? '#fb923c' : '#22c55e';
            ctx.beginPath();
            ctx.arc(point.x, point.y, isRecent ? 4 : 3, 0, 2 * Math.PI);
            ctx.fill();
          });
        }

        // Draw bounding box
        if (currentPoints.length > 0) {
          const latestPoint = currentPoints[currentPoints.length - 1];
          const boxWidth = canvas.width * 0.15;
          const boxHeight = canvas.height * 0.3;
          
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.strokeRect(
            latestPoint.x - boxWidth / 2,
            latestPoint.y - boxHeight / 2,
            boxWidth,
            boxHeight
          );
        }

        // Draw velocity info overlay
        const currentVel = analysisResult.velocityData.instant[frameIndex] || 0;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(canvas.width - 200, 10, 180, 100);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Velocity Analysis', canvas.width - 190, 30);
        ctx.font = '14px Arial';
        ctx.fillText(`Current: ${currentVel.toFixed(2)} m/s`, canvas.width - 190, 50);
        ctx.fillText(`Peak: ${analysisResult.peakVelocity.toFixed(2)} m/s`, canvas.width - 190, 70);
        ctx.fillText(`Mean: ${analysisResult.meanVelocity.toFixed(2)} m/s`, canvas.width - 190, 90);

        // Advance video time
        frameCount++;
        video.currentTime = (frameCount / 30); // 30 FPS
        
        // Continue rendering
        setTimeout(renderFrame, 1000 / 30); // 30 FPS timing
      };

      // Start rendering when video is ready
      video.addEventListener('seeked', renderFrame, { once: true });
      
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Failed to export video with overlays",
        variant: "destructive"
      });
    }
  }, [analysisResult, currentVideo, toast]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-primary text-primary-foreground w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg">
                B
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">BecomeAnAthlete</h1>
                <p className="text-xs text-muted-foreground">VBT Demo</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Gauge className="mr-2 h-4 w-4 inline" />
                Analysis
              </button>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Settings className="mr-2 h-4 w-4 inline" />
                Settings
              </button>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <HelpCircle className="mr-2 h-4 w-4 inline" />
                Help
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-1 space-y-6">
            <CameraRecorder onVideoRecorded={handleVideoRecorded} />
            <Uploader onVideoUploaded={handleVideoUploaded} />

            {/* Calibration Panel with AI Toggle */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Ruler className="text-chart-3 mr-2 h-5 w-5" />
                  Calibration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 block">Plate Diameter</Label>
                  <Select
                    value={calibrationSettings.plateDiameter.toString()}
                    onValueChange={(value) => setCalibrationSettings(prev => ({ 
                      ...prev, 
                      plateDiameter: parseInt(value) 
                    }))}
                  >
                    <SelectTrigger data-testid="select-plate-diameter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="450">45 cm (Olympic)</SelectItem>
                      <SelectItem value="250">25 cm (Standard)</SelectItem>
                      <SelectItem value="350">35 cm (Bumper)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* AI Enhancement Toggle */}
                <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg border">
                  <div>
                    <Label className="text-sm font-medium text-foreground">AI Enhancement</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enable AI-powered calibration and tracking for enhanced accuracy
                    </p>
                  </div>
                  <Switch
                    checked={aiEnabled}
                    onCheckedChange={setAiEnabled}
                    data-testid="switch-ai-enabled"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 block">Detection Method</Label>
                  <RadioGroup
                    value={calibrationSettings.method}
                    onValueChange={(value: 'plate' | 'manual') => 
                      setCalibrationSettings(prev => ({ ...prev, method: value }))
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="plate" id="plate" />
                      <Label htmlFor="plate" className="text-sm">Auto (Plate Detection)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manual" id="manual" />
                      <Label htmlFor="manual" className="text-sm">Manual Line</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Hide Tracking Settings
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Crosshair className="text-chart-4 mr-2 h-5 w-5" />
                  Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 block">Algorithm</Label>
                  <Select
                    value={trackingSettings.algorithm}
                    onValueChange={(value: 'klt' | 'roboflow') => 
                      setTrackingSettings(prev => ({ ...prev, algorithm: value }))
                    }
                  >
                    <SelectTrigger data-testid="select-algorithm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="klt">KLT Optical Flow</SelectItem>
                      <SelectItem value="roboflow">Roboflow Detection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-foreground mb-2 block">Tracking Points</Label>
                  <Slider
                    value={[trackingSettings.trackingPoints]}
                    onValueChange={(value) => 
                      setTrackingSettings(prev => ({ ...prev, trackingPoints: value[0] }))
                    }
                    min={10}
                    max={50}
                    step={1}
                    className="w-full"
                    data-testid="slider-tracking-points"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>10</span>
                    <span>{trackingSettings.trackingPoints}</span>
                    <span>50</span>
                  </div>
                </div>
              </CardContent>
            </Card> */}
          </div>

          {/* Main Content - Video Player */}
          <div className="lg:col-span-2 space-y-6">
            <VideoPlayerWithOverlay
              videoSrc={currentVideo}
              analysisResult={analysisResult}
              isAnalyzing={processingStatus.isProcessing}
              onExport={exportVideo}
            />

            {/* Analysis Controls */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={analyzeVideo}
                disabled={!currentVideo || processingStatus.isProcessing}
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-medium transition-colors flex items-center justify-center"
                data-testid="button-analyze"
              >
                {processingStatus.isProcessing ? (
                  <>
                    <div className="mr-2 h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze Video
                  </>
                )}
              </Button>
              <Button
                onClick={saveAnalysis}
                disabled={true}
                className="bg-secondary/50 text-secondary-foreground/50 font-medium opacity-50 cursor-not-allowed"
                data-testid="button-save"
              >
                Save Analysis
              </Button>
            </div>
          </div>

          {/* Right Sidebar - Analysis & Saved Videos */}
          <div className="lg:col-span-1 space-y-6">
            <AnalysisPanel 
              analysisResult={analysisResult}
              processingStatus={processingStatus}
            />
            {/* Hide Saved Analyses - <SavedList onVideoSelect={handleVideoSelect} /> */}

            {/* Hide Tips Panel 
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Lightbulb className="text-chart-4 mr-2 h-5 w-5" />
                  Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start space-x-2">
                  <Camera className="text-primary mt-0.5 h-3 w-3 flex-shrink-0" />
                  <span>Position camera perpendicular to the barbell path for best tracking accuracy.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Gauge className="text-accent mt-0.5 h-3 w-3 flex-shrink-0" />
                  <span>Ensure good lighting and minimal background movement during recording.</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Ruler className="text-chart-3 mt-0.5 h-3 w-3 flex-shrink-0" />
                  <span>Calibrate using plate diameter for accurate velocity measurements.</span>
                </div>
              </CardContent>
            </Card> */}
          </div>
        </div>
      </div>
    </div>
  );
}
