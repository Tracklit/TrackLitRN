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

// Save To Library Card Component
function SaveToLibraryCard({ videoId, videoName, analysisData }: { 
  videoId: number; 
  videoName: string; 
  analysisData: any; 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [libraryName, setLibraryName] = useState("");
  const [libraryDescription, setLibraryDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
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
      setIsSaved(true);
      setIsExpanded(false);
      toast({
        title: "Saved to Library",
        description: "Video analysis has been saved to your exercise library.",
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
    
    if (isAlreadySaved) {
      toast({
        title: "Already Saved",
        description: "This video is already saved to your library.",
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

  if (!isProOrStar) {
    return (
      <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-blue-400" />
            Save To Library
          </CardTitle>
        </CardHeader>
        <CardContent className="text-gray-300 space-y-3">
          <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <Lock className="h-4 w-4 text-yellow-400" />
            <span className="text-sm">Pro/Star Feature</span>
          </div>
          <p className="text-sm text-gray-400">
            Upgrade to Pro or Star to save analyzed videos to your exercise library.
          </p>
          <Button 
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            onClick={() => setLocation('/spikes')}
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade Plan
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isSaved || isAlreadySaved) {
    return (
      <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Check className="h-5 w-5 text-green-400" />
            {isAlreadySaved ? 'Already in Library' : 'Saved to Library'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-gray-300 space-y-3">
          <div className="flex items-center gap-2 p-3 bg-green-800/20 rounded-lg border border-green-700/30">
            <Check className="h-4 w-4 text-green-400" />
            <span className="text-sm">
              {isAlreadySaved ? `Saved as "${existingLibraryEntry.name}"` : 'Successfully saved'}
            </span>
          </div>
          <Button 
            variant="outline"
            className="w-full"
            onClick={() => setLocation('/tools/exercise-library')}
          >
            View in Library
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-blue-400" />
          Save To Library
        </CardTitle>
      </CardHeader>
      <CardContent className="text-gray-300 space-y-3">
        {!isExpanded ? (
          <>
            <div className="flex items-center gap-2 p-3 bg-blue-800/20 rounded-lg border border-blue-700/30">
              <Bookmark className="h-4 w-4 text-blue-400" />
              <span className="text-sm">Ready to save</span>
            </div>
            <p className="text-sm text-gray-400">
              Save this analyzed video to your exercise library for future reference.
            </p>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setIsExpanded(true);
                setLibraryName(videoName || "");
              }}
            >
              Save to Library
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="library-name" className="text-sm font-medium text-gray-300">
                Library Name
              </Label>
              <Input
                id="library-name"
                value={libraryName}
                onChange={(e) => setLibraryName(e.target.value)}
                placeholder="Enter a name for this exercise"
                className="mt-1 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            
            <div>
              <Label htmlFor="library-description" className="text-sm font-medium text-gray-300">
                Description (Optional)
              </Label>
              <Textarea
                id="library-description"
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
                onClick={() => setIsExpanded(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveToLibraryMutation.isPending || isAlreadySaved || !libraryName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {saveToLibraryMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </div>
                ) : isAlreadySaved ? (
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Already Saved
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
        )}
      </CardContent>
    </Card>
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
              {/* Save To Library */}
              <SaveToLibraryCard 
                videoId={videoId!} 
                videoName={currentVideo.name}
                analysisData={currentVideo.analysisData}
              />

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