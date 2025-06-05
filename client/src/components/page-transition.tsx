import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "wouter";
import { useRef, useEffect } from "react";

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
  for (const pattern in PAGE_HIERARCHY) {
    if (pattern.endsWith("/") && path.startsWith(pattern)) {
      return PAGE_HIERARCHY[pattern];
    }
  }
  
  return 1; // Default level
}

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();
  const prevLocationRef = useRef<string>(location);
  const isFirstRender = useRef(true);

  const currentLevel = getPageLevel(location);
  const prevLevel = getPageLevel(prevLocationRef.current);
  
  // Determine animation direction based on hierarchy
  const isGoingDeeper = currentLevel > prevLevel;
  
  useEffect(() => {
    if (!isFirstRender.current) {
      prevLocationRef.current = location;
    }
    isFirstRender.current = false;
  }, [location]);

  const variants = {
    initial: (direction: number) => ({
      x: direction > 0 ? '30%' : '-30%',
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-15%' : '15%',
      opacity: 0
    })
  };

  // Direction: 1 for deeper (slide from right), -1 for back (slide from left)
  const direction = isGoingDeeper ? 1 : -1;

  return (
    <div className="relative w-full overflow-hidden">
      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={location}
          custom={direction}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{
            duration: 0.1,
            ease: "easeInOut"
          }}
          className="w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}