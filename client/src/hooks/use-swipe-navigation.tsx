import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

interface SwipeNavigationHook {
  containerRef: React.RefObject<HTMLDivElement>;
  deltaX: number;
  isDragging: boolean;
  isNavigating: boolean;
  currentIndex: number;
}

export function useSwipeNavigation(
  navItems: Array<{ href: string; title: string; component?: React.ReactNode }>,
  currentIndex: number
): SwipeNavigationHook {
  const [, setLocation] = useLocation();
  const [deltaX, setDeltaX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [startX, setStartX] = useState<number | null>(null);
  const [startY, setStartY] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const navigatingRef = useRef(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (navigatingRef.current) return;
      
      setStartX(e.touches[0].clientX);
      setStartY(e.touches[0].clientY);
      setStartTime(Date.now());
      setIsDragging(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startX === null || startY === null || navigatingRef.current) return;
      
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaXMove = currentX - startX;
      const deltaYMove = currentY - startY;
      
      // Check if this is a horizontal swipe
      if (Math.abs(deltaXMove) > Math.abs(deltaYMove) && Math.abs(deltaXMove) > 10) {
        if (!isDragging) {
          setIsDragging(true);
        }
        e.preventDefault();
        
        // Apply boundary resistance
        let adjustedDelta = deltaXMove;
        if ((deltaXMove > 0 && currentIndex === 0) || 
            (deltaXMove < 0 && currentIndex === navItems.length - 1)) {
          // Add resistance when at boundaries
          adjustedDelta = deltaXMove * 0.3;
        }
        
        setDeltaX(adjustedDelta);
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging || startX === null || navigatingRef.current) {
        setDeltaX(0);
        setIsDragging(false);
        return;
      }
      
      const elapsed = Date.now() - startTime;
      const velocity = deltaX / elapsed; // pixels per millisecond
      
      // Velocity-based thresholds
      const threshold = window.innerWidth / 3;
      let targetIndex = currentIndex;
      
      // Check velocity-based navigation (faster swipes with lower distance threshold)
      if ((deltaX < -threshold || velocity < -0.3) && currentIndex < navItems.length - 1) {
        targetIndex = currentIndex + 1;
      } else if ((deltaX > threshold || velocity > 0.3) && currentIndex > 0) {
        targetIndex = currentIndex - 1;
      }
      
      setIsDragging(false);
      
      if (targetIndex !== currentIndex) {
        // Set navigation flag to prevent interference
        navigatingRef.current = true;
        setIsNavigating(true);
        
        // Navigate immediately without any transition
        setDeltaX(0);
        setLocation(navItems[targetIndex].href);
        
        // Clear navigation flag after a short delay
        requestAnimationFrame(() => {
          navigatingRef.current = false;
          setIsNavigating(false);
        });
      } else {
        // Snap back to original position
        setDeltaX(0);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentIndex, navItems, setLocation, isDragging, deltaX, startTime]);

  // Reset deltaX when currentIndex changes (from external navigation)
  useEffect(() => {
    if (!navigatingRef.current) {
      setDeltaX(0);
    }
  }, [currentIndex]);

  return {
    containerRef,
    deltaX,
    isDragging,
    isNavigating,
    currentIndex
  };
}