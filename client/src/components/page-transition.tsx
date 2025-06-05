import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { ReactNode, useRef } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

// Define page hierarchy for determining animation direction
const pageHierarchy: Record<string, number> = {
  '/': 0,
  '/dashboard': 0,
  '/programs': 0,
  '/meets': 0,
  '/profile': 0,
  '/social': 0,
  '/chat': 0,
  '/notifications': 0,
  '/meets/create': 1,
  '/programs/create': 1,
  '/programs/edit': 1,
  '/programs/view': 1,
  '/sessions': 1,
  '/workout': 2,
  '/workout/timer': 3,
};

// Track navigation direction
let previousLevel: number | null = null;

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const [location] = useLocation();
  
  // Determine navigation direction
  const currentLevel = pageHierarchy[location] ?? 0;
  const isGoingDeeper = previousLevel !== null && currentLevel > previousLevel;
  const isGoingBack = previousLevel !== null && currentLevel < previousLevel;
  
  // Update previous level for next navigation
  previousLevel = currentLevel;
  
  // Animation variants based on navigation direction
  const getVariants = () => {
    if (isGoingDeeper) {
      // Going to subpage: scale up from center
      return {
        enter: {
          scale: 0.9,
          opacity: 0,
          y: 20,
        },
        center: {
          scale: 1,
          opacity: 1,
          y: 0,
        },
        exit: {
          scale: 0.9,
          opacity: 0,
          y: -20,
        },
      };
    } else if (isGoingBack) {
      // Going back: scale down and slide out
      return {
        enter: {
          scale: 1.1,
          opacity: 0,
          y: -20,
        },
        center: {
          scale: 1,
          opacity: 1,
          y: 0,
        },
        exit: {
          scale: 1.1,
          opacity: 0,
          y: 20,
        },
      };
    } else {
      // Same level navigation: slide horizontally
      return {
        enter: {
          x: '100%',
          opacity: 0,
        },
        center: {
          x: 0,
          opacity: 1,
        },
        exit: {
          x: '-100%',
          opacity: 0,
        },
      };
    }
  };

  // Transition configuration
  const transition = {
    type: 'tween',
    ease: [0.25, 0.46, 0.45, 0.94],
    duration: 0.35,
  };
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location}
        variants={getVariants()}
        initial="enter"
        animate="center"
        exit="exit"
        transition={transition}
        className={`${className} w-full h-full`}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}