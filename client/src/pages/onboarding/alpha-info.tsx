import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Info, ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function OnboardingAlphaInfoPage() {
  return (
    <div className="min-h-screen bg-[#010a18] text-white flex items-center justify-center p-4">
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

          {/* Progress indicator */}
          <div className="flex justify-center">
            <div className="flex gap-1">
              <span className="block h-1.5 w-1.5 bg-muted rounded-full" />
              <span className="block h-1.5 w-6 bg-primary rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}