import React, { useState, useEffect, useRef } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { ImageOptimizer, ImageOptions } from '@/lib/image-optimizer';
import 'react-lazy-load-image-component/src/effects/blur.css';

interface OptimizedBackgroundImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackColor?: string;
  children?: React.ReactNode;
  priority?: boolean;
  quality?: number;
  lazy?: boolean;
  blur?: boolean;
  opacity?: number;
}

export const OptimizedBackgroundImage: React.FC<OptimizedBackgroundImageProps> = ({
  src,
  alt,
  className = '',
  fallbackColor = 'bg-gray-200',
  children,
  priority = false,
  quality = 20, // 80% compression (100-80=20)
  lazy = true,
  blur = true,
  opacity = 0.95
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [optimizedSrc, setOptimizedSrc] = useState<string>('');
  const [lqipSrc, setLqipSrc] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeImage = async () => {
      try {
        const imageOptions: ImageOptions = {
          quality,
          format: 'auto',
          lazy: !priority
        };

        // Get optimized image source
        const optimized = await ImageOptimizer.getOptimalImageSrc(src, imageOptions);
        setOptimizedSrc(optimized);

        // Generate LQIP for blur effect
        const lqip = ImageOptimizer.generateLQIP(src, 10);
        setLqipSrc(lqip);

        // Preload critical images immediately
        if (priority) {
          await ImageOptimizer.preloadImage(optimized);
          setImageLoaded(true);
        }
      } catch (error) {
        console.warn(`Failed to optimize image: ${src}`, error);
        setOptimizedSrc(src); // Fallback to original
        setLqipSrc(src);
        setImageError(true);
      }
    };

    initializeImage();
  }, [src, priority, quality]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    console.warn(`Failed to load background image: ${src}`);
  };

  // Use IntersectionObserver for lazy loading when not using react-lazy-load-image-component
  useEffect(() => {
    if (!lazy || priority || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && optimizedSrc) {
            const img = new Image();
            img.onload = handleImageLoad;
            img.onerror = handleImageError;
            img.src = optimizedSrc;
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px' // Start loading 50px before entering viewport
      }
    );

    observer.observe(containerRef.current);

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [lazy, priority, optimizedSrc]);

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      role="img"
      aria-label={alt}
    >
      {/* LQIP Background Layer */}
      {lqipSrc && !imageLoaded && !imageError && (
        <div
          className={`absolute inset-0 bg-cover bg-bottom bg-no-repeat transition-opacity duration-500 ${
            blur ? 'blur-sm' : ''
          }`}
          style={{
            backgroundImage: `url(${lqipSrc})`,
            opacity: 0.3,
            zIndex: 0
          }}
        />
      )}

      {/* Main Background Image Layer */}
      {optimizedSrc && imageLoaded && !imageError && (
        <div
          className="absolute inset-0 bg-cover bg-bottom bg-no-repeat transition-opacity duration-500"
          style={{
            backgroundImage: `url(${optimizedSrc})`,
            opacity,
            zIndex: 0
          }}
        />
      )}
      
      {/* Fallback Background */}
      {(!optimizedSrc || imageError) && (
        <div className={`absolute inset-0 ${fallbackColor}`} style={{ zIndex: 0 }} />
      )}
      
      {/* Content Layer */}
      <div className="relative" style={{ zIndex: 20 }}>
        {children}
      </div>
    </div>
  );
};

// Alternative component using react-lazy-load-image-component for foreground images
interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  quality?: number;
  lazy?: boolean;
  priority?: boolean;
  width?: number;
  height?: number;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  quality = 20,
  lazy = true,
  priority = false,
  width,
  height
}) => {
  const [optimizedSrc, setOptimizedSrc] = useState<string>('');
  const [lqipSrc, setLqipSrc] = useState<string>('');

  useEffect(() => {
    const initializeImage = async () => {
      try {
        const imageOptions: ImageOptions = {
          quality,
          format: 'auto',
          width,
          height
        };

        const optimized = await ImageOptimizer.getOptimalImageSrc(src, imageOptions);
        setOptimizedSrc(optimized);

        const lqip = ImageOptimizer.generateLQIP(src, 5);
        setLqipSrc(lqip);

        if (priority) {
          await ImageOptimizer.preloadImage(optimized);
        }
      } catch (error) {
        console.warn(`Failed to optimize image: ${src}`, error);
        setOptimizedSrc(src);
        setLqipSrc(src);
      }
    };

    initializeImage();
  }, [src, quality, width, height, priority]);

  if (!optimizedSrc) {
    return (
      <div 
        className={`bg-gray-200 animate-pulse ${className}`}
        style={{ width, height }}
        aria-label="Loading image..."
      />
    );
  }

  return (
    <LazyLoadImage
      src={optimizedSrc}
      alt={alt}
      className={className}
      width={width}
      height={height}
      effect={lazy ? "blur" : undefined}
      placeholderSrc={lqipSrc}
      loading={priority ? "eager" : "lazy"}
      threshold={50}
      style={{
        transition: 'opacity 0.3s ease-in-out'
      }}
    />
  );
};

// Higher-order component for background images with additional optimizations
export const BackgroundImageContainer: React.FC<{
  src: string;
  alt: string;
  children: React.ReactNode;
  className?: string;
  opacity?: number;
  filter?: string;
}> = ({ 
  src, 
  alt, 
  children, 
  className = '', 
  opacity = 0.95, 
  filter 
}) => {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Loading skeleton */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse z-0" />
      )}
      
      {/* Optimized background image */}
      {!imageError && (
        <LazyLoadImage
          src={src}
          alt={alt}
          effect="blur"
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{
            opacity: imageLoaded ? opacity : 0,
            filter,
            transition: 'opacity 0.3s ease-in-out',
          }}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            console.warn('Failed to load background image:', src);
          }}
          loading="lazy"
          threshold={100}
        />
      )}
      
      {/* Fallback for failed images */}
      {imageError && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 z-0"
          style={{ opacity }}
        />
      )}
      
      {/* Content Layer */}
      <div className="relative z-20">
        {children}
      </div>
    </div>
  );
};