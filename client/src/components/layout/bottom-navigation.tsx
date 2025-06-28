import { Link, useLocation } from "wouter";
import { 
  Home, 
  Calendar, 
  BookOpen, 
  Trophy, 
  Clock, 
  Star,
  Users,
  MessageCircle
} from "lucide-react";
import chatBubbleIcon from "@assets/IMG_4748_1751143315595.png";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useKeyboard } from "@/contexts/keyboard-context";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

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
    title: "Chat", 
    href: "/chat", 
    icon: <img src={chatBubbleIcon} alt="Chat" className="h-7 w-7 brightness-0 invert -ml-1" />,
    key: "chat"
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
  const handleClick = () => {
    if (onClick) onClick();
  };

  return (
    <Link href={href}>
      <div 
        className="flex flex-col items-center justify-center h-full px-2 cursor-pointer transition-colors relative"
        onClick={handleClick}
      >
        <div className={cn(
          "transition-colors duration-200",
          isActive ? "text-accent" : "text-gray-300"
        )}>
          <div className="flex items-center justify-center">
            {icon}
          </div>
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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleChatClick = () => {
    // Handle chat navigation
  };

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
        "fixed bottom-0 left-0 right-0 z-10 transition-transform duration-300 ease-in-out",
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
              onClick={item.key === 'chat' ? handleChatClick : undefined}
              showBadge={false}
              badgeCount={undefined}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}
