import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Switch, Route } from "wouter";
import PracticePageMinimal from "@/pages/practice-page-minimal";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen text-foreground bg-background">
          <main className="pt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Switch>
                <Route path="/practice" component={PracticePageMinimal} />
                <Route path="/" component={PracticePageMinimal} />
              </Switch>
            </div>
          </main>
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;