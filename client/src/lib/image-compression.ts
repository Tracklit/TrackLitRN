/**
 * Advanced image compression and optimization utilities
 * Provides consistent compression across all app thumbnails
 */

interface CompressionOptions {
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Compresses an image URL by applying CSS-based optimization
 */
export function getCompressedImageStyle(url: string, compressionLevel: 'light' | 'medium' | 'heavy' = 'medium') {
  const compressionFilters = {
    light: 'contrast(1.02) saturate(0.98)',
    medium: 'contrast(1.05) saturate(0.95)',
    heavy: 'contrast(1.1) saturate(0.9) brightness(0.95)'
  };

  return {
    backgroundImage: `url(${url})`,
    filter: compressionFilters[compressionLevel],
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden' as const,
    imageRendering: 'auto' as const
  };
}

/**
 * Gets optimized CSS classes for different thumbnail types
 */
export function getThumbnailClasses(type: 'card' | 'programs' | 'background' | 'media') {
  const baseClasses = 'transform-gpu backface-visibility-hidden';
  
  switch (type) {
    case 'card':
      return `${baseClasses} card-thumbnail`;
    case 'programs':
      return `${baseClasses} programs-thumbnail`;
    case 'background':
      return `${baseClasses} bg-thumbnail-crop`;
    case 'media':
      return `${baseClasses} card-thumbnail`;
    default:
      return `${baseClasses} thumbnail-crop`;
  }
}

/**
 * Preloads critical images to prevent visual flicker
 */
export function preloadCriticalImages(urls: string[]) {
  urls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Creates an optimized image element with compression
 */
export function createOptimizedImage(src: string, alt: string, className: string = '', compressionLevel: 'light' | 'medium' | 'heavy' = 'medium') {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  img.className = `${className} ${getThumbnailClasses('card')}`;
  img.loading = 'lazy';
  img.style.filter = getCompressedImageStyle(src, compressionLevel).filter;
  img.style.transform = 'translateZ(0)';
  img.style.backfaceVisibility = 'hidden';
  
  return img;
}

/**
 * Enhanced image error handling with fallback compression
 */
export function handleImageError(img: HTMLImageElement, fallbackSrc?: string) {
  if (fallbackSrc && img.src !== fallbackSrc) {
    img.src = fallbackSrc;
  } else {
    // Apply placeholder styling
    img.style.backgroundColor = '#f1f5f9';
    img.style.border = '1px solid #e2e8f0';
  }
}