import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";

// Define page hierarchy levels
const PAGE_HIERARCHY: Record<string, number> = {
  "/": 0, // Dashboard - highest level
  "/dashboard": 0,
  
  // Level 1 - Main sections
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
  
  // Level 2 - Tool pages
  "/tools/stopwatch": 2,
  "/tools/start-gun": 2,
  "/tools/journal": 2,
  "/tools/pace-calculator": 2,
  "/tools/photo-finish": 2,
  "/tools/exercise-library": 2,
  "/tools/rehabilitation": 2,
  "/tools/sprinthia": 2,
  
  // Level 3 - Sub-pages
  "/tools/exercise-library/add": 3,
  "/programs/create": 3,
  "/programs/editor": 3,
  "/clubs/management": 3,
  "/meets/create": 3,
  "/checkout": 3,
  
  // Level 4 - Detail pages
  "/programs/": 4, // Will match /programs/123
  "/clubs/": 4, // Will match /clubs/123
  "/athlete/": 4, // Will match /athlete/123
};

function getPageLevel(path: string): number {
  // Exact match first
  if (PAGE_HIERARCHY[path] !== undefined) {
    return PAGE_HIERARCHY[path];
  }
  
  // Pattern matching for dynamic routes
  for (const [pattern, level] of Object.entries(PAGE_HIERARCHY)) {
    if (pattern.endsWith("/") && path.startsWith(pattern)) {
      return level;
    }
  }
  
  // Default level for unknown pages
  return 2;
}

function getAnimationDirection(fromLevel: number, toLevel: number): 'left' | 'right' | 'none' {
  if (fromLevel < toLevel) return 'right'; // Going deeper - slide in from right
  if (fromLevel > toLevel) return 'left';  // Going back - slide in from left
  return 'none'; // Same level - no animation
}

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();
  const [animationClass, setAnimationClass] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayedContent, setDisplayedContent] = useState(children);
  const previousLocation = useRef<string>(location);
  const previousLevel = useRef<number>(getPageLevel(location));

  useEffect(() => {
    if (previousLocation.current !== location) {
      const currentLevel = getPageLevel(location);
      const direction = getAnimationDirection(previousLevel.current, currentLevel);
      
      if (direction !== 'none') {
        setIsAnimating(true);
        
        // Set exit animation for current content (keep showing old content)
        setAnimationClass(`page-exit-${direction === 'right' ? 'left' : 'right'}`);
        
        // After exit animation completes, switch content and start enter animation
        setTimeout(() => {
          setDisplayedContent(children);
          setAnimationClass(`page-enter-${direction}`);
          
          // Complete animation
          setTimeout(() => {
            setAnimationClass('');
            setIsAnimating(false);
          }, 300);
        }, 300);
      } else {
        // No animation, update content immediately
        setDisplayedContent(children);
      }
      
      previousLocation.current = location;
      previousLevel.current = currentLevel;
    } else if (!isAnimating) {
      // Update content when location hasn't changed and not animating
      setDisplayedContent(children);
    }
  }, [location, children, isAnimating]);

  return (
    <div className={`page-transition-container ${animationClass} ${isAnimating ? 'animating' : ''}`}>
      {displayedContent}
    </div>
  );
}