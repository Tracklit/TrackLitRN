import { Link, useLocation } from "wouter";
import { 
  Home, 
  Users, 
  Calendar, 
  Settings, 
  LineChart
} from "lucide-react";

function NavItem({ href, icon, children, isActive, onClick }: { 
  href: string; 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <li>
      <Link 
        href={href} 
        onClick={onClick}
        className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg ${
          isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        {icon}
        <span>{children}</span>
      </Link>
    </li>
  );
}

export function DesktopSidebar() {
  const [location] = useLocation();
  
  return (
    <aside className="hidden md:flex flex-col bg-white border-r border-gray-200 w-64 h-screen fixed top-0 left-0 z-20">
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4">Track Pro</h2>
        
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

export function MobileSidebarButton({ onClick }: { onClick: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className="rounded-md p-2 bg-white shadow-md text-gray-700"
    >
      <span className="sr-only">Open menu</span>
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}

export function MobileSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [location] = useLocation();
  
  return (
    <>
      {/* Backdrop with fade-in/out */}
      <div 
        className={`md:hidden fixed inset-0 bg-black/20 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sidebar - Always rendered but positioned off-screen when closed */}
      <div 
        className="md:hidden fixed top-0 left-0 h-full w-64 bg-white z-50 shadow-lg"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold">Track Pro</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <span className="sr-only">Close menu</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4">
          <ul className="space-y-1">
            <NavItem 
              href="/" 
              icon={<Home className="h-5 w-5" />} 
              isActive={location === '/'}
              onClick={onClose}
            >
              Dashboard
            </NavItem>
            <NavItem 
              href="/clubs" 
              icon={<Users className="h-5 w-5" />} 
              isActive={location.includes('/club')}
              onClick={onClose}
            >
              Clubs
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
      </div>
    </>
  );
}