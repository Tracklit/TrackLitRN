import { Switch, Route, useLocation, Redirect } from "wouter";
import { useState, useEffect, Suspense, lazy } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HamburgerMenu } from "@/components/ui/hamburger-menu";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { KeyboardProvider } from "@/contexts/keyboard-context";
import { usePWA } from "@/hooks/use-pwa";

// Only import core components that are always needed
import { PageTransition } from "@/components/page-transition";

// Dynamic imports for all page components using React.lazy
const HomePage = lazy(() => import("@/pages/home-page"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const ChatPage = lazy(() => import("@/pages/chat-page"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Tools
const StopwatchPage = lazy(() => import("@/pages/routes").then(m => ({ default: m.StopwatchPage })));
const StartGunPage = lazy(() => import("@/pages/routes").then(m => ({ default: m.StartGunPage })));
const JournalPage = lazy(() => import("@/pages/routes").then(m => ({ default: m.JournalPage })));
const PaceCalculatorPage = lazy(() => import("@/pages/routes").then(m => ({ default: m.PaceCalculatorPage })));
const PhotoFinishPage = lazy(() => import("@/pages/routes").then(m => ({ default: m.PhotoFinishPage })));
const VelocityTrackerPage = lazy(() => import("@/pages/routes").then(m => ({ default: m.VelocityTrackerPage })));
const PhotoFinishAnalysisPage = lazy(() => import("@/pages/tools/photo-finish-analysis-page"));
const ExerciseLibraryPage = lazy(() => import("@/pages/exercise-library-page"));
const ExerciseLibraryAddPage = lazy(() => import("@/pages/exercise-library-add-page"));
const VideoAnalysisPage = lazy(() => import("@/pages/video-analysis-page"));

// Training & Programs
const PracticePage = lazy(() => import("@/pages/practice-page"));
const JournalEntryPage = lazy(() => import("@/pages/journal-entry-page"));
const WorkoutToolsPage = lazy(() => import("@/pages/training-tools-page").then(m => ({ default: m.Component })));
const ProgramsPage = lazy(() => import("@/pages/programs-page").then(m => ({ default: m.Component })));
const ProgramCreatePage = lazy(() => import("@/pages/program-create-page").then(m => ({ default: m.Component })));
const ProgramDetailPage = lazy(() => import("@/pages/program-detail-page").then(m => ({ default: m.Component })));
const ProgramEditorPage = lazy(() => import("@/pages/program-editor-page").then(m => ({ default: m.Component })));
const DocumentProgramViewer = lazy(() => import("@/pages/document-program-viewer").then(m => ({ default: m.Component })));
const AssignedProgramsPage = lazy(() => import("@/pages/assigned-programs-page").then(m => ({ default: m.Component })));
const AssignProgramPage = lazy(() => import("@/pages/assign-program-page").then(m => ({ default: m.AssignProgramPage })));

// Competition & Meets
const MeetsPage = lazy(() => import("@/pages/meets-page"));
const CreateMeetPage = lazy(() => import("@/pages/create-meet-page"));
const ResultsPage = lazy(() => import("@/pages/results-page"));
const CompetitionCalendarPage = lazy(() => import("@/pages/competition-calendar-page"));

// Social & Athletes
const ConnectionsPage = lazy(() => import("@/pages/connections-page"));
const MyAthletesPage = lazy(() => import("@/pages/my-athletes-page"));
const AthletesPage = lazy(() => import("@/pages/athletes-page"));
const CoachesPage = lazy(() => import("@/pages/coaches-page"));
const RosterStatsPage = lazy(() => import("@/pages/roster-stats-page"));
const ClubsPage = lazy(() => import("@/pages/clubs-page"));
const ClubDetailPage = lazy(() => import("@/pages/club-detail-page").then(m => ({ default: m.Component })));
const ClubManagementPage = lazy(() => import("@/pages/club-management-page").then(m => ({ default: m.Component })));
const CreateGroupPage = lazy(() => import("@/pages/create-group-page"));
const ChannelSettingsPage = lazy(() => import("@/pages/channel-settings-page"));

// Profiles
const ProfilePage = lazy(() => import("@/pages/profile-page-new"));
const AthleteProfile = lazy(() => import("@/pages/athlete-profile"));
const AthleteProfilePage = lazy(() => import("@/pages/athlete-profile-page"));
const PublicProfilePage = lazy(() => import("@/pages/public-profile-page"));

// Marketplace
const MarketplacePage = lazy(() => import("@/pages/marketplace-page"));
const MarketplaceListingDetails = lazy(() => import("@/pages/marketplace-listing-details"));
const MarketplaceCart = lazy(() => import("@/pages/marketplace-cart"));
const MarketplaceCreateListingPage = lazy(() => import("@/pages/marketplace-create-listing-page"));

// Subscriptions & Payment
const MySubscriptionsPage = lazy(() => import("@/pages/my-subscriptions-page"));
const SubscriptionManagementPage = lazy(() => import("@/pages/subscription-management-page"));
const SubscriptionPage = lazy(() => import("@/pages/subscription-page"));
const CheckoutPage = lazy(() => import("@/pages/checkout-page"));
const SpikesPage = lazy(() => import("@/pages/spikes-page"));

// Rehab & Health
const RehabPage = lazy(() => import("@/pages/rehab-page"));
const HamstringRehabPage = lazy(() => import("@/pages/rehab/acute-muscle/hamstring"));
const FootRehabPage = lazy(() => import("@/pages/rehab/chronic-injuries/foot"));

// AI & Special Features
const SprinthiaPage = lazy(() => import("@/pages/sprinthia-simple"));
const VideoPlayerPage = lazy(() => import("@/pages/video-player-page").then(m => ({ default: m.VideoPlayerPage })));
const ArcadePage = lazy(() => import("@/pages/arcade-page"));

// Admin & Management
const AdminPanelPage = lazy(() => import("@/pages/admin-panel-page"));
const AdminAffiliateSubmissions = lazy(() => import("@/pages/admin-affiliate-submissions"));
const TimingSettingsPage = lazy(() => import("@/pages/timing-settings-page"));

// Onboarding & Auth
const OnboardingContainer = lazy(() => import("@/pages/onboarding/onboarding-container"));
const AmbassadorLandingPage = lazy(() => import("@/pages/ambassador-landing-page"));

// Test & Debug pages  
const TestPage = lazy(() => import("@/pages/test-page-simple"));
const ToolsPreviewPage = lazy(() => import("@/pages/tools-preview"));
const MinimalTest = lazy(() => import("@/pages/minimal-test"));
const DebugSimple = lazy(() => import("@/pages/debug-simple"));
const EmergencyDebug = lazy(() => import("@/pages/emergency-debug"));
const ReactNativePreview = lazy(() => import("@/pages/react-native-preview").then(m => ({ default: m.ReactNativePreview })));

// Legacy
const ConversationDetailPage = lazy(() => import("@/pages/conversation-detail-page"));
const FriendsPage = lazy(() => import("@/pages/friends-page"));
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

// Component to handle root path redirect - redirect to /home as default
function RootRedirect() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    console.log('RootRedirect: Redirecting from root path to /home');
    setLocation('/home');
  }, [setLocation]);
  
  // Also return declarative redirect as backup
  return <Redirect to="/home" />;
}

function Router() {
  const [location] = useLocation();
  console.log('Router: Current location:', location);
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
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </div>
          }>
            <Switch location={isChatRoute ? baseRoute : location}>
          {/* Home route */}
          <ProtectedRoute path="/home" component={HomePage} />
          
          {/* Explicit redirect for root path */}
          <Route path="/">
            <RootRedirect />
          </Route>
        
          {/* Training */}
          <ProtectedRoute path="/practice" component={PracticePage} />
          <ProtectedRoute path="/journal-entry" component={JournalEntryPage} />
          <ProtectedRoute path="/tools" component={WorkoutToolsPage} />
          <ProtectedRoute path="/training-tools" component={WorkoutToolsPage} />
          <ProtectedRoute path="/tools/stopwatch" component={StopwatchPage} />
          <ProtectedRoute path="/tools/start-gun" component={StartGunPage} />
          <ProtectedRoute path="/tools/journal" component={JournalPage} />
          <ProtectedRoute path="/tools/photo-finish" component={PhotoFinishPage} />
          <ProtectedRoute path="/tools/velocity-tracker" component={VelocityTrackerPage} />
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
        <ProtectedRoute path="/timing-settings" component={TimingSettingsPage} />

        
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
          </Suspense>
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
        <Suspense fallback={null}>
          <ChatPage />
        </Suspense>
      </div>
    </>
  );
}

function MainApp() {
  const { user, loginMutation, registerMutation, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const { isPWA, isIOS, canInstall, installPrompt } = usePWA();
  const [initialLoading, setInitialLoading] = useState(true);
  
  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY EARLY RETURNS
  
  // Handle initial loading state to prevent white page
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 100); // Brief delay to ensure auth query has started
    
    return () => clearTimeout(timer);
  }, []);
  
  // Authentication logging for debugging
  useEffect(() => {
    console.log('MainApp: Auth check', { user: !!user, isLoading, location, initialLoading });
  }, [user, isLoading, location, initialLoading]);
  
  // Redirect to onboarding for new user registrations (not logins)
  useEffect(() => {
    // For simplicity, check if the user has completed onboarding before
    const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
    
    // Only redirect to onboarding if user just registered (not logged in) and hasn't completed it before
    if (registerMutation.isSuccess && !hasCompletedOnboarding) {
      window.location.href = '/onboarding/welcome';
    }
  }, [registerMutation.isSuccess, registerMutation.data]);
  
  // Show loading while authentication is loading or during initial load
  if (isLoading || initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  

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