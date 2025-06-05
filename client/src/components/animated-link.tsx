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
    
    // Create overlay for the new page
    const overlay = document.createElement('div');
    overlay.className = 'page-overlay slide-in-right';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--background);
      z-index: 9999;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    `;
    
    document.body.appendChild(overlay);
    
    // Trigger the slide-in animation
    requestAnimationFrame(() => {
      overlay.style.transform = 'translateX(0)';
    });
    
    // Navigate after the overlay covers the screen
    setTimeout(() => {
      navigate(to);
      // Remove overlay after navigation
      setTimeout(() => {
        document.body.removeChild(overlay);
        setIsAnimating(false);
      }, 50);
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