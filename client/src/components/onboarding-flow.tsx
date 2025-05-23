import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Smartphone, ArrowRight, Download, Info, ExternalLink, AlertCircle } from "lucide-react";

export type OnboardingStep = {
  title: string;
  description: React.ReactNode;
  image?: string;
  icon?: React.ReactNode;
};

interface OnboardingFlowProps {
  onComplete: () => void;
  isFirstTimeUser?: boolean;
}

export function OnboardingFlow({ onComplete, isFirstTimeUser = true }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showFlow, setShowFlow] = useState(isFirstTimeUser);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  
  // A-Z animation class for entrance
  const animationClass = "animate-in fade-in-0 slide-in-from-bottom-5 duration-300";
  
  const steps: OnboardingStep[] = [
    {
      title: "Welcome to TrackLit",
      description: (
        <>
          Your complete track and field training companion.
          <div className="mt-2"></div>
          TrackLit helps you track workouts, manage programs, and analyze performance to reach your athletic potential.
          
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-sm mt-4">
            <Info className="h-5 w-5 text-primary flex-shrink-0" />
            <span>We've created a sample training program so you can explore right away.</span>
          </div>
        </>
      ),
      icon: <Sparkles className="h-8 w-8 text-primary" />
    },
    {
      title: "Alpha Testing Information",
      description: (
        <>
          Welcome to the TrackLit alpha test! This app is still in development and not finalized yet.
          
          <div className="p-4 bg-muted/40 rounded-md mt-4 text-sm">
            <span className="font-medium block mb-2">What to expect during alpha testing:</span>
            <ul className="space-y-2 list-disc pl-4">
              <li>Some features may be incomplete or change during development</li>
              <li>You might encounter occasional bugs or performance issues</li>
              <li>Your feedback is extremely valuable to us at this stage</li>
            </ul>
          </div>
          
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-sm mt-4">
            <ExternalLink className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <span className="font-medium block">Join our Telegram testing group</span>
              <a 
                href="https://t.me/+LHVB4IeeSvEwNmNk" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary underline"
              >
                https://t.me/+LHVB4IeeSvEwNmNk
              </a>
              <span className="text-xs block mt-1">
                Report bugs and suggest features to help improve TrackLit
              </span>
            </div>
          </div>
        </>
      ),
      icon: <Info className="h-8 w-8 text-primary" />
    },
    {
      title: "Install TrackLit for Easy Access",
      description: (
        <>
          Add TrackLit to your home screen for quick access to your training programs.
          
          <div className="p-4 border border-border rounded-md mt-4">
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
        </>
      ),
      icon: <Smartphone className="h-8 w-8 text-primary" />
    },
  ];

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowFlow(false);
      setShowInstallPrompt(true);
    }
  };

  const handleSkip = () => {
    setShowFlow(false);
    onComplete();
  };

  const handleCompleteInstall = () => {
    setShowInstallPrompt(false);
    onComplete();
  };

  // Check if we should show onboarding at all
  useEffect(() => {
    // We could check localStorage or user preferences here to see if
    // the user has already completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');
    if (hasCompletedOnboarding && isFirstTimeUser) {
      setShowFlow(false);
      onComplete();
    }
  }, [isFirstTimeUser, onComplete]);

  // When flow complete, store in localStorage
  useEffect(() => {
    if (!showFlow && !showInstallPrompt) {
      localStorage.setItem('hasCompletedOnboarding', 'true');
    }
  }, [showFlow, showInstallPrompt]);

  return (
    <>
      {/* Main Onboarding Steps */}
      <Dialog open={showFlow} onOpenChange={(open) => {
        if (!open) handleSkip();
        setShowFlow(open);
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              {steps[currentStep].icon}
            </div>
            <DialogTitle className="text-center text-xl">
              {steps[currentStep].title}
            </DialogTitle>
          </DialogHeader>
          
          <div className={animationClass}>
            <div className="text-center text-muted-foreground my-4">
              {steps[currentStep].description}
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between mt-4">
            <Button 
              variant="ghost" 
              onClick={handleSkip}
              className="sm:order-1"
            >
              Skip
            </Button>
            <Button 
              onClick={handleNextStep} 
              className="sm:order-2"
            >
              {currentStep < steps.length - 1 ? (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Get Started
                </>
              )}
            </Button>
          </DialogFooter>
          
          <div className="flex justify-center mt-4">
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <span
                  key={index}
                  className={`block h-1.5 rounded-full ${
                    currentStep === index ? 'w-6 bg-primary' : 'w-1.5 bg-muted'
                  } transition-all`}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Install App Prompt Overlay */}
      {showInstallPrompt && (
        <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-card rounded-lg border border-border shadow-lg p-6 relative">
            <h2 className="text-xl font-semibold mb-4 text-center">Install TrackLit Now</h2>
            
            <div className="text-center mb-6">
              <p className="mb-4">Add TrackLit to your home screen for the best experience and earn 15 Spikes!</p>
              
              <div className="inline-block">
                <Button 
                  size="lg" 
                  className="gap-2"
                >
                  <Download className="h-5 w-5" />
                  Add to Home Screen
                </Button>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleCompleteInstall} 
              className="w-full mt-4"
            >
              I'll do this later
            </Button>
          </div>
        </div>
      )}
    </>
  );
}