import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { NotificationBell } from "@/components/notification-bell";
import { MessageButton } from "@/components/message-button";
import { InstallAppButton } from "@/components/install-app-button";
import { Button } from "@/components/ui/button";
import { useTicker } from "@/contexts/ticker-context";

interface HeaderProps {
  title?: string;
  className?: string;
}

export function Header({ title = "TrackLit", className }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const { isTickerVisible, toggleTickerVisibility } = useTicker();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className={cn("bg-[#010a18] shadow-sm fixed top-0 left-0 right-0 z-20", className)}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <h1 className="text-xl font-bold text-white ml-11 cursor-pointer hover:text-blue-300 transition-colors">{title}</h1>
          </Link>
        </div>
        
        {user && (
          <div className="flex items-center justify-end flex-1">
            {/* Install App Button */}
            <div className="mr-4">
              <InstallAppButton />
            </div>
            
            <div className="flex items-center space-x-1 ml-auto">
              <NotificationBell />
              
              {/* Direct Messages Panel */}
              <MessageButton />
              
              {/* Ticker Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-gray-400 hover:text-white"
                onClick={() => toggleTickerVisibility(!isTickerVisible)}
                title={isTickerVisible ? "Hide ticker" : "Show ticker"}
              >
                <Globe className="h-5 w-5" />
              </Button>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none opacity-0 pointer-events-none" aria-label="User menu">
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
