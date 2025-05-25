import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";

interface HeaderProps {
  title?: string;
  className?: string;
}

export function Header({ title = "TrackLit", className }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  // Check if we're on a dark theme page
  const isDarkThemePage = location === "/journal" || location === "/meets" || location.includes("/meets/");

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-30 shadow-sm", 
      isDarkThemePage ? "bg-[#010a18] text-white" : "bg-white",
      className
    )}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src="/images/tracklit-logo.jpeg" 
            alt="TrackLit Logo" 
            className="h-8 w-auto" 
          />
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
        
        {user && (
          <div className="flex items-center space-x-4">
            <button className={isDarkThemePage ? "text-blue-300" : "text-darkGray"} aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none" aria-label="User menu">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback name={user.name} />
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}
