import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { 
  Menu, 
  X, 
  Home, 
  Dumbbell, 
  Clock, 
  Trophy, 
  Calendar, 
  LineChart, 
  Users, 
  MessagesSquare, 
  Award, 
  Coins, 
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
}

function NavItem({ href, icon, children, isActive, onClick }: NavItemProps) {
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

export function HamburgerMenu() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    closeMenu();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div style={{ backgroundColor: 'hsl(220 40% 15%)' }} className="flex items-center justify-between p-3 shadow-md">
        <div className="flex items-center">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-foreground mr-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" style={{ backgroundColor: 'hsl(220 40% 15%)' }} className="border-sidebar-border w-72 p-0">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-sidebar-border">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10 bg-primary text-primary-foreground">
                      <AvatarFallback>{getInitials(user.name || user.username)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{user.name || user.username}</p>
                      <p className="text-xs text-muted-foreground">{user.email || "Athlete"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 px-2 py-4 overflow-auto">
                  <div className="space-y-1">
                    <NavItem
                      href="/"
                      icon={<Home className="h-5 w-5" />}
                      isActive={location === "/"}
                      onClick={closeMenu}
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
                      isActive={location.startsWith("/practice")}
                      onClick={closeMenu}
                    >
                      Practice
                    </NavItem>
                    <NavItem
                      href="/training-tools"
                      icon={<Clock className="h-5 w-5" />}
                      isActive={location === "/training-tools"}
                      onClick={closeMenu}
                    >
                      Training Tools
                    </NavItem>
                  </div>

                  <div className="pt-4 pb-2">
                    <p className="text-xs text-muted-foreground px-3 font-medium uppercase">Competition</p>
                  </div>
                  <div className="space-y-1">
                    <NavItem
                      href="/meets"
                      icon={<Trophy className="h-5 w-5" />}
                      isActive={location === "/meets"}
                      onClick={closeMenu}
                    >
                      Meets
                    </NavItem>
                    <NavItem
                      href="/calendar"
                      icon={<Calendar className="h-5 w-5" />}
                      isActive={location === "/calendar"}
                      onClick={closeMenu}
                    >
                      Calendar
                    </NavItem>
                    <NavItem
                      href="/results"
                      icon={<LineChart className="h-5 w-5" />}
                      isActive={location === "/results"}
                      onClick={closeMenu}
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
                      isActive={location.startsWith("/clubs")}
                      onClick={closeMenu}
                    >
                      Clubs & Groups
                    </NavItem>
                    <NavItem
                      href="/messages"
                      icon={<MessagesSquare className="h-5 w-5" />}
                      isActive={location === "/messages"}
                      onClick={closeMenu}
                    >
                      Messages
                    </NavItem>
                    <NavItem
                      href="/coaches"
                      icon={<Award className="h-5 w-5" />}
                      isActive={location === "/coaches"}
                      onClick={closeMenu}
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
                      isActive={location === "/spikes"}
                      onClick={closeMenu}
                    >
                      Spikes
                    </NavItem>
                    <NavItem
                      href="/profile"
                      icon={<Settings className="h-5 w-5" />}
                      isActive={location === "/profile"}
                      onClick={closeMenu}
                    >
                      Settings
                    </NavItem>
                  </div>
                </div>

                <div className="p-4 border-t border-sidebar-border">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <span className="text-xl font-bold text-foreground">Track Elite</span>
        </div>

        <div className="flex items-center">
          <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
            <AvatarFallback>{getInitials(user.name || user.username)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}