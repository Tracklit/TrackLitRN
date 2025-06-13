import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

interface SwipeNavigationHook {
  containerRef: React.RefObject<HTMLDivElement>;
  deltaX: number;
  isDragging: boolean;
  isNavigating: boolean;
  navigationDirection: 'left' | 'right' | null;
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
        
        // Apply gentle resistance at boundaries and limit drag distance
        let adjustedDelta = deltaXMove;
        
        // Apply boundary resistance
        if ((deltaXMove > 0 && currentIndex === 0) || 
            (deltaXMove < 0 && currentIndex === navItems.length - 1)) {
          adjustedDelta = deltaXMove * 0.2; // Strong resistance at boundaries
        } else {
          // Limit maximum drag distance to 30% of screen width
          const maxDrag = window.innerWidth * 0.3;
          adjustedDelta = Math.max(-maxDrag, Math.min(maxDrag, deltaXMove));
        }
        
        setDeltaX(adjustedDelta);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragging || startX === null || navigatingRef.current) {
        setDeltaX(0);
        setIsDragging(false);
        setStartX(null);
        setStartY(null);
        return;
      }
      
      const touch = e.changedTouches[0];
      const deltaXFinal = touch.clientX - startX;
      const deltaYFinal = touch.clientY - startY;
      const elapsed = Date.now() - startTime;
      
      setIsDragging(false);
      
      // Check if this qualifies as a swipe gesture
      if (Math.abs(deltaXFinal) > Math.abs(deltaYFinal) && 
          Math.abs(deltaXFinal) > 30 && // Minimum swipe distance
          elapsed < 500) { // Maximum swipe time
        
        let targetIndex = currentIndex;
        
        if (deltaXFinal < 0 && currentIndex < navItems.length - 1) {
          // Swipe left - next page
          targetIndex = currentIndex + 1;
          setNavigationDirection('left');
        } else if (deltaXFinal > 0 && currentIndex > 0) {
          // Swipe right - previous page
          targetIndex = currentIndex - 1;
          setNavigationDirection('right');
        }
        
        if (targetIndex !== currentIndex) {
          // Set navigation flag to prevent interference
          navigatingRef.current = true;
          setIsNavigating(true);
          
          // Reset drag position immediately
          setDeltaX(0);
          
          // Navigate with animation after brief delay
          setTimeout(() => {
            setLocation(navItems[targetIndex].href);
            
            // Clear navigation state after animation
            setTimeout(() => {
              navigatingRef.current = false;
              setIsNavigating(false);
              setNavigationDirection(null);
            }, 350); // Match animation duration
          }, 50);
        } else {
          // Snap back to original position
          setDeltaX(0);
        }
      } else {
        // Not a valid swipe - snap back
        setDeltaX(0);
      }
      
      setStartX(null);
      setStartY(null);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentIndex, navItems, setLocation, isDragging, startTime]);

  // Reset states when currentIndex changes (from external navigation)
  useEffect(() => {
    if (!navigatingRef.current) {
      setDeltaX(0);
      setIsDragging(false);
      setIsNavigating(false);
      setNavigationDirection(null);
    }
  }, [currentIndex]);

  return {
    containerRef,
    deltaX,
    isDragging,
    isNavigating,
    navigationDirection,
    currentIndex
  };
}