import { useState, useRef } from "react";
import { BackNavigation } from "@/components/back-navigation";
import { PageContainer } from "@/components/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Upload, FileVideo, Play } from "lucide-react";

export default function VideoAnalysisPage() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoName, setVideoName] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
    const validTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select a valid video file (MP4, MOV, AVI)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please select a video file smaller than 100MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
    
    // Auto-set video name from filename
    if (!videoName) {
      const name = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      setVideoName(name);
    }
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
            Upload race videos and add precise timing overlays for professional analysis
          </p>
        </div>

        {/* Upload Section */}
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
                <h4 className="font-semibold">Timing Overlays</h4>
                <p className="text-muted-foreground">
                  Add precise timing markers and split times to your race videos
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Frame-by-Frame Analysis</h4>
                <p className="text-muted-foreground">
                  Step through videos frame by frame for detailed technique analysis
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Performance Metrics</h4>
                <p className="text-muted-foreground">
                  Extract key performance data and generate detailed reports
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}