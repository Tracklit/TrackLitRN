import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { KeyboardProvider } from "@/contexts/keyboard-context";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { TickerProvider } from "@/contexts/ticker-context";

import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import { PracticePageWrapper } from "@/pages/practice-page";
import { Component as ProgramsPage } from "@/pages/programs-page";
import MeetsPage from "@/pages/meets-page";
import { Component as StopwatchPage } from "@/pages/tools/stopwatch-page";

function AppContent() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if user is not authenticated
  if (!user) {
    return <AuthPage />;
  }

  // Show main app if user is authenticated
  return (
    <KeyboardProvider>
      <TickerProvider>
        <div className="min-h-screen bg-gray-50">
          <Header />
          
          <main className="pb-16">
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/practice" component={PracticePageWrapper} />
              <Route path="/programs" component={ProgramsPage} />
              <Route path="/race" component={MeetsPage} />
              <Route path="/tools/stopwatch" component={StopwatchPage} />
              <Route>
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Page Coming Soon</h2>
                    <p className="text-gray-600">This page is under development.</p>
                  </div>
                </div>
              </Route>
            </Switch>
          </main>
          
          <BottomNavigation />
        </div>
      </TickerProvider>
    </KeyboardProvider>
  );
}

function AuthenticatedApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default AuthenticatedApp;