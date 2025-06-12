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
  "/conversations": 1,
  "/messages": 2,
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
  "/tools/video-analysis": 2,
  
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
  const [currentContent, setCurrentContent] = useState(children);
  const [previousContent, setPreviousContent] = useState<React.ReactNode>(null);
  const [animationState, setAnimationState] = useState<'idle' | 'exiting' | 'entering'>('idle');
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right' | 'none'>('none');
  
  const previousLocation = useRef<string>(location);
  const previousLevel = useRef<number>(getPageLevel(location));
  const animationTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (previousLocation.current !== location) {
      const currentLevel = getPageLevel(location);
      const direction = getAnimationDirection(previousLevel.current, currentLevel);
      
      if (direction !== 'none') {
        // Clear any existing timeout
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
        
        // Store the previous content for exit animation
        setPreviousContent(currentContent);
        setTransitionDirection(direction);
        
        // Start exit animation
        setAnimationState('exiting');
        
        // After exit animation, start enter animation with new content
        animationTimeoutRef.current = setTimeout(() => {
          setCurrentContent(children);
          setPreviousContent(null);
          setAnimationState('entering');
          
          // Complete the animation cycle
          animationTimeoutRef.current = setTimeout(() => {
            setAnimationState('idle');
            setTransitionDirection('none');
          }, 300);
        }, 150); // Half the animation duration for exit
        
      } else {
        // No animation needed, update content immediately
        setCurrentContent(children);
        setAnimationState('idle');
      }
      
      previousLocation.current = location;
      previousLevel.current = currentLevel;
    } else if (animationState === 'idle') {
      // Same location and not animating, update content
      setCurrentContent(children);
    }

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [location, children, currentContent, animationState]);

  const getExitClasses = () => {
    if (animationState !== 'exiting') return 'hidden';
    
    if (transitionDirection === 'right') {
      return 'absolute inset-0 animate-out slide-out-to-left-full duration-150 ease-in';
    } else if (transitionDirection === 'left') {
      return 'absolute inset-0 animate-out slide-out-to-right-full duration-150 ease-in';
    }
    
    return '';
  };

  const getEnterClasses = () => {
    if (animationState === 'exiting') return 'hidden';
    if (animationState === 'idle') return '';
    
    if (transitionDirection === 'right') {
      return 'animate-in slide-in-from-right-full duration-300 ease-out';
    } else if (transitionDirection === 'left') {
      return 'animate-in slide-in-from-left-full duration-300 ease-out';
    }
    
    return '';
  };
  
  return (
    <div className="relative w-full h-full">
      {/* Previous content - exits first */}
      {previousContent && animationState === 'exiting' && (
        <div className={getExitClasses()}>
          {previousContent}
        </div>
      )}
      
      {/* Current content - enters after exit */}
      <div className={getEnterClasses()}>
        {currentContent}
      </div>
    </div>
  );
}