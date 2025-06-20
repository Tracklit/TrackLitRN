import { useState, useRef } from "react";

import { PageContainer } from "@/components/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Camera, Upload, FileVideo, Play, Sparkles, Zap, Crown, ArrowLeft, ArrowRight, Check, Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import videoAnalysisCardImage from "@assets/video-analysis-card.jpeg";
import { BiomechanicalVideoPlayer } from "@/components/biomechanical-video-player";

export default function VideoAnalysisPage() {
  const [currentStep, setCurrentStep] = useState<"upload" | "video" | "results">("upload");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoName, setVideoName] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [analysisResponse, setAnalysisResponse] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [biomechanicalData, setBiomechanicalData] = useState<any>(null);
  const [performanceScore, setPerformanceScore] = useState<number | null>(null);
  const [keyInsights, setKeyInsights] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [analysisType, setAnalysisType] = useState<"standard" | "enhanced">("enhanced");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Pre-made analysis prompts
  const analysisPrompts = [
    {
      id: "sprint-form",
      title: "Sprint Form Analysis",
      description: "Analyze running technique, posture, and form mechanics",
      icon: Sparkles,
    },
    {
      id: "block-start",
      title: "Block Start Analysis", 
      description: "Evaluate starting position, reaction time, and acceleration",
      icon: Zap,
    },
    {
      id: "stride-length",
      title: "Stride Length",
      description: "Measure and analyze stride length throughout the race",
      icon: Play,
    },
    {
      id: "stride-frequency",
      title: "Stride Frequency",
      description: "Calculate steps per second and cadence patterns",
      icon: Camera,
    },
    {
      id: "ground-contact",
      title: "Ground Contact Time",
      description: "Analyze foot contact duration and efficiency",
      icon: FileVideo,
    },
    {
      id: "flight-time",
      title: "Flight Time",
      description: "Measure airborne time between steps",
      icon: Upload,
    },
  ];

  // Get current user
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  // Get user videos with polling for processing status
  const { data: videos, refetch: refetchVideos } = useQuery({
    queryKey: ["/api/video-analysis"],
    refetchInterval: (data) => {
      // Poll every 2 seconds if there are processing videos
      const hasProcessingVideos = data?.some((video: any) => video.status === 'processing');
      return hasProcessingVideos ? 2000 : false;
    }
  });

  // Get current selected video data with polling for processing status
  const { data: currentVideo, refetch: refetchCurrentVideo } = useQuery({
    queryKey: ["/api/video-analysis", selectedVideoId],
    enabled: !!selectedVideoId,
    refetchInterval: (data) => {
      // Poll every 2 seconds if video is still processing
      return data?.status === 'processing' ? 2000 : false;
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setIsUploading(true);
      setUploadProgress(0);
      setProcessingStage("Uploading video...");
      
      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 200);
      
      const response = await fetch("/api/video-analysis/upload", {
        method: "POST",
        body: formData,
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-analysis"] });
      setSelectedVideoId(data.id);
      setUploadedVideoUrl(data.fileUrl);
      setIsUploading(false);
      setUploadProgress(0);
      setProcessingStage("Processing biomechanical data...");
      setAnalysisProgress(25);
      setCurrentStep("video");
    },
    onError: (error) => {
      setIsUploading(false);
      setUploadProgress(0);
      setProcessingStage("");
      toast({
        title: "Upload Failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    },
  });

  const analysisMutation = useMutation({
    mutationFn: async ({ videoId, promptId }: { videoId: number; promptId: string }) => {
      setIsAnalyzing(true);
      setAnalysisProgress(0);
      setProcessingStage("Starting analysis...");
      
      // Simulate progress stages
      const progressStages = [
        { progress: 20, stage: "Processing video frames..." },
        { progress: 40, stage: "Extracting pose data..." },
        { progress: 60, stage: "Analyzing biomechanics..." },
        { progress: 80, stage: "Generating insights..." },
        { progress: 95, stage: "Finalizing results..." }
      ];
      
      let currentStageIndex = 0;
      const progressInterval = setInterval(() => {
        if (currentStageIndex < progressStages.length) {
          const stage = progressStages[currentStageIndex];
          setAnalysisProgress(stage.progress);
          setProcessingStage(stage.stage);
          currentStageIndex++;
        }
      }, 1000);
      
      const endpoint = analysisType === "enhanced" 
        ? `/api/video-analysis/${videoId}/analyze-enhanced`
        : `/api/video-analysis/${videoId}/analyze`;
      
      const response = await apiRequest("POST", endpoint, { promptId });
      
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      setProcessingStage("Analysis complete!");
      
      if (!response.ok) {
        throw new Error("Analysis failed");
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      setAnalysisResponse(data.analysis);
      
      // Handle enhanced analysis data
      if (data.biomechanical_metrics) {
        setBiomechanicalData(data.biomechanical_metrics);
      }
      if (data.performance_score !== undefined) {
        setPerformanceScore(data.performance_score);
      }
      if (data.key_insights) {
        setKeyInsights(data.key_insights);
      }
      if (data.recommendations) {
        setRecommendations(data.recommendations);
      }
      
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      setProcessingStage("");
      setCurrentStep("results");
    },
    onError: (error: any) => {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      setProcessingStage("");
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze video. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getPromptLimits = () => {
    if (!user) return { total: 0, remaining: 0 };
    
    const tier = (user as any).subscriptionTier || "free";
    const limits = {
      free: { total: 1, period: "month" },
      pro: { total: 5, period: "week" },
      star: { total: "unlimited", period: "unlimited" }
    };
    
    const userLimit = limits[tier as keyof typeof limits] || limits.free;
    
    if (userLimit.total === "unlimited") {
      return { total: "unlimited", remaining: "unlimited" };
    }
    
    // For now, assume full usage available - in production, track actual usage
    return { total: userLimit.total, remaining: userLimit.total };
  };

  const handleAnalyze = (promptId: string) => {
    if (!selectedVideoId) {
      toast({
        title: "No Video Selected",
        description: "Please upload a video first",
        variant: "destructive",
      });
      return;
    }

    const limits = getPromptLimits();
    if (typeof limits.remaining === "number" && limits.remaining === 0) {
      toast({
        title: "Prompt Limit Reached",
        description: `You've used all ${limits.total} prompts. Upgrade or buy more with Spikes.`,
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResponse("");
    analysisMutation.mutate({ videoId: selectedVideoId, promptId });
  };

  const resetForm = () => {
    setSelectedFile(null);
    setVideoName("");
    setVideoDescription("");
    setVideoPreview(null);
    setCurrentStep("upload");
    setSelectedVideoId(null);
    setAnalysisResponse("");
    setSelectedPrompts([]);
    setCustomPrompt("");
    setUseCustomPrompt(false);
    setFeedback(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(cleanAnalysisText(analysisResponse));
      toast({
        title: "Copied to clipboard",
        description: "Analysis text has been copied",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleFeedback = (type: "up" | "down") => {
    setFeedback(type);
    toast({
      title: "Feedback recorded",
      description: `Thank you for your ${type === "up" ? "positive" : "negative"} feedback`,
    });
  };

  const handlePromptToggle = (promptId: string) => {
    setSelectedPrompts(prev => 
      prev.includes(promptId) 
        ? prev.filter(id => id !== promptId)
        : [...prev, promptId]
    );
  };

  const cleanAnalysisText = (text: string) => {
    return text
      .replace(/\*\*/g, '')  // Remove ** markdown bold
      .replace(/\*/g, '')    // Remove * markdown
      .replace(/#{1,6}\s/g, '') // Remove # headers
      .replace(/^- /gm, '• ')   // Replace dashes with bullet points
      .replace(/\n- /g, '\n• ') // Replace dashes after newlines with bullet points
      .replace(/\n{3,}/g, '\n\n\n') // Larger breaks between sections
      .replace(/\n([A-Z][^:\n]*:)/g, '\n\n$1') // Add extra space before headers
      .replace(/([.!?])\n(?=[A-Z])/g, '$1\n\n') // Add space after sentences before new paragraphs
      .replace(/([.!?])\n(?=[•])/g, '$1\n') // Smaller break before bullet points
      .trim();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ["video/mp4", "video/mov", "video/avi", "video/quicktime"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select a valid video file (MP4, MOV, AVI)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (100MB max)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Video file must be under 100MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setVideoName(file.name.replace(/\.[^/.]+$/, "")); // Remove extension for name

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);

    // Auto-upload after file selection
    setTimeout(() => {
      if (file.name.replace(/\.[^/.]+$/, "").trim()) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("name", file.name.replace(/\.[^/.]+$/, ""));
        formData.append("description", "");
        uploadMutation.mutate(formData);
      }
    }, 500); // Small delay to show the preview
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a video file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!videoName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a name for your video",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("name", videoName);
    formData.append("description", videoDescription);

    uploadMutation.mutate(formData);
  };

  const handleRunSelectedAnalyses = () => {
    if (useCustomPrompt && customPrompt.trim()) {
      // Handle custom prompt analysis
      handleAnalyze("custom");
    } else if (selectedPrompts.length > 0) {
      // Run first selected prompt
      handleAnalyze(selectedPrompts[0]);
    } else {
      toast({
        title: "No Analysis Selected",
        description: "Please select at least one analysis type or enter a custom prompt",
        variant: "destructive",
      });
    }
  };

  return (
    <PageContainer>

      
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Camera className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Video Analysis</h1>
          </div>
          <p className="text-blue-100">
            Upload race videos and get AI-powered analysis from Sprinthia
          </p>
        </div>

        {/* Step Progress Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-sm ${
              currentStep === "upload" ? "bg-blue-600 text-white" : "bg-green-500 text-white"
            }`}>
              {currentStep !== "upload" ? <Check className="w-3 h-3" /> : "1"}
            </div>
            <div className="w-12 h-0.5 bg-gray-300 rounded">
              <div className={`h-full bg-blue-600 rounded transition-all duration-300 ${
                currentStep === "video" || currentStep === "results" ? "w-full" : "w-0"
              }`} />
            </div>
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-sm ${
              currentStep === "video" ? "bg-blue-600 text-white" : 
              currentStep === "results" ? "bg-green-500 text-white" : "bg-gray-400 text-gray-600"
            }`}>
              {currentStep === "results" ? <Check className="w-3 h-3" /> : "2"}
            </div>
            <div className="w-12 h-0.5 bg-gray-300 rounded">
              <div className={`h-full bg-blue-600 rounded transition-all duration-300 ${
                currentStep === "results" ? "w-full" : "w-0"
              }`} />
            </div>
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-sm ${
              currentStep === "results" ? "bg-blue-600 text-white" : "bg-gray-400 text-gray-600"
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Upload Step */}
        {currentStep === "upload" && (
          <Card className="border-2">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* File Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : selectedFile
                      ? "border-green-500 bg-green-50"
                      : "border-blue-300 bg-gray-50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/mov,video/avi,video/quicktime"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  
                  {selectedFile ? (
                    <div className="space-y-4">
                      {uploadMutation.isPending || isUploading ? (
                        <>
                          <div className="h-16 w-16 mx-auto rounded-full border-4 border-gray-200 border-t-blue-600 border-r-purple-600 animate-spin"></div>
                          <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-blue-700">
                              {processingStage || "Uploading video..."}
                            </h3>
                            {isUploading && (
                              <div className="w-full max-w-md mx-auto">
                                <Progress value={uploadProgress} className="h-2" />
                                <p className="text-sm text-gray-600 mt-1">{uploadProgress.toFixed(0)}% complete</p>
                              </div>
                            )}
                            <p className="text-sm text-gray-600">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                            <p className="text-xs text-blue-600 mt-2">
                              Will automatically proceed to analysis when complete
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <FileVideo className="h-16 w-16 text-green-600 mx-auto" />
                          <div>
                            <h3 className="text-lg font-semibold text-green-700">
                              Ready for Analysis
                            </h3>
                            <p className="text-sm text-gray-600">
                              {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-400"
                          >
                            Change Video
                          </Button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-16 w-16 text-gray-400 mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700">
                          Select Race Video
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Click to select or drag and drop your video
                        </p>
                        <p className="text-sm text-gray-400">
                          Supports MP4, MOV, AVI formats • Auto-uploads when selected
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-400"
                      >
                        Select Video File
                      </Button>
                    </div>
                  )}
                </div>

                {/* Video Preview */}
                {videoPreview && !uploadMutation.isPending && (
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <video
                        src={videoPreview}
                        controls
                        className="w-full max-h-48 object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Video Player Step */}
        {currentStep === "video" && uploadedVideoUrl && (
          <div className="space-y-6">
            {/* Processing Status */}
            {currentVideo?.status === 'processing' && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full border-2 border-yellow-600 border-t-transparent animate-spin"></div>
                    <div>
                      <h3 className="font-semibold text-yellow-900">Processing Video</h3>
                      <p className="text-sm text-yellow-700">Extracting biomechanical data with MediaPipe...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Debug Info */}
            <div className="bg-gray-900 p-4 rounded text-xs text-white font-mono">
              <div><strong>Video Debug Info:</strong></div>
              <div>Video ID: {selectedVideoId}</div>
              <div>Current Video Status: {currentVideo?.status}</div>
              <div>Analysis Data Type: {typeof currentVideo?.analysisData}</div>
              <div>Analysis Data Length: {currentVideo?.analysisData?.length || 'null'}</div>
              <div>Analysis Data Preview: {currentVideo?.analysisData ? currentVideo.analysisData.substring(0, 100) + '...' : 'No data'}</div>
            </div>
            
            <BiomechanicalVideoPlayer
              videoUrl={uploadedVideoUrl}
              videoName={videoName}
              videoId={selectedVideoId!}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
              biomechanicalData={currentVideo?.analysisData}
              analysisStatus={currentVideo?.status}
            />
            
            {/* Analysis Progress Bar */}
            {isAnalyzing && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                      <div>
                        <h3 className="font-semibold text-blue-900">Analyzing Video</h3>
                        <p className="text-sm text-blue-700">{processingStage}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Progress value={analysisProgress} className="h-3" />
                      <div className="flex justify-between text-sm text-blue-600">
                        <span>{analysisProgress.toFixed(0)}% complete</span>
                        <span>This may take a few minutes</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="flex justify-between">
              <Button 
                variant="outline"
                onClick={() => setCurrentStep("upload")}
                className="flex items-center gap-2"
                disabled={isAnalyzing}
              >
                <ArrowLeft className="h-4 w-4" />
                Upload New Video
              </Button>
              
              {analysisResponse && (
                <Button 
                  onClick={() => setCurrentStep("results")}
                  className="flex items-center gap-2"
                >
                  View Analysis Results
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Legacy Analysis Step */}
        {currentStep === "video" && !uploadedVideoUrl && (
          <div className="space-y-6">
            {/* Analysis Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Choose Analysis Type
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pre-made Prompts Grid */}
                <div>
                  <Label className="text-base font-medium mb-3 block">Pre-made Analysis</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {analysisPrompts.map((prompt) => (
                      <div
                        key={prompt.id}
                        className="p-3 border border-slate-700 bg-slate-700 rounded-lg cursor-pointer"
                        onClick={() => !useCustomPrompt && handlePromptToggle(prompt.id)}
                      >
                        <div className="flex items-start gap-2">
                          <Checkbox
                            checked={selectedPrompts.includes(prompt.id)}
                            disabled={useCustomPrompt}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm leading-tight">{prompt.title}</h4>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{prompt.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Prompt Option */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={useCustomPrompt}
                      onCheckedChange={(checked) => {
                        setUseCustomPrompt(!!checked);
                        if (checked) {
                          setSelectedPrompts([]);
                        }
                      }}
                    />
                    <Label className="text-base font-medium">Custom Analysis</Label>
                  </div>
                  
                  {useCustomPrompt && (
                    <Textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Describe what you'd like Sprinthia to analyze in your video..."
                      rows={3}
                      className="w-full"
                    />
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep("upload")}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Upload
                  </Button>

                  <Button
                    onClick={handleRunSelectedAnalyses}
                    disabled={isAnalyzing || (!useCustomPrompt && selectedPrompts.length === 0) || (useCustomPrompt && !customPrompt.trim())}
                    className="flex items-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Sparkles className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Analyze
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {/* Results Step */}
        {currentStep === "results" && (
          <div className="space-y-6">
            {/* Performance Score and Metrics */}
            {performanceScore !== null && biomechanicalData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">Performance Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{performanceScore}/100</div>
                    <div className={`text-xs ${
                      performanceScore >= 85 ? 'text-green-400' : 
                      performanceScore >= 70 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {performanceScore >= 85 ? 'Excellent' : 
                       performanceScore >= 70 ? 'Good' : 'Needs Work'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">Stride Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{biomechanicalData.stride_rate.toFixed(0)}</div>
                    <div className="text-xs text-slate-400">steps/min</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">Asymmetry</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{biomechanicalData.asymmetry.toFixed(1)}%</div>
                    <div className={`text-xs ${
                      biomechanicalData.asymmetry <= 3 ? 'text-green-400' : 
                      biomechanicalData.asymmetry <= 5 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {biomechanicalData.asymmetry <= 3 ? 'Excellent' : 
                       biomechanicalData.asymmetry <= 5 ? 'Good' : 'High'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300">Knee ROM</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{biomechanicalData.knee_angle_range.toFixed(0)}°</div>
                    <div className="text-xs text-slate-400">range of motion</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Key Insights */}
            {keyInsights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-400" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {keyInsights.map((insight, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-white">{insight}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRight className="h-5 w-5 text-yellow-400" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span className="text-white">{rec}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analysis Results */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Detailed Analysis
                  {analysisType === "enhanced" && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Enhanced with MediaPipe
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-white leading-relaxed font-medium text-sm text-justify">
                    {cleanAnalysisText(analysisResponse)}
                  </div>
                </div>
                
                {/* Feedback and Copy Section */}
                <div className="mt-6">
                  <div className="border-t border-slate-600 pt-4 mb-4">
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyText}
                        className="flex items-center gap-2 text-slate-300 hover:text-white"
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback("up")}
                          className={`flex items-center gap-2 ${
                            feedback === "up" 
                              ? "text-green-400 bg-green-400/10" 
                              : "text-slate-300 hover:text-green-400"
                          }`}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFeedback("down")}
                          className={`flex items-center gap-2 ${
                            feedback === "down" 
                              ? "text-red-400 bg-red-400/10" 
                              : "text-slate-300 hover:text-red-400"
                          }`}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between mt-6">
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentStep("video")}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Video
                  </Button>
                  
                  <Button onClick={resetForm} variant="outline">
                    Analyze Another Video
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageContainer>
  );
}