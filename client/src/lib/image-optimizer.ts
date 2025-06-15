import React from 'react';

// Image optimization utilities
export class ImageOptimizer {
  private static preloadedImages = new Set<string>();
  private static imageCache = new Map<string, HTMLImageElement>();

  /**
   * Preload critical images that appear above the fold
   */
  static preloadCriticalImages(imageSources: string[]): Promise<void[]> {
    const preloadPromises = imageSources.map(src => this.preloadImage(src));
    return Promise.all(preloadPromises);
  }

  /**
   * Preload a single image
   */
  static preloadImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.preloadedImages.has(src)) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        this.preloadedImages.add(src);
        this.imageCache.set(src, img);
        resolve();
      };
      img.onerror = () => {
        console.warn(`Failed to preload image: ${src}`);
        reject(new Error(`Failed to preload image: ${src}`));
      };
      img.src = src;
    });
  }

  /**
   * Generate a low-quality image placeholder (LQIP)
   * In a real implementation, this would be generated at build time
   */
  static generateLQIP(src: string, quality: number = 10): string {
    // For now, return the original image with CSS blur effect
    // In production, you'd generate actual low-res versions
    return src;
  }

  /**
   * Check if an image is already cached
   */
  static isImageCached(src: string): boolean {
    return this.preloadedImages.has(src);
  }

  /**
   * Get optimal image format based on browser support
   */
  static getOptimalFormat(src: string): string {
    // Check for WebP support
    if (this.supportsWebP()) {
      return src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }
    
    // Check for AVIF support
    if (this.supportsAVIF()) {
      return src.replace(/\.(jpg|jpeg|png)$/i, '.avif');
    }
    
    return src;
  }

  /**
   * Check WebP support
   */
  private static supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Check AVIF support
   */
  private static supportsAVIF(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    try {
      return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    } catch {
      return false;
    }
  }
}

// Hook for using image optimization in React components
export const useImageOptimization = (imageSources: string[]) => {
  const [imagesLoaded, setImagesLoaded] = React.useState(false);
  const [loadingProgress, setLoadingProgress] = React.useState(0);

  React.useEffect(() => {
    let loadedCount = 0;
    const totalImages = imageSources.length;

    const preloadImages = async () => {
      const promises = imageSources.map(async (src) => {
        try {
          await ImageOptimizer.preloadImage(src);
          loadedCount++;
          setLoadingProgress((loadedCount / totalImages) * 100);
        } catch (error) {
          console.warn('Failed to preload image:', src);
          loadedCount++;
          setLoadingProgress((loadedCount / totalImages) * 100);
        }
      });

      await Promise.all(promises);
      setImagesLoaded(true);
    };

    preloadImages();
  }, [imageSources]);

  return { imagesLoaded, loadingProgress };
};

export default ImageOptimizer;