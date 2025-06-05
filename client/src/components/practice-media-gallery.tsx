import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Image, FileVideo, Loader2, Play, X, Calendar, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

interface Media {
  id: number;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  thumbUrl?: string;    // 200x200 square thumbnail
  mediumUrl?: string;   // 400x300 for cards
  largeUrl?: string;    // 800x400 for large displays
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
  const { toast } = useToast();
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [mediaToDelete, setMediaToDelete] = useState<Media | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Show a more helpful message if no completionId is provided
  if (!completionId) {
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
            <p>Media gallery requires a practice completion ID</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Query to fetch media for this completion
  const { data: mediaItems = [], isLoading } = useQuery<Media[]>({
    queryKey: ['/api/practice/media', completionId],
    queryFn: async () => {
      if (!completionId) {
        return [];
      }
      
      const endpoint = `/api/practice/media?completionId=${completionId}`;
        
      // Use the fetch API with credentials to include cookies
      const response = await fetch(endpoint, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch media');
      return response.json();
    },
    enabled: !!completionId && !!user,
  });
  
  // Mutation to delete media
  const deleteMutation = useMutation({
    mutationFn: async (mediaId: number) => {
      const response = await fetch(`/api/practice/media/${mediaId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete media');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Media deleted',
        description: 'The media item has been deleted successfully',
      });
      
      // Close dialogs
      setDeleteDialogOpen(false);
      setMediaToDelete(null);
      
      // Refresh media list
      queryClient.invalidateQueries({
        queryKey: ['/api/practice/media', completionId],
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete media',
        description: error.message,
        variant: 'destructive',
      });
      
      setDeleteDialogOpen(false);
    },
  });
  
  // Handle delete confirmation
  const handleDeleteConfirm = (media: Media) => {
    setMediaToDelete(media);
    setDeleteDialogOpen(true);
  };
  
  // Handle actual deletion
  const handleDelete = () => {
    if (mediaToDelete) {
      deleteMutation.mutate(mediaToDelete.id);
    }
  };

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
                className="relative rounded-md overflow-hidden aspect-square cursor-pointer hover:opacity-90 transition-opacity border border-border group"
              >
                {/* Clickable overlay for preview */}
                <div 
                  className="absolute inset-0 z-10"
                  onClick={() => setSelectedMedia(media)}
                />
                
                {/* Delete button */}
                <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConfirm(media);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {media.type === 'image' ? (
                  <img 
                    src={media.thumbUrl || media.url} 
                    alt="Practice media" 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="relative w-full h-full bg-slate-900">
                    <img 
                      src={media.thumbnail || media.url} 
                      alt="Video thumbnail" 
                      className="w-full h-full object-cover opacity-80"
                      loading="lazy"
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
              src={selectedMedia.largeUrl || selectedMedia.url} 
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
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete this media file and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}