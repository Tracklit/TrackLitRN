import { useState } from 'react';
import { useLocation } from 'wouter';

/**
 * Hook for delayed navigation that triggers route change on animation start
 * rather than immediate tap/click
 */
export function useDelayedNavigation() {
  const [, setLocation] = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  const navigateWithDelay = (href: string, delay: number = 50) => {
    setIsNavigating(true);
    
    // Start animation immediately, trigger navigation after delay
    setTimeout(() => {
      setLocation(href);
      setIsNavigating(false);
    }, delay);
  };

  return {
    navigateWithDelay,
    isNavigating
  };
}