import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
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
  UserCircle,
  X,
  Menu
} from 'lucide-react';

export function SimpleMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  // Close menu when location changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Control body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!user) return null;

  const handleLogout = () => {
    logoutMutation.mutate();
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 md:hidden">
        <div 
          className="flex items-center justify-between p-2 shadow-md"
          style={{ backgroundColor: 'hsl(220 40% 15%)' }}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
            <span className="sr-only">{isOpen ? 'Close menu' : 'Open menu'}</span>
          </Button>
          
          <div className="h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
            {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Mobile Menu and Backdrop */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Panel */}
          <div 
            className="fixed top-0 left-0 h-full w-64 bg-background z-50 overflow-y-auto md:hidden"
            style={{ backgroundColor: 'hsl(220 40% 15%)' }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-foreground">TrackLit</h2>
              <button 
                type="button"
                className="p-1 text-foreground"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <nav className="p-2">
              <ul className="space-y-1">
                <MenuItem 
                  href="/" 
                  icon={<Home className="h-5 w-5" />}
                  isActive={location === '/'}
                >
                  Dashboard
                </MenuItem>
                
                <MenuSectionTitle>Training</MenuSectionTitle>
                <MenuItem 
                  href="/practice" 
                  icon={<Dumbbell className="h-5 w-5" />}
                  isActive={location.startsWith('/practice')}
                >
                  Practice
                </MenuItem>
                <MenuItem 
                  href="/training-tools" 
                  icon={<Clock className="h-5 w-5" />}
                  isActive={location === '/training-tools'}
                >
                  Training Tools
                </MenuItem>
                <MenuItem 
                  href="/programs" 
                  icon={<BookOpen className="h-5 w-5" />}
                  isActive={location.startsWith('/programs')}
                >
                  Programs
                </MenuItem>
                
                <MenuSectionTitle>Competition</MenuSectionTitle>
                <MenuItem 
                  href="/meets" 
                  icon={<Trophy className="h-5 w-5" />}
                  isActive={location === '/meets'}
                >
                  Meets
                </MenuItem>
                <MenuItem 
                  href="/calendar" 
                  icon={<Calendar className="h-5 w-5" />}
                  isActive={location === '/calendar'}
                >
                  Calendar
                </MenuItem>
                <MenuItem 
                  href="/results" 
                  icon={<LineChart className="h-5 w-5" />}
                  isActive={location === '/results'}
                >
                  Results
                </MenuItem>
                
                <MenuSectionTitle>Social</MenuSectionTitle>
                <MenuItem 
                  href="/clubs" 
                  icon={<Users className="h-5 w-5" />}
                  isActive={location.startsWith('/club')}
                >
                  Clubs
                </MenuItem>
                <MenuItem 
                  href="/messages" 
                  icon={<MessagesSquare className="h-5 w-5" />}
                  isActive={location === '/messages'}
                >
                  Messages
                </MenuItem>
                <MenuItem 
                  href="/coaches" 
                  icon={<Award className="h-5 w-5" />}
                  isActive={location === '/coaches'}
                >
                  Coaches
                </MenuItem>
                
                <MenuSectionTitle>Account</MenuSectionTitle>
                <MenuItem 
                  href="/spikes" 
                  icon={<Coins className="h-5 w-5" />}
                  isActive={location === '/spikes'}
                >
                  Spikes
                </MenuItem>
                <MenuItem 
                  href="/athlete-profile" 
                  icon={<UserCircle className="h-5 w-5" />}
                  isActive={location === '/athlete-profile'}
                >
                  Athlete Profile
                </MenuItem>
                <MenuItem 
                  href="/profile" 
                  icon={<Settings className="h-5 w-5" />}
                  isActive={location === '/profile'}
                >
                  Settings
                </MenuItem>
              </ul>
            </nav>
            
            <div className="p-4 border-t border-gray-700 mt-4">
              <button 
                className="flex items-center w-full space-x-2 px-3 py-2 rounded-md text-red-400 hover:bg-gray-700"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function MenuItem({ 
  href, 
  icon, 
  children, 
  isActive 
}: { 
  href: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  isActive: boolean;
}) {
  return (
    <li>
      <Link 
        href={href}
        className={`flex items-center space-x-3 px-3 py-2 rounded-md ${
          isActive 
            ? 'bg-primary/20 text-primary' 
            : 'text-foreground hover:bg-gray-700'
        }`}
      >
        {icon}
        <span>{children}</span>
      </Link>
    </li>
  );
}

function MenuSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-4 pb-2">
      <p className="text-xs uppercase text-muted-foreground px-3">
        {children}
      </p>
    </div>
  );
}