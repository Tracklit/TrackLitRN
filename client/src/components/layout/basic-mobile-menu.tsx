import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { 
  Home, Menu, X, Settings, Calendar, Trophy, LineChart, Users, 
  MessagesSquare, Award, Coins, UserCircle, LogOut, BookOpen, 
  Dumbbell, Clock
} from 'lucide-react';

export function BasicMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  return (
    <div className="md:hidden">
      {/* Header with menu button */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-[#192742] shadow-md">
        <div className="flex items-center justify-between p-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded p-2 text-white hover:bg-blue-800"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
              {user.name ? user.name[0].toUpperCase() : user.username[0].toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[90] bg-black/50" onClick={() => setIsOpen(false)} />
      )}

      {/* Mobile menu panel */}
      <div 
        className={`fixed top-0 left-0 z-[99] h-full w-64 bg-[#192742] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-[56px] items-center justify-center border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">TrackLit</h1>
        </div>

        <nav className="mt-4 px-3">
          <NavItem href="/" icon={<Home size={18} />} active={location === '/'} onClick={() => setIsOpen(false)}>
            Dashboard
          </NavItem>

          <NavHeading>Training</NavHeading>
          <NavItem href="/practice" icon={<Dumbbell size={18} />} active={location.startsWith('/practice')} onClick={() => setIsOpen(false)}>
            Practice
          </NavItem>
          <NavItem href="/training-tools" icon={<Clock size={18} />} active={location === '/training-tools'} onClick={() => setIsOpen(false)}>
            Training Tools
          </NavItem>
          <NavItem href="/programs" icon={<BookOpen size={18} />} active={location.startsWith('/programs')} onClick={() => setIsOpen(false)}>
            Programs
          </NavItem>

          <NavHeading>Competition</NavHeading>
          <NavItem href="/meets" icon={<Trophy size={18} />} active={location === '/meets'} onClick={() => setIsOpen(false)}>
            Meets
          </NavItem>
          <NavItem href="/calendar" icon={<Calendar size={18} />} active={location === '/calendar'} onClick={() => setIsOpen(false)}>
            Calendar
          </NavItem>
          <NavItem href="/results" icon={<LineChart size={18} />} active={location === '/results'} onClick={() => setIsOpen(false)}>
            Results
          </NavItem>

          <NavHeading>Social</NavHeading>
          <NavItem href="/clubs" icon={<Users size={18} />} active={location.startsWith('/club')} onClick={() => setIsOpen(false)}>
            Clubs
          </NavItem>
          <NavItem href="/messages" icon={<MessagesSquare size={18} />} active={location === '/messages'} onClick={() => setIsOpen(false)}>
            Messages
          </NavItem>
          <NavItem href="/coaches" icon={<Award size={18} />} active={location === '/coaches'} onClick={() => setIsOpen(false)}>
            Coaches
          </NavItem>

          <NavHeading>Account</NavHeading>
          <NavItem href="/spikes" icon={<Coins size={18} />} active={location === '/spikes'} onClick={() => setIsOpen(false)}>
            Spikes
          </NavItem>
          <NavItem href="/athlete-profile" icon={<UserCircle size={18} />} active={location === '/athlete-profile'} onClick={() => setIsOpen(false)}>
            Athlete Profile
          </NavItem>
          <NavItem href="/profile" icon={<Settings size={18} />} active={location === '/profile'} onClick={() => setIsOpen(false)}>
            Settings
          </NavItem>

          <div className="mt-6 border-t border-gray-700 pt-4">
            <button
              onClick={() => {
                logoutMutation.mutate();
                setIsOpen(false);
              }}
              className="flex w-full items-center rounded-md px-3 py-2 text-red-400 hover:bg-gray-700"
            >
              <LogOut size={18} className="mr-3" />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}

function NavItem({ 
  href, 
  icon, 
  children, 
  active, 
  onClick 
}: { 
  href: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center rounded-md px-3 py-2 mb-1 ${
        active ? 'bg-blue-800 text-white' : 'text-gray-300 hover:bg-gray-700'
      }`}
    >
      <span className="mr-3">{icon}</span>
      <span>{children}</span>
    </Link>
  );
}

function NavHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-4 mb-2 px-3 text-xs font-semibold uppercase text-gray-400">
      {children}
    </h3>
  );
}