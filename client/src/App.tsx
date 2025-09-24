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
import { usePWA } from "@/hooks/use-pwa";
// Import tool components
import { 
  StopwatchPage,
  StartGunPage,
  JournalPage,
  PaceCalculatorPage,
  PhotoFinishPage,
  VBTAnalysisPage
} from "@/pages/routes";
import PhotoFinishAnalysisPage from "@/pages/tools/photo-finish-analysis-page";

import { PageTransition } from "@/components/page-transition";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import TestPage from "@/pages/test-page-simple";
import ToolsPreviewPage from "@/pages/tools-preview";
import MinimalTest from "@/pages/minimal-test";
import DebugSimple from "@/pages/debug-simple";
import EmergencyDebug from "@/pages/emergency-debug";
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
import { ReactNativePreview } from "@/pages/react-native-preview";
import { Component as DocumentProgramViewer } from "@/pages/document-program-viewer";
import CompetitionCalendarPage from "@/pages/competition-calendar-page";
import { Component as AssignedProgramsPage } from "@/pages/assigned-programs-page";
import { AssignProgramPage } from "@/pages/assign-program-page";
import CheckoutPage from "@/pages/checkout-page";
import AthleteProfilePage from "@/pages/athlete-profile-page";

import AthleteProfile from "@/pages/athlete-profile";
import PublicProfilePage from "@/pages/public-profile-page";
import ExerciseLibraryPage from "@/pages/exercise-library-page";
import ExerciseLibraryAddPage from "@/pages/exercise-library-add-page";
import VideoAnalysisPage from "@/pages/video-analysis-page";
import { VideoPlayerPage } from "@/pages/video-player-page";
import AdminPanelPage from "@/pages/admin-panel-page";
import AdminAffiliateSubmissions from "@/pages/admin-affiliate-submissions";
import SprinthiaPage from "@/pages/sprinthia-simple";
import RehabPage from "@/pages/rehab-page";
import ArcadePage from "@/pages/arcade-page";
import ChatPage from "@/pages/chat-page";
import CreateGroupPage from "@/pages/create-group-page";
import AmbassadorLandingPage from "@/pages/ambassador-landing-page";
import ChannelSettingsPage from "@/pages/channel-settings-page";
import JournalEntryPage from "@/pages/journal-entry-page";

