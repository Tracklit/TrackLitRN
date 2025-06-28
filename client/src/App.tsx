import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HamburgerMenu } from "@/components/ui/hamburger-menu";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { KeyboardProvider } from "@/contexts/keyboard-context";
// Import tool components
import { 
  StopwatchPage,
  StartGunPage,
  JournalPage,
  PaceCalculatorPage,
  PhotoFinishPage
} from "@/pages/routes";
import PhotoFinishAnalysisPage from "@/pages/tools/photo-finish-analysis-page";

import { OnboardingFlow } from "@/components/onboarding-flow";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import MeetsPage from "@/pages/meets-page";
import CreateMeetPage from "@/pages/create-meet-page";
import ResultsPage from "@/pages/results-page";

import ProfilePage from "@/pages/profile-page-new";
import CoachesPage from "@/pages/coaches-page";
import RosterStatsPage from "@/pages/roster-stats-page";
import PracticePage from "@/pages/practice-page";
import { Component as WorkoutToolsPage } from "@/pages/training-tools-page";
import ClubsPage from "@/pages/clubs-page";
import { Component as ClubDetailPage } from "@/pages/club-detail-page";
import { Component as ClubManagementPage } from "@/pages/club-management-page";


import ConversationDetailPage from "@/pages/conversation-detail-page";

import AthletesPage from "@/pages/athletes-page";
import FriendsPage from "@/pages/friends-page";
import ConnectionsPage from "@/pages/connections-page";
import MyAthletesPage from "@/pages/my-athletes-page";
import SpikesPage from "@/pages/spikes-page";
import SubscriptionPage from "@/pages/subscription-page";
import { Component as ProgramsPage } from "@/pages/programs-page";
import { Component as ProgramCreatePage } from "@/pages/program-create-page";
import { Component as ProgramDetailPage } from "@/pages/program-detail-page";
import { Component as ProgramEditorPage } from "@/pages/program-editor-page";
import { Component as DocumentProgramViewer } from "@/pages/document-program-viewer";
import CompetitionCalendarPage from "@/pages/competition-calendar-page";
import { Component as AssignedProgramsPage } from "@/pages/assigned-programs-page";
import { AssignProgramPage } from "@/pages/assign-program-page";
import CheckoutPage from "@/pages/checkout-page";
import AthleteProfilePage from "@/pages/athlete-profile-page";
import { Component as InstallAppPage } from "@/pages/install-app-page";
import AthleteProfile from "@/pages/athlete-profile";
import PublicProfilePage from "@/pages/public-profile-page";
import ExerciseLibraryPage from "@/pages/exercise-library-page";
import ExerciseLibraryAddPage from "@/pages/exercise-library-add-page";
import VideoAnalysisPage from "@/pages/video-analysis-page";
import { VideoPlayerPage } from "@/pages/video-player-page";
import AdminPanelPage from "@/pages/admin-panel-page";
import SprinthiaPage from "@/pages/sprinthia-simple";
import RehabPage from "@/pages/rehab-page";
import ArcadePage from "@/pages/arcade-page";
import ChatPage from "@/pages/chat-page";
import CreateGroupPage from "@/pages/create-group-page";
import GroupSettingsPage from "@/pages/group-settings-page";

import HamstringRehabPage from "@/pages/rehab/acute-muscle/hamstring";
import FootRehabPage from "@/pages/rehab/chronic-injuries/foot";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { TickerProvider } from "@/contexts/ticker-context";
// Scroll override system disabled to prevent interference with normal scrolling
// import { initializeScrollOverride } from "@/lib/scroll-override";

// Initialize global scroll override immediately
// initializeScrollOverride();

