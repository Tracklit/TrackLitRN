import { useLocation } from 'wouter';

interface AnimatedLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function AnimatedLink({ to, children, className, onClick, disabled }: AnimatedLinkProps) {
  const [, navigate] = useLocation();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (disabled) return;
    
    if (onClick) onClick();
    
    // Let Framer Motion handle the transitions
    navigate(to);
  };

  return (
    <a 
      href={to} 
      onClick={handleClick}
      className={className}
      style={{ pointerEvents: disabled ? 'none' : 'auto' }}
    >
      {children}
    </a>
  );
}