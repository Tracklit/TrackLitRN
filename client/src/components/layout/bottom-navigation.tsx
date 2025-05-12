import { Link, useLocation } from "wouter";
import { 
  Home, 
  Calendar, 
  LineChart, 
  User, 
  Plus, 
  Award, 
  Dumbbell, 
  Users,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CreateMeetModal } from "@/components/create-meet-modal";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
}

function NavItem({ href, icon, children, isActive }: NavItemProps) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center">
      <div className={cn("text-xl", isActive ? "text-primary" : "text-darkGray")}>
        {icon}
      </div>
      <span className={cn("text-xs mt-1", isActive ? "text-primary font-medium" : "text-darkGray")}>
        {children}
      </span>
    </Link>
  );
}

export function BottomNavigation() {
  const [location] = useLocation();
  const [isCreateMeetOpen, setIsCreateMeetOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-md border-t border-lightGray h-16 md:hidden z-30">
        <div className="grid grid-cols-5 h-full">
          <NavItem 
            href="/" 
            icon={<Home className="h-5 w-5" />} 
            isActive={location === '/'}
          >
            Home
          </NavItem>
          <NavItem 
            href="/practice" 
            icon={<Dumbbell className="h-5 w-5" />} 
            isActive={location.startsWith('/practice')}
          >
            Practice
          </NavItem>
          <div className="flex items-center justify-center">
            <button 
              className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg"
              onClick={() => setIsCreateMeetOpen(true)}
              aria-label="Create new meet"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>
          <NavItem 
            href="/meets" 
            icon={<Trophy className="h-5 w-5" />} 
            isActive={location === '/meets'}
          >
            Meets
          </NavItem>
          <NavItem 
            href="/clubs" 
            icon={<Users className="h-5 w-5" />} 
            isActive={location.startsWith('/clubs')}
          >
            Clubs
          </NavItem>
        </div>
      </nav>

      <CreateMeetModal
        isOpen={isCreateMeetOpen}
        onClose={() => setIsCreateMeetOpen(false)}
      />
    </>
  );
}
