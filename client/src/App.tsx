import { Switch, Route } from "wouter";
import { useState } from "react";
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

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground relative">
            {/* Sidebar - Only on desktop */}
            <aside className="hidden md:block fixed inset-y-0 left-0 w-64 border-r bg-white z-10">
              <div className="p-4">
                <h2 className="text-xl font-bold mb-6">Track Pro</h2>
                <nav className="space-y-1">
                  <a href="/" className="block px-3 py-2 text-primary font-medium rounded-md bg-primary/10">Dashboard</a>
                  <a href="/clubs" className="block px-3 py-2 text-gray-900 hover:bg-gray-100 rounded-md">Clubs</a>
                  <a href="/meets" className="block px-3 py-2 text-gray-900 hover:bg-gray-100 rounded-md">Meets</a>
                  <a href="/profile" className="block px-3 py-2 text-gray-900 hover:bg-gray-100 rounded-md">Profile</a>
                </nav>
              </div>
            </aside>
            
            {/* Mobile menu button - part of main content that slides */}
            <div className="md:hidden relative z-50">
              <div className={`fixed top-4 left-4 transition-transform duration-300 ${isMenuOpen ? 'translate-x-64' : ''}`}>
                <button 
                  className="p-2 bg-white rounded-md shadow-md"
                  onClick={toggleMenu}
                >
                  {isMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Mobile menu - Always in DOM but positioned off-screen */}
            <div 
              className={`md:hidden fixed inset-0 bg-black/20 z-30 transition-opacity duration-300 ${
                isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              onClick={() => setIsMenuOpen(false)}
            />
            <aside 
              className={`md:hidden fixed inset-y-0 left-0 w-64 bg-white z-40 shadow-lg transition-transform duration-300 ${
                isMenuOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <div className="p-4">
                <h2 className="text-xl font-bold mb-6">Track Pro</h2>
                <nav className="space-y-1">
                  <a 
                    href="/" 
                    className="block px-3 py-2 text-primary font-medium rounded-md bg-primary/10"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </a>
                  <a 
                    href="/clubs" 
                    className="block px-3 py-2 text-gray-900 hover:bg-gray-100 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Clubs
                  </a>
                  <a 
                    href="/meets" 
                    className="block px-3 py-2 text-gray-900 hover:bg-gray-100 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Meets
                  </a>
                  <a 
                    href="/profile" 
                    className="block px-3 py-2 text-gray-900 hover:bg-gray-100 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </a>
                </nav>
              </div>
            </aside>
            
            {/* Main content - slides when menu opens */}
            <main className={`content-slide md:pl-64 ${isMenuOpen ? 'open' : ''}`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Router />
              </div>
            </main>
            
            <Toaster />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;