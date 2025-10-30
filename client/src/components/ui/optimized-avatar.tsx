import { useState, useRef, useEffect } from 'react';
import { User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface OptimizedAvatarProps {
  src?: string;
  alt?: string;
  fallback: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  lazy?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
};

export function OptimizedAvatar({ 
  src, 
  alt, 
  fallback, 
  className = '', 
  size = 'md',
  lazy = true 
}: OptimizedAvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | undefined>(lazy ? undefined : src);
  const [imageError, setImageError] = useState(false);
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
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  return (
    <div ref={containerRef} className={`relative ${sizeClasses[size]} ${className}`}>
      <Avatar className={`${sizeClasses[size]} ${imageLoaded && !imageError ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
        <AvatarImage 
          ref={imgRef}
          src={imageSrc} 
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            objectFit: 'cover',
            width: '100%',
            height: '100%',
          }}
        />
        <AvatarFallback className="bg-blue-500 text-white">
          {fallback}
        </AvatarFallback>
      </Avatar>
      
      {/* Skeleton loader while image loads */}
      {(!imageLoaded || imageError) && (
        <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-gray-600 animate-pulse`} />
      )}
      
      {/* Show fallback if image fails */}
      {imageError && (
        <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-blue-500 text-white flex items-center justify-center font-medium`}>
          <User className="h-1/2 w-1/2" />
        </div>
      )}
    </div>
  );
}