import { useSwipeNavigation } from '@/hooks/use-swipe-navigation';

interface SwipeContainerProps {
  children: React.ReactNode;
  navItems: Array<{ href: string; title: string; component?: React.ReactNode }>;
  currentIndex: number;
  className?: string;
}

export function SwipeContainer({ children, navItems, currentIndex, className = "" }: SwipeContainerProps) {
  const {
    containerRef,
    isNavigating,
    navigationDirection
  } = useSwipeNavigation(navItems, currentIndex);

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Current page - always visible */}
      <div
        ref={containerRef}
        className="w-full h-full"
      >
        {children}
      </div>

      {/* Animated incoming page during navigation */}
      {isNavigating && navigationDirection && (
        <div
          className={`absolute top-0 w-full h-full bg-background ${
            navigationDirection === 'left' ? 'animate-slide-in-left' : 'animate-slide-in-right'
          }`}
          style={{
            left: navigationDirection === 'left' ? '100%' : '-100%'
          }}
        >
          {navigationDirection === 'left' && currentIndex < navItems.length - 1 
            ? navItems[currentIndex + 1]?.component 
            : navigationDirection === 'right' && currentIndex > 0
            ? navItems[currentIndex - 1]?.component
            : null}
        </div>
      )}
    </div>
  );
}