// Emergency backup analysis without AI integration for debugging
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
import { useToast } from '@/hooks/use-toast';
import { aiCalibrationDetector } from '@/utils/ai-calibration';

export default function HomeBackup() {
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    progress: 0,
    currentStep: 'Ready'
  });

  const [calibrationSettings, setCalibrationSettings] = useState<CalibrationSettings>({
    method: 'plate',
    plateDiameter: 450,
    pixelsPerMm: 1
  });

  const [trackingSettings, setTrackingSettings] = useState<TrackingSettings>({
    algorithm: 'klt',
    trackingPoints: 25,
    maxCorners: 25,
    qualityLevel: 0.01,
    minDistance: 8
  });

  const { toast } = useToast();

  const handleVideoRecorded = useCallback((videoBlob: Blob) => {
    const videoUrl = URL.createObjectURL(videoBlob);
    setCurrentVideo(videoUrl);
    setCurrentFile(new File([videoBlob], `recording-${Date.now()}.webm`, { type: 'video/webm' }));
    setAnalysisResult(null);
  }, []);

  const handleVideoUploaded = useCallback((videoFile: File) => {
    const videoUrl = URL.createObjectURL(videoFile);
    setCurrentVideo(videoUrl);
    setCurrentFile(videoFile);
    setAnalysisResult(null);
  }, []);

  const handleVideoSelect = useCallback((savedVideo: SavedVideo) => {
    const videoUrl = URL.createObjectURL(savedVideo.videoBlob);
    setCurrentVideo(videoUrl);
    setCurrentFile(new File([savedVideo.videoBlob], savedVideo.name));
    setAnalysisResult(savedVideo.analysisResult);
  }, []);

  // SIMPLE ANALYSIS WITHOUT AI INTEGRATION
  const analyzeVideo = useCallback(async () => {
    if (!currentVideo || !currentFile) {
      toast({
        title: "No video",
        description: "Please record or upload a video first",
        variant: "destructive"
      });
      return;
    }

    setAnalysisResult(null);
    setProcessingStatus({
      isProcessing: true,
      progress: 0,
      currentStep: 'Initializing analysis...'
    });

    try {
      const video = document.createElement('video');
      video.src = currentVideo;
      
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
        video.load();
      });

      // Step 1: AI-powered calibration with fallback
      setProcessingStatus(prev => ({ ...prev, progress: 10, currentStep: 'AI calibration: analyzing scene scale...' }));
      
      let calibration;
      let calibrationMethod = 'traditional';
      
      try {
        const aiCalibrationAvailable = await aiCalibrationDetector.isAvailable();
        
        if (aiCalibrationAvailable) {
          // Capture frame for AI calibration analysis
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
              calibration = {
                pixelsPerMm: aiCalibration.pixelsPerMm,
                confidence: aiCalibration.confidence || 0
              };
              calibrationMethod = 'ai';
              console.log(`🤖 AI calibration successful: ${aiCalibration.pixelsPerMm} pixels/mm (confidence: ${(aiCalibration.confidence || 0).toFixed(2)})`);
            } else {
              console.log('⚠️ AI calibration result insufficient, using traditional method');
              calibration = CalibrationManager.calibrateFromPlate(video, calibrationSettings.plateDiameter);
            }
          } else {
            calibration = CalibrationManager.calibrateFromPlate(video, calibrationSettings.plateDiameter);
          }
        } else {
          console.log('ℹ️ AI calibration not available, using traditional method');
          calibration = CalibrationManager.calibrateFromPlate(video, calibrationSettings.plateDiameter);
        }
      } catch (error) {
        console.log('⚠️ AI calibration failed, falling back to traditional method:', error);
        calibration = CalibrationManager.calibrateFromPlate(video, calibrationSettings.plateDiameter);
      }
      
      // Step 2: Initialize basic tracking
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

      // Basic initialization without AI region
      await tracker.initializeTracking(video, trackingSettings);

      // Step 3: Process frames
      await KLTTracker.extractFrames(video, (imageData, timestamp, frameNumber, totalFrames) => {
        const frameProgress = Math.min(90, 25 + (frameNumber / totalFrames) * 65);
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
        15  // Match the actual processing frame rate
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

      const barbellPath = KLTTracker.calculateBarbellPath(trackingPoints);
      const cleanVelocityData = VelocityCalculator.analyzeVelocityData(barbellPath, calibration.pixelsPerMm, 15);

      const result: AnalysisResult = {
        meanVelocity: cleanVelocityData.mean,
        peakVelocity: cleanVelocityData.peak,
        repDuration: video.duration,
        concentricDuration: (concentricPhase.end - concentricPhase.start) / 15,
        pathDeviation: pathDeviation,
        rangeOfMotion: rangeOfMotion,
        trackingPoints: barbellPath,
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

      toast({
        title: "Analysis complete",
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
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  }, [currentVideo, currentFile, calibrationSettings, trackingSettings, toast]);

  // Return same UI as main component
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="container mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Dumbbell className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              BecomeAnAthlete<span className="text-blue-600">_VBTdemo</span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Advanced Velocity-Based Training Analysis (Debug Mode - AI Disabled)
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Video Upload Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Camera className="h-5 w-5" />
                  <span>Upload Video</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Uploader onVideoUploaded={handleVideoUploaded} />
              </CardContent>
            </Card>

            {/* Video Player */}
            {currentVideo && (
              <VideoPlayerWithOverlay 
                videoSrc={currentVideo} 
                analysisResult={analysisResult}
                isAnalyzing={processingStatus.isProcessing}
                onExport={async () => {
                  if (currentVideo && analysisResult) {
                    // Export functionality can be added later
                    toast({
                      title: "Export",
                      description: "Export functionality coming soon"
                    });
                  }
                }}
              />
            )}
          </div>

          {/* Analysis Section */}
          <div className="space-y-6">
            {/* Analysis Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Play className="h-5 w-5" />
                  <span>Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={analyzeVideo} 
                  disabled={!currentVideo || processingStatus.isProcessing}
                  className="w-full"
                  size="lg"
                  data-testid="button-analyze"
                >
                  <Gauge className="h-4 w-4 mr-2" />
                  {processingStatus.isProcessing ? 'Processing...' : 'Analyze Movement'}
                </Button>
                
                {processingStatus.isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{processingStatus.currentStep}</span>
                      <span>{Math.round(processingStatus.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${processingStatus.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {processingStatus.error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{processingStatus.error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {analysisResult && (
              <AnalysisPanel 
                analysisResult={analysisResult} 
                processingStatus={processingStatus}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}