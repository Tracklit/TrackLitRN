import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

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

function getNavigationDirection(fromLevel: number, toLevel: number): 'forward' | 'back' | 'none' {
  if (fromLevel < toLevel) return 'forward'; // Going deeper - push
  if (fromLevel > toLevel) return 'back';    // Going back - pop
  return 'none'; // Same level - no animation
}

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();
  const [direction, setDirection] = useState<'forward' | 'back' | 'none'>('none');
  
  const previousLocation = useRef<string>(location);
  const previousLevel = useRef<number>(getPageLevel(location));

  useEffect(() => {
    if (previousLocation.current !== location) {
      const currentLevel = getPageLevel(location);
      const navDirection = getNavigationDirection(previousLevel.current, currentLevel);
      
      setDirection(navDirection);
      
      previousLocation.current = location;
      previousLevel.current = currentLevel;
    }
  }, [location]);

  // Simplified iOS-style animation variants
  const pageVariants = {
    initial: (direction: string) => {
      if (direction === 'forward') {
        return { x: '100%', opacity: 0.8 };
      } else if (direction === 'back') {
        return { x: '-20%', opacity: 0.8 };
      }
      return { x: 0, opacity: 1 };
    },
    in: {
      x: 0,
      opacity: 1,
    },
    out: (direction: string) => {
      if (direction === 'forward') {
        return { x: '-20%', opacity: 0.6 };
      } else if (direction === 'back') {
        return { x: '100%', opacity: 0 };
      }
      return { x: 0, opacity: 1 };
    },
  };

  // Transition configuration
  const pageTransition = {
    type: "tween",
    ease: [0.25, 0.46, 0.45, 0.94], // iOS-like easing
    duration: 0.35,
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <AnimatePresence
        mode="wait"
        custom={direction}
        onExitComplete={() => setDirection('none')}
      >
        <motion.div
          key={location}
          custom={direction}
          variants={pageVariants}
          initial="initial"
          animate="in"
          exit="out"
          transition={pageTransition}
          className="w-full h-full bg-background"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}