import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { NotificationBell } from "@/components/notification-bell";
import { Button } from "@/components/ui/button";
import { InstallAppButton } from "@/components/install-app-button";

interface HeaderProps {
  title?: string;
  className?: string;
}

export function Header({ title = "TrackLit", className }: HeaderProps) {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className={cn("bg-[#010a18] shadow-sm fixed top-0 left-0 right-0 z-30", className)}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-white ml-11">{title}</h1>
        </div>
        
        {user && (
          <div className="flex items-center space-x-4">
            {/* Install App Button */}
            <div className="ml-1">
              <InstallAppButton />
            </div>
            
            <div className="flex items-center space-x-1">
              <NotificationBell />
              
              {/* Direct Messages Icon */}
              <Link href="/messages">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-gray-300 hover:text-white hover:bg-white/10"
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </Link>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none" aria-label="User menu">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/default-avatar.png" />
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
