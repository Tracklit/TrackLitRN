import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Switch, Route, useLocation } from "wouter";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Header } from "@/components/layout/header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { PracticePageWrapper } from "@/pages/practice-page";
import HomePage from "@/pages/home-page";
import { AuthProvider } from "@/hooks/use-auth";

function MinimalApp() {
  const [location] = useLocation();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Header />
            
            {/* Main Content */}
            <main className="pb-16">
              <Switch>
                <Route path="/" component={HomePage} />
                <Route path="/practice" component={PracticePageWrapper} />
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
            
            {/* Bottom Navigation */}
            <BottomNavigation />
            
            {/* Toast notifications */}
            <Toaster />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default MinimalApp;