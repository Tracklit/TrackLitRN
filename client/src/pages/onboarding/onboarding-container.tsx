import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sparkles, ArrowRight, Info, ExternalLink } from "lucide-react";
import { Link, useLocation } from "wouter";

interface OnboardingStep {
  id: string;
  content: React.ReactNode;
}

export default function OnboardingContainer() {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      content: (
        <Card className="w-full max-w-md bg-[#0a1529] border-blue-800/30">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Welcome to TrackLit</h1>
            <p className="text-lg font-semibold text-primary">The Ultimate Performance Toolkit</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center text-gray-300">
              <p>TrackLit helps you track workouts, manage programs and analyze performance to reach your maximum potential.</p>
              
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-sm mt-4">
                <Info className="h-5 w-5 text-primary flex-shrink-0" />
                <span>We've created a sample training program so you can explore right away.</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={() => setCurrentStep(1)} className="w-full">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="ghost" asChild className="w-full" onClick={() => {
                localStorage.setItem('onboardingCompleted', 'true');
                localStorage.setItem('hasCompletedOnboarding', 'true');
              }}>
                <Link href="/">Skip</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: "alpha-info",
      content: (
        <Card className="w-full max-w-md bg-[#0a1529] border-blue-800/30">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Info className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Alpha Testing Information</h1>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center text-gray-300">
              <p className="mb-4">Welcome to the TrackLit alpha test! This app is still in development and not finalized yet.</p>
              
              <div className="p-4 bg-muted/40 rounded-md text-sm text-left">
                <span className="font-medium block mb-2">What to expect during alpha testing:</span>
                <ul className="space-y-2 list-disc pl-4">
                  <li>Some features may be incomplete or change during development</li>
                  <li>You might encounter occasional bugs or performance issues</li>
                  <li>Your feedback is extremely valuable to us at this stage</li>
                </ul>
              </div>
              
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-sm mt-4 text-left">
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
            </div>

            <div className="flex flex-col gap-3">
              <Button asChild className="w-full" onClick={() => {
                localStorage.setItem('onboardingCompleted', 'true');
                localStorage.setItem('hasCompletedOnboarding', 'true');
              }}>
                <Link href="/">
                  Get Started
                </Link>
              </Button>
              <Button variant="ghost" asChild className="w-full" onClick={() => {
                localStorage.setItem('onboardingCompleted', 'true');
                localStorage.setItem('hasCompletedOnboarding', 'true');
              }}>
                <Link href="/">Skip</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }
  ];

  // Handle touch events for swipe detection
  const handleTouchStart = (e: React.TouchEvent) => {
    touchEndRef.current = null;
    touchStartRef.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;

    const diffX = touchStartRef.current.x - touchEndRef.current.x;
    const diffY = touchStartRef.current.y - touchEndRef.current.y;

    // Only detect horizontal swipes (ignore vertical scrolling)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) {
        // Swipe left - go to next step
        if (currentStep < steps.length - 1) {
          setCurrentStep(currentStep + 1);
        }
      } else {
        // Swipe right - go to previous step
        if (currentStep > 0) {
          setCurrentStep(currentStep - 1);
        }
      }
    }
  };

  // Update URL when step changes
  useEffect(() => {
    const stepRoutes = ['/onboarding/welcome', '/onboarding/alpha-info'];
    if (stepRoutes[currentStep]) {
      setLocation(stepRoutes[currentStep]);
    }
  }, [currentStep, setLocation]);

  // Set step based on current URL
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/onboarding/welcome') {
      setCurrentStep(0);
    } else if (path === '/onboarding/alpha-info') {
      setCurrentStep(1);
    }
  }, []);

  return (
    <div 
      className="min-h-screen bg-[#010a18] text-white flex flex-col items-center justify-center p-4"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe hint */}
      <div className="mb-4 text-center">
        <p className="text-xs text-gray-400">Swipe left or right to navigate</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center">
        {steps[currentStep].content}
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center mt-6 mb-8">
        <div className="flex gap-3">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`h-3 rounded-full transition-all duration-300 ${
                currentStep === index 
                  ? 'w-12 bg-blue-500' 
                  : 'w-3 bg-gray-400 hover:bg-gray-300'
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}