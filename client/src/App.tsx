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
const HomePageLazy = lazy(() => import("@/pages/home-page"));
const AuthPageLazy = lazy(() => import("@/pages/auth-page"));
const ChatPageLazy = lazy(() => import("@/pages/chat-page"));
const NotFoundLazy = lazy(() => import("@/pages/not-found"));

// Tools
const StopwatchPageLazy = lazy(() => import("@/pages/routes").then(m => ({ default: m.StopwatchPage })));
const StartGunPageLazy = lazy(() => import("@/pages/routes").then(m => ({ default: m.StartGunPage })));
const JournalPageLazy = lazy(() => import("@/pages/routes").then(m => ({ default: m.JournalPage })));
const PhotoFinishPageLazy = lazy(() => import("@/pages/routes").then(m => ({ default: m.PhotoFinishPage })));
const VelocityTrackerPageLazy = lazy(() => import("@/pages/routes").then(m => ({ default: m.VelocityTrackerPage })));
const PhotoFinishAnalysisPageLazy = lazy(() => import("@/pages/tools/photo-finish-analysis-page"));
const ExerciseLibraryPageLazy = lazy(() => import("@/pages/exercise-library-page"));
const ExerciseLibraryAddPageLazy = lazy(() => import("@/pages/exercise-library-add-page"));
const VideoAnalysisPageLazy = lazy(() => import("@/pages/video-analysis-page"));

// Training & Programs
const PracticePageLazy = lazy(() => import("@/pages/practice-page"));
const JournalEntryPageLazy = lazy(() => import("@/pages/journal-entry-page"));
const WorkoutToolsPageLazy = lazy(() => import("@/pages/training-tools-page").then(m => ({ default: m.Component })));
const ProgramsPageLazy = lazy(() => import("@/pages/programs-page").then(m => ({ default: m.Component })));
const ProgramCreatePageLazy = lazy(() => import("@/pages/program-create-page").then(m => ({ default: m.Component })));
const ProgramDetailPageLazy = lazy(() => import("@/pages/program-detail-page").then(m => ({ default: m.Component })));
const ProgramEditorPageLazy = lazy(() => import("@/pages/program-editor-page").then(m => ({ default: m.Component })));
const DocumentProgramViewerLazy = lazy(() => import("@/pages/document-program-viewer").then(m => ({ default: m.Component })));
const AssignedProgramsPageLazy = lazy(() => import("@/pages/assigned-programs-page").then(m => ({ default: m.Component })));
const AssignProgramPageLazy = lazy(() => import("@/pages/assign-program-page").then(m => ({ default: m.AssignProgramPage })));

// Competition & Meets
const MeetsPageLazy = lazy(() => import("@/pages/meets-page"));
const CreateMeetPageLazy = lazy(() => import("@/pages/create-meet-page"));
const ResultsPageLazy = lazy(() => import("@/pages/results-page"));
const CompetitionCalendarPageLazy = lazy(() => import("@/pages/competition-calendar-page"));

// Social & Athletes
const ConnectionsPageLazy = lazy(() => import("@/pages/connections-page"));
const MyAthletesPageLazy = lazy(() => import("@/pages/my-athletes-page"));
const AthletesPageLazy = lazy(() => import("@/pages/athletes-page"));
const CoachesPageLazy = lazy(() => import("@/pages/coaches-page"));
const RosterStatsPageLazy = lazy(() => import("@/pages/roster-stats-page"));
const ClubsPageLazy = lazy(() => import("@/pages/clubs-page"));
const ClubDetailPageLazy = lazy(() => import("@/pages/club-detail-page").then(m => ({ default: m.Component })));
const ClubManagementPageLazy = lazy(() => import("@/pages/club-management-page").then(m => ({ default: m.Component })));
const CreateGroupPageLazy = lazy(() => import("@/pages/create-group-page"));
const ChannelSettingsPageLazy = lazy(() => import("@/pages/channel-settings-page"));
const FeedPageLazy = lazy(() => import("@/pages/feed-page"));

// Profiles
const ProfilePageLazy = lazy(() => import("@/pages/profile-page-new"));
const PublicProfilePageLazy = lazy(() => import("@/pages/public-profile-page"));

// Marketplace
const MarketplacePageLazy = lazy(() => import("@/pages/marketplace-page"));
const MarketplaceListingDetailsLazy = lazy(() => import("@/pages/marketplace-listing-details"));
const MarketplaceCartLazy = lazy(() => import("@/pages/marketplace-cart"));
const MarketplaceCreateListingPageLazy = lazy(() => import("@/pages/marketplace-create-listing-page"));

// Subscriptions & Payment
const MySubscriptionsPageLazy = lazy(() => import("@/pages/my-subscriptions-page"));
const SubscriptionManagementPageLazy = lazy(() => import("@/pages/subscription-management-page"));
const SubscriptionPageLazy = lazy(() => import("@/pages/subscription-page"));
const CheckoutPageLazy = lazy(() => import("@/pages/checkout-page"));
const SpikesPageLazy = lazy(() => import("@/pages/spikes-page"));

