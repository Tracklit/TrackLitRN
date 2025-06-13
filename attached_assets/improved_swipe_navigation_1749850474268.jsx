// ImprovedSwipeContainer.tsx
import { useRef, useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface SwipeContainerProps {
  navItems: Array<{ href: string; title: string; component: React.ReactNode }>;
  currentIndex: number;
}

export function ImprovedSwipeContainer({ navItems, currentIndex }: SwipeContainerProps) {
  const [, setLocation] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [deltaX, setDeltaX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  const handleTouchStart = (e: TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setStartTime(Date.now());
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || startX === null) return;
    const moveX = e.touches[0].clientX;
    setDeltaX(moveX - startX);
  };

  const handleTouchEnd = () => {
    if (!isDragging || startX === null) return;
    const elapsed = Date.now() - startTime;
    const velocity = deltaX / elapsed;

    const threshold = window.innerWidth / 3;
    const absDelta = Math.abs(deltaX);
    let targetIndex = currentIndex;

    if ((deltaX < -threshold || velocity < -0.3) && currentIndex < navItems.length - 1) {
      targetIndex = currentIndex + 1;
    } else if ((deltaX > threshold || velocity > 0.3) && currentIndex > 0) {
      targetIndex = currentIndex - 1;
    }

    setIsDragging(false);
    setDeltaX(0);
    if (targetIndex !== currentIndex) {
      const handler = () => {
        setLocation(navItems[targetIndex].href);
        containerRef.current?.removeEventListener('transitionend', handler);
      };
      containerRef.current?.addEventListener('transitionend', handler);
    }
  };

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  });

  const getTransform = () => {
    return `translateX(calc(${-currentIndex * 100}% + ${deltaX}px))`;
  };

  return (
    <div
      ref={containerRef}
      className="flex w-[200vw] transition-transform duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
      style={{ transform: getTransform() }}
    >
      <div className="w-screen">
        {navItems[currentIndex].component}
      </div>
      <div className="w-screen">
        {navItems[currentIndex + 1]?.component || null}
      </div>
    </div>
  );
}
