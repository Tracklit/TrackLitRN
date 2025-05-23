import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HamburgerMenu } from '@/components/layout/hamburger-menu';
import { Meet, Result, WorkoutSessionPreview } from '@shared/schema';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { 
  Dumbbell, 
  Trophy, 
  Users, 
  Clock, 
  Clipboard, 
  ArrowRight,
  Calendar,
  Coins,
  ChevronRight,
  Timer,
  LineChart,
  ArrowUpRight,
  Eye,
  BookmarkPlus,
  MoreHorizontal,
  UserCircle,
  X,
  BookOpen
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { CreateMeetModal } from '@/components/create-meet-modal';
import { cn } from '@/lib/utils';
import { useAssignedPrograms } from '@/hooks/use-assigned-programs';
import { useProgramSessions } from '@/hooks/use-program-sessions';

export default function HomePage() {
  const { user } = useAuth();
  const [isCreateMeetOpen, setIsCreateMeetOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [isTickerVisible, setIsTickerVisible] = useState(true);
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);
  
  // Fetch data for stats
  const { data: meets } = useQuery<Meet[]>({
    queryKey: ['/api/meets'],
  });
  
  const { data: results } = useQuery<Result[]>({
    queryKey: ['/api/results'],
  });
  
  // Fetch assigned programs
  const { assignedPrograms, isLoading: isLoadingPrograms } = useAssignedPrograms();
  
  // Get the first assigned program's ID (Beast Mode program)
  const primaryProgramId = assignedPrograms?.[0]?.programId || null;
  
  // Fetch program sessions for the primary program
  const { programSessions, isLoading: isLoadingSessions } = useProgramSessions(primaryProgramId);
  
  // Find today's workout session (for May 23, 2025 as specified)
  const todayDate = "May-23";
  const todaySession = programSessions?.find(session => session.date === todayDate) || null;
  
  // Temporary type for session previews with user data
  type SessionPreviewWithUser = {
    id: number;
    workoutId: number;
    userId: number;
    title: string;
    previewText: string;
    createdAt: string;
    user?: {
      username: string;
      name: string;
    };
  };
  
  // Fetch workout session previews
  const { data: sessionPreviews, isLoading: isLoadingPreviews } = useQuery<SessionPreviewWithUser[]>({
    queryKey: ['/api/workout-previews']
  });
  
  // Interval for rotating through sessions
  useEffect(() => {
    if (!sessionPreviews?.length) return;
    
    const interval = setInterval(() => {
      setActiveSessionIndex(prev => 
        prev >= (sessionPreviews.length - 1) ? 0 : prev + 1
      );
    }, 5000); // 5 second interval
    
    return () => clearInterval(interval);
  }, [sessionPreviews]);
  
  // Function to open session details modal
  const openSessionDetails = (session: SessionPreviewWithUser) => {
    setCurrentSession(session);
    setIsSessionModalOpen(true);
  };
  
  // Function to save session to user's workout library
  const saveSessionToLibrary = async () => {
    if (!currentSession || !user) return;
    
    setIsSavingSession(true);
    
    try {
      // This would be the actual API call when implemented
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      console.log("Session saved to library:", currentSession.title);
      setIsSavingSession(false);
      setIsSessionModalOpen(false);
      
      // Show success message or toast here
    } catch (error) {
      console.error("Error saving session:", error);
      setIsSavingSession(false);
    }
  };
  
  // Interval for rotating through sessions
  useEffect(() => {
    if (!sessionPreviews?.length) return;
    
    const interval = setInterval(() => {
      setActiveSessionIndex(prev => 
        prev >= (sessionPreviews.length - 1) ? 0 : prev + 1
      );
    }, 5000); // 5 second interval
    
    return () => clearInterval(interval);
  }, [sessionPreviews]);

  // Category cards for main navigation
  const categoryCards = [
    {
      title: "Practice",
      description: "Training sessions and programs",
      icon: <Dumbbell className="h-6 w-6 text-primary" />,
      href: "/practice",
    },
    {
      title: "Programs",
      description: "Training plans and schedules",
      icon: <BookOpen className="h-6 w-6 text-primary" />,
      href: "/programs",
    },
    {
      title: "Competitions",
      description: "Meets, results and analytics",
      icon: <Trophy className="h-6 w-6 text-primary" />,
      href: "/meets",
    },
    {
      title: "Clubs & Groups",
      description: "Find a new home",
      icon: <Users className="h-6 w-6 text-primary" />,
      href: "/clubs",
    }
  ];

  // Quote removed as requested

  return (
    <div className="min-h-screen text-foreground pb-16">
      {/* Session Preview Ticker */}
      {isTickerVisible && (
        <div className="relative left-0 right-0 z-10 pt-4 px-4">
          <div className="w-full flex items-center mb-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 -ml-3 absolute left-0"
              onClick={() => setIsTickerVisible(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="w-full"></div>
          </div>
          
          <div>
            {sessionPreviews && (
              <div 
                className="cursor-pointer animate-fadeIn"
                onClick={() => openSessionDetails(sessionPreviews[activeSessionIndex])}
                key={activeSessionIndex} // Key helps with animation
              >
                <div 
                  className="flex items-center gap-2 px-3 py-2 hover:bg-primary/10 transition-all duration-300"
                >
                  <div className="rounded-full bg-primary/15 h-8 w-8 flex items-center justify-center flex-shrink-0">
                    <UserCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="text-xs font-medium">{sessionPreviews[activeSessionIndex].title}</span>
                      <span className="text-xs text-muted-foreground">· {sessionPreviews[activeSessionIndex].user?.username}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{sessionPreviews[activeSessionIndex].previewText}</p>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Show ticker button */}
      {!isTickerVisible && (
        <div className="relative z-10 py-4 px-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setIsTickerVisible(true)}
          >
            <Clock className="h-3.5 w-3.5 mr-1" />
            Show Recent Workouts
          </Button>
        </div>
      )}
      
      <main className="pt-4 px-4 container mx-auto max-w-7xl">
        {/* Logo will be placed here in the future */}
        <div className="h-3 mb-4 mx-auto" style={{ maxWidth: "540px" }}>
          {/* Reserved space for logo */}
        </div>

        {/* Quote removed as requested */}
        
        {/* Main Category Cards - 2 column layout with smaller sizes for mobile */}
        <section className="mb-4">
          <div className="grid grid-cols-2 gap-2 mx-auto" style={{ maxWidth: "540px", margin: "0 auto 8px" }}>
            {categoryCards.map((card, index) => (
              <Link href={card.href} key={index}>
                <Card className="cursor-pointer hover:shadow-md transition-all duration-300 border border-muted hover:border-primary h-[140px] mx-auto mb-2 overflow-hidden group relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  <CardContent className="p-2.5 relative h-full flex flex-col justify-center">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="p-1.5 rounded-full bg-primary/15 border border-primary/20 group-hover:bg-primary/25 transition-colors duration-300">
                        <div className="h-4 w-4 flex items-center justify-center text-primary">
                          {card.icon}
                        </div>
                      </div>
                      <div>
                        <h2 className="text-base font-bold mb-0.5">{card.title}</h2>
                        <p className="text-muted-foreground text-xs px-1 line-clamp-2 overflow-hidden">{card.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
        
        {/* Today's Session Preview */}
        <section className="mb-4 mx-auto" style={{ maxWidth: "540px" }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Today's Session</h2>
            <Link href="/practice">
              <Button variant="link" className="text-primary p-0 h-auto text-sm">
                <span>View All</span>
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          
          {isLoadingSessions ? (
            <Card className="border-primary/20 w-full p-8 flex justify-center items-center">
              <div className="text-center text-muted-foreground">
                <div className="animate-pulse h-5 w-24 bg-muted rounded-md mx-auto mb-4"></div>
                <p className="text-sm">Loading today's workout...</p>
              </div>
            </Card>
          ) : !todaySession ? (
            <Card className="border-primary/20 w-full p-8">
              <div className="text-center text-muted-foreground">
                <p className="mb-2">No session scheduled for today</p>
                <Link href="/practice">
                  <Button variant="outline" size="sm">
                    View All Workouts
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <Card className="border-primary/20 w-full">
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{`${todayDate} Training Session`}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-0.5 text-xs">
                      {todaySession.isRestDay && (
                        <span className="text-amber-600 font-medium">Rest Day</span>
                      )}
                    </CardDescription>
                  </div>
                  <Link href="/practice">
                    <Button variant="outline" size="sm" className="border-primary/20 text-primary hover:bg-primary/10 text-xs h-7 px-2">
                      Start Session
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              
              <CardContent className="px-3 py-2">
                <div className="space-y-1">
                  {todaySession.preActivation1 && (
                    <div className="flex items-center gap-2 p-1 rounded-md hover:bg-muted/30">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <LineChart className="h-2.5 w-2.5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-xs">Pre-Activation</p>
                        <p className="text-xs text-muted-foreground">{todaySession.preActivation1}</p>
                      </div>
                    </div>
                  )}
                  
                  {todaySession.shortDistanceWorkout && (
                    <div className="flex items-center gap-2 p-1 rounded-md hover:bg-muted/30">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <Timer className="h-2.5 w-2.5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-xs">Sprint Workout</p>
                        <p className="text-xs text-muted-foreground">{todaySession.shortDistanceWorkout}</p>
                      </div>
                    </div>
                  )}
                  
                  {todaySession.mediumDistanceWorkout && (
                    <div className="flex items-center gap-2 p-1 rounded-md hover:bg-muted/30">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <Timer className="h-2.5 w-2.5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-xs">Medium Distance</p>
                        <p className="text-xs text-muted-foreground">{todaySession.mediumDistanceWorkout}</p>
                      </div>
                    </div>
                  )}
                  
                  {todaySession.longDistanceWorkout && (
                    <div className="flex items-center gap-2 p-1 rounded-md hover:bg-muted/30">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <Timer className="h-2.5 w-2.5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-xs">Long Distance</p>
                        <p className="text-xs text-muted-foreground">{todaySession.longDistanceWorkout}</p>
                      </div>
                    </div>
                  )}
                  
                  {todaySession.extraSession && (
                    <div className="flex items-center gap-2 p-1 rounded-md hover:bg-muted/30">
                      <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <Dumbbell className="h-2.5 w-2.5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-xs">Extra Training</p>
                        <p className="text-xs text-muted-foreground">{todaySession.extraSession}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* If no workout data is available, show a message */}
                  {!todaySession.preActivation1 && 
                   !todaySession.shortDistanceWorkout && 
                   !todaySession.mediumDistanceWorkout && 
                   !todaySession.longDistanceWorkout && 
                   !todaySession.extraSession && (
                    <div className="py-4 text-center text-muted-foreground text-sm">
                      <p>Rest day or no specific workout details available.</p>
                      <p className="text-xs mt-1">Check the full program for more information.</p>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="border-t py-2 px-3 flex justify-between text-xs text-muted-foreground">
                <div>Program: {assignedPrograms?.[0]?.title || 'Beast Mode'}</div>
                <Link href="/practice">
                  <div className="flex items-center cursor-pointer">
                    <span className="text-primary font-medium">View Details</span>
                    <ArrowUpRight className="ml-1 h-2.5 w-2.5 text-primary" />
                  </div>
                </Link>
              </CardFooter>
            </Card>
          )}
        </section>
      </main>
      
      {/* Session Detail Modal */}
      <Dialog open={isSessionModalOpen} onOpenChange={setIsSessionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{currentSession?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 h-8 w-8 flex items-center justify-center flex-shrink-0">
                <UserCircle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{currentSession?.user?.name}</p>
                <p className="text-xs text-muted-foreground">@{currentSession?.user?.username}</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-sm font-medium mb-2">Workout Details</h3>
              <p className="text-sm">{currentSession?.previewText}</p>
            </div>
            
            <div className="bg-muted p-3 rounded-md">
              <h4 className="text-xs font-medium mb-2">Exercise Breakdown</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Dumbbell className="h-3 w-3 text-primary" />
                  <span>6 x 200m at 30s each</span>
                </li>
                <li className="flex items-center gap-2">
                  <Dumbbell className="h-3 w-3 text-primary" />
                  <span>90 second recovery between sets</span>
                </li>
                <li className="flex items-center gap-2">
                  <Dumbbell className="h-3 w-3 text-primary" />
                  <span>10 minute cool down</span>
                </li>
              </ul>
            </div>
          </div>
          
          <DialogFooter className="flex sm:justify-between">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
              >
                Close
              </Button>
            </DialogClose>
            <Button 
              type="button"
              onClick={saveSessionToLibrary}
              disabled={isSavingSession}
              className="bg-primary text-white"
            >
              {isSavingSession ? (
                <>
                  <BookmarkPlus className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <BookmarkPlus className="mr-2 h-4 w-4" />
                  Save to Library
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <CreateMeetModal
        isOpen={isCreateMeetOpen}
        onClose={() => setIsCreateMeetOpen(false)}
      />
    </div>
  );
}