// Rehab & Health
const RehabPageLazy = lazy(() => import("@/pages/rehab-page"));
const HamstringRehabPageLazy = lazy(() => import("@/pages/rehab/acute-muscle/hamstring"));
const FootRehabPageLazy = lazy(() => import("@/pages/rehab/chronic-injuries/foot"));

// AI & Special Features
const SprinthiaPageLazy = lazy(() => import("@/pages/sprinthia-simple"));
const VideoPlayerPageLazy = lazy(() => import("@/pages/video-player-page").then(m => ({ default: m.VideoPlayerPage })));
const ArcadePageLazy = lazy(() => import("@/pages/arcade-page"));

// Admin & Management
const AdminPanelPageLazy = lazy(() => import("@/pages/admin-panel-page"));
const AdminAffiliateSubmissionsLazy = lazy(() => import("@/pages/admin-affiliate-submissions"));

// Onboarding & Auth
const OnboardingContainerLazy = lazy(() => import("@/pages/onboarding/onboarding-container"));
const AmbassadorLandingPageLazy = lazy(() => import("@/pages/ambassador-landing-page"));

// Test & Debug pages  
const TestPageLazy = lazy(() => import("@/pages/test-page-simple"));
const MinimalTestLazy = lazy(() => import("@/pages/minimal-test"));
const DebugSimpleLazy = lazy(() => import("@/pages/debug-simple"));
const EmergencyDebugLazy = lazy(() => import("@/pages/emergency-debug"));
const ReactNativePreviewLazy = lazy(() => import("@/pages/react-native-preview").then(m => ({ default: m.ReactNativePreview })));

// Legacy
const ConversationDetailPageLazy = lazy(() => import("@/pages/conversation-detail-page"));
const FriendsPageLazy = lazy(() => import("@/pages/friends-page"));

// Wrapper components for ProtectedRoute compatibility
const HomePage = () => <HomePageLazy />;
const AuthPage = () => <AuthPageLazy />;
const ChatPage = () => <ChatPageLazy />;
const NotFound = () => <NotFoundLazy />;
const StopwatchPage = () => <StopwatchPageLazy />;
const StartGunPage = () => <StartGunPageLazy />;
const JournalPage = () => <JournalPageLazy />;
const PhotoFinishPage = () => <PhotoFinishPageLazy />;
const VelocityTrackerPage = () => <VelocityTrackerPageLazy />;
const PhotoFinishAnalysisPage = () => <PhotoFinishAnalysisPageLazy />;
const ExerciseLibraryPage = () => <ExerciseLibraryPageLazy />;
const ExerciseLibraryAddPage = () => <ExerciseLibraryAddPageLazy />;
const VideoAnalysisPage = () => <VideoAnalysisPageLazy />;
const PracticePage = () => <PracticePageLazy />;
const JournalEntryPage = () => <JournalEntryPageLazy />;
const WorkoutToolsPage = () => <WorkoutToolsPageLazy />;
const ProgramsPage = () => <ProgramsPageLazy />;
const ProgramCreatePage = () => <ProgramCreatePageLazy />;
const ProgramDetailPage = () => <ProgramDetailPageLazy />;
const ProgramEditorPage = () => <ProgramEditorPageLazy />;
const DocumentProgramViewer = () => <DocumentProgramViewerLazy />;
const AssignedProgramsPage = () => <AssignedProgramsPageLazy />;
const AssignProgramPage = () => <AssignProgramPageLazy />;
const MeetsPage = () => <MeetsPageLazy />;
const CreateMeetPage = () => <CreateMeetPageLazy />;
const ResultsPage = () => <ResultsPageLazy />;
const CompetitionCalendarPage = () => <CompetitionCalendarPageLazy />;
const ConnectionsPage = () => <ConnectionsPageLazy />;
const MyAthletesPage = () => <MyAthletesPageLazy />;
const AthletesPage = () => <AthletesPageLazy />;
const CoachesPage = () => <CoachesPageLazy />;
const RosterStatsPage = () => <RosterStatsPageLazy />;
const ClubsPage = () => <ClubsPageLazy />;
const ClubDetailPage = () => <ClubDetailPageLazy />;
const ClubManagementPage = () => <ClubManagementPageLazy />;
const CreateGroupPage = () => <CreateGroupPageLazy />;
const ChannelSettingsPage = () => <ChannelSettingsPageLazy />;
const FeedPage = () => <FeedPageLazy />;
const ProfilePage = () => <ProfilePageLazy />;
const PublicProfilePage = () => <PublicProfilePageLazy />;
const MarketplacePage = () => <MarketplacePageLazy />;
const MarketplaceListingDetails = () => <MarketplaceListingDetailsLazy />;
const MarketplaceCart = () => <MarketplaceCartLazy />;
const MarketplaceCreateListingPage = () => <MarketplaceCreateListingPageLazy />;
const MySubscriptionsPage = () => <MySubscriptionsPageLazy />;
const SubscriptionManagementPage = () => <SubscriptionManagementPageLazy />;
const SubscriptionPage = () => <SubscriptionPageLazy />;
const CheckoutPage = () => <CheckoutPageLazy />;
const SpikesPage = () => <SpikesPageLazy />;
const RehabPage = () => <RehabPageLazy />;
const HamstringRehabPage = () => <HamstringRehabPageLazy />;
const FootRehabPage = () => <FootRehabPageLazy />;
const SprinthiaPage = () => <SprinthiaPageLazy />;
const VideoPlayerPage = () => <VideoPlayerPageLazy />;
const ArcadePage = () => <ArcadePageLazy />;
const AdminPanelPage = () => <AdminPanelPageLazy />;
const AdminAffiliateSubmissions = () => <AdminAffiliateSubmissionsLazy />;
const OnboardingContainer = () => <OnboardingContainerLazy />;
const AmbassadorLandingPage = () => <AmbassadorLandingPageLazy />;
const TestPage = () => <TestPageLazy />;
const MinimalTest = () => <MinimalTestLazy />;
const DebugSimple = () => <DebugSimpleLazy />;
const EmergencyDebug = () => <EmergencyDebugLazy />;
const ReactNativePreview = () => <ReactNativePreviewLazy />;
const ConversationDetailPage = () => <ConversationDetailPageLazy />;
const FriendsPage = () => <FriendsPageLazy />;
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

