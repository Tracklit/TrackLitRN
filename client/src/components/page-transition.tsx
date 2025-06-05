import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { ReactNode } from 'react';

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

// Animation variants for different transition types
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.95,
  }),
};

const scaleVariants = {
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
    scale: 1.05,
    opacity: 0,
    y: -20,
  },
};

// Transition configuration
const transition = {
  type: 'tween',
  ease: [0.25, 0.46, 0.45, 0.94],
  duration: 0.4,
};

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const [location] = useLocation();
  
  // Determine if this is a subpage navigation
  const currentLevel = pageHierarchy[location] ?? 0;
  const isSubpage = currentLevel > 0;
  
  // Use scale animation for subpages, slide for same-level navigation
  const variants = isSubpage ? scaleVariants : slideVariants;
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location}
        custom={1}
        variants={variants}
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