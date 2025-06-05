import { useLocation } from 'wouter';
import { useState } from 'react';

interface AnimatedLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function AnimatedLink({ to, children, className, onClick, disabled }: AnimatedLinkProps) {
  const [, navigate] = useLocation();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (disabled || isAnimating) return;
    
    if (onClick) onClick();
    
    setIsAnimating(true);
    
    // Add exit animation class
    document.body.classList.add('page-exit');
    
    // Wait for animation to complete before navigating
    setTimeout(() => {
      navigate(to);
      document.body.classList.remove('page-exit');
      setIsAnimating(false);
    }, 300);
  };

  return (
    <a 
      href={to} 
      onClick={handleClick}
      className={className}
      style={{ pointerEvents: disabled || isAnimating ? 'none' : 'auto' }}
    >
      {children}
    </a>
  );
}