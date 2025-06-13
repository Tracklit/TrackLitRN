import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";

// Define page hierarchy levels for navigation depth
const PAGE_HIERARCHY: Record<string, number> = {
  "/": 0, // Dashboard - root level
  "/dashboard": 0,
  
  // Level 1 - Main sections
  "/tools": 1,
  "/training-tools": 1,
  "/meets": 1,
  "/results": 1,
  "/programs": 1,
  "/clubs": 1,
  "/conversations": 1,
  "/friends": 1,
  "/athletes": 1,
  "/coaches": 1,
  "/practice": 1,
  "/profile": 1,
  "/spikes": 1,
  "/subscription": 1,
  "/sprinthia": 1,
  
  // Level 2 - Tool pages and sub-sections
  "/tools/stopwatch": 2,
  "/tools/start-gun": 2,
  "/tools/journal": 2,
  "/tools/pace-calculator": 2,
  "/tools/photo-finish": 2,
  "/tools/exercise-library": 2,
  "/tools/rehabilitation": 2,
  "/tools/sprinthia": 2,
  "/tools/video-analysis": 2,
  "/messages": 2,
  
  // Level 3 - Deep pages
  "/tools/exercise-library/add": 3,
  "/programs/create": 3,
  "/clubs/management": 3,
  "/meets/create": 3,
  "/checkout": 3,
  
  // Level 4 - Detail pages (dynamic routes)
  "/programs/": 4,
  "/clubs/": 4,
  "/athlete/": 4,
};

function getPageLevel(path: string): number {
  if (PAGE_HIERARCHY[path] !== undefined) {
    return PAGE_HIERARCHY[path];
  }
  
  for (const [pattern, level] of Object.entries(PAGE_HIERARCHY)) {
    if (pattern.endsWith("/") && path.startsWith(pattern)) {
      return level;
    }
  }
  
  return 2;
}

function getNavigationDirection(fromLevel: number, toLevel: number): 'forward' | 'back' | 'none' {
  if (fromLevel < toLevel) return 'forward';
  if (fromLevel > toLevel) return 'back';
  return 'none';
}

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();
  const [direction, setDirection] = useState<'forward' | 'back' | 'none'>('none');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [overlayContent, setOverlayContent] = useState<React.ReactNode>(null);
  const [baseContent, setBaseContent] = useState<React.ReactNode>(children);
  const [displayedContent, setDisplayedContent] = useState<React.ReactNode>(children);
  
  const previousLocation = useRef<string>(location);
  const previousLevel = useRef<number>(getPageLevel(location));
  const overlayPageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previousLocation.current !== location) {
      const currentLevel = getPageLevel(location);
      const prevLevel = previousLevel.current;
      const navDirection = getNavigationDirection(prevLevel, currentLevel);
      
      if (navDirection !== 'none') {
        setDirection(navDirection);
        setIsTransitioning(true);
        
        if (navDirection === 'forward') {
          // For forward navigation, keep showing old content in base, new content in overlay
          setOverlayContent(children);
          
          // Start overlay from 85% right (showing 15% of new page)
          setTimeout(() => {
            if (overlayPageRef.current) {
              overlayPageRef.current.style.transform = 'translateX(85%)';
              
              // Wait a moment before starting the slide-in animation
              setTimeout(() => {
                if (overlayPageRef.current) {
                  overlayPageRef.current.style.transform = 'translateX(0%)';
                }
              }, 50);
            }
          }, 10);
          
        } else if (navDirection === 'back') {
          // For back navigation, show new content in base, old content slides out in overlay
          setDisplayedContent(children);
          setOverlayContent(displayedContent);
          
          setTimeout(() => {
            if (overlayPageRef.current) {
              overlayPageRef.current.style.transform = 'translateX(0%)';
              
              setTimeout(() => {
                if (overlayPageRef.current) {
                  overlayPageRef.current.style.transform = 'translateX(85%)';
                }
              }, 50);
            }
          }, 10);
        }
        
        // Complete transition after animation duration
        setTimeout(() => {
          setIsTransitioning(false);
          setDirection('none');
          setOverlayContent(null);
          setDisplayedContent(children);
          setBaseContent(children);
        }, 370);
      } else {
        // No transition needed, update immediately
        setDisplayedContent(children);
        setBaseContent(children);
      }
      
      previousLocation.current = location;
      previousLevel.current = currentLevel;
    }
  }, [location, children]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Base page - shows displayed content */}
      <div className="w-full h-full bg-background">
        {displayedContent}
      </div>
      
      {/* Overlay page - completely opaque during transitions */}
      {isTransitioning && overlayContent && (
        <div 
          ref={overlayPageRef}
          className="fixed inset-0 z-[50] w-full h-full"
          style={{
            transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            transform: direction === 'forward' ? 'translateX(85%)' : 'translateX(0%)',
            backgroundColor: 'hsl(var(--background))', // Solid background color
          }}
        >
          {overlayContent}
        </div>
      )}
    </div>
  );
}