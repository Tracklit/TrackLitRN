import { ProtectedRoute } from "@/lib/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Upload, 
  Camera, 
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Percent,
  Home,
  Calculator,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { useState, useEffect } from "react";

export default function PracticePage() {
  const { user } = useAuth();
  
  // Swipe navigation
  const [currentDay, setCurrentDay] = useState<string>("today");
  
  // UI state
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  
  // Percentage and distance calculation
  const [percentage, setPercentage] = useState<number[]>([95]);
  const [distance, setDistance] = useState<number[]>([100]);
  const [calculatedTime, setCalculatedTime] = useState<number>(0);
  
  // Dummy best times data (will be fetched from API in future)
  const bestTimes: Record<string, number> = {
    "50": 6.2,
    "60": 7.3,
    "80": 9.6,
    "90": 10.8,
    "100": 12.0,
    "110": 13.2,
    "120": 14.5,
    "150": 18.3,
    "180": 22.1,
    "200": 24.8,
    "220": 27.6,
    "250": 31.7,
    "280": 35.9,
    "300": 38.8,
    "350": 47.2,
    "400": 54.1,
    "500": 72.8,
    "600": 94.5
  };
  
  // Calculate distance marks at specific points
  const distanceMarks = [50, 60, 80, 90, 100, 110, 120, 150, 180, 200, 220, 250, 280, 300, 350, 400, 500, 600];
  
  // Navigation functions
  const goToPreviousDay = () => {
    setCurrentDay("yesterday");
  };
  
  const goToNextDay = () => {
    setCurrentDay("tomorrow");
  };
  
  // Calculate goal time based on percentage and distance
  useEffect(() => {
    // Find the closest distance mark
    const closestDistance = distanceMarks.reduce((prev, curr) => {
      return (Math.abs(curr - distance[0]) < Math.abs(prev - distance[0])) ? curr : prev;
    });
    
    // Get best time for that distance (or calculate if not available)
    const bestTime = bestTimes[closestDistance.toString()] || (bestTimes["100"] * (closestDistance / 100));
    
    // Calculate time based on selected percentage
    const targetTime = bestTime * (100 / percentage[0]);
    
    setCalculatedTime(parseFloat(targetTime.toFixed(2)));
  }, [percentage, distance]);
  
  return (
    <div className="container max-w-3xl mx-auto p-4 pt-20 md:pt-24 pb-20">
      <div className="text-center mx-auto max-w-md">
        <Link href="/" className="inline-flex items-center text-muted-foreground mb-4 hover:text-primary transition-colors">
          <Home className="h-4 w-4 mr-1" />
          <span>Back to Dashboard</span>
        </Link>
        
        <h1 className="text-3xl font-bold tracking-tight">
          {currentDay === "today" ? "Today's Practice" : currentDay === "yesterday" ? "Yesterday's Practice" : "Tomorrow's Practice"}
        </h1>
        <p className="text-muted-foreground mt-2 mb-6">
          Track your training sessions and progress
        </p>
      </div>
      
      <div className="mt-6 relative">
        {/* Day navigation */}
        <div className="flex items-center justify-between mb-6 max-w-xs mx-auto text-center">
          <Button 
            variant="ghost" 
            onClick={goToPreviousDay} 
            disabled={currentDay === "yesterday"}
            className={cn(
              "flex items-center gap-1 text-sm",
              currentDay === "yesterday" ? "opacity-30 cursor-not-allowed" : ""
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Yesterday</span>
          </Button>
          
          <span className="text-sm font-semibold">
            {currentDay === "today" 
              ? "May 12, 2025" 
              : currentDay === "yesterday" 
              ? "May 11, 2025" 
              : "May 13, 2025"}
          </span>
          
          <Button 
            variant="ghost" 
            onClick={goToNextDay}
            disabled={currentDay === "tomorrow"}
            className={cn(
              "flex items-center gap-1 text-sm",
              currentDay === "tomorrow" ? "opacity-30 cursor-not-allowed" : ""
            )}
          >
            <span>Tomorrow</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Main session content - single column layout */}
        <div>
          <Card className="mb-6">
            <CardContent className="p-0">
              {/* Workout details as bullet points */}
              <div className="p-6 pt-6 relative">
                <div className="absolute right-6 top-6">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarFallback>{user?.name?.split(' ').map(n => n[0]).join('') || user?.username?.[0]}</AvatarFallback>
                  </Avatar>
                </div>
                <h3 className="text-lg font-medium mb-3">Workout Plan</h3>
                <ul className="space-y-3 list-disc pl-8 pr-4">
                  <li>Warm-up: 10 min dynamic stretching</li>
                  <li>Main set: 5 x 100m sprints at 95% intensity</li>
                  <li>Recovery: 3 min between sets</li>
                  <li>Cool down: 5 min easy jog + stretching</li>
                  <li>Total distance: ~1.5km</li>
                </ul>
              </div>
              
              {/* Calculator toggle with animation */}
              <div className="px-6 pt-4">
                <Separator className="bg-primary/10 h-[2px]" />
                <Collapsible
                  open={showCalculator}
                  onOpenChange={setShowCalculator}
                  className="w-full"
                >
                  <CollapsibleTrigger asChild>
                    <button 
                      className="flex items-center justify-center gap-2 w-full mt-4 mb-2 p-2 hover:bg-muted rounded-md transition-colors"
                    >
                      <Calculator className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Performance Calculator
                      </span>
                      {showCalculator ? 
                        <ChevronUp className="h-4 w-4 text-muted-foreground transition-transform duration-200" /> : 
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                      }
                    </button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="overflow-hidden data-[state=open]:animate-expand data-[state=closed]:animate-collapse">
                    {/* Percentage and distance sliders */}
                    <div className="p-6 border-b">
                      <div className="mb-8">
                        <div className="text-center mb-3">
                          <span className="text-3xl font-bold text-primary">{percentage}%</span>
                        </div>
                        <div className="flex items-center gap-3" style={{ maxWidth: "275px", margin: "0 auto" }}>
                          <label className="text-sm font-medium whitespace-nowrap">
                            <Percent className="h-4 w-4 mr-1 inline-block" />
                            Intensity:
                          </label>
                          <Slider
                            value={percentage}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={setPercentage}
                            className="py-2 flex-1"
                          />
                        </div>
                        <div className="text-center text-xs text-muted-foreground mt-1">
                          <span>Recovery (0%) — Maximum (100%)</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-center mb-3">
                          <span className="text-3xl font-bold text-primary">{distance[0]}m</span>
                        </div>
                        <div className="flex items-center gap-3" style={{ maxWidth: "275px", margin: "0 auto" }}>
                          <label className="text-sm font-medium whitespace-nowrap">
                            <TrendingUp className="h-4 w-4 mr-1 inline-block" />
                            Distance:
                          </label>
                          <Slider
                            value={distance}
                            min={50}
                            max={600}
                            step={1}
                            onValueChange={setDistance}
                            className="py-2 flex-1"
                          />
                        </div>
                        <div className="text-center text-xs text-muted-foreground mt-1">
                          <span>50m — 600m</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Goal time calculation */}
                    <div className="p-6 bg-primary/5">
                      <div className="bg-primary/10 p-6 rounded-lg text-center max-w-sm mx-auto">
                        <div className="mb-2">
                          <span className="text-base font-medium">Goal Time ({percentage}% of Best)</span>
                        </div>
                        <div className="text-5xl font-bold text-primary mb-2">
                          {calculatedTime.toFixed(2)}s
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Based on your best time of {bestTimes["100"]}s for 100m
                        </p>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </CardContent>
          </Card>
          
          {/* Media Upload Section */}
          <div className="flex justify-center mt-8">
            <Button size="lg" className="mr-4 py-6 px-8">
              <Upload className="h-5 w-5 mr-3" />
              <span className="text-base">Upload Results</span>
            </Button>
            
            <Button variant="outline" size="lg" className="py-6 px-8">
              <Camera className="h-5 w-5 mr-3" />
              <span className="text-base">Add Media</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Protected route wrapper
export function Component() {
  return (
    <ProtectedRoute path="/practice" component={PracticePage} />
  );
}