import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Folder, Trash2, Play, Plus } from 'lucide-react';
import { SavedVideo } from '@/types/vbt';
import { vbtStorage } from '@/utils/storage';
import { useToast } from '@/hooks/use-toast';

interface SavedListProps {
  onVideoSelect: (video: SavedVideo) => void;
}

export function SavedList({ onVideoSelect }: SavedListProps) {
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSavedVideos();
  }, []);

  const loadSavedVideos = async () => {
    try {
      await vbtStorage.init();
      const videos = await vbtStorage.getVideos();
      setSavedVideos(videos);
    } catch (error) {
      console.error('Error loading saved videos:', error);
      toast({
        title: "Storage Error",
        description: "Failed to load saved videos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteVideo = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      await vbtStorage.deleteVideo(id);
      setSavedVideos(prev => prev.filter(video => video.id !== id));
      toast({
        title: "Video deleted",
        description: "Analysis has been removed"
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Delete Error",
        description: "Failed to delete video",
        variant: "destructive"
      });
    }
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (duration: number): string => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Folder className="text-chart-4 mr-2 h-5 w-5" />
            Saved Analyses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-secondary rounded-md p-3 border border-border animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Folder className="text-chart-4 mr-2 h-5 w-5" />
          Saved Analyses
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {savedVideos.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-2">No saved analyses yet</p>
              <p className="text-sm text-muted-foreground">
                Analyzed videos will appear here
              </p>
            </div>
          ) : (
            savedVideos.map((video) => (
              <div
                key={video.id}
                className="bg-secondary rounded-md p-3 border border-border hover:bg-secondary/80 transition-colors cursor-pointer"
                onClick={() => onVideoSelect(video)}
                data-testid={`video-item-${video.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground truncate">
                    {video.name}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onVideoSelect(video);
                      }}
                      className="h-6 w-6 p-0 text-primary hover:text-primary/80"
                      data-testid={`button-play-${video.id}`}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => deleteVideo(video.id, e)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
                      data-testid={`button-delete-${video.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Mean: {video.analysisResult.meanVelocity.toFixed(2)} m/s</span>
                    <span>Peak: {video.analysisResult.peakVelocity.toFixed(2)} m/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{formatDate(video.timestamp)}</span>
                    <span>{formatDuration(video.duration)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {savedVideos.length > 0 && (
          <Button
            variant="ghost"
            className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors border border-dashed border-border"
            onClick={loadSavedVideos}
            data-testid="button-refresh"
          >
            <Plus className="mr-2 h-4 w-4" />
            Refresh List
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
