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
import { Camera, Upload, FileVideo, Play, Sparkles, Zap, Crown, ArrowLeft, ArrowRight, Check, Copy, ThumbsUp, ThumbsDown, CheckCircle, Plus, Minus } from "lucide-react";
import { useLocation } from "wouter";
import videoAnalysisCardImage from "@assets/video-analysis-card.jpeg";
import { BiomechanicalVideoPlayer } from "@/components/biomechanical-video-player";
import { VideoThumbnail } from "@/components/video-thumbnail";

export default function VideoAnalysisPage() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<"upload" | "video" | "results">("upload");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUploadDropdown, setShowUploadDropdown] = useState(false);
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
      const hasProcessingVideos = Array.isArray(data) && data.some((video: any) => video.status === 'processing');
      return hasProcessingVideos ? 2000 : false;
    }
  });

  // Get saved video analyses from exercise library
  const { data: savedVideos } = useQuery({
    queryKey: ["/api/exercise-library/saved-videos"],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/exercise-library?type=video_analysis');
      return response.json();
    }
  });

  // Get current selected video data with polling for processing status
  const { data: currentVideo, refetch: refetchCurrentVideo } = useQuery({
    queryKey: ["/api/video-analysis", selectedVideoId],
    enabled: !!selectedVideoId,
    refetchInterval: (data: any) => {
      // Poll every 2 seconds if video is still processing
      return data && data.status === 'processing' ? 2000 : false;
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
      setIsUploading(false);
      setUploadProgress(0);
      // Stay on the video analysis page and show the uploaded video
      setSelectedVideoId(data.id);
      setUploadedVideoUrl(data.fileUrl);
      setCurrentStep("video");
      toast({
        title: "Upload Complete",
        description: "Your video has been uploaded and is ready for analysis.",
      });
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








        {/* Upload Step */}
        {currentStep === "upload" && (
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUploadDropdown(!showUploadDropdown)}
                className="flex items-center gap-2 border-white/20 text-white hover:bg-white/10"
              >
                {showUploadDropdown ? (
                  <Minus className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Upload Video
              </Button>
                
                {selectedFile && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileVideo className="h-4 w-4 text-green-600" />
                    <span>{selectedFile.name}</span>
                  </div>
                )}
              </div>
              
              {showUploadDropdown && (
                <div className="mt-4">
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
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
                    
                    {uploadMutation.isPending || isUploading ? (
                      <div className="space-y-3">
                        <div className="relative flex items-center justify-center w-12 h-12 mx-auto">
                          <div className="absolute inset-0 rounded-full border-3 border-blue-200"></div>
                          <div 
                            className="absolute inset-0 rounded-full border-3 border-blue-600 border-t-transparent animate-spin"
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-semibold text-blue-700">{uploadProgress.toFixed(0)}%</span>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-700">
                            {processingStage || "Uploading..."}
                          </h3>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                        <div>
                          <h3 className="font-semibold text-gray-700">Drop video here or click to select</h3>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-400"
                        >
                          Select File
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Saved Videos */}
        {currentStep === "upload" && (
          <Card className="bg-black border-gray-700 mb-6">
            <CardContent className="p-4">
              <div className="text-center">
                <h3 className="font-semibold text-white mb-3">Saved Videos</h3>
                {Array.isArray(videos) && videos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {videos.slice(0, 4).map((video: any) => (
                      <div key={video.id}>
                        <VideoThumbnail
                          videoUrl={video.fileUrl}
                          videoId={video.id}
                          onClick={() => setLocation(`/video-player/${video.id}`)}
                        />
                        <p className="text-xs text-white truncate text-center">
                          {video.createdAt ? new Date(video.createdAt).toLocaleDateString() : `Video #${video.id}`}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 py-8">
                    <FileVideo className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No saved videos yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Saved Videos Section */}
        {currentStep === "upload" && savedVideos && savedVideos.exercises && savedVideos.exercises.length > 0 && (
          <Card className="border-green-200 bg-green-50 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                Saved Video Analyses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedVideos.exercises.map((video: any) => (
                  <div key={video.id} className="bg-white rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow border border-green-200"
                       onClick={() => setLocation(`/video-player/${video.videoAnalysisId}`)}>
                    <div className="aspect-video bg-gray-100 rounded mb-3 flex items-center justify-center">
                      <Play className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="font-medium text-sm mb-1 truncate text-gray-900">{video.name}</h3>
                    {video.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">{video.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Saved</Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(video.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Video Upload Success - Show Analysis Interface */}
        {currentStep === "video" && uploadedVideoUrl && selectedVideoId && (
          <div className="space-y-6">
            {/* Video Player */}
            <div className="w-full">
              <BiomechanicalVideoPlayer
                videoUrl={uploadedVideoUrl}
                videoName={videoName || `Video ${selectedVideoId}`}
                videoId={selectedVideoId}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                biomechanicalData={null}
                analysisStatus="complete"
                onOverlayChange={() => {}}
              />
            </div>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <div className="flex flex-col items-center gap-4">
                  <Check className="h-12 w-12 text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">Upload Complete!</h3>
                    <p className="text-green-700 mb-4">Your video has been uploaded and is ready for analysis</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Analysis Progress */}
            {isAnalyzing && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative flex items-center justify-center w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                      <div 
                        className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"
                        style={{
                          background: `conic-gradient(from 0deg, #2563eb ${analysisProgress * 3.6}deg, transparent ${analysisProgress * 3.6}deg)`
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-700">{analysisProgress.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold text-blue-900">Analyzing Video</h3>
                      <p className="text-sm text-blue-700">{processingStage}</p>
                      <span className="text-xs text-blue-600">This may take a few minutes</span>
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

        {/* Video Player Step - When video is uploaded */}
        {currentStep === "video" && uploadedVideoUrl && selectedVideoId && (
          <div className="space-y-6">
            {/* Video Player */}
            <div className="w-full">
              <BiomechanicalVideoPlayer
                videoUrl={uploadedVideoUrl}
                videoName={videoName || `Video ${selectedVideoId}`}
                videoId={selectedVideoId}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                biomechanicalData={null}
                analysisStatus="complete"
                onOverlayChange={() => {}}
              />
            </div>

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
                      placeholder="Describe what you'd like to analyze about this video..."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="min-h-[100px]"
                    />
                  )}
                </div>

                <div className="flex justify-between">
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