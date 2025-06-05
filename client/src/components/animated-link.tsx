import { useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';

interface AnimatedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Custom Link component that triggers navigation on animation start
 * instead of immediate tap/click
 */
export function AnimatedLink({ href, children, className, onClick }: AnimatedLinkProps) {
  const [, setLocation] = useLocation();
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    setIsPressed(true);
    
    // Trigger navigation after animation starts (50ms delay)
    setTimeout(() => {
      setLocation(href);
      setIsPressed(false);
    }, 50);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick?.(e);
    handlePress();
  };

  return (
    <motion.div
      className={className}
      onTap={handlePress}
      onClick={handleClick}
      animate={isPressed ? { scale: 0.98 } : { scale: 1 }}
      transition={{ duration: 0.05 }}
      style={{ cursor: 'pointer' }}
    >
      {children}
    </motion.div>
  );
}