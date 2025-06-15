import React from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

interface OptimizedBackgroundImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  placeholderSrc?: string;
}

export const OptimizedBackgroundImage: React.FC<OptimizedBackgroundImageProps> = ({
  src,
  alt,
  className = '',
  style = {},
  placeholderSrc
}) => {
  // Generate a low-quality placeholder from the original image
  const generateLQIP = (originalSrc: string) => {
    // For static imports, we'll use a CSS blur effect as placeholder
    return originalSrc;
  };

  const placeholder = placeholderSrc || generateLQIP(src);

  return (
    <div 
      className={`absolute inset-0 bg-cover bg-center ${className}`}
      style={{
        ...style,
        aspectRatio: '16/9', // Prevent layout shift
      }}
    >
      <LazyLoadImage
        src={src}
        alt={alt}
        effect="blur"
        placeholderSrc={placeholder}
        className="w-full h-full object-cover"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
        }}
        loading="lazy"
        onLoad={() => {
          // Optional: Add any post-load effects
        }}
        onError={(e) => {
          console.warn('Failed to load background image:', src);
        }}
      />
    </div>
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
  opacity = 0.7, 
  filter 
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <OptimizedBackgroundImage
        src={src}
        alt={alt}
        style={{
          opacity,
          filter,
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};