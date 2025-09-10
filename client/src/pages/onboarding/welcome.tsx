import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sparkles, ArrowRight, Info } from "lucide-react";
import { Link } from "wouter";

export default function OnboardingWelcomePage() {
  return (
    <div className="min-h-screen bg-[#010a18] text-white flex items-center justify-center p-4">
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
            <Button asChild className="w-full">
              <Link href="/onboarding/alpha-info">
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" asChild className="w-full">
              <Link href="/">Skip</Link>
            </Button>
          </div>

          {/* Progress indicator */}
          <div className="flex justify-center">
            <div className="flex gap-1">
              <span className="block h-1.5 w-6 bg-primary rounded-full" />
              <span className="block h-1.5 w-1.5 bg-muted rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}