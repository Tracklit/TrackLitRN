import { Switch, Route } from "wouter";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SidebarNavigation } from "@/components/layout/sidebar-navigation";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import MeetsPage from "@/pages/meets-page";
import ResultsPage from "@/pages/results-page";
import CalendarPage from "@/pages/calendar-page";
import ProfilePage from "@/pages/profile-page";
import CoachesPage from "@/pages/coaches-page";
import PracticePage from "@/pages/practice-page";
import TrainingToolsPage from "@/pages/training-tools-page";
import ClubsPage from "@/pages/clubs-page";
import { Component as ClubDetailPage } from "@/pages/club-detail-page";
import { Component as ClubManagementPage } from "@/pages/club-management-page";
import MessagesPage from "@/pages/messages-page";
import SpikesPage from "@/pages/spikes-page";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      {/* Dashboard */}
      <ProtectedRoute path="/" component={HomePage} />
      
      {/* Training */}
      <ProtectedRoute path="/practice" component={PracticePage} />
      <ProtectedRoute path="/training-tools" component={TrainingToolsPage} />
      
      {/* Competition */}
      <ProtectedRoute path="/meets" component={MeetsPage} />
      <ProtectedRoute path="/results" component={ResultsPage} />
      <ProtectedRoute path="/calendar" component={CalendarPage} />
      
      {/* Social */}
      <ProtectedRoute path="/clubs" component={ClubsPage} />
      <ProtectedRoute path="/club/:id" component={ClubDetailPage} />
      <ProtectedRoute path="/club-management/:id" component={ClubManagementPage} />
      <ProtectedRoute path="/messages" component={MessagesPage} />
      <ProtectedRoute path="/coaches" component={CoachesPage} />
      
      {/* Account */}
      <ProtectedRoute path="/spikes" component={SpikesPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      
      {/* Auth */}
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Handle menu toggle
  const handleMenuToggle = (isOpen: boolean) => {
    setIsMenuOpen(isOpen);
    
    // Apply class to body when menu is open to prevent scrolling
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    
    // Apply class to main content for slide effect
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      if (isOpen) {
        mainContent.classList.add("menu-open");
      } else {
        mainContent.classList.remove("menu-open");
      }
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
              <SidebarNavigation />
            </div>
            
            {/* Hamburger Menu Button - Positioned at top left */}
            <div className="fixed top-3 left-3 z-50 md:hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative"
                onClick={() => handleMenuToggle(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6 text-foreground" />
                ) : (
                  <Menu className="h-6 w-6 text-foreground" />
                )}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </div>
            
            {/* Mobile Menu Overlay */}
            <div
              className={cn(
                "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity duration-300 md:hidden",
                isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
              )}
              onClick={() => handleMenuToggle(false)}
            />
            
            {/* Mobile Menu Sidebar */}
            <div
              className={cn(
                "fixed top-0 left-0 bottom-0 z-40 w-3/4 max-w-xs bg-background shadow-xl transition-transform duration-300 ease-in-out md:hidden",
                isMenuOpen ? "translate-x-0" : "-translate-x-full"
              )}
            >
              <SidebarNavigation />
            </div>
            
            {/* Main Content - Will slide when menu is open */}
            <div id="main-content" className="relative transition-all">
              <Router />
            </div>
            
            <Toaster />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;