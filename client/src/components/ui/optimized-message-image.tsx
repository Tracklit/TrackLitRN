import { useState, useRef, useEffect } from 'react';

interface OptimizedMessageImageProps {
  src: string;
  alt?: string;
  className?: string;
  lazy?: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

export function OptimizedMessageImage({ 
  src, 
  alt = "Image", 
  className = '', 
  lazy = true,
  maxWidth = 300,
  maxHeight = 400
}: OptimizedMessageImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | undefined>(lazy ? undefined : src);
  const [imageError, setImageError] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lazy || !src) {
      setImageSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [src, lazy]);

  const handleImageLoad = () => {
    if (imgRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current;
      
      // Calculate display dimensions while maintaining aspect ratio
      let displayWidth = naturalWidth;
      let displayHeight = naturalHeight;
      
      if (displayWidth > maxWidth) {
        displayHeight = (displayHeight * maxWidth) / displayWidth;
        displayWidth = maxWidth;
      }
      
      if (displayHeight > maxHeight) {
        displayWidth = (displayWidth * maxHeight) / displayHeight;
        displayHeight = maxHeight;
      }
      
      setDimensions({ width: displayWidth, height: displayHeight });
    }
    
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  if (imageError) {
    return (
      <div className={`bg-gray-700 border border-gray-600 rounded-lg p-4 ${className}`}>
        <div className="text-gray-400 text-sm">Failed to load image</div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{
        width: imageLoaded && dimensions.width ? `${dimensions.width}px` : '200px',
        height: imageLoaded && dimensions.height ? `${dimensions.height}px` : '150px',
        minWidth: '100px',
        minHeight: '75px'
      }}
    >
      {/* Image */}
      {imageSrc && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ objectFit: 'cover' }}
        />
      )}
      
      {/* Skeleton loader */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-600 animate-pulse flex items-center justify-center">
          <div className="text-gray-400 text-xs">Loading...</div>
        </div>
      )}
    </div>
  );
}