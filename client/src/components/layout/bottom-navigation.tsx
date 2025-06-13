import { Link, useLocation } from "wouter";
import { 
  Home, 
  Calendar, 
  BookOpen, 
  Trophy, 
  Clock, 
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

// Navigation items based on dashboard card order
const navItems = [
  { 
    title: "Dashboard", 
    href: "/", 
    icon: <Home className="h-5 w-5" />,
    key: "dashboard"
  },
  { 
    title: "Practice", 
    href: "/practice", 
    icon: <Calendar className="h-5 w-5" />,
    key: "practice"
  },
  { 
    title: "Programs", 
    href: "/programs", 
    icon: <BookOpen className="h-5 w-5" />,
    key: "programs"
  },
  { 
    title: "Race", 
    href: "/meets", 
    icon: <Trophy className="h-5 w-5" />,
    key: "race"
  },
  { 
    title: "Tools", 
    href: "/training-tools", 
    icon: <Clock className="h-5 w-5" />,
    key: "tools"
  },
  { 
    title: "Sprinthia", 
    href: "/sprinthia", 
    icon: <MessageCircle className="h-5 w-5" />,
    key: "sprinthia"
  }
];

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  isActive: boolean;
  onClick?: () => void;
}

function NavItem({ href, icon, title, isActive, onClick }: NavItemProps) {
  return (
    <Link href={href}>
      <div 
        className="flex flex-col items-center justify-center h-full px-2 cursor-pointer transition-colors"
        onClick={onClick}
      >
        <div className={cn(
          "transition-colors duration-200",
          isActive ? "text-accent" : "text-gray-300"
        )}>
          {icon}
        </div>
        <span className={cn(
          "text-xs mt-1 transition-colors duration-200 font-medium",
          isActive ? "text-accent" : "text-gray-300"
        )}>
          {title}
        </span>
      </div>
    </Link>
  );
}

export function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const [startX, setStartX] = useState<number | null>(null);
  const [startY, setStartY] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Update current index based on location
  useEffect(() => {
    const index = navItems.findIndex(item => {
      if (item.href === "/") {
        return location === "/";
      }
      return location.startsWith(item.href);
    });
    setCurrentIndex(index >= 0 ? index : 0);
  }, [location]);

  // Global touch event handlers
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      setStartX(e.touches[0].clientX);
      setStartY(e.touches[0].clientY);
      console.log('Touch start:', e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (startX === null || startY === null) return;
      
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = startX - endX;
      const diffY = startY - endY;
      
      console.log('Touch end:', endX, endY, 'Diff:', diffX, diffY, 'Current index:', currentIndex);
      
      const threshold = 50; // Reduced minimum swipe distance
      const verticalThreshold = 150; // Increased maximum vertical movement allowed
      
      // Only trigger horizontal swipes if vertical movement is minimal
      if (Math.abs(diffX) > threshold && Math.abs(diffY) < verticalThreshold) {
        console.log('Swipe detected!', diffX > 0 ? 'left' : 'right');
        if (diffX > 0 && currentIndex < navItems.length - 1) {
          // Swipe left - go to next page
          console.log('Navigating to:', navItems[currentIndex + 1].href);
          setLocation(navItems[currentIndex + 1].href);
        } else if (diffX < 0 && currentIndex > 0) {
          // Swipe right - go to previous page
          console.log('Navigating to:', navItems[currentIndex - 1].href);
          setLocation(navItems[currentIndex - 1].href);
        }
      } else {
        console.log('Swipe rejected - not enough horizontal movement or too much vertical');
      }
      
      setStartX(null);
      setStartY(null);
    };

    // Add passive listeners for better performance
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentIndex, setLocation]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden">
      <nav className="bg-darkBlue shadow-lg border-t border-gray-600 h-16">
        <div className="grid grid-cols-6 h-full">
          {navItems.map((item, index) => (
            <NavItem
              key={item.key}
              href={item.href}
              icon={item.icon}
              title={item.title}
              isActive={index === currentIndex}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}
