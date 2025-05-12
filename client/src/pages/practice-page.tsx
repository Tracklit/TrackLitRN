import { ProtectedRoute } from "@/lib/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Dumbbell, 
  Calendar, 
  Clock, 
  Activity,
  Upload, 
  Camera, 
  Check, 
  PauseCircle, 
  BarChart,
  ChevronLeft,
  ChevronRight,
  Timer,
  TrendingUp,
  Percent
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export default function PracticePage() {
  const { user } = useAuth();
  // Session feedback sliders
  const [intensity, setIntensity] = useState<number[]>([60]);
  const [effort, setEffort] = useState<number[]>([70]);
  const [enjoyment, setEnjoyment] = useState<number[]>([80]);
  
  // Timer state
  const [duration, setDuration] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [sessionTimerInterval, setSessionTimerInterval] = useState<number | null>(null);
  
  // Swipe navigation
  const [currentDay, setCurrentDay] = useState<string>("today");
  
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
  
  // Timer functions
  const toggleTimer = () => {
    if (isTimerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  };
  
  const startTimer = () => {
    setIsTimerRunning(true);
    const interval = window.setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    setSessionTimerInterval(interval);
  };
  
  const pauseTimer = () => {
    if (sessionTimerInterval) {
      clearInterval(sessionTimerInterval);
      setSessionTimerInterval(null);
      setIsTimerRunning(false);
    }
  };
  
  const resetTimer = () => {
    pauseTimer();
    setDuration(0);
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
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="container max-w-3xl mx-auto p-4 pt-20 md:pt-24 pb-20">
      <PageHeader
        title={currentDay === "today" ? "Today's Practice" : currentDay === "yesterday" ? "Yesterday's Practice" : "Tomorrow's Practice"}
        description="Track your training sessions and progress"
        className="text-center"
      />
      
      <div className="mt-6 relative">
        {/* Day navigation */}
        <div className="flex items-center justify-between mb-6 max-w-xs mx-auto">
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
            <CardHeader className="pb-3 border-b">
              <div className="text-center">
                <Badge className="mb-2 bg-primary/20 text-primary hover:bg-primary/30">Track Session</Badge>
                <CardTitle className="text-2xl font-semibold">Speed Workout</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Workout details as bullet points */}
              <div className="p-6 border-b">
                <h3 className="text-lg font-medium mb-3 text-center">Workout Plan</h3>
                <ul className="space-y-3 list-disc pl-8 pr-4">
                  <li>Warm-up: 10 min dynamic stretching</li>
                  <li>Main set: 5 x 100m sprints at 95% intensity</li>
                  <li>Recovery: 3 min between sets</li>
                  <li>Cool down: 5 min easy jog + stretching</li>
                  <li>Total distance: ~1.5km</li>
                </ul>
              </div>
              
              {/* Percentage and distance sliders */}
              <div className="p-6 border-b">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <label className="text-base font-medium flex items-center">
                      <Percent className="h-5 w-5 mr-2" />
                      Intensity
                    </label>
                    <div className="flex items-center">
                      <span className="text-3xl font-bold text-primary">{percentage}%</span>
                    </div>
                  </div>
                  <div className="mx-auto" style={{ maxWidth: "275px" }}>
                    <Slider
                      value={percentage}
                      min={70}
                      max={100}
                      step={5}
                      onValueChange={setPercentage}
                      className="py-4"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground" style={{ maxWidth: "275px", margin: "0 auto" }}>
                    <span>Recovery (70%)</span>
                    <span>Maximum (100%)</span>
                  </div>
                </div>
                
                <div className="mt-8 space-y-4">
                  <div className="flex justify-between">
                    <label className="text-base font-medium flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Distance
                    </label>
                    <div className="flex items-center">
                      <span className="text-3xl font-bold text-primary">{distance[0]}m</span>
                    </div>
                  </div>
                  <div className="mx-auto" style={{ maxWidth: "275px" }}>
                    <Slider
                      value={distance}
                      min={50}
                      max={600}
                      step={10}
                      onValueChange={setDistance}
                      className="py-4"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground" style={{ maxWidth: "275px", margin: "0 auto" }}>
                    <span>50m</span>
                    <span>600m</span>
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
            </CardContent>
          </Card>
          
          {/* Feedback section */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-xl text-center">Session Feedback</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <label className="text-base font-medium">Intensity</label>
                  <span className="text-3xl font-bold text-primary">{intensity}%</span>
                </div>
                <div className="mx-auto" style={{ maxWidth: "200px" }}>
                  <Slider
                    value={intensity}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={setIntensity}
                    className="py-4"
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground" style={{ maxWidth: "200px", margin: "0 auto" }}>
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
              
              <div className="pt-4 border-t space-y-4">
                <div className="flex justify-between">
                  <label className="text-base font-medium">Effort Level</label>
                  <span className="text-3xl font-bold text-primary">{effort}%</span>
                </div>
                <div className="mx-auto" style={{ maxWidth: "200px" }}>
                  <Slider
                    value={effort}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={setEffort}
                    className="py-4"
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground" style={{ maxWidth: "200px", margin: "0 auto" }}>
                  <span>Easy</span>
                  <span>Maximum</span>
                </div>
              </div>
              
              <div className="pt-4 border-t space-y-4">
                <div className="flex justify-between">
                  <label className="text-base font-medium">Enjoyment</label>
                  <span className="text-3xl font-bold text-primary">{enjoyment}%</span>
                </div>
                <div className="mx-auto" style={{ maxWidth: "200px" }}>
                  <Slider
                    value={enjoyment}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={setEnjoyment}
                    className="py-4"
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground" style={{ maxWidth: "200px", margin: "0 auto" }}>
                  <span>Bad</span>
                  <span>Great</span>
                </div>
              </div>
              
              <div className="pt-6 border-t flex flex-col gap-3">
                <Button className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  <span>Save Feedback</span>
                </Button>
                
                <Button variant="outline" className="w-full">
                  <Camera className="h-4 w-4 mr-2" />
                  <span>Add Media</span>
                </Button>
              </div>
            </CardContent>
          </Card>
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