import HamstringRehabPage from "@/pages/rehab/acute-muscle/hamstring";
import FootRehabPage from "@/pages/rehab/chronic-injuries/foot";
import OnboardingContainer from "@/pages/onboarding/onboarding-container";
import MarketplacePage from "@/pages/marketplace-page";
import MarketplaceListingDetails from "@/pages/marketplace-listing-details";
import MarketplaceCart from "@/pages/marketplace-cart";
import MarketplaceCreateListingPage from "@/pages/marketplace-create-listing-page";
import MySubscriptionsPage from "@/pages/my-subscriptions-page";
import SubscriptionManagementPage from "@/pages/subscription-management-page";
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
  
  // For chat routes, determine the base route to keep mounted
  const baseRoute = isChatRoute ? (
    location === '/chat' || location === '/chats' ? '/' : 
    location.includes('/practice') ? '/practice' :
    location.includes('/programs') ? '/programs' :
    location.includes('/meets') ? '/meets' :
    location.includes('/tools') ? '/tools' :
    '/' // Default to dashboard
  ) : location;
  
  return (
    <>
      <ScrollRestoration />
      {/* Main Content Container - stable positioning */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          isolation: 'isolate'
        }}
      >
        {/* Main App Routes - always rendered, but use baseRoute for chat scenarios */}
        <PageTransition>
          <Switch location={isChatRoute ? baseRoute : location}>
          {/* Dashboard */}
          <ProtectedRoute path="/" component={HomePage} />
        
          {/* Training */}
          <ProtectedRoute path="/practice" component={PracticePage} />
          <ProtectedRoute path="/journal-entry" component={JournalEntryPage} />
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
          <ProtectedRoute path="/tools/vbt-analysis" component={VBTAnalysisPage} />
          <ProtectedRoute path="/programs" component={ProgramsPage} />
          <ProtectedRoute path="/programs/create" component={ProgramCreatePage} />
          <ProtectedRoute path="/programs/:id" component={ProgramDetailPage} />
          <ProtectedRoute path="/programs/:id/checkout" component={CheckoutPage} />
          <ProtectedRoute path="/programs/:id/document" component={DocumentProgramViewer} />
          <ProtectedRoute path="/programs/:id/edit" component={ProgramEditorPage} />
          <ProtectedRoute path="/assign-program/:programId" component={AssignProgramPage} />
          <ProtectedRoute path="/assigned-programs" component={AssignedProgramsPage} />
          
          {/* Marketplace */}
          <ProtectedRoute path="/marketplace" component={MarketplacePage} />
          <ProtectedRoute path="/marketplace/create" component={MarketplaceCreateListingPage} />
          <ProtectedRoute path="/marketplace/listings/:id" component={MarketplaceListingDetails} />
          <ProtectedRoute path="/marketplace/cart" component={MarketplaceCart} />
          
          {/* Subscriptions */}
          <ProtectedRoute path="/my-subscriptions" component={MySubscriptionsPage} />
          <ProtectedRoute path="/manage-subscription" component={SubscriptionManagementPage} />
          
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
        <ProtectedRoute path="/create-group" component={CreateGroupPage} />
        <ProtectedRoute path="/chats/channels/:id/settings" component={ChannelSettingsPage} />

        
        {/* Rehab */}
        <ProtectedRoute path="/rehab" component={RehabPage} />
        <ProtectedRoute path="/rehab/acute-muscle/hamstring" component={HamstringRehabPage} />
        <ProtectedRoute path="/rehab/chronic-injuries/foot" component={FootRehabPage} />
        
        {/* AI */}
        <ProtectedRoute path="/sprinthia" component={SprinthiaPage} />
        <ProtectedRoute path="/video-player/:id" component={VideoPlayerPage} />
        
        {/* React Native Preview */}
        <ProtectedRoute path="/react-native-preview" component={ReactNativePreview} />
        
        {/* Arcade Games */}
        <ProtectedRoute path="/arcade" component={ArcadePage} />
        
        {/* Account */}
        <ProtectedRoute path="/spikes" component={SpikesPage} />
        <ProtectedRoute path="/subscription" component={SubscriptionPage} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <ProtectedRoute path="/timing-settings" component={AthleteProfilePage} />

        
        {/* Public Profiles - separate URL pattern */}
        <Route path="/user/:userId" component={PublicProfilePage} />
        <ProtectedRoute path="/admin-panel" component={AdminPanelPage} />
        <ProtectedRoute path="/admin-affiliate-submissions" component={AdminAffiliateSubmissions} />
        
        {/* Onboarding */}
        <Route path="/onboarding/welcome" component={OnboardingContainer} />
        <Route path="/onboarding/alpha-info" component={OnboardingContainer} />
        <Route path="/onboarding/spikes" component={OnboardingContainer} />
        
        {/* Auth */}
        <Route path="/auth" component={AuthPage} />
        <Route path="/reset-password" component={AuthPage} />
        <Route path="/affiliate" component={AmbassadorLandingPage} />
        <Route path="/test" component={TestPage} />
        <Route path="/tools-preview" component={ToolsPreviewPage} />
        <Route path="/test-minimal" component={MinimalTest} />
        <Route path="/debug" component={DebugSimple} />
        <Route path="/emergency" component={EmergencyDebug} />
        <Route component={NotFound} />
        </Switch>
        </PageTransition>
      </div>
      
      {/* Chat Overlay - completely isolated from main layout */}
      <div 
        className="fixed inset-0 z-50 pointer-events-none" 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          contain: 'strict',
          isolation: 'isolate'
        }}
      >
        <ChatPage />
      </div>
    </>
  );
}

function MainApp() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [location] = useLocation();
  const { isPWA, isIOS, canInstall, installPrompt } = usePWA();
  
  // Redirect to onboarding for new user registrations (not logins)
  useEffect(() => {
    // For simplicity, check if the user has completed onboarding before
    const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
    
    // Only redirect to onboarding if user just registered (not logged in) and hasn't completed it before
    if (registerMutation.isSuccess && !hasCompletedOnboarding) {
      window.location.href = '/onboarding/welcome';
    }
  }, [registerMutation.isSuccess, registerMutation.data]);
  

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
    <div className={`min-h-screen text-foreground ${isPWA ? 'pwa-container' : ''}`}>
      {/* iOS Status Bar Spacer - Only show in PWA mode on iOS */}
      {isPWA && isIOS && <div className="ios-status-bar-height" />}
      
      {/* Top Header Bar - Hide for chat routes, auth page, and affiliate page */}
      {!location.startsWith('/chat') && location !== '/auth' && location !== '/affiliate' && <Header />}
      
      {/* Hamburger Menu for all screens - Hide for chat routes, auth page, and affiliate page */}
      {!location.startsWith('/chat') && location !== '/auth' && location !== '/affiliate' && (
        <div className="fixed top-4 left-4 z-50">
          <HamburgerMenu />
        </div>
      )}
      
      {/* Main Content */}
      <main className={location.startsWith('/chat') || location === '/auth' || location === '/affiliate' ? '' : 'pt-20 pb-16 md:pb-0'}>
        <div className={location.startsWith('/chat') || location === '/auth' || location === '/affiliate' ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
          <Router />
        </div>
      </main>
      
      {/* Bottom Navigation - Hide for chat routes, auth page, and affiliate page */}
      {!location.startsWith('/chat') && location !== '/auth' && location !== '/affiliate' && <BottomNavigation />}
      
      {/* Onboarding flow moved to separate pages */}
      
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