import { useState, useEffect, useRef } from 'react';
import { imagePreloader } from '@/lib/image-preloader';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  className,
  style,
  fallbackSrc,
  onLoad,
  onError,
  loading = 'lazy',
  priority = false,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Reset states when src changes
    setIsLoaded(false);
    setHasError(false);
    setCurrentSrc(src);

    // Check if image is already cached
    if (imagePreloader.isImageLoaded(src)) {
      setIsLoaded(true);
      return;
    }

    // Preload image if priority or eager loading
    if (priority || loading === 'eager') {
      imagePreloader.preloadImage(src)
        .then(() => {
          setIsLoaded(true);
          onLoad?.();
        })
        .catch(() => {
          setHasError(true);
          if (fallbackSrc) {
            setCurrentSrc(fallbackSrc);
          }
          onError?.();
        });
    }
  }, [src, priority, loading, fallbackSrc, onLoad, onError]);

  const handleImageLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleImageError = () => {
    setHasError(true);
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    } else {
      onError?.();
    }
  };

  return (
    <div className={cn("relative overflow-hidden", className)} style={style}>
      {/* Placeholder background while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        loading={loading}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        style={{
          ...style,
          display: hasError && !fallbackSrc ? 'none' : 'block'
        }}
      />
      
      {/* Error fallback */}
      {hasError && !fallbackSrc && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Image unavailable</span>
        </div>
      )}
    </div>
  );
}