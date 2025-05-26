import { Switch, Route } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DesktopSidebar, MobileSidebar, MobileSidebarButton } from "@/components/layout/minimal-sidebar";


// Import tool components
import { 
  StopwatchPage,
  StartGunPage,
  JournalPage,
  PaceCalculatorPage
} from "@/pages/routes";

import { OnboardingFlow } from "@/components/onboarding-flow";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import MeetsPage from "@/pages/meets-page";
import ResultsPage from "@/pages/results-page";
import CalendarPage from "@/pages/calendar-page";
import ProfilePage from "@/pages/profile-page";
import CoachesPage from "@/pages/coaches-page";
import PracticePage from "@/pages/practice-page";
import { Component as WorkoutToolsPage } from "@/pages/training-tools-page";
import ClubsPage from "@/pages/clubs-page";
import { Component as ClubDetailPage } from "@/pages/club-detail-page";
import { Component as ClubManagementPage } from "@/pages/club-management-page";
import MessagesPage from "@/pages/messages-page";
import SpikesPage from "@/pages/spikes-page";
import SubscriptionPage from "@/pages/subscription-page";
import { Component as ProgramsPage } from "@/pages/programs-page";
import { Component as ProgramCreatePage } from "@/pages/program-create-page";
import { Component as ProgramDetailPage } from "@/pages/program-detail-page";
import { Component as ProgramEditorPage } from "@/pages/program-editor-page";
import { Component as DocumentProgramViewer } from "@/pages/document-program-viewer";
import { Component as AssignedProgramsPage } from "@/pages/assigned-programs-page";
import AthleteProfilePage from "@/pages/athlete-profile-page";
import AdminPage from "@/pages/admin-page";
import RehabPage from "@/pages/rehab-page";
import HamstringRehabPage from "@/pages/rehab/acute-muscle/hamstring";
import FootRehabPage from "@/pages/rehab/chronic-injuries/foot";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      {/* Dashboard */}
      <ProtectedRoute path="/" component={HomePage} />
      
      {/* Training */}
      <ProtectedRoute path="/practice" component={PracticePage} />
      <ProtectedRoute path="/training-tools" component={WorkoutToolsPage} />
      <ProtectedRoute path="/tools/stopwatch" component={StopwatchPage} />
      <ProtectedRoute path="/tools/start-gun" component={StartGunPage} />
      <ProtectedRoute path="/tools/journal" component={JournalPage} />
      <ProtectedRoute path="/programs" component={ProgramsPage} />
      <ProtectedRoute path="/programs/create" component={ProgramCreatePage} />
      <ProtectedRoute path="/programs/:id" component={ProgramDetailPage} />
      <ProtectedRoute path="/programs/:id/document" component={DocumentProgramViewer} />
      <ProtectedRoute path="/programs/:id/edit" component={ProgramEditorPage} />
      <ProtectedRoute path="/assigned-programs" component={AssignedProgramsPage} />
      
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
      
      {/* Rehab */}
      <ProtectedRoute path="/rehab" component={RehabPage} />
      <ProtectedRoute path="/rehab/acute-muscle/hamstring" component={HamstringRehabPage} />
      <ProtectedRoute path="/rehab/chronic-injuries/foot" component={FootRehabPage} />
      
      {/* Account */}
      <ProtectedRoute path="/spikes" component={SpikesPage} />
      <ProtectedRoute path="/subscription" component={SubscriptionPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/athlete-profile" component={AthleteProfilePage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      
      {/* Auth */}
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function MainApp() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { user, loginMutation, registerMutation } = useAuth();
  
  // Only show onboarding for new user registrations (not logins)
  useEffect(() => {
    // For simplicity, check if the user has completed onboarding before
    const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
    
    // Only show onboarding if user just registered (not logged in) and hasn't completed it before
    if (registerMutation.isSuccess && !hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, [registerMutation.isSuccess, registerMutation.data]);
  
  const toggleMenu = () => {
    const newMenuState = !isMenuOpen;
    setIsMenuOpen(newMenuState);
    
    // Prevent body scrolling when menu is open
    if (newMenuState) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };
  
  // Cleanup effect to reset body overflow when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    
    // Award spikes to the user for completing onboarding (this could call an API)
    // Implementation would go here
    console.log("Onboarding completed!");
    
    // Mark onboarding as completed in localStorage
    localStorage.setItem('onboardingCompleted', 'true');
  };
  
  return (
    <div className="min-h-screen text-foreground" 
      style={{ 
        background: "linear-gradient(135deg, hsl(220, 80%, 4%), hsl(215, 70%, 13%))",
        minHeight: "100vh" 
      }}>
      {/* Mobile Menu Button */}
      <MobileSidebarButton onClick={toggleMenu} isOpen={isMenuOpen} />
      
      {/* Mobile Sidebar - Always rendered but with slide animation */}
      <MobileSidebar isOpen={isMenuOpen} onClose={toggleMenu} />
      
      {/* Main Content */}
      <main className="pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Router />
        </div>
      </main>
      
      {/* Onboarding flow - Only show for logged in users who haven't seen it */}
      {user && showOnboarding && (
        <OnboardingFlow 
          onComplete={handleOnboardingComplete}
          isFirstTimeUser={true} // We can check if user has used the app before
        />
      )}
      
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <MainApp />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;