import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import {
  Home, Calendar, Settings, LineChart, Dumbbell, Clock, Trophy,
  MessagesSquare, Award, Coins, LogOut, BookOpen, UserCircle, Users
} from 'lucide-react';

export function SimpleHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    console.log("Menu toggled, new state:", !isMenuOpen);
  };

  return (
    <>
      {/* Fixed header with menu button */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 shadow-md">
        <div className="flex items-center justify-between px-4 py-2">
          <button 
            onClick={toggleMenu}
            className="bg-blue-600 text-white px-3 py-1 rounded-md"
          >
            Menu
          </button>
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-500 text-white rounded-full flex items-center justify-center">
              {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu panel */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setIsMenuOpen(false)}></div>
          
          {/* Menu */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-800 text-white">
            <div className="px-4 pt-5 pb-4 flex">
              <button 
                className="ml-auto bg-gray-700 rounded-md p-2 text-gray-400 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mt-5 flex-1 h-0 overflow-y-auto">
              <nav className="px-2 space-y-1">
                <NavLink href="/" active={location === '/'} icon={<Home className="mr-3 h-5 w-5" />}>
                  Dashboard
                </NavLink>
                
                <div className="pt-4 mt-4 border-t border-gray-700">
                  <h3 className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Training
                  </h3>
                  <div className="mt-2 space-y-1">
                    <NavLink href="/practice" active={location.startsWith('/practice')} icon={<Dumbbell className="mr-3 h-5 w-5" />}>
                      Practice
                    </NavLink>
                    <NavLink href="/training-tools" active={location === '/training-tools'} icon={<Clock className="mr-3 h-5 w-5" />}>
                      Training Tools
                    </NavLink>
                    <NavLink href="/programs" active={location.startsWith('/programs')} icon={<BookOpen className="mr-3 h-5 w-5" />}>
                      Programs
                    </NavLink>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-700">
                  <h3 className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Competition
                  </h3>
                  <div className="mt-2 space-y-1">
                    <NavLink href="/meets" active={location === '/meets'} icon={<Trophy className="mr-3 h-5 w-5" />}>
                      Meets
                    </NavLink>
                    <NavLink href="/calendar" active={location === '/calendar'} icon={<Calendar className="mr-3 h-5 w-5" />}>
                      Calendar
                    </NavLink>
                    <NavLink href="/results" active={location === '/results'} icon={<LineChart className="mr-3 h-5 w-5" />}>
                      Results
                    </NavLink>
                  </div>
                </div>
                
                <div className="pt-4 mt-4 border-t border-gray-700">
                  <h3 className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Social
                  </h3>
                  <div className="mt-2 space-y-1">
                    <NavLink href="/clubs" active={location.startsWith('/club')} icon={<Users className="mr-3 h-5 w-5" />}>
                      Clubs
                    </NavLink>
                    <NavLink href="/messages" active={location === '/messages'} icon={<MessagesSquare className="mr-3 h-5 w-5" />}>
                      Messages
                    </NavLink>
                    <NavLink href="/coaches" active={location === '/coaches'} icon={<Award className="mr-3 h-5 w-5" />}>
                      Coaches
                    </NavLink>
                  </div>
                </div>
                
                <div className="pt-4 mt-4 border-t border-gray-700">
                  <h3 className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Account
                  </h3>
                  <div className="mt-2 space-y-1">
                    <NavLink href="/spikes" active={location === '/spikes'} icon={<Coins className="mr-3 h-5 w-5" />}>
                      Spikes
                    </NavLink>
                    <NavLink href="/athlete-profile" active={location === '/athlete-profile'} icon={<UserCircle className="mr-3 h-5 w-5" />}>
                      Athlete Profile
                    </NavLink>
                    <NavLink href="/profile" active={location === '/profile'} icon={<Settings className="mr-3 h-5 w-5" />}>
                      Settings
                    </NavLink>
                    
                    <button
                      onClick={() => {
                        logoutMutation.mutate();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center px-3 py-2 text-sm font-medium text-red-400 rounded-md hover:bg-gray-700 w-full mt-4"
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      Logout
                    </button>
                  </div>
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NavLink({ 
  href, 
  active, 
  children, 
  icon 
}: { 
  href: string; 
  active: boolean; 
  children: React.ReactNode; 
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
        active ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}