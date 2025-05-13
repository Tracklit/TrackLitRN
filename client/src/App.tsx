import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
