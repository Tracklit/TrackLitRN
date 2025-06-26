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
  User,
  UserCheck,
  Settings, 
  Crown, 
  Award, 
  Clock,
  Dumbbell, 
  MessagesSquare, 
  Coins,
  BookOpen,
  Brain,
  Shield
} from "lucide-react";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
  badge?: React.ReactNode;
}

function NavItem({ href, icon, children, isActive, badge }: NavItemProps) {
  return (
    <li>
      <Link 
        href={href} 
        className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
          isActive 
            ? "bg-primary text-primary-foreground" 
            : "text-gray-300 hover:bg-gray-800 hover:text-white"
        )}
      >
        {icon}
        <div className="flex items-center justify-between w-full">
          <span>{children}</span>
          {badge && badge}
        </div>
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
      "flex flex-col bg-gray-900 border-r border-gray-700 w-full h-screen overflow-y-auto",
      isMobile ? "block md:hidden" : "hidden md:flex"
    )}>
      <div className="p-4">
        <div className="bg-gray-800/50 rounded-lg p-3 mb-6">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium">
              {getInitials(user.name)}
            </div>
            <div>
              <p className="font-medium text-sm text-white">{user.name}</p>
              <p className="text-xs text-gray-400">{user.role || 'admin'}</p>
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
            <p className="text-xs text-gray-400 px-3 font-medium">TRAINING</p>
          </div>
          <NavItem 
            href="/practice" 
            icon={<Dumbbell className="h-5 w-5" />} 
            isActive={location.startsWith('/practice')}
          >
            Practice
          </NavItem>
          <NavItem 
            href="/programs" 
            icon={<BookOpen className="h-5 w-5" />} 
            isActive={location === '/programs'}
          >
            Programs
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
            <p className="text-xs text-gray-400 px-3 font-medium">COMPETITION</p>
          </div>
          {/* World Athletics Competition Calendar */}
          <NavItem 
            href="/competitions" 
            icon={<Calendar className="h-5 w-5" />} 
            isActive={location === '/competitions'}
          >
            Competition Calendar
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
            href="/connections" 
            icon={<UserCheck className="h-5 w-5" />} 
            isActive={location === '/connections'}
          >
            Connections
          </NavItem>
          <NavItem 
            href="/conversations" 
            icon={<MessagesSquare className="h-5 w-5" />} 
            isActive={location === '/conversations' || location.startsWith('/messages/')}
          >
            Messages
          </NavItem>
          <NavItem 
            href="/chat" 
            icon={<Users className="h-5 w-5" />} 
            isActive={location === '/chat'}
          >
            Group Chat
          </NavItem>
          <NavItem 
            href="/athletes" 
            icon={<Users className="h-5 w-5" />} 
            isActive={location === '/athletes'}
          >
            Athletes
          </NavItem>
          <NavItem 
            href="/coaches" 
            icon={<Award className="h-5 w-5" />} 
            isActive={location === '/coaches'}
          >
            Coaches
          </NavItem>
          <NavItem 
            href="/groups" 
            icon={<Users className="h-5 w-5" />} 
            isActive={location === '/groups'}
          >
            Groups
          </NavItem>
          
          {/* AI Section */}
          <div className="pt-4 pb-2">
            <p className="text-xs text-gray-400 px-3 font-medium">AI</p>
          </div>
          <NavItem 
            href="/sprinthia" 
            icon={<Brain className="h-5 w-5" />} 
            isActive={location === '/sprinthia'}
          >
            Sprinthia
          </NavItem>
          
          {/* Account Section */}
          <div className="pt-4 pb-2">
            <p className="text-xs text-darkGray px-3 font-medium">ACCOUNT</p>
          </div>
          <NavItem 
            href="/athlete-profile" 
            icon={<User className="h-5 w-5" />} 
            isActive={location === '/athlete-profile'}
          >
            Athlete Profile
          </NavItem>
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
          
          {/* Admin Section - Only show for admin users */}
          {user.role === 'admin' && (
            <>
              <div className="pt-4 pb-2">
                <p className="text-xs text-darkGray px-3 font-medium">ADMIN</p>
              </div>
              <NavItem 
                href="/admin-panel" 
                icon={<Shield className="h-5 w-5" />} 
                isActive={location === '/admin-panel'}
              >
                Admin Panel
              </NavItem>
            </>
          )}
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
