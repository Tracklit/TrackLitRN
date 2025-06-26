import React, { useRef, useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface SwipeWrapperProps {
  children: React.ReactNode;
  currentPage: 'dashboard' | 'chat';
}

const SwipeWrapper: React.FC<SwipeWrapperProps> = ({ children, currentPage }) => {
  const [, setLocation] = useLocation();
  const [startX, setStartX] = useState<number>(0);
  const [startY, setStartY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 100; // Minimum distance for swipe

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!e.touches[0]) return;
    
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setStartY(touch.clientY);
    setIsDragging(true);
    setDragX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !e.touches[0]) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    // Only handle horizontal swipes (ignore vertical scrolling)
    if (Math.abs(deltaY) < Math.abs(deltaX)) {
      try {
        e.preventDefault();
        setDragX(deltaX);
      } catch (error) {
        console.error('Touch move error:', error);
        resetState();
      }
    } else if (Math.abs(deltaY) > 10) {
      // Reset if vertical movement is too large
      resetState();
    }
  };

  const resetState = () => {
    setIsDragging(false);
    setDragX(0);
    setStartX(0);
    setStartY(0);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) {
      resetState();
      return;
    }

    const touch = e.changedTouches[0];
    if (!touch) {
      resetState();
      return;
    }

    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    // Only process if horizontal movement is dominant and meets threshold
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
      const isRightSwipe = deltaX > 0;
      const isLeftSwipe = deltaX < 0;

      try {
        setIsTransitioning(true);
        
        if (isRightSwipe && currentPage === 'dashboard') {
          // Swipe right from dashboard → go to chat
          setTimeout(() => {
            setLocation('/chat');
            setIsTransitioning(false);
          }, 150);
        } else if (isLeftSwipe && currentPage === 'chat') {
          // Swipe left from chat → go to dashboard  
          setTimeout(() => {
            setLocation('/');
            setIsTransitioning(false);
          }, 150);
        } else {
          setIsTransitioning(false);
        }
      } catch (error) {
        console.error('Navigation error:', error);
        setIsTransitioning(false);
      }
    }

    resetState();
  };

  // Mouse events for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX);
    setStartY(e.clientY);
    setIsDragging(true);
    setDragX(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    if (Math.abs(deltaY) < Math.abs(deltaX)) {
      setDragX(deltaX);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) {
      resetState();
      return;
    }

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    // Only process if horizontal movement is dominant and meets threshold
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
      const isRightSwipe = deltaX > 0;
      const isLeftSwipe = deltaX < 0;

      try {
        if (isRightSwipe && currentPage === 'dashboard') {
          setLocation('/chat');
        } else if (isLeftSwipe && currentPage === 'chat') {
          setLocation('/home');
        }
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }

    resetState();
  };

  // Reset drag state when switching pages
  useEffect(() => {
    resetState();
  }, [currentPage]);

  return (
    <div
      ref={containerRef}
      className={`h-full w-full relative overflow-hidden touch-pan-y ${
        isTransitioning ? 'transition-transform duration-300 ease-out' : ''
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        transform: isTransitioning 
          ? (currentPage === 'dashboard' ? 'translateX(100%)' : 'translateX(-100%)')
          : isDragging 
            ? `translateX(${Math.max(-50, Math.min(50, dragX * 0.3))}px)` 
            : 'translateX(0px)',
        transition: isTransitioning 
          ? 'transform 0.3s ease-out' 
          : isDragging 
            ? 'none' 
            : 'transform 0.3s ease-out',
      }}
    >
      {children}
      
      {/* Visual feedback during swipe */}
      {isDragging && Math.abs(dragX) > 20 && (
        <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div 
            className={`text-4xl opacity-60 transition-opacity duration-200 ${
              dragX > 0 
                ? (currentPage === 'dashboard' ? 'text-blue-500' : 'text-gray-400')
                : (currentPage === 'chat' ? 'text-blue-500' : 'text-gray-400')
            }`}
          >
            {dragX > 0 && currentPage === 'dashboard' ? '💬' : 
             dragX < 0 && currentPage === 'chat' ? '🏠' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

export default SwipeWrapper;