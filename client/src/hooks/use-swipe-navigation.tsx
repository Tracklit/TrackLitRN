import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

interface SwipeNavigationHook {
  containerRef: React.RefObject<HTMLDivElement>;
  isNavigating: boolean;
  navigationDirection: 'left' | 'right' | null;
  currentIndex: number;
}

export function useSwipeNavigation(
  navItems: Array<{ href: string; title: string; component?: React.ReactNode }>,
  currentIndex: number
): SwipeNavigationHook {
  const [, setLocation] = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationDirection, setNavigationDirection] = useState<'left' | 'right' | null>(null);
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
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startX === null || startY === null || navigatingRef.current) return;
      
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaXMove = currentX - startX;
      const deltaYMove = currentY - startY;
      
      // Check if this is a horizontal swipe
      if (Math.abs(deltaXMove) > Math.abs(deltaYMove) && Math.abs(deltaXMove) > 30) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      if (startX === null || navigatingRef.current) {
        setStartX(null);
        setStartY(null);
        return;
      }
      
      const endX = startX; // We stored the start position
      const currentX = startX; // This would be the end position in a real scenario
      // Since we're not tracking during move, we need to get the end position differently
      // Let's use a different approach - detect swipe on touchend
      
      const touchEndTime = Date.now();
      const elapsed = touchEndTime - startTime;
      
      // For Instagram-like behavior, we need to detect quick swipes
      // Let's use a simpler approach: detect direction and minimum distance
      
      setStartX(null);
      setStartY(null);
    };

    const handleSwipeDetection = (e: TouchEvent) => {
      if (navigatingRef.current) return;
      
      const touch = e.changedTouches[0];
      if (!startX || !startY) return;
      
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      const elapsed = Date.now() - startTime;
      
      // Check if this is a horizontal swipe with sufficient velocity and distance
      if (Math.abs(deltaX) > Math.abs(deltaY) && 
          Math.abs(deltaX) > 50 && // Minimum swipe distance
          elapsed < 300) { // Maximum swipe time for quick gesture
        
        let targetIndex = currentIndex;
        
        if (deltaX < 0 && currentIndex < navItems.length - 1) {
          // Swipe left - next page
          targetIndex = currentIndex + 1;
          setNavigationDirection('left');
        } else if (deltaX > 0 && currentIndex > 0) {
          // Swipe right - previous page
          targetIndex = currentIndex - 1;
          setNavigationDirection('right');
        }
        
        if (targetIndex !== currentIndex) {
          // Set navigation flag to prevent interference
          navigatingRef.current = true;
          setIsNavigating(true);
          
          // Navigate with animation
          setTimeout(() => {
            setLocation(navItems[targetIndex].href);
            
            // Clear navigation state after animation
            setTimeout(() => {
              navigatingRef.current = false;
              setIsNavigating(false);
              setNavigationDirection(null);
            }, 350); // Match animation duration
          }, 50); // Small delay to ensure animation starts
        }
      }
      
      setStartX(null);
      setStartY(null);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleSwipeDetection, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleSwipeDetection);
    };
  }, [currentIndex, navItems, setLocation, startTime]);

  // Reset navigation state when currentIndex changes (from external navigation)
  useEffect(() => {
    if (!navigatingRef.current) {
      setIsNavigating(false);
      setNavigationDirection(null);
    }
  }, [currentIndex]);

  return {
    containerRef,
    isNavigating,
    navigationDirection,
    currentIndex
  };
}