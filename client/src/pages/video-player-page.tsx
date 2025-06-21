import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BiomechanicalVideoPlayer } from "@/components/biomechanical-video-player";
import { ArrowLeft, Activity, Brain, Zap, Target } from "lucide-react";

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
            onClick={() => setLocation('/video-analysis')}
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
            onClick={() => setLocation('/video-analysis')}
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
                onClick={() => setLocation('/video-analysis')}
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
              {/* Video Info */}
              <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-400" />
                    Video Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-gray-300 space-y-2">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant="outline" className="border-gray-600">
                      {currentVideo.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Analysis:</span>
                    <span className="text-sm">
                      {currentVideo.analysisData ? 'Available' : 'Pending'}
                    </span>
                  </div>
                  {currentVideo.fileSize && (
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="text-sm">
                        {(currentVideo.fileSize / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

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