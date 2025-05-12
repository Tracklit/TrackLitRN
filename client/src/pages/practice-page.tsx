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
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
      <PageHeader
        title={currentDay === "today" ? "Today's Practice" : currentDay === "yesterday" ? "Yesterday's Practice" : "Tomorrow's Practice"}
        description="Track your training sessions and progress"
      />
      
      <div className="mt-6 relative">
        {/* Day navigation */}
        <div className="flex items-center justify-between mb-4">
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
        
        {/* Main session content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Session details - takes up 2/3 of the space */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge className="mb-2 bg-primary/20 text-primary hover:bg-primary/30">Track Session</Badge>
                    <CardTitle className="text-xl font-semibold">Speed Workout</CardTitle>
                  </div>
                  <div className="text-4xl font-bold font-mono">{formatTime(duration)}</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Current Exercise: 5 x 100m Sprints</h3>
                    <Progress value={60} className="h-2 mb-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>3/5 completed</span>
                      <span>2 remaining</span>
                    </div>
                  </div>
                  
                  {/* Timer controls */}
                  <div className="flex justify-center gap-4">
                    <Button 
                      onClick={toggleTimer}
                      variant={isTimerRunning ? "outline" : "default"}
                      size="lg"
                      className="h-14 w-14 rounded-full p-0 flex items-center justify-center"
                    >
                      {isTimerRunning ? <PauseCircle className="h-6 w-6" /> : <Timer className="h-6 w-6" />}
                    </Button>
                    
                    <Button 
                      onClick={resetTimer}
                      variant="outline"
                      size="lg"
                      className="h-14 w-14 rounded-full p-0 flex items-center justify-center"
                    >
                      <Activity className="h-6 w-6" />
                    </Button>
                  </div>
                  
                  {/* Percentage and distance sliders */}
                  <div className="space-y-6 mt-6 border-t pt-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <label className="text-sm font-medium flex items-center">
                          <Percent className="h-4 w-4 mr-1" />
                          Intensity
                        </label>
                        <div className="flex items-center">
                          <span className="text-sm font-medium">{percentage}%</span>
                        </div>
                      </div>
                      <Slider
                        value={percentage}
                        min={70}
                        max={100}
                        step={5}
                        onValueChange={setPercentage}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Recovery (70%)</span>
                        <span>Maximum (100%)</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <label className="text-sm font-medium flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Distance
                        </label>
                        <div className="flex items-center">
                          <span className="text-sm font-medium">{distance[0]}m</span>
                        </div>
                      </div>
                      <Slider
                        value={distance}
                        min={50}
                        max={600}
                        step={10}
                        onValueChange={setDistance}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>50m</span>
                        <span>600m</span>
                      </div>
                    </div>
                    
                    <div className="bg-primary/10 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Goal Time ({percentage}% of Best)</span>
                        <span className="text-xl font-bold">{calculatedTime.toFixed(2)}s</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Based on your best time of {bestTimes["100"]}s for 100m
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Feedback section - takes up 1/3 of the space */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Intensity</label>
                    <span className="text-sm text-muted-foreground">{intensity}%</span>
                  </div>
                  <Slider
                    value={intensity}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={setIntensity}
                    className="pt-1"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Effort Level</label>
                    <span className="text-sm text-muted-foreground">{effort}%</span>
                  </div>
                  <Slider
                    value={effort}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={setEffort}
                    className="pt-1"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Easy</span>
                    <span>Maximum</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Enjoyment</label>
                    <span className="text-sm text-muted-foreground">{enjoyment}%</span>
                  </div>
                  <Slider
                    value={enjoyment}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={setEnjoyment}
                    className="pt-1"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Bad</span>
                    <span>Great</span>
                  </div>
                </div>
                
                <Button className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  <span>Save Feedback</span>
                </Button>
                
                <Button variant="outline" className="w-full">
                  <Camera className="h-4 w-4 mr-2" />
                  <span>Add Media</span>
                </Button>
              </CardContent>
            </Card>
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