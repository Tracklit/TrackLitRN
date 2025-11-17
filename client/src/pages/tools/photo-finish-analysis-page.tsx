import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import PhotoFinishFullscreen from './photo-finish-fullscreen';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  saveVideo,
  getAllVideoMetadata,
  getTierLimit,
  generateThumbnail,
  type SavedVideoMetadata,
} from '@/lib/video-storage';

interface VideoData {
  file: File;
  url: string;
  name: string;
  blob?: Blob;
}

export default function PhotoFinishAnalysisPage() {
  const [location, navigate] = useLocation();
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isAlreadySaved, setIsAlreadySaved] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Get video data from sessionStorage (set during upload)
    const storedVideoData = sessionStorage.getItem('photoFinishVideoData');
    const storedVideoUrl = sessionStorage.getItem('photoFinishVideoUrl');
    const storedVideoBlob = sessionStorage.getItem('photoFinishVideoBlob');
    const isNewVideo = sessionStorage.getItem('photoFinishIsNewVideo') === 'true';
    
    if (storedVideoData && storedVideoUrl) {
      try {
        const parsedData = JSON.parse(storedVideoData);
        
        // Try to get the blob if available
        let blob: Blob | undefined;
        if (storedVideoBlob) {
          try {
            const blobData = JSON.parse(storedVideoBlob);
            blob = new Blob([new Uint8Array(blobData.data)], { type: blobData.type });
          } catch (e) {
            console.log('Could not parse stored blob');
          }
        }
        
        // Create a file object
        const file = new File([], parsedData.name, { type: parsedData.type });
        
        setVideoData({
          file,
          url: storedVideoUrl,
          name: parsedData.name,
          blob
        });
        
        // Set whether this video is already saved
        setIsAlreadySaved(!isNewVideo);
      } catch (error) {
        console.error('Error parsing stored video data:', error);
        navigate('/tools/photo-finish');
      }
    } else {
      // No video data, redirect back to upload page
      navigate('/tools/photo-finish');
    }
  }, [navigate]);

  const handleSave = async () => {
    if (!videoData) return;

    try {
      // Get tier limit
      const tierLimit = getTierLimit(user?.subscriptionTier || undefined);
      
      // Check current saved videos count
      const savedVideos = await getAllVideoMetadata();
      
      if (savedVideos.length >= tierLimit) {
        const tierName = user?.subscriptionTier === 'star' ? 'Star' : 
                        user?.subscriptionTier === 'pro' ? 'Pro' : 'Free';
        toast({
          title: 'Storage Limit Reached',
          description: `You've reached your ${tierName} tier limit of ${tierLimit} videos. Delete old videos or upgrade your subscription.`,
          variant: 'destructive',
        });
        return;
      }

      // Convert the video URL back to a blob
      let videoBlob: Blob;
      
      if (videoData.blob) {
        videoBlob = videoData.blob;
      } else {
        // Fetch the blob from the object URL
        const response = await fetch(videoData.url);
        videoBlob = await response.blob();
      }

      // Generate thumbnail
      const thumbnail = await generateThumbnail(videoBlob);

      // Create video element to get duration
      const video = document.createElement('video');
      video.src = videoData.url;
      await new Promise((resolve) => {
        video.addEventListener('loadedmetadata', resolve, { once: true });
      });
      const duration = video.duration;

      // Create metadata
      const metadata: SavedVideoMetadata = {
        id: Date.now().toString(),
        name: videoData.name,
        duration,
        createdAt: new Date().toISOString(),
        thumbnail,
        size: videoBlob.size,
      };

      // Save to IndexedDB
      await saveVideo(videoBlob, metadata);

      setIsSaved(true);
      toast({
        title: 'Video Saved',
        description: `${videoData.name} has been saved to your library.`,
      });
    } catch (error) {
      console.error('Error saving video:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save video. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    // Clean up video URL and navigate back
    if (videoData?.url) {
      URL.revokeObjectURL(videoData.url);
    }
    sessionStorage.removeItem('photoFinishVideoData');
    sessionStorage.removeItem('photoFinishVideoUrl');
    sessionStorage.removeItem('photoFinishVideoBlob');
    sessionStorage.removeItem('photoFinishIsNewVideo');
    navigate('/tools/photo-finish');
  };

  if (!videoData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading video analysis...</div>
      </div>
    );
  }

  return (
    <PhotoFinishFullscreen
      videoUrl={videoData.url}
      videoName={videoData.name}
      onClose={handleClose}
      onSave={isAlreadySaved ? undefined : handleSave}
      isSaved={isSaved}
    />
  );
}

// Export also as Component for dynamic routes
export function Component() {
  return <PhotoFinishAnalysisPage />;
}
