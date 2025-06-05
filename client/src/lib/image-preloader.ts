import trackImage1 from "@assets/IMG_4075.JPG?url";
import trackImage2 from "@assets/IMG_4076.JPG?url";
import trackImage3 from "@assets/IMG_4077.JPG?url";
import trackImage4 from "@assets/IMG_4078.JPG?url";

// Preload track images and cache them
export const trackImages = [trackImage1, trackImage2, trackImage3, trackImage4];

// Enhanced image preloader with browser caching support
class ImagePreloader {
  private imageCache = new Map<string, HTMLImageElement>();
  private preloadPromises = new Map<string, Promise<HTMLImageElement>>();
  private loadedUrls = new Set<string>();

  preloadImage(src: string): Promise<HTMLImageElement> {
    // Return cached image if available
    if (this.imageCache.has(src)) {
      return Promise.resolve(this.imageCache.get(src)!);
    }

    // Return existing promise if already loading
    if (this.preloadPromises.has(src)) {
      return this.preloadPromises.get(src)!;
    }

    // Create new preload promise
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      // Enable browser caching
      img.crossOrigin = 'anonymous';
      img.loading = 'eager';
      
      img.onload = () => {
        this.imageCache.set(src, img);
        this.loadedUrls.add(src);
        this.preloadPromises.delete(src);
        resolve(img);
      };
      
      img.onerror = () => {
        this.preloadPromises.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });

    this.preloadPromises.set(src, promise);
    return promise;
  }

  preloadImages(srcs: string[]): Promise<HTMLImageElement[]> {
    return Promise.all(srcs.map(src => this.preloadImage(src)));
  }

  getImageFromCache(src: string): HTMLImageElement | null {
    return this.imageCache.get(src) || null;
  }

  isImageLoaded(src: string): boolean {
    return this.loadedUrls.has(src) || this.imageCache.has(src);
  }

  // Clear cache if needed
  clearCache(): void {
    this.imageCache.clear();
    this.loadedUrls.clear();
  }
}

export const imagePreloader = new ImagePreloader();

// Preload track images immediately when module loads
imagePreloader.preloadImages(trackImages).catch(console.error);

// Preload images on page load for better performance
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Preload all track images to prevent flicker
    imagePreloader.preloadImages(trackImages);
  });
}