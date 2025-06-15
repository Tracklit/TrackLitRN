import React from 'react';

interface ImagePreloadProps {
  images: string[];
}

export const ImagePreload: React.FC<ImagePreloadProps> = ({ images }) => {
  React.useEffect(() => {
    // Create preload links for critical images
    const preloadLinks = images.map(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      link.type = 'image/jpeg'; // Default type, could be dynamic
      return link;
    });

    // Add to document head
    preloadLinks.forEach(link => {
      document.head.appendChild(link);
    });

    // Cleanup function to remove preload links
    return () => {
      preloadLinks.forEach(link => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      });
    };
  }, [images]);

  return null; // This component doesn't render anything
};

// Component for setting explicit dimensions to prevent layout shift
export const AspectRatioContainer: React.FC<{
  aspectRatio?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ aspectRatio = '16/9', children, className = '' }) => {
  return (
    <div 
      className={`relative w-full ${className}`}
      style={{ aspectRatio }}
    >
      {children}
    </div>
  );
};