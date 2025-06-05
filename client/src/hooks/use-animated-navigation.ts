import { useState } from 'react';
import { useLocation } from 'wouter';

export function useAnimatedNavigation() {
  const [, setLocation] = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  const navigateWithAnimation = (path: string) => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    
    // Add exit animation class
    document.body.classList.add('page-transitioning');
    
    // Wait for animation to complete before navigating
    setTimeout(() => {
      setLocation(path);
      setIsNavigating(false);
      document.body.classList.remove('page-transitioning');
    }, 300);
  };

  return { navigateWithAnimation, isNavigating };
}