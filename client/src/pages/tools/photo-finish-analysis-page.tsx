import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import PhotoFinishFullscreen from './photo-finish-fullscreen';

interface VideoData {
  file: File;
  url: string;
  name: string;
}

export default function PhotoFinishAnalysisPage() {
  const [location, navigate] = useLocation();
  const [videoData, setVideoData] = useState<VideoData | null>(null);

  useEffect(() => {
    // Get video data from sessionStorage (set during upload)
    const storedVideoData = sessionStorage.getItem('photoFinishVideoData');
    const storedVideoUrl = sessionStorage.getItem('photoFinishVideoUrl');
    
    if (storedVideoData && storedVideoUrl) {
      try {
        const parsedData = JSON.parse(storedVideoData);
        
        // Create a dummy file object for compatibility
        const file = new File([], parsedData.name, { type: parsedData.type });
        
        setVideoData({
          file,
          url: storedVideoUrl,
          name: parsedData.name
        });
      } catch (error) {
        console.error('Error parsing stored video data:', error);
        navigate('/tools/photo-finish');
      }
    } else {
      // No video data, redirect back to upload page
      navigate('/tools/photo-finish');
    }
  }, [navigate]);

  const handleClose = () => {
    // Clean up video URL and navigate back
    if (videoData?.url) {
      URL.revokeObjectURL(videoData.url);
    }
    sessionStorage.removeItem('photoFinishVideoData');
    sessionStorage.removeItem('photoFinishVideoUrl');
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
      videoFile={videoData.file}
      onClose={handleClose}
    />
  );
}

// Export also as Component for dynamic routes
export function Component() {
  return <PhotoFinishAnalysisPage />;
}