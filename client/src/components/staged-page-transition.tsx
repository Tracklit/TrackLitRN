import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useRef, useEffect, useState } from "react";

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
  
  // Level 2 - Detail pages
  "/meets/": 2,
  "/results/": 2,
  "/programs/": 2,
  "/practice": 2,
  "/workout": 2,
  "/profile": 2,
  "/settings": 2,
  "/notifications": 2,
  "/chat": 2,
  
  // Level 3 - Sub-detail pages
  "/workout/": 3,
  "/practice/": 3,
  "/chat/": 3
};

interface TransitionState {
  stage: 'idle' | 'starting' | 'loading_new' | 'completing';
  oldContent: React.ReactNode | null;
  newContent: React.ReactNode | null;
  oldLocation: string;
  newLocation: string;
}

export function StagedPageTransition({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [transitionState, setTransitionState] = useState<TransitionState>({
    stage: 'idle',
    oldContent: children,
    newContent: null,
    oldLocation: location,
    newLocation: location
  });

  const currentLevel = PAGE_HIERARCHY[location] ?? 2;
  const prevLevel = PAGE_HIERARCHY[transitionState.oldLocation] ?? 2;
  const isGoingDeeper = currentLevel > prevLevel;
  const direction = isGoingDeeper ? 1 : -1;

  useEffect(() => {
    if (location !== transitionState.oldLocation && transitionState.stage === 'idle') {
      // Stage 1: Start transition (0-90%)
      setTransitionState(prev => ({
        ...prev,
        stage: 'starting',
        newLocation: location,
        newContent: children
      }));

      // Stage 2: Load new page at 90% (180ms)
      setTimeout(() => {
        setTransitionState(prev => ({
          ...prev,
          stage: 'loading_new'
        }));
      }, 180);

      // Stage 3: Complete transition at 100% (200ms) 
      setTimeout(() => {
        setTransitionState(prev => ({
          ...prev,
          stage: 'completing'
        }));
      }, 200);

      // Stage 4: Reset to idle (220ms)
      setTimeout(() => {
        setTransitionState({
          stage: 'idle',
          oldContent: children,
          newContent: null,
          oldLocation: location,
          newLocation: location
        });
      }, 220);
    }
  }, [location, children]);

  const variants = {
    oldPageExit: {
      x: direction > 0 ? '-15%' : '15%',
      opacity: 0
    },
    newPageInitial: {
      x: direction > 0 ? '30%' : '-30%',
      opacity: 0
    },
    newPageAnimate: {
      x: 0,
      opacity: 1
    }
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* Current/Old Page - visible until 100% completion */}
      <AnimatePresence>
        {(transitionState.stage === 'starting' || transitionState.stage === 'loading_new') && (
          <motion.div
            key={`old-${transitionState.oldLocation}`}
            variants={variants}
            initial={{ x: 0, opacity: 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit="oldPageExit"
            transition={{
              duration: 0.2,
              ease: "easeInOut"
            }}
            className="w-full absolute top-0 left-0 z-10"
          >
            {transitionState.oldContent}
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Page - starts loading at 90% completion */}
      <AnimatePresence>
        {(transitionState.stage === 'loading_new' || transitionState.stage === 'completing') && (
          <motion.div
            key={`new-${transitionState.newLocation}`}
            variants={variants}
            initial="newPageInitial"
            animate="newPageAnimate"
            transition={{
              duration: 0.2,
              ease: "easeInOut"
            }}
            className="w-full relative z-20"
          >
            {transitionState.newContent}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Idle State - normal page display */}
      {transitionState.stage === 'idle' && (
        <div className="w-full">
          {children}
        </div>
      )}
    </div>
  );
}