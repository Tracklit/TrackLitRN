import React, { useEffect } from 'react';
import { ImageOptimizer } from '@/lib/image-optimizer';

interface PreloadImagesProps {
  images: string[];
  quality?: number;
  priority?: boolean;
}

export const PreloadImages: React.FC<PreloadImagesProps> = ({
  images,
  quality = 20, // 80% compression
  priority = true
}) => {
  useEffect(() => {
    const preloadCriticalImages = async () => {
      try {
        // Preload images directly without format conversion for static imports
        const preloadPromises = images.map(src => ImageOptimizer.preloadImage(src));
        await Promise.all(preloadPromises);
      } catch (error) {
        console.warn('Failed to preload critical images:', error);
      }
    };

    if (images.length > 0) {
      preloadCriticalImages();
    }
  }, [images, quality, priority]);

  return null; // This component doesn't render anything
};

// Component for immediate critical image preloading
export const CriticalImagePreloader: React.FC<{ images: string[] }> = ({ images }) => {
  useEffect(() => {
    // Preload images immediately when component mounts
    images.forEach(async (src) => {
      try {
        const optimizedSrc = await ImageOptimizer.getOptimalImageSrc(src, {
          quality: 20,
          format: 'auto'
        });
        await ImageOptimizer.preloadImage(optimizedSrc);
      } catch (error) {
        console.warn(`Failed to preload image: ${src}`, error);
      }
    });
  }, [images]);

  return null;
};