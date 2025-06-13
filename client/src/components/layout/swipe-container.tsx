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
    currentTransform,
    isTransitioning,
    swipeProgress,
    nextPageDirection
  } = useSwipeNavigation(navItems, currentIndex);

  const getNextPageComponent = () => {
    if (nextPageDirection === 'left' && currentIndex < navItems.length - 1) {
      return navItems[currentIndex + 1].component || null;
    } else if (nextPageDirection === 'right' && currentIndex > 0) {
      return navItems[currentIndex - 1].component || null;
    }
    return null;
  };

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Current page */}
      <div
        className="w-full"
        style={{
          transform: `translateX(${currentTransform}px)`,
          transition: isTransitioning ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
        }}
      >
        {children}
      </div>

      {/* Next page preview - actual page content */}
      {nextPageDirection && (swipeProgress > 0 || isTransitioning) && (
        <div
          className="absolute top-0 w-full h-full bg-background"
          style={{
            left: nextPageDirection === 'left' ? '100%' : '-100%',
            transform: isTransitioning 
              ? `translateX(${nextPageDirection === 'left' ? '-100%' : '100%'})` 
              : `translateX(${nextPageDirection === 'left' ? -swipeProgress * 100 : swipeProgress * 100}%)`,
            transition: isTransitioning ? 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
            {getNextPageComponent()}
          </div>
        </div>
      )}

      {/* Swipe indicator */}
      {swipeProgress > 0 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-xs">
          {Math.round(swipeProgress * 100)}%
        </div>
      )}
    </div>
  );
}