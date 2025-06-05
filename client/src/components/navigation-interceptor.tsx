import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";

// Define page hierarchy levels
const PAGE_HIERARCHY: Record<string, number> = {
  "/": 0,
  "/dashboard": 0,
  "/tools": 1,
  "/training-tools": 1,
  "/meets": 1,
  "/results": 1,
  "/programs": 1,
  "/clubs": 1,
  "/messages": 1,
  "/friends": 1,
  "/athletes": 1,
  "/coaches": 1,
  "/practice": 1,
  "/profile": 1,
  "/spikes": 1,
  "/subscription": 1,
  "/sprinthia": 1,
  "/tools/stopwatch": 2,
  "/tools/start-gun": 2,
  "/tools/journal": 2,
  "/tools/pace-calculator": 2,
  "/tools/photo-finish": 2,
  "/tools/exercise-library": 2,
  "/tools/rehabilitation": 2,
  "/tools/sprinthia": 2,
  "/tools/exercise-library/add": 3,
  "/programs/create": 3,
  "/programs/editor": 3,
  "/clubs/management": 3,
  "/meets/create": 3,
  "/checkout": 3,
  "/programs/": 4,
  "/clubs/": 4,
  "/athlete/": 4,
};

function getPageLevel(path: string): number {
  if (PAGE_HIERARCHY[path] !== undefined) {
    return PAGE_HIERARCHY[path];
  }
  for (const pattern in PAGE_HIERARCHY) {
    if (pattern.endsWith('/') && path.startsWith(pattern)) {
      return PAGE_HIERARCHY[pattern];
    }
  }
  return 1;
}

function getAnimationDirection(fromLevel: number, toLevel: number): 'left' | 'right' | 'none' {
  if (fromLevel < toLevel) {
    return 'right';
  } else if (fromLevel > toLevel) {
    return 'left';
  }
  return 'none';
}

interface NavigationInterceptorProps {
  children: React.ReactNode;
}

export function NavigationInterceptor({ children }: NavigationInterceptorProps) {
  const [actualLocation] = useLocation();
  const [displayLocation, setDisplayLocation] = useState(actualLocation);
  const [animationClass, setAnimationClass] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const previousLocation = useRef<string>(actualLocation);
  const previousLevel = useRef<number>(getPageLevel(actualLocation));
  const animationTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (previousLocation.current !== actualLocation) {
      const currentLevel = getPageLevel(actualLocation);
      const direction = getAnimationDirection(previousLevel.current, currentLevel);
      
      if (direction !== 'none') {
        // Clear any existing animation
        if (animationTimeout.current) {
          clearTimeout(animationTimeout.current);
        }
        
        setIsAnimating(true);
        
        // Start with exit animation on current content
        setAnimationClass(`page-exit-${direction === 'right' ? 'left' : 'right'}`);
        
        // After exit animation, update location and start enter animation
        animationTimeout.current = setTimeout(() => {
          setDisplayLocation(actualLocation);
          
          requestAnimationFrame(() => {
            setAnimationClass(`page-enter-${direction}`);
            
            // Complete the animation
            animationTimeout.current = setTimeout(() => {
              setAnimationClass('');
              setIsAnimating(false);
            }, 300);
          });
        }, 300);
      } else {
        // No animation needed, update immediately
        setDisplayLocation(actualLocation);
      }
      
      previousLocation.current = actualLocation;
      previousLevel.current = currentLevel;
    }
  }, [actualLocation]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationTimeout.current) {
        clearTimeout(animationTimeout.current);
      }
    };
  }, []);

  // Override the location context for children
  const OverrideLocationProvider = ({ children }: { children: React.ReactNode }) => {
    // This is a hack to override wouter's location context
    const originalUseLocation = useLocation;
    
    return (
      <div className={`navigation-container ${animationClass} ${isAnimating ? 'animating' : ''}`}>
        {children}
      </div>
    );
  };

  return <OverrideLocationProvider>{children}</OverrideLocationProvider>;
}