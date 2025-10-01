import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { NotificationBell } from "@/components/notification-bell";
import { MessageButton } from "@/components/message-button";
import { ChatButton } from "@/components/chat-button";

import { Button } from "@/components/ui/button";
// import { useTicker } from "@/contexts/ticker-context";

interface HeaderProps {
  title?: string;
  className?: string;
}

export function Header({ title = "TrackLit", className }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  
  // const { isTickerVisible, toggleTickerVisibility } = useTicker();
  const isTickerVisible = true;
  const toggleTickerVisibility = (visible: boolean) => {};

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className={cn("bg-[#010a18] shadow-sm fixed top-0 left-0 right-0 z-50", className)}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <div className="ml-11 cursor-pointer"></div>
          </Link>
        </div>
        
        {user && (
          <div className="flex items-center justify-end flex-1">
            <div className="flex items-center ml-auto">
              {/* Ticker Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-gray-400 hover:text-white"
                onClick={() => toggleTickerVisibility(!isTickerVisible)}
                title={isTickerVisible ? "Hide ticker" : "Show ticker"}
              >
                <FontAwesomeIcon icon={faGlobe} className="h-5 w-5" />
              </Button>
              
              <NotificationBell />
              
              {/* Direct Messages Panel */}
              <MessageButton />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none ml-3" aria-label="User menu">
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
                  <FontAwesomeIcon icon={faSignOutAlt} className="mr-2 h-4 w-4" />
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