// Component to handle scroll restoration
function ScrollRestoration() {
  const [location] = useLocation();
  
  useEffect(() => {
    // Disable browser's automatic scroll restoration completely
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // Immediately and aggressively reset scroll position
    const forceScrollReset = () => {
      // Override any existing scroll behavior
      const originalScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      
      // Force window scroll to top with all possible methods
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      window.scroll(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Force all scrollable elements to reset
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        if (el instanceof HTMLElement && (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) {
          el.scrollTop = 0;
          el.scrollLeft = 0;
        }
      });
      
      // Restore original scroll behavior
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
    };
    
    // Execute immediately - no delays
    forceScrollReset();
    
    // Use requestAnimationFrame for the next frame
    const frameId = requestAnimationFrame(() => {
      forceScrollReset();
      
      // One more frame to be absolutely sure
      requestAnimationFrame(forceScrollReset);
    });
    
    // Backup timer-based resets
    const timers = [
      setTimeout(forceScrollReset, 1),
      setTimeout(forceScrollReset, 10),
      setTimeout(forceScrollReset, 50),
      setTimeout(forceScrollReset, 100)
    ];
    
    return () => {
      cancelAnimationFrame(frameId);
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [location]);
  
  return null;
}

function Router() {
  const [location] = useLocation();
  const isChatRoute = location.startsWith('/chat') || location.startsWith('/chats');
  
  return (
    <>
      <ScrollRestoration />
      {/* Main App Routes - always rendered */}
      <Switch>
      {/* Dashboard */}
      <ProtectedRoute path="/" component={HomePage} />
      
      {/* Training */}
      <ProtectedRoute path="/practice" component={PracticePage} />
      <ProtectedRoute path="/tools" component={WorkoutToolsPage} />
      <ProtectedRoute path="/training-tools" component={WorkoutToolsPage} />
      <ProtectedRoute path="/tools/stopwatch" component={StopwatchPage} />
      <ProtectedRoute path="/tools/start-gun" component={StartGunPage} />
      <ProtectedRoute path="/tools/journal" component={JournalPage} />
      <ProtectedRoute path="/tools/photo-finish" component={PhotoFinishPage} />
      <ProtectedRoute path="/tools/photo-finish/analysis" component={PhotoFinishAnalysisPage} />
      <ProtectedRoute path="/tools/exercise-library" component={ExerciseLibraryPage} />
      <ProtectedRoute path="/tools/exercise-library/add" component={ExerciseLibraryAddPage} />
      <ProtectedRoute path="/tools/video-analysis" component={VideoAnalysisPage} />
      <ProtectedRoute path="/programs" component={ProgramsPage} />
      <ProtectedRoute path="/programs/create" component={ProgramCreatePage} />
      <ProtectedRoute path="/programs/:id" component={ProgramDetailPage} />
      <ProtectedRoute path="/programs/:id/checkout" component={CheckoutPage} />
      <ProtectedRoute path="/programs/:id/document" component={DocumentProgramViewer} />
      <ProtectedRoute path="/programs/:id/edit" component={ProgramEditorPage} />
      <ProtectedRoute path="/assign-program/:programId" component={AssignProgramPage} />
      <ProtectedRoute path="/assigned-programs" component={AssignedProgramsPage} />
      
      {/* Competition */}
      <ProtectedRoute path="/meets" component={MeetsPage} />
      <ProtectedRoute path="/meets/create" component={CreateMeetPage} />
      <ProtectedRoute path="/results" component={ResultsPage} />
      {/* <ProtectedRoute path="/competitions" component={CompetitionCalendarPage} /> */}
      
      {/* Social */}
      <ProtectedRoute path="/connections" component={ConnectionsPage} />
      <ProtectedRoute path="/my-athletes" component={MyAthletesPage} />
      <ProtectedRoute path="/athletes" component={AthletesPage} />
      <ProtectedRoute path="/coaches" component={CoachesPage} />
      <ProtectedRoute path="/roster-stats" component={RosterStatsPage} />
      <ProtectedRoute path="/clubs" component={ClubsPage} />
      <ProtectedRoute path="/club/:id" component={ClubDetailPage} />
      <ProtectedRoute path="/club-management/:id" component={ClubManagementPage} />
      <ProtectedRoute path="/chat" component={HomePage} />
      <ProtectedRoute path="/chats" component={HomePage} />
      <ProtectedRoute path="/chats/groups/:id" component={HomePage} />
      <ProtectedRoute path="/chats/create" component={CreateGroupPage} />
      <ProtectedRoute path="/create-group" component={CreateGroupPage} />
      <ProtectedRoute path="/chats/groups/:id/settings" component={GroupSettingsPage} />


      
      {/* Rehab */}
      <ProtectedRoute path="/rehab" component={RehabPage} />
      <ProtectedRoute path="/rehab/acute-muscle/hamstring" component={HamstringRehabPage} />
      <ProtectedRoute path="/rehab/chronic-injuries/foot" component={FootRehabPage} />
      
      {/* AI */}
      <ProtectedRoute path="/sprinthia" component={SprinthiaPage} />
      <ProtectedRoute path="/video-player/:id" component={VideoPlayerPage} />
      
      {/* Arcade Games */}
      <ProtectedRoute path="/arcade" component={ArcadePage} />
      
      {/* Account */}
      <ProtectedRoute path="/spikes" component={SpikesPage} />
      <ProtectedRoute path="/subscription" component={SubscriptionPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/athlete-profile" component={AthleteProfilePage} />
      <ProtectedRoute path="/install-app" component={InstallAppPage} />
      
      {/* Public Profiles - separate URL pattern */}
      <Route path="/user/:userId" component={PublicProfilePage} />
      <ProtectedRoute path="/admin-panel" component={AdminPanelPage} />
      
      {/* Auth */}
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
      </Switch>
      
      {/* Chat Overlay - always mounted to prevent remounting, controlled by internal state */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <ChatPage />
      </div>
    </>
  );
}

function MainApp() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { user, loginMutation, registerMutation } = useAuth();
  const [location] = useLocation();
  
  // Only show onboarding for new user registrations (not logins)
  useEffect(() => {
    // For simplicity, check if the user has completed onboarding before
    const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
    
    // Only show onboarding if user just registered (not logged in) and hasn't completed it before
    if (registerMutation.isSuccess && !hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, [registerMutation.isSuccess, registerMutation.data]);
  
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    
    // Award spikes to the user for completing onboarding (this could call an API)
    // Implementation would go here
    console.log("Onboarding completed!");
    
    // Mark onboarding as completed in localStorage
    localStorage.setItem('onboardingCompleted', 'true');
  };

  // Special handling for admin panel - render without any layout
  if (location === '/admin-panel') {
    return (
      <>
        <Router />
        <Toaster />
      </>
    );
  }
  
  return (
    <div className="min-h-screen text-foreground">
      {/* Top Header Bar - Hide for chat routes */}
      {!location.startsWith('/chat') && <Header />}
      
      {/* Hamburger Menu for all screens - Hide for chat routes */}
      {!location.startsWith('/chat') && (
        <div className="fixed top-4 left-4 z-50">
          <HamburgerMenu />
        </div>
      )}
      
      {/* Main Content */}
      <main className={location.startsWith('/chat') ? '' : 'pt-20 pb-16 md:pb-0'}>
        <div className={location.startsWith('/chat') ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
          <Router />
        </div>
      </main>
      
      {/* Bottom Navigation - Hide for chat routes */}
      {!location.startsWith('/chat') && <BottomNavigation />}
      
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
        <TickerProvider>
          <KeyboardProvider>
            <TooltipProvider>
              <MainApp />
            </TooltipProvider>
          </KeyboardProvider>
        </TickerProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;