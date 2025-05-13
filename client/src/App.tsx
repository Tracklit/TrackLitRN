import { Switch, Route } from "wouter";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
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

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/practice" component={PracticePage} />
      <ProtectedRoute path="/training-tools" component={TrainingToolsPage} />
      <ProtectedRoute path="/meets" component={MeetsPage} />
      <ProtectedRoute path="/results" component={ResultsPage} />
      <ProtectedRoute path="/calendar" component={CalendarPage} />
      <ProtectedRoute path="/clubs" component={ClubsPage} />
      <ProtectedRoute path="/club/:id" component={ClubDetailPage} />
      <ProtectedRoute path="/club-management/:id" component={ClubManagementPage} />
      <ProtectedRoute path="/messages" component={MessagesPage} />
      <ProtectedRoute path="/coaches" component={CoachesPage} />
      <ProtectedRoute path="/spikes" component={SpikesPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function DesktopSidebar() {
  return (
    <div className="hidden md:block fixed top-0 left-0 w-[280px] h-screen bg-white border-r border-gray-200 z-20">
      <div className="p-4">
        <h1 className="text-xl font-bold mb-6">Track Pro</h1>
        
        <nav className="space-y-1">
          <a href="/" className="flex items-center px-3 py-2 rounded-md bg-blue-50 text-blue-600 font-medium">
            Dashboard
          </a>
          <a href="/meets" className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
            Meets
          </a>
          <a href="/clubs" className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
            Clubs
          </a>
          <a href="/profile" className="flex items-center px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
            Profile
          </a>
        </nav>
      </div>
    </div>
  );
}

function MobileMenuButton({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) {
  return (
    <button 
      className={`fixed top-4 left-4 z-60 p-2 bg-white rounded-md shadow-md md:hidden menu-button ${isOpen ? 'hidden' : ''}`}
      onClick={onClick}
    >
      <Menu className="h-6 w-6 text-gray-700" />
    </button>
  );
}

function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <>
      {/* Overlay */}
      <div 
        className={`mobile-menu-overlay ${isOpen ? 'open' : ''}`} 
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className={`mobile-menu ${isOpen ? 'open' : ''}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h1 className="text-lg font-bold">Track Pro</h1>
          <button 
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="p-4 space-y-1">
          <a 
            href="/" 
            className="block px-3 py-2 rounded-md bg-blue-50 text-blue-600 font-medium"
            onClick={onClose}
          >
            Dashboard
          </a>
          <a 
            href="/meets" 
            className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
            onClick={onClose}
          >
            Meets
          </a>
          <a 
            href="/clubs" 
            className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
            onClick={onClose}
          >
            Clubs
          </a>
          <a 
            href="/profile" 
            className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
            onClick={onClose}
          >
            Profile
          </a>
        </nav>
      </div>
    </>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  const closeMenu = () => {
    setMenuOpen(false);
  };
  
  // Add event listener to handle page navigation
  useEffect(() => {
    const handleNavigation = () => {
      closeMenu();
    };
    
    window.addEventListener('popstate', handleNavigation);
    
    return () => {
      window.removeEventListener('popstate', handleNavigation);
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className={`push-content ${menuOpen ? 'open' : ''}`}>
            {/* Desktop Sidebar (only visible on md and up) */}
            <DesktopSidebar />
            
            {/* Mobile Menu Button */}
            <MobileMenuButton onClick={toggleMenu} isOpen={menuOpen} />
            
            {/* Mobile Menu */}
            <MobileMenu isOpen={menuOpen} onClose={closeMenu} />
            
            {/* Main Content */}
            <div className="main-content">
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