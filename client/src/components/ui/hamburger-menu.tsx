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
import { useLocation, Link } from "wouter";

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
    <div className={cn("block lg:hidden", className)}>
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
          "fixed top-0 left-0 bottom-0 z-40 w-3/4 max-w-xs bg-background shadow-xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Menu</h2>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <nav className="space-y-1 mt-6">
            {/* Dashboard */}
            <Link
              href="/"
              className={cn(
                "flex items-center px-4 py-2.5 rounded-md hover:bg-muted transition-colors",
                location === "/" ? "bg-primary/10 text-primary" : "text-foreground"
              )}
              onClick={() => setIsOpen(false)}
            >
              <Home className="h-5 w-5 mr-3" />
              Dashboard
            </Link>
            
            {/* Training Section */}
            <div className="pt-4 pb-2">
              <p className="text-xs text-muted-foreground px-4 font-medium">TRAINING</p>
            </div>
            <Link
              href="/practice"
              className={cn(
                "flex items-center px-4 py-2.5 rounded-md hover:bg-muted transition-colors",
                location.startsWith("/practice") ? "bg-primary/10 text-primary" : "text-foreground"
              )}
              onClick={() => setIsOpen(false)}
            >
              <Dumbbell className="h-5 w-5 mr-3" />
              Practice
            </Link>
            <Link
              href="/training-tools"
              className={cn(
                "flex items-center px-4 py-2.5 rounded-md hover:bg-muted transition-colors",
                location === "/training-tools" ? "bg-primary/10 text-primary" : "text-foreground"
              )}
              onClick={() => setIsOpen(false)}
            >
              <Clock className="h-5 w-5 mr-3" />
              Training Tools
            </Link>
            
            {/* Competition Section */}
            <div className="pt-4 pb-2">
              <p className="text-xs text-muted-foreground px-4 font-medium">COMPETITION</p>
            </div>
            <Link
              href="/calendar"
              className={cn(
                "flex items-center px-4 py-2.5 rounded-md hover:bg-muted transition-colors",
                location === "/calendar" ? "bg-primary/10 text-primary" : "text-foreground"
              )}
              onClick={() => setIsOpen(false)}
            >
              <Calendar className="h-5 w-5 mr-3" />
              Calendar
            </Link>
            <Link
              href="/meets"
              className={cn(
                "flex items-center px-4 py-2.5 rounded-md hover:bg-muted transition-colors",
                location === "/meets" ? "bg-primary/10 text-primary" : "text-foreground"
              )}
              onClick={() => setIsOpen(false)}
            >
              <Trophy className="h-5 w-5 mr-3" />
              Meets
            </Link>
            <Link
              href="/results"
              className={cn(
                "flex items-center px-4 py-2.5 rounded-md hover:bg-muted transition-colors",
                location === "/results" ? "bg-primary/10 text-primary" : "text-foreground"
              )}
              onClick={() => setIsOpen(false)}
            >
              <LineChart className="h-5 w-5 mr-3" />
              Results
            </Link>
            
            {/* Social Section */}
            <div className="pt-4 pb-2">
              <p className="text-xs text-muted-foreground px-4 font-medium">SOCIAL</p>
            </div>
            <Link
              href="/clubs"
              className={cn(
                "flex items-center px-4 py-2.5 rounded-md hover:bg-muted transition-colors",
                location.startsWith("/clubs") || location.startsWith("/club") ? "bg-primary/10 text-primary" : "text-foreground"
              )}
              onClick={() => setIsOpen(false)}
            >
              <Users className="h-5 w-5 mr-3" />
              Clubs
            </Link>
            <Link
              href="/messages"
              className={cn(
                "flex items-center px-4 py-2.5 rounded-md hover:bg-muted transition-colors",
                location === "/messages" ? "bg-primary/10 text-primary" : "text-foreground"
              )}
              onClick={() => setIsOpen(false)}
            >
              <MessagesSquare className="h-5 w-5 mr-3" />
              Messages
            </Link>
            <Link
              href="/coaches"
              className={cn(
                "flex items-center px-4 py-2.5 rounded-md hover:bg-muted transition-colors",
                location === "/coaches" ? "bg-primary/10 text-primary" : "text-foreground"
              )}
              onClick={() => setIsOpen(false)}
            >
              <Award className="h-5 w-5 mr-3" />
              Coaches
            </Link>
            
            {/* Account Section */}
            <div className="pt-4 pb-2">
              <p className="text-xs text-muted-foreground px-4 font-medium">ACCOUNT</p>
            </div>
            <Link
              href="/spikes"
              className={cn(
                "flex items-center px-4 py-2.5 rounded-md hover:bg-muted transition-colors",
                location === "/spikes" ? "bg-primary/10 text-primary" : "text-foreground"
              )}
              onClick={() => setIsOpen(false)}
            >
              <Coins className="h-5 w-5 mr-3" />
              Spikes
            </Link>
            <Link
              href="/profile"
              className={cn(
                "flex items-center px-4 py-2.5 rounded-md hover:bg-muted transition-colors",
                location === "/profile" ? "bg-primary/10 text-primary" : "text-foreground"
              )}
              onClick={() => setIsOpen(false)}
            >
              <Settings className="h-5 w-5 mr-3" />
              Settings
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}