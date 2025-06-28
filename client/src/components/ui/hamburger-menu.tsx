import { useState, useEffect } from "react";
import { 
  Menu, 
  X, 
  Home, 
  Calendar, 
  Trophy, 
  LineChart, 
  Users, 
  User,
  UserCheck,
  Settings, 
  Award, 
  Clock,
  Dumbbell, 
  MessagesSquare, 
  Coins,
  BookOpen,
  Target,
  Shield,
  Heart,
  Gamepad2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { NotificationBell } from "@/components/notification-bell";

interface HamburgerMenuProps {
  className?: string;
}

export function HamburgerMenu({ className }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  // Fetch current user to check if they're a coach
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
  });

  // Reset menu state when navigating
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Add overflow hidden to body when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen]);

  // Add a class to the main content when the menu is open
  useEffect(() => {
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      if (isOpen) {
        mainContent.classList.add("menu-open");
      } else {
        mainContent.classList.remove("menu-open");
      }
    }
  }, [isOpen]);

  return (
    <div className={cn("block", className)}>
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative -mt-1 z-[70]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-foreground" />
        ) : (
          <Menu className="h-6 w-6 text-foreground" />
        )}
        <span className="sr-only">Toggle menu</span>
      </Button>
      
      <div
        className={cn(
          "fixed inset-0 z-60 bg-background/80 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />
      
      <div
        className={cn(
          "fixed top-0 left-0 bottom-0 z-60 w-3/4 max-w-xs bg-gray-900 shadow-xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">          
          <nav className="flex-1 overflow-y-auto p-4 pt-16 space-y-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {/* Dashboard */}
            <Link href="/">
              <div
                className={cn(
                  "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  location === "/" ? "bg-primary text-primary-foreground" : "text-gray-300"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Home className="h-4 w-4 mr-3" />
                Dashboard
              </div>
            </Link>
            
            {/* Training Section */}
            <div className="pt-4 pb-2">
              <p className="text-xs text-gray-400 px-4 font-medium">TRAINING</p>
            </div>
            <Link href="/practice">
              <div
                className={cn(
                  "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  location.startsWith("/practice") ? "bg-primary text-primary-foreground" : "text-gray-300"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Dumbbell className="h-4 w-4 mr-3" />
                Practice
              </div>
            </Link>
            <Link href="/programs">
              <div
                className={cn(
                  "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  location === "/programs" ? "bg-primary text-primary-foreground" : "text-gray-300"
                )}
                onClick={() => setIsOpen(false)}
              >
                <BookOpen className="h-4 w-4 mr-3" />
                Programs
              </div>
            </Link>
            <Link href="/training-tools">
              <div
                className={cn(
                  "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  location === "/training-tools" ? "bg-primary text-primary-foreground" : "text-gray-300"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Clock className="h-4 w-4 mr-3" />
                Training Tools
              </div>
            </Link>
            <Link href="/rehab">
              <div
                className={cn(
                  "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  location.startsWith("/rehab") ? "bg-primary text-primary-foreground" : "text-gray-300"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Heart className="h-4 w-4 mr-3" />
                Rehabilitation
              </div>
            </Link>
            
            {/* Competition Section */}
            <div className="pt-4 pb-2">
              <p className="text-xs text-gray-400 px-4 font-medium">COMPETITION</p>
            </div>

            <Link href="/meets">
              <div
                className={cn(
                  "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  location === "/meets" ? "bg-primary text-primary-foreground" : "text-gray-300"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Trophy className="h-4 w-4 mr-3" />
                Meets
              </div>
            </Link>
            <Link href="/results">
              <div
                className={cn(
                  "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  location === "/results" ? "bg-primary text-primary-foreground" : "text-gray-300"
                )}
                onClick={() => setIsOpen(false)}
              >
                <LineChart className="h-4 w-4 mr-3" />
                Results
              </div>
            </Link>
            
            {/* Fun Section */}
            <div className="pt-4 pb-2">
              <p className="text-xs text-gray-400 px-4 font-medium">FUN</p>
            </div>
            <Link href="/arcade">
              <div
                className={cn(
                  "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  location === "/arcade" ? "bg-primary text-primary-foreground" : "text-gray-300"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Gamepad2 className="h-4 w-4 mr-3" />
                Arcade
              </div>
            </Link>
            
            {/* Social Section */}
            <div className="pt-4 pb-2">
              <p className="text-xs text-gray-400 px-4 font-medium">SOCIAL</p>
            </div>
            <Link href="/connections">
              <div
                className={cn(
                  "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  location === "/connections" ? "bg-primary text-primary-foreground" : "text-gray-300"
                )}
                onClick={() => setIsOpen(false)}
              >
                <UserCheck className="h-4 w-4 mr-3" />
                Connections
              </div>
            </Link>
            <Link href="/chat">
              <div
                className={cn(
                  "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  location === "/chat" ? "bg-primary text-primary-foreground" : "text-gray-300"
                )}
                onClick={() => setIsOpen(false)}
              >
                <MessagesSquare className="h-4 w-4 mr-3" />
                Group Chat
              </div>
            </Link>
            {(currentUser as any)?.isCoach && (
              <Link href="/my-athletes">
                <div
                  className={cn(
                    "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer",
                    location === "/my-athletes" ? "bg-primary text-primary-foreground" : "text-gray-300"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Target className="h-4 w-4 mr-3" />
                  My Athletes
                </div>
              </Link>
            )}
            {(currentUser as any)?.isCoach && (
              <Link href="/roster-stats">
                <div
                  className={cn(
                    "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer",
                    location === "/roster-stats" ? "bg-primary text-primary-foreground" : "text-gray-300"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <LineChart className="h-4 w-4 mr-3" />
                  Roster Stats
                </div>
              </Link>
            )}
            <Link href="/athletes">
              <div
                className={cn(
                  "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  location === "/athletes" ? "bg-primary text-primary-foreground" : "text-gray-300"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Users className="h-4 w-4 mr-3" />
                Athletes
              </div>
            </Link>


            <Link href="/coaches">
              <div
                className={cn(
                  "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  location === "/coaches" ? "bg-primary text-primary-foreground" : "text-gray-300"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Award className="h-4 w-4 mr-3" />
                Coaches
              </div>
            </Link>
            <Link href="/groups">
              <div
                className={cn(
                  "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  location === "/groups" ? "bg-primary text-primary-foreground" : "text-gray-300"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Users className="h-4 w-4 mr-3" />
                Groups
              </div>
            </Link>
            
            {/* Admin Section - Only show for admin users */}
            {(currentUser as any)?.role === 'admin' && (
              <>
                <div className="pt-4 pb-2">
                  <p className="text-xs text-gray-400 px-4 font-medium">ADMIN</p>
                </div>
                <Link href="/admin-panel">
                  <div
                    className={cn(
                      "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer",
                      location === "/admin-panel" ? "bg-primary text-primary-foreground" : "text-gray-300"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <Shield className="h-4 w-4 mr-3" />
                    Admin Panel
                  </div>
                </Link>
              </>
            )}
            
            {/* Account Section */}
            <div className="pt-4 pb-2">
              <p className="text-xs text-gray-400 px-4 font-medium">ACCOUNT</p>
            </div>
            <Link href="/athlete-profile">
              <div
                className={cn(
                  "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  location === "/athlete-profile" ? "bg-primary text-primary-foreground" : "text-gray-300"
                )}
                onClick={() => setIsOpen(false)}
              >
                <User className="h-4 w-4 mr-3" />
                Athlete Profile
              </div>
            </Link>
            <Link href="/spikes">
              <div
                className={cn(
                  "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  location === "/spikes" ? "bg-primary text-primary-foreground" : "text-gray-300"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Coins className="h-4 w-4 mr-3" />
                Spikes
              </div>
            </Link>
            <Link href="/profile">
              <div
                className={cn(
                  "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer",
                  location === "/profile" ? "bg-primary text-primary-foreground" : "text-gray-300"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Settings className="h-4 w-4 mr-3" />
                Settings
              </div>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}