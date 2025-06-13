import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

interface SwipeNavigationHook {
  containerRef: React.RefObject<HTMLDivElement>;
  currentTransform: number;
  isTransitioning: boolean;
  swipeProgress: number;
  nextPageDirection: 'left' | 'right' | null;
}

export function useSwipeNavigation(
  navItems: Array<{ href: string; title: string }>,
  currentIndex: number
): SwipeNavigationHook {
  const [, setLocation] = useLocation();
  const [currentTransform, setCurrentTransform] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [nextPageDirection, setNextPageDirection] = useState<'left' | 'right' | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (isTransitioning) return;
      
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isDragging.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartX.current || !touchStartY.current || isTransitioning) return;
      
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - touchStartX.current;
      const deltaY = currentY - touchStartY.current;
      
      // Check if this is a horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        isDragging.current = true;
        e.preventDefault();
        
        const progress = Math.abs(deltaX) / window.innerWidth;
        const clampedProgress = Math.min(progress, 1);
        
        // Determine swipe direction and check boundaries
        if (deltaX > 0 && currentIndex > 0) {
          // Swiping right (previous page)
          setNextPageDirection('right');
          setSwipeProgress(clampedProgress);
          setCurrentTransform(deltaX);
        } else if (deltaX < 0 && currentIndex < navItems.length - 1) {
          // Swiping left (next page)
          setNextPageDirection('left');
          setSwipeProgress(clampedProgress);
          setCurrentTransform(deltaX);
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartX.current || !isDragging.current || isTransitioning) {
        // Reset states
        setCurrentTransform(0);
        setSwipeProgress(0);
        setNextPageDirection(null);
        touchStartX.current = null;
        touchStartY.current = null;
        isDragging.current = false;
        return;
      }
      
      const endX = e.changedTouches[0].clientX;
      const deltaX = endX - touchStartX.current;
      const threshold = window.innerWidth * 0.3; // 30% of screen width
      
      setIsTransitioning(true);
      
      if (Math.abs(deltaX) > threshold) {
        // Complete the navigation
        if (deltaX > 0 && currentIndex > 0) {
          // Navigate to previous page
          setLocation(navItems[currentIndex - 1].href);
        } else if (deltaX < 0 && currentIndex < navItems.length - 1) {
          // Navigate to next page
          setLocation(navItems[currentIndex + 1].href);
        }
        
        // Animate to complete position
        setCurrentTransform(deltaX > 0 ? window.innerWidth : -window.innerWidth);
      } else {
        // Snap back to current page
        setCurrentTransform(0);
      }
      
      // Reset after animation
      setTimeout(() => {
        setCurrentTransform(0);
        setSwipeProgress(0);
        setNextPageDirection(null);
        setIsTransitioning(false);
      }, 300);
      
      touchStartX.current = null;
      touchStartY.current = null;
      isDragging.current = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentIndex, navItems, setLocation, isTransitioning]);

  return {
    containerRef,
    currentTransform,
    isTransitioning,
    swipeProgress,
    nextPageDirection
  };
}