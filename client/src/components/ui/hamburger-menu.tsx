import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
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
          
          <nav className="space-y-4 mt-6">
            <a
              href="/"
              className="block py-2 px-4 rounded-md hover:bg-muted transition-colors"
            >
              Home
            </a>
            <a
              href="/clubs"
              className="block py-2 px-4 rounded-md hover:bg-muted transition-colors"
            >
              Clubs
            </a>
            <a
              href="/practice"
              className="block py-2 px-4 rounded-md hover:bg-muted transition-colors"
            >
              Practice
            </a>
            <a
              href="/meets"
              className="block py-2 px-4 rounded-md hover:bg-muted transition-colors"
            >
              Meets
            </a>
            <a
              href="/results"
              className="block py-2 px-4 rounded-md hover:bg-muted transition-colors"
            >
              Results
            </a>
            <a
              href="/coaches"
              className="block py-2 px-4 rounded-md hover:bg-muted transition-colors"
            >
              Coaches
            </a>
            <a
              href="/training-tools"
              className="block py-2 px-4 rounded-md hover:bg-muted transition-colors"
            >
              Training Tools
            </a>
            <a
              href="/spikes"
              className="block py-2 px-4 rounded-md hover:bg-muted transition-colors"
            >
              Spikes
            </a>
            <a
              href="/profile"
              className="block py-2 px-4 rounded-md hover:bg-muted transition-colors"
            >
              Profile
            </a>
          </nav>
        </div>
      </div>
    </div>
  );
}