// Removed RootRedirect component - no more automatic redirects

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
          {/* Root path - require authentication (must be first to match correctly) */}
          <ProtectedRoute path="/" component={HomePage} />
          
          {/* Home route */}
          <ProtectedRoute path="/home" component={HomePage} />
        
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
        <ProtectedRoute path="/feed" component={FeedPage} />

        
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
  
  // Enhanced authentication redirect with fallback
  useEffect(() => {
    const unprotectedPaths = ['/auth', '/affiliate', '/emergency', '/debug'];
    const isUnprotectedPath = unprotectedPaths.some(path => 
      location === path || location.startsWith('/onboarding')
    );
    
    // Add emergency fallback for stuck authentication
    const authTimeout = setTimeout(() => {
      if (isLoading && !user) {
        console.warn('Authentication taking too long, forcing redirect to /auth');
        setLocation('/auth');
      }
    }, 10000); // 10 second timeout
    
    // Only redirect if user is not authenticated AND it's not an unprotected path
    if (!isLoading && !initialLoading && !user && !isUnprotectedPath) {
      console.log('MainApp: Redirecting unauthenticated user from', location, 'to /auth');
      setLocation('/auth');
    }
    
    return () => clearTimeout(authTimeout);
  }, [user, isLoading, initialLoading, location, setLocation]);
  
  // Redirect to onboarding for new user registrations (not logins)
  useEffect(() => {
    // For simplicity, check if the user has completed onboarding before
    const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
    
    // Only redirect to onboarding if user just registered (not logged in) and hasn't completed it before
    if (registerMutation.isSuccess && !hasCompletedOnboarding) {
      window.location.href = '/onboarding/welcome';
    }
  }, [registerMutation.isSuccess, registerMutation.data]);
  
  // ALL HOOKS ABOVE - NO EARLY RETURNS BELOW
  
  // Show loading while authentication is loading or during initial load
  const showLoading = isLoading || initialLoading;
  const showRedirecting = !user && location !== '/auth' && location !== '/affiliate' && !location.startsWith('/onboarding');
  const isAdminPanel = location === '/admin-panel';
  
  if (showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (showRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }
  
  if (isAdminPanel) {
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
      
      {/* Top Header Bar - Hide for chat routes, auth page, affiliate page, and Sprinthia. Only show for authenticated users */}
      {!location.startsWith('/chat') && location !== '/auth' && location !== '/affiliate' && location !== '/sprinthia' && user && <Header />}
      
      {/* Hamburger Menu for all screens - Hide for chat routes, auth page, affiliate page, and Sprinthia. Only show for authenticated users */}
      {!location.startsWith('/chat') && location !== '/auth' && location !== '/affiliate' && location !== '/sprinthia' && user && (
        <div className="fixed top-4 left-4 z-50">
          <HamburgerMenu />
        </div>
      )}
      
      {/* Main Content */}
      <main className={location.startsWith('/chat') || location === '/auth' || location === '/affiliate' || location === '/sprinthia' ? '' : 'pt-20 pb-16 md:pb-0'}>
        <div className={location.startsWith('/chat') || location === '/auth' || location === '/affiliate' || location === '/sprinthia' ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
          <Router />
        </div>
      </main>
      
      {/* Bottom Navigation - Hide for chat routes, auth page, affiliate page, and Sprinthia. Only show for authenticated users */}
      {!location.startsWith('/chat') && location !== '/auth' && location !== '/affiliate' && location !== '/sprinthia' && user && <BottomNavigation />}
      
      {/* Onboarding flow moved to separate pages */}
      
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <KeyboardProvider>
          <TooltipProvider>
            <MainApp />
          </TooltipProvider>
        </KeyboardProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;