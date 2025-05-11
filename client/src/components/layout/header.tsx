import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "wouter";

interface HeaderProps {
  title?: string;
  className?: string;
}

export function Header({ title = "Track Meet", className }: HeaderProps) {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className={cn("bg-white shadow-sm fixed top-0 left-0 right-0 z-30", className)}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 12a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4a4 4 0 0 1 4 4z"></path>
            <path d="M18.6 14a4 4 0 0 0 .1-6a9 9 0 0 0-9.6-1.3a4 4 0 1 0 2.2 7.1"></path>
            <path d="M18.6 10A4 4 0 0 0 16 8"></path>
            <line x1="16" y1="16" x2="16.01" y2="16"></line>
          </svg>
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
        
        {user && (
          <div className="flex items-center space-x-4">
            <button className="text-darkGray" aria-label="Notifications">
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
