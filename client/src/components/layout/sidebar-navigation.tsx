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
}

function NavItem({ href, icon, children, isActive }: NavItemProps) {
  return (
    <li>
      <Link 
        href={href} 
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

export function SidebarNavigation({ isMobile = false }: { isMobile?: boolean }) {
  const { user } = useAuth();
  const [location] = useLocation();

  if (!user) return null;
  
  return (
    <aside className={cn(
      "flex flex-col bg-white dark:bg-background border-r border-lightGray dark:border-zinc-800 w-64 h-screen fixed top-0 left-0 z-20 pt-8 md:pt-16",
      isMobile ? "block md:hidden" : "hidden md:flex"
    )}>
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
          >
            Practice
          </NavItem>
          <NavItem 
            href="/training-tools" 
            icon={<Clock className="h-5 w-5" />} 
            isActive={location === '/training-tools'}
          >
            Training Tools
          </NavItem>
          
          {/* Competition Section */}
          <div className="pt-4 pb-2">
            <p className="text-xs text-darkGray px-3 font-medium">COMPETITION</p>
          </div>
          <NavItem 
            href="/meets" 
            icon={<Calendar className="h-5 w-5" />} 
            isActive={location === '/meets'}
          >
            <div className="flex items-center justify-between w-full">
              <span>Calendar</span>
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 text-black text-xs px-1.5 py-0.5 rounded font-bold">
                PRO
              </span>
            </div>
          </NavItem>
          <NavItem 
            href="/meets" 
            icon={<Trophy className="h-5 w-5" />} 
            isActive={location === '/meets'}
          >
            Meets
          </NavItem>
          <NavItem 
            href="/results" 
            icon={<LineChart className="h-5 w-5" />} 
            isActive={location === '/results'}
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
          >
            Clubs
          </NavItem>
          <NavItem 
            href="/messages" 
            icon={<MessagesSquare className="h-5 w-5" />} 
            isActive={location === '/messages'}
          >
            Messages
          </NavItem>
          <NavItem 
            href="/coaches" 
            icon={<Award className="h-5 w-5" />} 
            isActive={location === '/coaches'}
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
          >
            Spikes
          </NavItem>
          <NavItem 
            href="/subscription" 
            icon={<Crown className="h-5 w-5" />} 
            isActive={location === '/subscription'}
          >
            Subscription
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
    </aside>
  );
}
