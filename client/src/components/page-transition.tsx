import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [currentChildren, setCurrentChildren] = useState(children);

  useEffect(() => {
    // Start fade out
    setIsVisible(false);
    
    // After fade out completes, update content and fade in
    const timer = setTimeout(() => {
      setCurrentChildren(children);
      setIsVisible(true);
    }, 120); // 120ms fade out duration for snappy transitions

    return () => clearTimeout(timer);
  }, [location]); // Trigger on location changes

  return (
    <div 
      className={`transition-opacity duration-[120ms] ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {currentChildren}
    </div>
  );
}