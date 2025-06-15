import React from 'react';

// Image quality and compression settings
export interface ImageOptions {
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'auto';
  width?: number;
  height?: number;
  blur?: boolean;
  lazy?: boolean;
}

// Image optimization utilities
export class ImageOptimizer {
  private static preloadedImages = new Set<string>();
  private static imageCache = new Map<string, HTMLImageElement>();
  private static formatSupport = {
    webp: null as boolean | null,
    avif: null as boolean | null
  };

  /**
   * Generate compressed image URL with specified quality
   */
  static getCompressedImageUrl(src: string, quality: number = 20): string {
    // For static images, we'll create a compressed version identifier
    // In production, this would integrate with your image processing service
    const baseUrl = src.replace(/\.(jpg|jpeg|png)$/i, '');
    const extension = src.match(/\.(jpg|jpeg|png)$/i)?.[1] || 'png';
    return `${baseUrl}_q${quality}.${extension}`;
  }

  /**
   * Generate LQIP (Low Quality Image Placeholder)
   */
  static generateLQIP(src: string, quality: number = 10): string {
    // For static imports, return the original source
    // The CSS blur effect will create the LQIP appearance
    return src;
  }

  /**
   * Get optimal image format and quality based on browser support
   */
  static async getOptimalImageSrc(src: string, options: ImageOptions = {}): Promise<string> {
    // For static imports, return the original source
    // The browser will handle optimization and compression
    return src;
  }

  /**
   * Convert image to specified format with quality
   */
  private static convertToFormat(src: string, format: string, quality: number): string {
    const baseUrl = src.replace(/\.(jpg|jpeg|png)$/i, '');
    return `${baseUrl}_q${quality}.${format}`;
  }

  /**
   * Preload critical images that appear above the fold
   */
  static async preloadCriticalImages(imageSources: string[], options: ImageOptions = {}): Promise<void[]> {
    const optimizedSources = await Promise.all(
      imageSources.map(src => this.getOptimalImageSrc(src, options))
    );
    const preloadPromises = optimizedSources.map(src => this.preloadImage(src));
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
   * Check if an image is already cached
   */
  static isImageCached(src: string): boolean {
    return this.preloadedImages.has(src);
  }

  /**
   * Check WebP support with caching
   */
  static async supportsWebP(): Promise<boolean> {
    if (this.formatSupport.webp !== null) {
      return this.formatSupport.webp;
    }

    return new Promise((resolve) => {
      const webp = new Image();
      webp.onload = webp.onerror = () => {
        this.formatSupport.webp = webp.height === 2;
        resolve(this.formatSupport.webp);
      };
      webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  /**
   * Check AVIF support with caching
   */
  static async supportsAVIF(): Promise<boolean> {
    if (this.formatSupport.avif !== null) {
      return this.formatSupport.avif;
    }

    return new Promise((resolve) => {
      const avif = new Image();
      avif.onload = avif.onerror = () => {
        this.formatSupport.avif = avif.height === 2;
        resolve(this.formatSupport.avif);
      };
      avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=';
    });
  }

  /**
   * Create responsive image srcSet for different screen sizes
   */
  static generateSrcSet(src: string, options: ImageOptions = {}): string {
    const { quality = 80 } = options;
    const sizes = [480, 768, 1024, 1200];
    
    return sizes
      .map(size => `${this.getCompressedImageUrl(src, quality)} ${size}w`)
      .join(', ');
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