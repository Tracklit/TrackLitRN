import { useState, useEffect } from "react";
import { 
  Menu, 
  X, 
  Home, 
  Calendar, 
  Trophy, 
  LineChart, 
  Users, 
  Settings, 
  Award, 
  Clock,
  Dumbbell, 
  MessagesSquare, 
  Coins 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface HamburgerMenuProps {
  className?: string;
}

export function HamburgerMenu({ className }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

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
    <div className={cn("block md:hidden", className)}>
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative z-50"
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
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />
      
      <div
        className={cn(
          "fixed top-0 left-0 bottom-0 z-40 w-3/4 max-w-xs bg-gray-900 shadow-xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">Menu</h2>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {/* Dashboard */}
            <a
              href="/"
              className={cn(
                "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors",
                location === "/" ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
              onClick={() => setIsOpen(false)}
            >
              <Home className="h-4 w-4 mr-3" />
              Dashboard
            </a>
            
            {/* Training Section */}
            <div className="pt-4 pb-2">
              <p className="text-xs text-gray-400 px-4 font-medium">TRAINING</p>
            </div>
            <a
              href="/practice"
              className={cn(
                "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors",
                location.startsWith("/practice") ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
              onClick={() => setIsOpen(false)}
            >
              <Dumbbell className="h-4 w-4 mr-3" />
              Practice
            </a>
            <a
              href="/training-tools"
              className={cn(
                "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors",
                location === "/training-tools" ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
              onClick={() => setIsOpen(false)}
            >
              <Clock className="h-4 w-4 mr-3" />
              Training Tools
            </a>
            
            {/* Competition Section */}
            <div className="pt-4 pb-2">
              <p className="text-xs text-gray-400 px-4 font-medium">COMPETITION</p>
            </div>
            <a
              href="/meets"
              className={cn(
                "flex items-center justify-between px-4 py-2 rounded-md text-xs font-medium transition-colors",
                location === "/meets" ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-3" />
                Calendar
              </div>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                PRO
              </span>
            </a>
            <a
              href="/meets"
              className={cn(
                "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors",
                location === "/meets" ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
              onClick={() => setIsOpen(false)}
            >
              <Trophy className="h-4 w-4 mr-3" />
              Meets
            </a>
            <a
              href="/results"
              className={cn(
                "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors",
                location === "/results" ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
              onClick={() => setIsOpen(false)}
            >
              <LineChart className="h-4 w-4 mr-3" />
              Results
            </a>
            
            {/* Social Section */}
            <div className="pt-4 pb-2">
              <p className="text-xs text-gray-400 px-4 font-medium">SOCIAL</p>
            </div>
            <a
              href="/clubs"
              className={cn(
                "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors",
                location.startsWith("/clubs") || location.startsWith("/club") ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
              onClick={() => setIsOpen(false)}
            >
              <Users className="h-4 w-4 mr-3" />
              Clubs
            </a>
            <a
              href="/messages"
              className={cn(
                "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors",
                location === "/messages" ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
              onClick={() => setIsOpen(false)}
            >
              <MessagesSquare className="h-4 w-4 mr-3" />
              Messages
            </a>
            <a
              href="/coaches"
              className={cn(
                "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors",
                location === "/coaches" ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
              onClick={() => setIsOpen(false)}
            >
              <Award className="h-4 w-4 mr-3" />
              Coaches
            </a>
            
            {/* Account Section */}
            <div className="pt-4 pb-2">
              <p className="text-xs text-gray-400 px-4 font-medium">ACCOUNT</p>
            </div>
            <a
              href="/spikes"
              className={cn(
                "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors",
                location === "/spikes" ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
              onClick={() => setIsOpen(false)}
            >
              <Coins className="h-4 w-4 mr-3" />
              Spikes
            </a>
            <a
              href="/profile"
              className={cn(
                "flex items-center px-4 py-2 rounded-md text-xs font-medium transition-colors",
                location === "/profile" ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
              onClick={() => setIsOpen(false)}
            >
              <Settings className="h-4 w-4 mr-3" />
              Settings
            </a>
          </nav>
        </div>
      </div>
    </div>
  );
}