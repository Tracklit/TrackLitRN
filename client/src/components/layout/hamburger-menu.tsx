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
  
  // Check if we're on a dark theme page
  const isDarkThemePage = location === "/journal" || location === "/meets" || location.includes("/meets/");

  if (!user) return null;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div 
        className={cn(
          "flex items-center justify-between p-1 shadow-md",
          isDarkThemePage ? "bg-[#010a18]" : "bg-[hsl(220,40%,15%)]"
        )}
      >
        <div className="flex items-center">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        <div className="flex items-center">
          <Avatar className="h-6 w-6 bg-primary text-primary-foreground">
            <AvatarFallback>{getInitials(user.name || user.username)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  );
}