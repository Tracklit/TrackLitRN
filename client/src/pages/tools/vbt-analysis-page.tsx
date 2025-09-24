import { useState, useCallback } from 'react';
import { ProtectedRoute } from "@/lib/protected-route";
import { CameraRecorder } from '@/components/CameraRecorder';
import { Uploader } from '@/components/Uploader';
import { VideoPlayerWithOverlay } from '@/components/VideoPlayerWithOverlay';
import { AnalysisPanel } from '@/components/AnalysisPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Dumbbell, Ruler, Crosshair, Play, Settings, HelpCircle, Lightbulb, Camera, Gauge } from 'lucide-react';
import { AnalysisResult, SavedVideo, CalibrationSettings, TrackingSettings, ProcessingStatus } from '@shared/schema';
import { CalibrationManager } from '@/utils/calibration';
import { VelocityCalculator } from '@/utils/velocity';
import { KLTTracker } from '@/utils/klt';
import { vbtStorage } from '@/utils/storage';
import { aiBarbellDetector, aiPoseDetector, AICalibrationDetector } from '@/utils/ai-detection';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from "@/components/page-header";

export default function VBTAnalysisPage() {
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

    // Clear any existing analysis result
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

      // Check if video has valid duration
      if (!video.duration || video.duration <= 0) {
        console.warn('⚠️ Video has invalid duration, attempting to estimate...');
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
            calibCanvas.width = Math.min(video.videoWidth, 800);
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
              }
            } else {
              calibration = CalibrationManager.calibrateFromPlate(video, calibrationSettings.plateDiameter);
            }
          } else {
            console.log('🤖 AI calibration not available, using traditional method');
            calibration = CalibrationManager.calibrateFromPlate(video, calibrationSettings.plateDiameter);
          }
        } catch (error) {
          console.warn('❌ AI calibration failed, using traditional method:', error);
          calibration = CalibrationManager.calibrateFromPlate(video, calibrationSettings.plateDiameter);
        }
      } else {
        console.log('🔧 AI Enhancement: DISABLED - Using traditional calibration only');
        calibration = CalibrationManager.calibrateFromPlate(video, calibrationSettings.plateDiameter);
      }
      
      // Step 2: AI-enhanced detection (pose + barbell)
      setProcessingStatus(prev => ({ ...prev, progress: 25, currentStep: 'Initializing tracking...' }));
      const tracker = new KLTTracker();
      
      const trackingPoints: any[] = [];

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

      // Initialize tracking
      await tracker.initializeTracking(video, trackingSettings);

      // Step 3: Extract frames and track  
      setProcessingStatus(prev => ({ ...prev, progress: 30, currentStep: 'Starting frame extraction...' }));
      
      await KLTTracker.extractFrames(video, (imageData, timestamp, frameNumber, totalFrames) => {
        console.log(`📊 Frame ${frameNumber + 1}/${totalFrames}: ${imageData.width}x${imageData.height} at ${timestamp.toFixed(0)}ms`);
        
        // Update progress based on actual frame progress
        const frameProgress = Math.min(90, 30 + (frameNumber / totalFrames) * 60);
        setProcessingStatus(prev => ({ 
          ...prev, 
          progress: frameProgress, 
          currentStep: `Processing frame ${frameNumber + 1}/${totalFrames}...`
        }));
        
        tracker.processFrame(imageData, frameNumber, timestamp);
      });

      // Step 4: Calculate velocities
      setProcessingStatus(prev => ({ ...prev, progress: 95, currentStep: 'Calculating velocity metrics...' }));
      
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

      const enhancementText = calibrationMethod === 'AI-powered' ? ' (AI-enhanced)' : '';
      
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
    
    const videoFile = new File([videoBlob], `recording-${Date.now()}.webm`, { 
      type: 'video/webm'
    });
    const videoUrl = URL.createObjectURL(videoBlob);
    
    console.log('✅ Video file created, starting analysis...');
    
    setCurrentVideo(videoUrl);
    setCurrentFile(videoFile);
    setAnalysisResult(null);
    
    // Start analysis immediately
    setTimeout(() => {
      analyzeVideoWithData(videoUrl, videoFile);
    }, 500);
  }, [analyzeVideoWithData]);

  const handleVideoUploaded = useCallback((videoFile: File | null) => {
    if (videoFile) {
      const videoUrl = URL.createObjectURL(videoFile);
      setCurrentVideo(videoUrl);
      setCurrentFile(videoFile);
      setAnalysisResult(null);
    } else {
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
    toast({
      title: "Export feature",
      description: "Video export with overlays coming soon!",
    });
  }, [toast]);

  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 pb-20">
      <PageHeader
        title="VBT Analysis"
        description="Advanced velocity-based training analysis with AI-enhanced tracking"
      />

      <div className="grid gap-6 max-w-6xl mx-auto">
        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Input Methods */}
          <div className="space-y-6">
            <CameraRecorder onVideoRecorded={handleVideoRecorded} />
            <Uploader onVideoUploaded={handleVideoUploaded} currentFile={currentFile} />
            
            {/* Settings Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Analysis Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* AI Enhancement Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">AI Enhancement</Label>
                    <div className="text-[0.8rem] text-muted-foreground">
                      Use AI for improved detection and calibration
                    </div>
                  </div>
                  <Switch
                    checked={aiEnabled}
                    onCheckedChange={setAiEnabled}
                  />
                </div>

                {/* Calibration Settings */}
                <div className="space-y-2">
                  <Label>Plate Diameter (mm)</Label>
                  <Input
                    type="number"
                    value={calibrationSettings.plateDiameter}
                    onChange={(e) => setCalibrationSettings(prev => ({
                      ...prev,
                      plateDiameter: Number(e.target.value)
                    }))}
                    placeholder="450"
                  />
                </div>

                {/* Tracking Settings */}
                <div className="space-y-2">
                  <Label>Tracking Points: {trackingSettings.trackingPoints}</Label>
                  <Slider
                    value={[trackingSettings.trackingPoints]}
                    onValueChange={(value) => setTrackingSettings(prev => ({
                      ...prev,
                      trackingPoints: value[0],
                      maxCorners: value[0]
                    }))}
                    max={50}
                    min={10}
                    step={5}
                  />
                </div>

                {currentVideo && !processingStatus.isProcessing && (
                  <Button onClick={analyzeVideo} className="w-full" data-testid="button-analyze">
                    <Play className="h-4 w-4 mr-2" />
                    Analyze Video
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Video Player & Analysis */}
          <div className="space-y-6">
            <VideoPlayerWithOverlay
              videoSrc={currentVideo}
              analysisResult={analysisResult}
              isAnalyzing={processingStatus.isProcessing}
              onExport={exportVideo}
            />
            
            <AnalysisPanel
              analysisResult={analysisResult}
              processingStatus={processingStatus}
              onSave={saveAnalysis}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Protected route wrapper
export function Component() {
  return (
    <ProtectedRoute path="/tools/vbt-analysis" component={VBTAnalysisPage} />
  );
}