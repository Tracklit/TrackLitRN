import { Link, useLocation } from "wouter";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome,
  faCalendarDays,
  faBook,
  faTrophy,
  faImage,
  faStar,
  faShoppingCart,
} from '@fortawesome/free-solid-svg-icons';

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useKeyboard } from "@/contexts/keyboard-context";
import { Badge } from "@/components/ui/badge";

// Navigation items based on dashboard card order
const navItems = [
  { 
    title: "Home", 
    href: "/", 
    icon: <FontAwesomeIcon icon={faHome} className="h-4 w-4" />,
    key: "dashboard"
  },
  { 
    title: "Practice", 
    href: "/practice", 
    icon: <FontAwesomeIcon icon={faCalendarDays} className="h-4 w-4" />,
    key: "practice"
  },
  { 
    title: "Programs", 
    href: "/programs", 
    icon: <FontAwesomeIcon icon={faBook} className="h-4 w-4" />,
    key: "programs"
  },
  { 
    title: "Race", 
    href: "/meets", 
    icon: <FontAwesomeIcon icon={faTrophy} className="h-4 w-4" />,
    key: "race"
  },
  { 
    title: "Tools", 
    href: "/training-tools", 
    icon: <FontAwesomeIcon icon={faImage} className="h-4 w-4" />,
    key: "tools"
  },
  { 
    title: "Sprinthia", 
    href: "/sprinthia", 
    icon: <span className="text-xs font-bold">AI</span>,
    key: "sprinthia"
  }
];

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  isActive: boolean;
  onClick?: () => void;
  showBadge?: boolean;
  badgeCount?: number;
}

function NavItem({ href, icon, title, isActive, onClick, showBadge, badgeCount }: NavItemProps) {
  
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) onClick();
  };

  return (
    <Link href={href}>
      <div 
        className="flex flex-col items-center justify-center h-full px-2 cursor-pointer transition-colors relative"
        onClick={handleClick}
      >
        <div className={cn(
          "transition-colors duration-200 flex flex-col items-center gap-1",
          isActive ? "text-accent" : "text-gray-300"
        )}>
          <div className="flex items-center justify-center">
            {icon}
          </div>
          <span className="font-medium" style={{ fontSize: '8px' }}>{title}</span>
        </div>
        {showBadge && badgeCount && badgeCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs font-medium min-w-[20px] rounded-full"
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </Badge>
        )}
      </div>
    </Link>
  );
}

export function BottomNavigation() {
  const [location] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { isKeyboardVisible } = useKeyboard();

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

  // Handle scroll to show/hide navigation
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        // Scrolling up or at top - show navigation
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past threshold - hide navigation
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Hide completely in private message pages
  const isPrivateMessagePage = location.startsWith('/messages/') && location.split('/').length > 2;
  
  if (isPrivateMessagePage) {
    return null;
  }

  return (
    <div 
      className={cn(
        "fixed left-0 right-0 z-10 transition-transform duration-300 ease-in-out",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
      style={{ bottom: '-5px' }}
    >
      <nav className="bg-gray-900 shadow-lg border-t border-gray-700 h-16 pb-[5px]">
        <div className="grid grid-cols-6 h-full">
          {navItems.map((item, index) => (
            <NavItem
              key={item.key}
              href={item.href}
              icon={item.icon}
              title={item.title}
              isActive={index === currentIndex}
              showBadge={false}
              badgeCount={undefined}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}
