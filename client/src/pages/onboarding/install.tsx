import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Smartphone, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function OnboardingInstallPage() {
  const handleComplete = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    localStorage.setItem('hasCompletedOnboarding', 'true');
  };

  return (
    <div className="min-h-screen bg-[#010a18] text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#0a1529] border-blue-800/30">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Smartphone className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Install TrackLit for Easy Access</h1>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-gray-300">
            <p className="mb-4">Add TrackLit to your home screen for quick access to your training programs.</p>
            
            <div className="p-4 border border-border rounded-md text-left">
              <span className="text-sm font-medium block mb-2">How to install:</span>
              <div className="text-sm space-y-3">
                <div className="flex items-start gap-2">
                  <span className="bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <span>Tap the share button in your browser</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span>Select "Add to Home Screen"</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span>Tap "Add" to confirm</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-sm mt-4">
              <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
              <span>Earn 15 Spikes when you install the app!</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild className="w-full" onClick={handleComplete}>
              <Link href="/">
                Get Started
              </Link>
            </Button>
            <Button variant="ghost" asChild className="w-full" onClick={handleComplete}>
              <Link href="/">Skip</Link>
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="flex justify-center">
            <div className="flex gap-1">
              <span className="block h-1.5 w-1.5 bg-muted rounded-full" />
              <span className="block h-1.5 w-1.5 bg-muted rounded-full" />
              <span className="block h-1.5 w-6 bg-primary rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}