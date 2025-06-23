import { useState, useRef, useEffect } from "react";
import { Play, FileVideo } from "lucide-react";

interface VideoThumbnailProps {
  videoUrl: string;
  videoId: number;
  className?: string;
  onClick?: () => void;
}

// Cache for storing generated thumbnails
const thumbnailCache = new Map<string, string>();

export function VideoThumbnail({ videoUrl, videoId, className = "", onClick }: VideoThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cacheKey = `thumbnail-${videoId}`;

  useEffect(() => {
    // Check if thumbnail is already cached
    if (thumbnailCache.has(cacheKey)) {
      setThumbnailUrl(thumbnailCache.get(cacheKey)!);
      setIsLoading(false);
      return;
    }

    generateThumbnail();
  }, [videoUrl, videoId, cacheKey]);

  const generateThumbnail = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas) return;

    try {
      setIsLoading(true);
      setHasError(false);

      // Wait for video metadata to load
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = resolve;
        video.onerror = reject;
        video.load();
      });

      // Seek to 1 second or 10% of duration, whichever is smaller
      const seekTime = Math.min(1, video.duration * 0.1);
      video.currentTime = seekTime;

      // Wait for the seek to complete
      await new Promise((resolve) => {
        video.onseeked = resolve;
      });

      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Set canvas dimensions to match video aspect ratio
      const aspectRatio = video.videoWidth / video.videoHeight;
      const maxWidth = 200;
      const maxHeight = 150;

      let canvasWidth = maxWidth;
      let canvasHeight = maxWidth / aspectRatio;

      if (canvasHeight > maxHeight) {
        canvasHeight = maxHeight;
        canvasWidth = maxHeight * aspectRatio;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight);

      // Convert canvas to blob URL
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/jpeg', 0.8);
      });

      const blobUrl = URL.createObjectURL(blob);
      
      // Cache the thumbnail
      thumbnailCache.set(cacheKey, blobUrl);
      setThumbnailUrl(blobUrl);
      setIsLoading(false);

    } catch (error) {
      console.error('Error generating thumbnail:', error);
      setHasError(true);
      setIsLoading(false);
    }
  };

  return (
    <div className={`group cursor-pointer ${className}`} onClick={onClick}>
      <div className="aspect-video bg-gray-800 rounded overflow-hidden mb-2 relative">
        {/* Hidden video element for thumbnail generation */}
        <video
          ref={videoRef}
          src={videoUrl}
          muted
          preload="metadata"
          className="hidden"
        />
        
        {/* Hidden canvas for thumbnail generation */}
        <canvas ref={canvasRef} className="hidden" />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center text-gray-400">
              <FileVideo className="h-8 w-8 mx-auto mb-1" />
              <p className="text-xs">No preview</p>
            </div>
          </div>
        )}

        {thumbnailUrl && !isLoading && !hasError && (
          <>
            <img
              src={thumbnailUrl}
              alt="Video thumbnail"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
            <div className="absolute bottom-1 right-1">
              <Play className="h-4 w-4 text-white/80" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}