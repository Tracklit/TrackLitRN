import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Image, FileVideo, Loader2, Play, X, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface Media {
  id: number;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  createdAt: string;
}

interface PracticeMediaGalleryProps {
  sessionId: number;
  completionId?: number;
}

export function PracticeMediaGallery({ 
  sessionId, 
  completionId 
}: PracticeMediaGalleryProps) {
  const { user } = useAuth();
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

  // Query to fetch media for this session/completion
  const { data: mediaItems = [], isLoading } = useQuery<Media[]>({
    queryKey: ['/api/practice/media', completionId || sessionId],
    queryFn: async () => {
      // If we have a completionId, fetch media for that specific completion
      // Otherwise, fetch all media for the session
      const endpoint = completionId 
        ? `/api/practice/completions/${completionId}/media`
        : `/api/practice/sessions/${sessionId}/media`;
        
      // Use the fetch API with credentials to include cookies
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch media');
      return response.json();
    },
    enabled: !!sessionId && !!user,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Image className="w-5 h-5 mr-2" />
            Session Media
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center my-8">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mediaItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Image className="w-5 h-5 mr-2" />
            Session Media
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <div className="flex justify-center">
              <Image className="w-12 h-12 text-muted-foreground/40 mb-3" />
            </div>
            <p>No media uploaded for this session yet</p>
            <p className="text-sm mt-1">
              Upload photos or videos to track your progress
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Image className="w-5 h-5 mr-2" />
            Session Media ({mediaItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {mediaItems.map((media) => (
              <div 
                key={media.id} 
                className="relative rounded-md overflow-hidden aspect-square cursor-pointer hover:opacity-90 transition-opacity border border-border"
                onClick={() => setSelectedMedia(media)}
              >
                {media.type === 'image' ? (
                  <img 
                    src={media.url} 
                    alt="Practice media" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="relative w-full h-full bg-slate-900">
                    <img 
                      src={media.thumbnail || media.url} 
                      alt="Video thumbnail" 
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/60 rounded-full p-2">
                        <Play className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(media.createdAt, false)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Media preview dialog */}
      <Dialog open={!!selectedMedia} onOpenChange={(open) => !open && setSelectedMedia(null)}>
        <DialogContent className="sm:max-w-3xl p-1 sm:p-3">
          <div className="absolute right-2 top-2 z-10">
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="bg-black/50 hover:bg-black/70 text-white">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
          
          {selectedMedia?.type === 'image' ? (
            <img 
              src={selectedMedia.url} 
              alt="Practice media" 
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          ) : (
            <video 
              src={selectedMedia?.url} 
              controls 
              autoPlay 
              className="w-full h-auto max-h-[80vh]" 
            >
              Your browser does not support the video tag.
            </video>
          )}
          
          <DialogTitle className="text-sm text-center mt-2">
            {formatDate(selectedMedia?.createdAt || '')}
          </DialogTitle>
        </DialogContent>
      </Dialog>
    </>
  );
}