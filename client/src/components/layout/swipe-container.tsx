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
    deltaX,
    isDragging,
    isNavigating,
    navigationDirection
  } = useSwipeNavigation(navItems, currentIndex);

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Current page with drag feedback */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{
          transform: `translateX(${deltaX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
      >
        {children}
      </div>

      {/* Preview of next/previous page during drag */}
      {isDragging && Math.abs(deltaX) > 20 && (
        <div
          className="absolute top-0 w-full h-full bg-background"
          style={{
            left: deltaX > 0 ? '-100%' : '100%',
            transform: `translateX(${deltaX > 0 ? deltaX - window.innerWidth : deltaX + window.innerWidth}px)`,
            transition: 'none'
          }}
        >
          {deltaX > 0 && currentIndex > 0 
            ? navItems[currentIndex - 1]?.component 
            : deltaX < 0 && currentIndex < navItems.length - 1
            ? navItems[currentIndex + 1]?.component
            : null}
        </div>
      )}

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