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

function App() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Add body class when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('slide-content');
    } else {
      document.body.classList.remove('slide-content');
    }
    
    return () => {
      document.body.classList.remove('slide-content');
    };
  }, [isOpen]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="container">
            {/* App Wrapper */}
            <div className="app-wrapper">
              {/* Sidebar - Desktop */}
              <div className="sidebar desktop-only">
                <div className="p-4">
                  <h2 className="text-xl font-bold mb-6">Track Pro</h2>
                  <nav className="space-y-1">
                    <a href="/" className="nav-item active">Dashboard</a>
                    <a href="/clubs" className="nav-item">Clubs</a>
                    <a href="/meets" className="nav-item">Meets</a>
                    <a href="/profile" className="nav-item">Profile</a>
                  </nav>
                </div>
              </div>
              
              {/* Content */}
              <div className="content">
                {/* Mobile Header */}
                <header className="mobile-header">
                  <button 
                    className="menu-button"
                    onClick={() => setIsOpen(!isOpen)}
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                  <h1 className="mobile-title">Track Pro</h1>
                </header>
                
                {/* Page Content */}
                <main className="page-content">
                  <Router />
                </main>
              </div>
              
              {/* Sidebar - Mobile Overlay */}
              <div 
                className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              ></div>
              
              {/* Sidebar - Mobile Slide Out */}
              <div className={`sidebar mobile-only ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                  <h2 className="text-lg font-bold">Track Pro</h2>
                  <button 
                    className="close-button"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-4">
                  <nav className="space-y-1">
                    <a 
                      href="/" 
                      className="nav-item active"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </a>
                    <a 
                      href="/clubs" 
                      className="nav-item"
                      onClick={() => setIsOpen(false)}
                    >
                      Clubs
                    </a>
                    <a 
                      href="/meets" 
                      className="nav-item"
                      onClick={() => setIsOpen(false)}
                    >
                      Meets
                    </a>
                    <a 
                      href="/profile" 
                      className="nav-item"
                      onClick={() => setIsOpen(false)}
                    >
                      Profile
                    </a>
                  </nav>
                </div>
              </div>
            </div>
            
            <Toaster />
            
            <style jsx global>{`
              /* Container */
              body {
                overflow-x: hidden;
                margin: 0;
                padding: 0;
              }
              
              .container {
                position: relative;
                height: 100vh;
                width: 100vw;
                overflow: hidden;
              }
              
              /* App Wrapper */
              .app-wrapper {
                display: flex;
                height: 100%;
                width: 100%;
                position: relative;
              }
              
              /* Sidebar - Desktop */
              .sidebar {
                width: 256px;
                height: 100%;
                background-color: white;
                border-right: 1px solid #e5e7eb;
                z-index: 20;
              }
              
              .desktop-only {
                display: none;
              }
              
              @media (min-width: 768px) {
                .desktop-only {
                  display: block;
                }
                
                .mobile-only {
                  display: none;
                }
              }
              
              /* Content */
              .content {
                flex: 1;
                display: flex;
                flex-direction: column;
                transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
              }
              
              /* Mobile Header */
              .mobile-header {
                height: 60px;
                display: flex;
                align-items: center;
                padding: 0 16px;
                border-bottom: 1px solid #e5e7eb;
                background-color: white;
              }
              
              .menu-button {
                background: none;
                border: none;
                cursor: pointer;
                color: #6b7280;
              }
              
              .mobile-title {
                margin-left: 16px;
                font-size: 18px;
                font-weight: 600;
              }
              
              @media (min-width: 768px) {
                .mobile-header {
                  display: none;
                }
              }
              
              /* Page Content */
              .page-content {
                flex: 1;
                padding: 16px;
                overflow-y: auto;
              }
              
              /* Mobile Sidebar Overlay */
              .sidebar-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.3);
                z-index: 30;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
              }
              
              .sidebar-overlay.active {
                opacity: 1;
                pointer-events: auto;
              }
              
              /* Mobile Sidebar */
              .sidebar.mobile-only {
                position: fixed;
                top: 0;
                left: 0;
                bottom: 0;
                transform: translateX(-100%);
                transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                z-index: 40;
              }
              
              .sidebar.mobile-only.open {
                transform: translateX(0);
              }
              
              .sidebar-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px;
                border-bottom: 1px solid #e5e7eb;
              }
              
              .close-button {
                background: none;
                border: none;
                cursor: pointer;
                color: #6b7280;
              }
              
              /* Nav Items */
              .nav-item {
                display: block;
                padding: 8px 12px;
                border-radius: 6px;
                color: #374151;
                text-decoration: none;
                font-weight: 500;
                transition: background-color 0.15s ease;
              }
              
              .nav-item:hover {
                background-color: #f3f4f6;
              }
              
              .nav-item.active {
                background-color: #eff6ff;
                color: #2563eb;
              }
              
              /* Content Slide Effect */
              @media (max-width: 767px) {
                body.slide-content .content {
                  transform: translateX(256px);
                }
              }
            `}</style>
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;