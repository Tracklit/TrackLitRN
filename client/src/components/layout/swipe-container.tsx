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
    isNavigating
  } = useSwipeNavigation(navItems, currentIndex);

  // Calculate transform for the three-page carousel
  const getTransform = () => {
    // Always position current page in the middle (index 1 of 3-page layout)
    // Base position moves the current page to center, deltaX adds swipe offset
    return `translateX(calc(-100vw + ${deltaX}px))`;
  };

  return (
    <div 
      className={`relative overflow-hidden ${className}`}
      style={{ touchAction: 'pan-y' }}
    >
      <div
        ref={containerRef}
        className="flex"
        style={{ 
          transform: getTransform(),
          width: '300vw', // Three pages: previous, current, next
          transition: (isDragging || isNavigating) ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }}
      >
        {/* Previous page */}
        <div className="w-screen flex-shrink-0">
          {currentIndex > 0 && navItems[currentIndex - 1]?.component ? (
            navItems[currentIndex - 1].component
          ) : (
            <div className="w-full h-full bg-background" />
          )}
        </div>

        {/* Current page */}
        <div className="w-screen flex-shrink-0">
          {children}
        </div>

        {/* Next page */}
        <div className="w-screen flex-shrink-0">
          {currentIndex < navItems.length - 1 && navItems[currentIndex + 1]?.component ? (
            navItems[currentIndex + 1].component
          ) : (
            <div className="w-full h-full bg-background" />
          )}
        </div>
      </div>

      {/* Swipe progress indicator */}
      {isDragging && Math.abs(deltaX) > 20 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-xs z-10">
          {Math.round((Math.abs(deltaX) / window.innerWidth) * 100)}%
        </div>
      )}
    </div>
  );
}