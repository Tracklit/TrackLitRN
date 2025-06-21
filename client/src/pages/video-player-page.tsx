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
  console.log('Video Player Debug:', {
    videoId: id,
    currentVideo: {
      id: currentVideo.id,
      name: currentVideo.name,
      url: currentVideo.url,
      hasAnalysisData: !!currentVideo.analysisData,
      analysisDataLength: currentVideo.analysisData?.length || 0
    }
  });

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
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-white">{currentVideo.name}</h1>
                <p className="text-sm text-gray-300">
                  {currentVideo.biomechanicalData ? 'MediaPipe Analysis Complete' : 'Raw Video'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {currentVideo.analysisData && (
                <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600/30">
                  <Activity className="h-3 w-3 mr-1" />
                  Pose Data Available
                </Badge>
              )}
              <Badge variant="outline" className="text-purple-300 border-purple-600/30">
                ID: {currentVideo.id}
              </Badge>
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
              <div className="relative bg-black/40 border border-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
                <BiomechanicalVideoPlayer
                  videoUrl={currentVideo.url}
                  videoName={currentVideo.name}
                  videoId={currentVideo.id}
                  onAnalyze={handleAnalyze}
                  isAnalyzing={false}
                  biomechanicalData={currentVideo.analysisData}
                  analysisStatus={currentVideo.status}
                />
              </div>
            </div>

            {/* Side Panel */}
            <div className="xl:w-1/4 space-y-4">
            {/* Video Info */}
            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-400" />
                  Video Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-300">
                  <div className="flex justify-between mb-2">
                    <span>Name:</span>
                    <span className="text-white">{currentVideo.name}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Upload Date:</span>
                    <span className="text-white">
                      {new Date(currentVideo.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Status:</span>
                    <Badge 
                      variant={currentVideo.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {currentVideo.status || 'Ready'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* MediaPipe Status */}
            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-400" />
                  MediaPipe Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentVideo.analysisData ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-400">
                      <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                      <span className="text-sm">Pose tracking data available</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Enable pose overlays in the video player to see real-time biomechanical analysis
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <div className="h-2 w-2 bg-yellow-400 rounded-full"></div>
                      <span className="text-sm">No pose data available</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      MediaPipe analysis was not performed on this video
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Controls */}
            <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-400" />
                  Analysis Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => handleAnalyze('sprint-form')}
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