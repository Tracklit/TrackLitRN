import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sparkles, ArrowRight, Info, Coins, Gift } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface OnboardingStep {
  id: string;
  content: React.ReactNode;
}

export default function OnboardingContainer() {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);
  const [claimedSpikes, setClaimedSpikes] = useState(false);
  const [animatedCount, setAnimatedCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const { user } = useAuth();

  // Claim Spikes mutation
  const claimSpikesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/claim-welcome-spikes');
    },
    onSuccess: () => {
      setClaimedSpikes(true);
      animateCountUp();
      // Invalidate cache to refresh user data and spikes balance
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/spike-transactions'] });
    }
  });

  // Handle claim spikes
  const handleClaimSpikes = () => {
    claimSpikesMutation.mutate();
  };

  // Animate count up effect
  const animateCountUp = () => {
    setShowConfetti(true);
    let count = 0;
    const target = 100;
    const duration = 2000; // 2 seconds
    const increment = target / (duration / 50); // 50ms intervals

    const timer = setInterval(() => {
      count += increment;
      if (count >= target) {
        count = target;
        clearInterval(timer);
      }
      setAnimatedCount(Math.floor(count));
    }, 50);

    // Remove confetti effect after animation
    setTimeout(() => setShowConfetti(false), 3000);
  };

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
            </div>
          </CardContent>
        </Card>
      )
    },
    {
      id: "spikes",
      content: (
        <Card className="w-full max-w-md bg-[#0a1529] border-blue-800/30">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Coins className="h-12 w-12 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold">Meet Spikes</h1>
            <p className="text-lg font-semibold text-amber-500">Your Training Rewards</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center text-gray-300">
              <p className="mb-4">Spikes are your in-app currency that you earn automatically by training and engaging with TrackLit.</p>
              
              <div className="p-4 bg-muted/40 rounded-md text-sm text-left">
                <span className="font-medium block mb-2">Earn Spikes by:</span>
                <ul className="space-y-1 list-disc pl-4">
                  <li>Completing training sessions</li>
                  <li>Daily login streaks</li>
                  <li>Achieving personal records</li>
                  <li>Group participation</li>
                  <li>Competition results</li>
                </ul>
              </div>
              
              <div className="p-4 bg-amber-500/10 rounded-md text-sm text-left mt-4">
                <span className="font-medium block mb-2 text-amber-500">Use Spikes to unlock:</span>
                <ul className="space-y-1 list-disc pl-4 text-amber-200">
                  <li>Pro tier features (1,000 Spikes)</li>
                  <li>Advanced analytics</li>
                  <li>Custom workout plans</li>
                  <li>Priority support</li>
                </ul>
              </div>
            </div>

            {!claimedSpikes ? (
              <div className="text-center">
                <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20 mb-4">
                  <Gift className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-400 mb-1">Welcome Bonus Available!</p>
                  <p className="text-xs text-gray-400">Claim your first 100 Spikes</p>
                </div>
                
                <Button 
                  onClick={handleClaimSpikes}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-black font-semibold"
                  disabled={claimSpikesMutation.isPending}
                >
                  {claimSpikesMutation.isPending ? "Claiming..." : "Claim 100 Spikes"}
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <div className={`p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30 mb-4 transition-all duration-1000 ${showConfetti ? 'scale-105 shadow-lg' : ''}`}>
                  <div className="flex items-center justify-center mb-2">
                    <Coins className="h-8 w-8 text-amber-500 mr-2" />
                    <span className="text-3xl font-bold text-amber-500">{animatedCount}</span>
                  </div>
                  <p className="text-green-400 font-medium">🎉 Spikes Claimed! 🎉</p>
                  <p className="text-xs text-gray-400">Added to your account</p>
                </div>
                
                <Button asChild className="w-full" onClick={() => {
                  localStorage.setItem('onboardingCompleted', 'true');
                  localStorage.setItem('hasCompletedOnboarding', 'true');
                }}>
                  <Link href="/">
                    Start Training
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
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
    const stepRoutes = ['/onboarding/welcome', '/onboarding/alpha-info', '/onboarding/spikes'];
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
    } else if (path === '/onboarding/spikes') {
      setCurrentStep(2);
    }
  }, []);

  return (
    <div 
      className="min-h-screen bg-[#010a18] text-white relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe hint */}
      <div className="absolute top-6 left-0 right-0 text-center">
        <p className="text-xs text-gray-400">Swipe left or right to navigate</p>
      </div>

      {/* Content - Centered vertically */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-6">
          {steps[currentStep].content}
          
          {/* Navigation dots - Right under the info box */}
          <div className="flex justify-center">
            <div className="flex gap-3">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`h-4 rounded-full transition-all duration-300 ${
                    currentStep === index 
                      ? 'w-12 bg-blue-500' 
                      : 'w-4 bg-gray-400 hover:bg-gray-300'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}