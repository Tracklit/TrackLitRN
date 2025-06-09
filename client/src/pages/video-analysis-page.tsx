import { useState, useRef } from "react";
import { BackNavigation } from "@/components/back-navigation";
import { PageContainer } from "@/components/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Camera, Upload, FileVideo, Play, Sparkles, Zap, Crown, ArrowLeft, ArrowRight, Check } from "lucide-react";

export default function VideoAnalysisPage() {
  const [currentStep, setCurrentStep] = useState<"upload" | "analyze">("upload");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoName, setVideoName] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [analysisResponse, setAnalysisResponse] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
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

  // Get user videos
  const { data: videos } = useQuery({
    queryKey: ["/api/video-analysis"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/video-analysis/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-analysis"] });
      setSelectedVideoId(data.id);
      setCurrentStep("analyze");
      toast({
        title: "Success",
        description: "Video uploaded successfully for analysis",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    },
  });

  const analysisMutation = useMutation({
    mutationFn: async ({ videoId, promptId }: { videoId: number; promptId: string }) => {
      const response = await apiRequest("POST", `/api/video-analysis/${videoId}/analyze`, { promptId });
      if (!response.ok) {
        throw new Error("Analysis failed");
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      setAnalysisResponse(data.analysis);
      setIsAnalyzing(false);
      toast({
        title: "Analysis Complete",
        description: "Sprinthia has analyzed your video",
      });
    },
    onError: (error: any) => {
      setIsAnalyzing(false);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze video. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getPromptLimits = () => {
    if (!user) return { total: 0, remaining: 0 };
    
    const tier = user.subscriptionTier || "free";
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double
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
      <BackNavigation />
      
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
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep === "upload" ? "bg-primary text-white" : "bg-green-500 text-white"
            }`}>
              {currentStep === "analyze" ? <Check className="w-4 h-4" /> : "1"}
            </div>
            <div className="w-16 h-1 bg-gray-300 rounded">
              <div className={`h-full bg-primary rounded transition-all duration-300 ${
                currentStep === "analyze" ? "w-full" : "w-0"
              }`} />
            </div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep === "analyze" ? "bg-primary text-white" : "bg-gray-300 text-gray-600"
            }`}>
              2
            </div>
          </div>
        </div>

        {/* Upload Step */}
        {currentStep === "upload" && (
          <Card className="border-2">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
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
                      <FileVideo className="h-16 w-16 text-green-600 mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold text-green-700">
                          {selectedFile.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
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
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-16 w-16 text-gray-400 mx-auto" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700">
                          Upload Race Video
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Click to select a video file or drag and drop
                        </p>
                        <p className="text-sm text-gray-400">
                          Supports MP4, MOV, AVI formats
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
                {videoPreview && (
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

                {/* Video Details */}
                {selectedFile && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="video-name">Video Name *</Label>
                      <Input
                        id="video-name"
                        value={videoName}
                        onChange={(e) => setVideoName(e.target.value)}
                        placeholder="Enter video name"
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="video-description">Description</Label>
                      <Textarea
                        id="video-description"
                        value={videoDescription}
                        onChange={(e) => setVideoDescription(e.target.value)}
                        placeholder="Optional: Add notes about this race video"
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                {selectedFile && (
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={uploadMutation.isPending || !videoName.trim()}
                      className="px-8"
                    >
                      {uploadMutation.isPending ? (
                        <>
                          <Upload className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Continue to Analysis
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        )}

        {/* Analysis Step */}
        {currentStep === "analyze" && (
          <div className="space-y-6">
            {/* Subscription Status */}
            {user && (
              <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {user.subscriptionTier === "star" && <Crown className="h-5 w-5 text-yellow-500" />}
                      <div>
                        <h3 className="font-semibold">
                          {user.subscriptionTier === "star" ? "Star Member" : 
                           user.subscriptionTier === "pro" ? "Pro Member" : "Free Account"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {(() => {
                            const limits = getPromptLimits();
                            if (limits.total === "unlimited") {
                              return "Unlimited AI analysis prompts";
                            }
                            return `${limits.remaining}/${limits.total} prompts remaining this ${
                              user.subscriptionTier === "pro" ? "week" : "month"
                            }`;
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedPrompts.includes(prompt.id)
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
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
                        Start Analysis
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {analysisResponse && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Sprinthia Analysis Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {cleanAnalysisText(analysisResponse)}
                    </div>
                  </div>
                  
                  <div className="flex justify-end mt-6">
                    <Button onClick={resetForm} variant="outline">
                      Analyze Another Video
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}