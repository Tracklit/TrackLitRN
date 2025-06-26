import { Link, useLocation } from "wouter";
import { 
  Home, 
  Calendar, 
  BookOpen, 
  Trophy, 
  Clock, 
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useKeyboard } from "@/contexts/keyboard-context";

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
    icon: (
      <svg 
        className="h-5 w-5 text-yellow-400 fill-yellow-400" 
        viewBox="0 0 24 24" 
        fill="currentColor"
      >
        <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z" />
      </svg>
    ),
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
  const handleClick = () => {
    if (onClick) onClick();
  };

  return (
    <Link href={href}>
      <div 
        className="flex flex-col items-center justify-center h-full px-2 cursor-pointer transition-colors"
        onClick={handleClick}
      >
        <div className={cn(
          "transition-colors duration-200",
          isActive ? "text-accent" : "text-gray-300"
        )}>
          <div className="w-5 h-5">
            {icon}
          </div>
        </div>
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
        "fixed bottom-0 left-0 right-0 z-10 md:hidden transition-transform duration-300 ease-in-out",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <nav className="bg-gray-900 shadow-lg border-t border-gray-700 h-14">
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
