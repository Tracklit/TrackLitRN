import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BiomechanicalVideoPlayer } from "@/components/biomechanical-video-player";
import { ArrowLeft, Activity, Brain, Zap, Target, Bookmark, Crown, Lock, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Compact Save To Library Icon Component
function SaveToLibraryIcon({ videoId, videoName, analysisData }: { 
  videoId: number; 
  videoName: string; 
  analysisData: any; 
}) {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [libraryName, setLibraryName] = useState(videoName || "");
  const [libraryDescription, setLibraryDescription] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch user data to check subscription tier
  const { data: user } = useQuery({
    queryKey: ['/api/user']
  });

  // Check if video is already saved in library
  const { data: existingLibraryEntry } = useQuery({
    queryKey: ['/api/exercise-library/check-video', videoId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/exercise-library/check-video/${videoId}`);
      return response.json();
    },
    enabled: !!videoId && !!user
  });

  const isProOrStar = user && typeof user === 'object' && user !== null && 'subscriptionTier' in user && ((user as any).subscriptionTier === 'pro' || (user as any).subscriptionTier === 'star');
  const isAlreadySaved = !!existingLibraryEntry;

  const saveToLibraryMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; videoId: number }) => {
      const response = await apiRequest('POST', '/api/exercise-library', {
        name: data.name,
        description: data.description,
        videoId: data.videoId,
        type: 'video_analysis',
        analysisData: analysisData
      });
      return response.json();
    },
    onSuccess: () => {
      setShowSaveDialog(false);
      toast({
        title: "Saved to Library",
        description: "Video analysis has been saved to your library.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/exercise-library'] });
      queryClient.invalidateQueries({ queryKey: ['/api/exercise-library/check-video', videoId] });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save to library",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!libraryName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your library entry.",
        variant: "destructive",
      });
      return;
    }
    
    saveToLibraryMutation.mutate({
      name: libraryName,
      description: libraryDescription,
      videoId: videoId
    });
  };

  const handleIconClick = () => {
    if (!isProOrStar) {
      setLocation('/pricing');
      return;
    }
    
    if (isAlreadySaved) {
      setLocation('/tools/video-analysis');
      return;
    }
    
    setShowSaveDialog(true);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleIconClick}
            className={`p-2 rounded-full ${
              isAlreadySaved 
                ? 'text-green-400 hover:text-green-300' 
                : isProOrStar 
                  ? 'text-blue-400 hover:text-blue-300' 
                  : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            {isAlreadySaved ? (
              <Check className="h-5 w-5" />
            ) : !isProOrStar ? (
              <Lock className="h-5 w-5" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isAlreadySaved 
            ? 'Already saved - View in library' 
            : !isProOrStar 
              ? 'Save to Library (Pro/Star only)' 
              : 'Save to Library'
          }
        </TooltipContent>
      </Tooltip>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-blue-400" />
              Save to Library
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="save-name" className="text-sm font-medium text-gray-300">
                Name *
              </Label>
              <Input
                id="save-name"
                value={libraryName}
                onChange={(e) => setLibraryName(e.target.value)}
                placeholder="Enter a name for this analysis..."
                className="mt-1 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            
            <div>
              <Label htmlFor="save-description" className="text-sm font-medium text-gray-300">
                Description (Optional)
              </Label>
              <Textarea
                id="save-description"
                value={libraryDescription}
                onChange={(e) => setLibraryDescription(e.target.value)}
                placeholder="Add notes about this analysis..."
                className="mt-1 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveToLibraryMutation.isPending || !libraryName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {saveToLibraryMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Bookmark className="h-4 w-4" />
                    Save
                  </div>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function VideoPlayerPage() {
  const [, params] = useRoute("/video-player/:id");
  const [, setLocation] = useLocation();
  const videoId = params?.id ? parseInt(params.id) : null;
  const [overlays, setOverlays] = useState<any[]>([]);

  // Fetch video data
  const { data: videos, isLoading } = useQuery({
    queryKey: ['/api/video-analysis'],
    enabled: !!videoId
  });

  const currentVideo = Array.isArray(videos) ? videos.find((v: any) => v.id === videoId) : null;

  const handleAnalyze = async (promptId: string) => {
    // Handle analysis if needed
    console.log('Analyzing with prompt:', promptId);
  };

  const handleOverlayChange = (newOverlays: any[]) => {
    setOverlays(newOverlays);
  };

  const toggleOverlay = (overlayId: string) => {
    const newOverlays = overlays.map(overlay => 
      overlay.id === overlayId 
        ? { ...overlay, enabled: !overlay.enabled }
        : overlay
    );
    setOverlays(newOverlays);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  if (!videoId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Video ID</h1>
          <Button 
            onClick={() => setLocation('/tools/video-analysis')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Back to Video Analysis
          </Button>
        </div>
      </div>
    );
  }

  if (!currentVideo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Video Not Found</h1>
          <Button 
            onClick={() => setLocation('/tools/video-analysis')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Back to Video Analysis
          </Button>
        </div>
      </div>
    );
  }

  // Debug video data
  if (currentVideo) {
    console.log('Video Player Debug:', {
      videoId: videoId,
      currentVideo: {
        id: currentVideo.id,
        name: currentVideo.name,
        fileUrl: currentVideo.fileUrl,
        hasAnalysisData: !!currentVideo.analysisData,
        analysisDataLength: currentVideo.analysisData?.length || 0
      }
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/tools/video-analysis')}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Videos
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white">Video Analysis</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-0 min-h-screen pt-6 pb-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col xl:flex-row gap-6 h-full">
            {/* Video Player - Main Column */}
            <div className="flex-1 xl:w-3/4">
              <BiomechanicalVideoPlayer
                videoUrl={currentVideo.fileUrl}
                videoName={currentVideo.name}
                videoId={currentVideo.id}
                onAnalyze={handleAnalyze}
                isAnalyzing={false}
                biomechanicalData={currentVideo.analysisData}
                analysisStatus={currentVideo.status}
                onOverlayChange={handleOverlayChange}
              />
            </div>

            {/* Side Panel */}
            <div className="xl:w-1/4 space-y-4">
              {/* Save To Library Icon */}
              <div className="flex justify-end">
                <SaveToLibraryIcon 
                  videoId={videoId!} 
                  videoName={currentVideo.name}
                  analysisData={currentVideo.analysisData}
                />
              </div>

              {/* Analysis Actions */}
              <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Brain className="h-5 w-5 text-green-400" />
                    AI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleAnalyze('comprehensive')}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Run AI Analysis
                  </Button>
                  <div className="text-xs text-gray-400">
                    Generate detailed performance insights using AI analysis
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}