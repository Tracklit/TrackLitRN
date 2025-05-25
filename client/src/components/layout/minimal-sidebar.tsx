import { Link, useLocation } from "wouter";
import { 
  Home, 
  Users, 
  Calendar, 
  Settings, 
  LineChart,
  Dumbbell,
  Clock,
  Trophy,
  MessagesSquare,
  Award,
  Coins,
  LogOut,
  BookOpen,
  Clipboard,
  UserCircle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

function NavItem({ href, icon, children, isActive, onClick }: { 
  href: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link 
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium transition-all",
        isActive 
          ? "bg-primary/20 text-primary" 
          : "text-foreground hover:bg-muted"
      )}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

export function DesktopSidebar() {
  const [location] = useLocation();
  
  return (
    <aside className="hidden md:flex flex-col bg-white border-r border-gray-200 w-64 h-screen fixed top-0 left-0 z-20">
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">TrackLit</h2>
        
        <ul className="space-y-1">
          <NavItem 
            href="/" 
            icon={<Home className="h-5 w-5" />} 
            isActive={location === '/'}
          >
            Dashboard
          </NavItem>
          <NavItem 
            href="/clubs" 
            icon={<Users className="h-5 w-5" />} 
            isActive={location.includes('/club')}
          >
            Clubs
          </NavItem>
          <NavItem 
            href="/calendar" 
            icon={<Calendar className="h-5 w-5" />} 
            isActive={location === '/calendar'}
          >
            Calendar
          </NavItem>
          <NavItem 
            href="/results" 
            icon={<LineChart className="h-5 w-5" />} 
            isActive={location === '/results'}
          >
            Results
          </NavItem>
          <NavItem 
            href="/programs" 
            icon={<BookOpen className="h-5 w-5" />} 
            isActive={location.startsWith('/programs') && !location.includes('assigned')}
          >
            Programs
          </NavItem>
          <NavItem 
            href="/assigned-programs" 
            icon={<Clipboard className="h-5 w-5" />} 
            isActive={location.includes('assigned-programs')}
          >
            Assigned Programs
          </NavItem>
          <NavItem 
            href="/athlete-profile" 
            icon={<UserCircle className="h-5 w-5" />} 
            isActive={location === '/athlete-profile'}
          >
            Athlete Profile
          </NavItem>
          <NavItem 
            href="/profile" 
            icon={<Settings className="h-5 w-5" />} 
            isActive={location === '/profile'}
          >
            Settings
          </NavItem>
        </ul>
      </div>
    </aside>
  );
}

import { InstallAppButton } from "@/components/install-app-button";

export function MobileSidebarButton({ onClick, isOpen }: { onClick: () => void, isOpen?: boolean }) {
  const { user } = useAuth();
  
  if (!user) return null;
  
  // Create a wrapper function for the click event
  const handleButtonClick = (e: React.MouseEvent) => {
    // Prevent default action
    e.preventDefault();
    // Stop event bubbling
    e.stopPropagation();
    // Call the onClick function passed as prop
    onClick();
    // Log to verify the click is registered
    console.log("Menu button clicked", { isOpen });
  };
  
  return (
    <div className="fixed top-0 left-0 right-0 z-[60]">
      <div style={{ backgroundColor: 'hsl(220 40% 15%)' }} className="flex items-center justify-between p-1 shadow-md">
        <div className="flex items-center">
          <button 
            onClick={handleButtonClick}
            className="text-foreground p-2 cursor-pointer"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            type="button"
          >
            <span className="sr-only">{isOpen ? 'Close' : 'Open'} menu</span>
            {isOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Install App Button */}
          <InstallAppButton />
          
          {/* User Profile */}
          <div className="h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
            {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  if (!user) return null;

  const handleLogout = () => {
    logoutMutation.mutate();
    onClose();
  };
  
  // Debug output to verify the component is receiving the correct props
  console.log("MobileSidebar rendered with isOpen:", isOpen);
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="md:hidden fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
        style={{ 
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          visibility: isOpen ? 'visible' : 'hidden'
        }}
      />
      
      {/* Sidebar */}
      <div 
        className="md:hidden fixed top-0 left-0 h-full w-64 z-50 shadow-lg transform transition-transform duration-300 ease-in-out" 
        style={{ 
          backgroundColor: 'hsl(220 40% 15%)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          overscrollBehavior: 'contain',
          visibility: isOpen ? 'visible' : 'hidden' // Ensure it's visible when open
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center items-center p-4 border-b border-sidebar-border">
          <h2 className="text-lg font-bold text-foreground">TrackLit</h2>
        </div>
        
        <div 
          className="flex-1 px-2 py-4 overflow-y-auto h-[calc(100vh-140px)]" 
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            msOverflowStyle: 'none'
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div className="space-y-1">
            <NavItem 
              href="/" 
              icon={<Home className="h-5 w-5" />} 
              isActive={location === '/'}
              onClick={onClose}
            >
              Dashboard
            </NavItem>
          </div>

          <div className="pt-4 pb-2">
            <p className="text-xs text-muted-foreground px-3 font-medium uppercase">Training</p>
          </div>
          <div className="space-y-1">
            <NavItem 
              href="/practice" 
              icon={<Dumbbell className="h-5 w-5" />} 
              isActive={location.startsWith('/practice')}
              onClick={onClose}
            >
              Practice
            </NavItem>
            <NavItem 
              href="/training-tools" 
              icon={<Clock className="h-5 w-5" />} 
              isActive={location === '/training-tools'}
              onClick={onClose}
            >
              Training Tools
            </NavItem>
            <NavItem 
              href="/programs" 
              icon={<BookOpen className="h-5 w-5" />} 
              isActive={location.startsWith('/programs')}
              onClick={onClose}
            >
              Programs
            </NavItem>
          </div>

          <div className="pt-4 pb-2">
            <p className="text-xs text-muted-foreground px-3 font-medium uppercase">Competition</p>
          </div>
          <div className="space-y-1">
            <NavItem 
              href="/meets" 
              icon={<Trophy className="h-5 w-5" />} 
              isActive={location === '/meets'}
              onClick={onClose}
            >
              Meets
            </NavItem>
            <NavItem 
              href="/calendar" 
              icon={<Calendar className="h-5 w-5" />} 
              isActive={location === '/calendar'}
              onClick={onClose}
            >
              Calendar
            </NavItem>
            <NavItem 
              href="/results" 
              icon={<LineChart className="h-5 w-5" />} 
              isActive={location === '/results'}
              onClick={onClose}
            >
              Results
            </NavItem>
          </div>

          <div className="pt-4 pb-2">
            <p className="text-xs text-muted-foreground px-3 font-medium uppercase">Social</p>
          </div>
          <div className="space-y-1">
            <NavItem 
              href="/clubs" 
              icon={<Users className="h-5 w-5" />} 
              isActive={location.startsWith('/club')}
              onClick={onClose}
            >
              Clubs
            </NavItem>
            <NavItem 
              href="/messages" 
              icon={<MessagesSquare className="h-5 w-5" />} 
              isActive={location === '/messages'}
              onClick={onClose}
            >
              Messages
            </NavItem>
            <NavItem 
              href="/coaches" 
              icon={<Award className="h-5 w-5" />} 
              isActive={location === '/coaches'}
              onClick={onClose}
            >
              Coaches
            </NavItem>
          </div>

          <div className="pt-4 pb-2">
            <p className="text-xs text-muted-foreground px-3 font-medium uppercase">Account</p>
          </div>
          <div className="space-y-1">
            <NavItem 
              href="/spikes" 
              icon={<Coins className="h-5 w-5" />} 
              isActive={location === '/spikes'}
              onClick={onClose}
            >
              Spikes
            </NavItem>
            <NavItem 
              href="/athlete-profile" 
              icon={<UserCircle className="h-5 w-5" />} 
              isActive={location === '/athlete-profile'}
              onClick={onClose}
            >
              Athlete Profile
            </NavItem>
            <NavItem 
              href="/profile" 
              icon={<Settings className="h-5 w-5" />} 
              isActive={location === '/profile'}
              onClick={onClose}
            >
              Settings
            </NavItem>
          </div>
        </div>
        
        <div className="p-4 border-t border-sidebar-border">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full space-x-2 px-3 py-2.5 rounded-lg font-medium text-destructive hover:bg-muted transition-all"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}