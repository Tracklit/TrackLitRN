import { ProtectedRoute } from "@/lib/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, Calendar, Clock, List, Play, PenLine, Upload, Camera, Check, PauseCircle, BarChart } from "lucide-react";
import { useState } from "react";

export default function PracticePage() {
  const { user } = useAuth();
  const [intensity, setIntensity] = useState<number[]>([60]);
  const [effort, setEffort] = useState<number[]>([70]);
  const [enjoyment, setEnjoyment] = useState<number[]>([80]);
  const [duration, setDuration] = useState<number>(0);
  const [sessionStarted, setSessionStarted] = useState<boolean>(false);
  const [sessionTimerInterval, setSessionTimerInterval] = useState<number | null>(null);
  
  const startSession = () => {
    setSessionStarted(true);
    // Start the timer
    const interval = window.setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    setSessionTimerInterval(interval);
  };
  
  const pauseSession = () => {
    if (sessionTimerInterval) {
      clearInterval(sessionTimerInterval);
      setSessionTimerInterval(null);
    }
  };
  
  const resumeSession = () => {
    const interval = window.setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    setSessionTimerInterval(interval);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
      <PageHeader
        title="Practice"
        description="Track your training sessions and progress"
      />

      <Tabs defaultValue="upcoming" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="session" id="session-tab">Active Session</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="diary">Training Diary</TabsTrigger>
          <TabsTrigger value="tools">Training Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Placeholder for upcoming practice sessions */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-semibold">Speed Workout</CardTitle>
                  <div className="flex items-center space-x-1 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>Tomorrow</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-2 text-sm">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>45 minutes</span>
                  <span className="mx-2">•</span>
                  <Dumbbell className="h-4 w-4 mr-1" />
                  <span>High intensity</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Focus on acceleration and top-end speed with 60m sprints and block starts.</p>
                <div className="flex justify-between">
                  <Button size="sm" variant="outline" className="flex items-center">
                    <List className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  <Button size="sm" className="flex items-center" onClick={() => document.getElementById('session-tab')?.click()}>
                    <Play className="h-4 w-4 mr-1" />
                    Start Session
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-semibold">Endurance Training</CardTitle>
                  <div className="flex items-center space-x-1 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>Thursday</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-2 text-sm">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>60 minutes</span>
                  <span className="mx-2">•</span>
                  <Dumbbell className="h-4 w-4 mr-1" />
                  <span>Medium intensity</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Build stamina with tempo runs and 400m repeats. Focus on form throughout.</p>
                <div className="flex justify-between">
                  <Button size="sm" variant="outline" className="flex items-center">
                    <List className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  <Button size="sm" className="flex items-center">
                    <Play className="h-4 w-4 mr-1" />
                    Start Session
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-semibold">Recovery Session</CardTitle>
                  <div className="flex items-center space-x-1 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>Saturday</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-2 text-sm">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>30 minutes</span>
                  <span className="mx-2">•</span>
                  <Dumbbell className="h-4 w-4 mr-1" />
                  <span>Low intensity</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Light recovery workout with stretching and mobility exercises to promote recovery.</p>
                <div className="flex justify-between">
                  <Button size="sm" variant="outline" className="flex items-center">
                    <List className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  <Button size="sm" className="flex items-center">
                    <Play className="h-4 w-4 mr-1" />
                    Start Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8">
            <Button className="w-full" size="lg">View Training Program</Button>
          </div>
        </TabsContent>

        <TabsContent value="session" id="active-session">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                      <h3 className="text-lg font-medium mb-2">Current Exercise: 60m Sprints</h3>
                      <Progress value={40} className="h-2 mb-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>3/8 completed</span>
                        <span>5 remaining</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {!sessionStarted ? (
                        <Button onClick={startSession} className="col-span-full flex items-center justify-center gap-2 py-6">
                          <Play className="h-5 w-5" />
                          <span>Start Session</span>
                        </Button>
                      ) : sessionTimerInterval ? (
                        <Button onClick={pauseSession} variant="outline" className="flex items-center justify-center gap-2 py-4">
                          <PauseCircle className="h-5 w-5" />
                          <span>Pause</span>
                        </Button>
                      ) : (
                        <Button onClick={resumeSession} className="flex items-center justify-center gap-2 py-4">
                          <Play className="h-5 w-5" />
                          <span>Resume</span>
                        </Button>
                      )}
                      
                      <Button variant="outline" className="flex items-center justify-center gap-2 py-4">
                        <Check className="h-5 w-5" />
                        <span>Complete Exercise</span>
                      </Button>
                      
                      <Button variant="outline" className="flex items-center justify-center gap-2 py-4">
                        <Camera className="h-5 w-5" />
                        <span>Add Media</span>
                      </Button>
                      
                      <Button variant="outline" className="flex items-center justify-center gap-2 py-4">
                        <BarChart className="h-5 w-5" />
                        <span>Track Metrics</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
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
                  
                  <Button className="w-full mt-4">
                    <Upload className="h-4 w-4 mr-2" />
                    <span>Save Feedback</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Your completed practice sessions will appear here</p>
            <Button className="mt-4">Record a Practice Session</Button>
          </div>
        </TabsContent>

        <TabsContent value="diary">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PenLine className="h-5 w-5 mr-2" />
                  Training Diary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Keep track of your thoughts, feelings, and progress during training</p>
                <Button>Create New Entry</Button>
              </CardContent>
            </Card>

            {/* Previous diary entries placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No diary entries yet</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tools">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:bg-accent/10 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-center">Stopwatch</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Clock className="h-16 w-16 text-primary" />
              </CardContent>
            </Card>

            <Card className="hover:bg-accent/10 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-center">Start Gun</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Play className="h-16 w-16 text-primary" />
              </CardContent>
            </Card>

            <Card className="hover:bg-accent/10 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-center">Interval Timer</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Clock className="h-16 w-16 text-primary" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Protected route wrapper
export function Component() {
  return (
    <ProtectedRoute path="/practice" component={PracticePage} />
  );
}