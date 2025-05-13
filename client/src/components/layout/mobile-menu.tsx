import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Calendar, 
  Trophy, 
  LineChart, 
  Users, 
  Settings, 
  Crown, 
  Award, 
  Clock,
  Dumbbell, 
  MessagesSquare, 
  Coins
} from "lucide-react";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
}

function NavItem({ href, icon, children, isActive, onClick }: NavItemProps) {
  return (
    <li>
      <Link 
        href={href} 
        onClick={onClick}
        className={cn(
          "flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium transition-colors",
          isActive 
            ? "bg-primary/10 text-primary" 
            : "text-darkGray hover:bg-lightGray"
        )}
      >
        {icon}
        <span>{children}</span>
      </Link>
    </li>
  );
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { user } = useAuth();
  const [location] = useLocation();

  if (!user) return null;
  
  // If not open, don't render anything
  if (!isOpen) return null;
  
  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="fixed top-0 left-0 bottom-0 w-[280px] bg-white dark:bg-background z-50 shadow-xl md:hidden">
        <div className="p-4">
          <div className="bg-primary/5 rounded-lg p-3 mb-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-secondary text-white flex items-center justify-center font-medium">
                {getInitials(user.name)}
              </div>
              <div>
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.role || 'Athlete'}</p>
              </div>
            </div>
          </div>
          
          <ul className="space-y-1">
            <NavItem 
              href="/" 
              icon={<Home className="h-5 w-5" />} 
              isActive={location === '/'}
              onClick={onClose}
            >
              Dashboard
            </NavItem>
            
            {/* Training Section */}
            <div className="pt-4 pb-2">
              <p className="text-xs text-darkGray px-3 font-medium">TRAINING</p>
            </div>
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
            
            {/* Competition Section */}
            <div className="pt-4 pb-2">
              <p className="text-xs text-darkGray px-3 font-medium">COMPETITION</p>
            </div>
            <NavItem 
              href="/calendar" 
              icon={<Calendar className="h-5 w-5" />} 
              isActive={location === '/calendar'}
              onClick={onClose}
            >
              Calendar
            </NavItem>
            <NavItem 
              href="/meets" 
              icon={<Trophy className="h-5 w-5" />} 
              isActive={location === '/meets'}
              onClick={onClose}
            >
              Meets
            </NavItem>
            <NavItem 
              href="/results" 
              icon={<LineChart className="h-5 w-5" />} 
              isActive={location === '/results'}
              onClick={onClose}
            >
              Results
            </NavItem>
            
            {/* Social Section */}
            <div className="pt-4 pb-2">
              <p className="text-xs text-darkGray px-3 font-medium">SOCIAL</p>
            </div>
            <NavItem 
              href="/clubs" 
              icon={<Users className="h-5 w-5" />} 
              isActive={location.startsWith('/clubs')}
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
            
            {/* Account Section */}
            <div className="pt-4 pb-2">
              <p className="text-xs text-darkGray px-3 font-medium">ACCOUNT</p>
            </div>
            <NavItem 
              href="/spikes" 
              icon={<Coins className="h-5 w-5" />} 
              isActive={location === '/spikes'}
              onClick={onClose}
            >
              Spikes
            </NavItem>
            <NavItem 
              href="/profile" 
              icon={<Settings className="h-5 w-5" />} 
              isActive={location === '/profile'}
              onClick={onClose}
            >
              Settings
            </NavItem>
          </ul>
        </div>
        
        {!user.isPremium && (
          <div className="mt-auto p-4">
            <div className="bg-darkNavy rounded-lg p-4 text-white">
              <div className="flex items-center space-x-2 mb-2">
                <Crown className="h-5 w-5 text-accent" />
                <h3 className="font-medium">Go Premium</h3>
              </div>
              <p className="text-xs opacity-80 mb-3">Unlock AI coaching, calendar sharing and more.</p>
              <button className="w-full bg-accent text-darkNavy py-2 rounded text-sm font-medium">
                Upgrade Now
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}