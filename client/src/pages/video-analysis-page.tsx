import { useState, useRef } from "react";
import { BackNavigation } from "@/components/back-navigation";
import { PageContainer } from "@/components/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Camera, Upload, FileVideo, Play, Sparkles, Zap, Crown } from "lucide-react";

export default function VideoAnalysisPage() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoName, setVideoName] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [analysisResponse, setAnalysisResponse] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Pre-made analysis prompts
  const analysisPrompts = [
    {
      id: "sprint-form",
      title: "Sprint Form Analysis",
      description: "Analyze running technique, posture, and overall form",
      icon: <Sparkles className="h-4 w-4" />
    },
    {
      id: "block-start",
      title: "Block Start Analysis", 
      description: "Evaluate starting technique from blocks",
      icon: <Zap className="h-4 w-4" />
    },
    {
      id: "stride-length",
      title: "Stride Length",
      description: "Measure and analyze stride length patterns",
      icon: <Play className="h-4 w-4" />
    },
    {
      id: "stride-frequency",
      title: "Stride Frequency",
      description: "Calculate steps per second and cadence",
      icon: <Play className="h-4 w-4" />
    },
    {
      id: "ground-contact",
      title: "Ground Contact Time",
      description: "Analyze foot contact duration with the ground",
      icon: <Sparkles className="h-4 w-4" />
    },
    {
      id: "flight-time",
      title: "Flight Time",
      description: "Measure airborne time between steps",
      icon: <Zap className="h-4 w-4" />
    }
  ];

  // Get user data for subscription tier
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video-analysis"] });
      toast({
        title: "Success",
        description: "Video uploaded successfully for analysis",
      });
      resetForm();
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
        description: error.message || "Failed to analyze video",
        variant: "destructive",
      });
    }
  });

  const getPromptLimits = () => {
    if (!user) return { remaining: 0, total: 0, canBuy: false };
    
    const subscriptionTier = (user as any).subscriptionTier || "free";
    const prompts = (user as any).sprinthiaPrompts || 0;
    
    switch (subscriptionTier) {
      case "star":
        return { remaining: "unlimited", total: "unlimited", canBuy: false };
      case "pro":
        return { remaining: Math.max(0, 5 - prompts), total: 5, canBuy: true };
      default: // free
        return { remaining: Math.max(0, 1 - prompts), total: 1, canBuy: true };
    }
  };

  const handleAnalyze = async (promptId: string) => {
    if (!selectedVideoId) {
      toast({
        title: "No Video Selected",
        description: "Please select a video to analyze",
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
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Video</TabsTrigger>
            <TabsTrigger value="analyze">Sprinthia Analysis</TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <Card className="border-2">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* File Upload Area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
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
                          className="w-full max-h-64 object-contain"
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
                            <Upload className="h-4 w-4 mr-2" />
                            Upload for Analysis
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sprinthia Analysis Tab */}
          <TabsContent value="analyze">
            <div className="space-y-6">
              {/* Subscription Status */}
              {user && (
                <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-6 w-6 text-purple-600" />
                        <div>
                          <h3 className="font-semibold text-purple-900">Sprinthia AI Analysis</h3>
                          <p className="text-sm text-purple-700">
                            {(user as any).subscriptionTier === "star" ? (
                              <span className="flex items-center gap-1">
                                <Crown className="h-4 w-4" />
                                Unlimited prompts available
                              </span>
                            ) : (
                              `${getPromptLimits().remaining}/${getPromptLimits().total} prompts remaining this ${(user as any).subscriptionTier === "pro" ? "week" : "month"}`
                            )}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={(user as any).subscriptionTier === "star" ? "default" : (user as any).subscriptionTier === "pro" ? "secondary" : "outline"}
                        className="capitalize"
                      >
                        {(user as any).subscriptionTier || "free"} tier
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Video Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Video for Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {videos && (videos as any[]).length > 0 ? (
                    <div className="grid gap-4">
                      {(videos as any[]).map((video: any) => (
                        <div 
                          key={video.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedVideoId === video.id ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => setSelectedVideoId(video.id)}
                        >
                          <div className="flex items-center gap-3">
                            <FileVideo className="h-8 w-8 text-gray-500" />
                            <div className="flex-1">
                              <h4 className="font-medium">{video.name}</h4>
                              <p className="text-sm text-gray-500">{video.description || "No description"}</p>
                            </div>
                            {selectedVideoId === video.id && (
                              <div className="text-purple-600">
                                <Sparkles className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileVideo className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No videos uploaded yet</p>
                      <p className="text-sm">Upload a video first to analyze it with Sprinthia</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Analysis Prompts */}
              {selectedVideoId && (
                <Card>
                  <CardHeader>
                    <CardTitle>Choose Analysis Type</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Select what you'd like Sprinthia to analyze in your video
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysisPrompts.map((prompt) => (
                        <Button
                          key={prompt.id}
                          variant="outline"
                          className="h-auto p-4 text-left justify-start"
                          onClick={() => handleAnalyze(prompt.id)}
                          disabled={isAnalyzing || (typeof getPromptLimits().remaining === "number" && getPromptLimits().remaining === 0)}
                        >
                          <div className="flex items-start gap-3 w-full">
                            {prompt.icon}
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{prompt.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1">{prompt.description}</p>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>

                    {typeof getPromptLimits().remaining === "number" && getPromptLimits().remaining === 0 && (
                      <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center gap-2 text-orange-800">
                          <Zap className="h-4 w-4" />
                          <span className="font-medium">Prompt limit reached</span>
                        </div>
                        <p className="text-sm text-orange-700 mt-1">
                          {(user as any)?.subscriptionTier === "pro" 
                            ? "You've used all 5 prompts this week. Upgrade to Star for unlimited prompts or buy more with Spikes."
                            : "You've used your 1 free prompt this month. Upgrade your plan or buy more with Spikes."}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline">
                            Upgrade Plan
                          </Button>
                          <Button size="sm" variant="outline">
                            Buy with Spikes (25 💥)
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Analysis Results */}
              {(isAnalyzing || analysisResponse) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Sprinthia's Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isAnalyzing ? (
                      <div className="flex items-center gap-3 p-8 text-center">
                        <div className="animate-spin">
                          <Sparkles className="h-6 w-6 text-purple-600" />
                        </div>
                        <p className="text-lg">Sprinthia is analyzing your video...</p>
                      </div>
                    ) : (
                      <div className="prose max-w-none">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <pre className="whitespace-pre-wrap text-sm">{analysisResponse}</pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Features Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Analysis Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold">AI Video Analysis</h4>
                <p className="text-muted-foreground">
                  Sprinthia analyzes technique, form, and performance metrics
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Frame-by-Frame Analysis</h4>
                <p className="text-muted-foreground">
                  Step through videos frame by frame for detailed technique analysis
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Performance Insights</h4>
                <p className="text-muted-foreground">
                  Get detailed insights on timing, stride patterns, and biomechanics
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}