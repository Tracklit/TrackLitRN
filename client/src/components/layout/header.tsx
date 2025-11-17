import { useAuth } from "@/hooks/use-auth";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { NotificationBell } from "@/components/notification-bell";
import { MessageButton } from "@/components/message-button";

import { Button } from "@/components/ui/button";
// import { useTicker } from "@/contexts/ticker-context";

interface HeaderProps {
  title?: string;
  className?: string;
}

export function Header({ title = "TrackLit", className }: HeaderProps) {
  const { user } = useAuth();
  
  // const { isTickerVisible, toggleTickerVisibility } = useTicker();
  const isTickerVisible = true;
  const toggleTickerVisibility = (visible: boolean) => {};

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
              <NotificationBell />
              
              {/* Direct Messages Panel */}
              <MessageButton />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
