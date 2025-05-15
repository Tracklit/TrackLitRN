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
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { CreateMeetModal } from '@/components/create-meet-modal';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const { user } = useAuth();
  const [isCreateMeetOpen, setIsCreateMeetOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [isTickerVisible, setIsTickerVisible] = useState(true);
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);
  
  // Fetch data for stats (simplified for now)
  const { data: meets } = useQuery<Meet[]>({
    queryKey: ['/api/meets'],
  });
  
  const { data: results } = useQuery<Result[]>({
    queryKey: ['/api/results'],
  });
  
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
    queryKey: ['/api/workout-previews'],
    // Use fallback data for demo until API is implemented
    placeholderData: [
      {
        id: 1,
        workoutId: 1,
        userId: 2,
        title: "Speed Intervals",
        previewText: "Completed a great sprint session with 6x200m at 30s each!",
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        user: { username: "sarah_runner", name: "Sarah T." }
      },
      {
        id: 2,
        workoutId: 2,
        userId: 3,
        title: "Long Run Day",
        previewText: "10km easy run completed in 45mins. Feeling great!",
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        user: { username: "track_star", name: "Michael J." }
      },
      {
        id: 3,
        workoutId: 3,
        userId: 4,
        title: "Tempo Run",
        previewText: "5x400m ladder workout complete. New personal best!",
        createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        user: { username: "coach_k", name: "Coach Kevin" }
      },
      {
        id: 4,
        workoutId: 4,
        userId: 5,
        title: "Hill Sprints",
        previewText: "Just finished 10x hill sprints. My legs are on fire but worth it!",
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        user: { username: "sprint_queen", name: "Lisa M." }
      },
      {
        id: 5,
        workoutId: 5,
        userId: 6,
        title: "Morning Endurance",
        previewText: "Early morning 800m repeats - 6 sets at 2:15 pace. New week, new goals!",
        createdAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
        user: { username: "distance_king", name: "Alex P." }
      },
      {
        id: 6,
        workoutId: 6,
        userId: 7,
        title: "Track Workout",
        previewText: "400m, 300m, 200m, 100m ladder with full recovery. Felt strong today!",
        createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        user: { username: "track_coach", name: "Coach Smith" }
      },
      {
        id: 7,
        workoutId: 7,
        userId: 8,
        title: "Race Prep",
        previewText: "Final tuneup before Saturday's meet - 4x150m at race pace with 3min rest",
        createdAt: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
        user: { username: "medal_hunter", name: "James W." }
      }
    ]
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
      icon: <Clipboard className="h-6 w-6 text-primary" />,
      href: "/practice",
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
    <div className="min-h-screen bg-background text-foreground pb-16">
      <HamburgerMenu />
      
      {/* Session Preview Ticker */}
      {isTickerVisible && (
        <div className="relative left-0 right-0 z-10 bg-background/80 backdrop-blur-sm pt-8 pb-3 border-b border-border/20 px-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 mb-2"
            onClick={() => setIsTickerVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div>
            {sessionPreviews && (
              <div 
                className="cursor-pointer animate-fadeIn"
                onClick={() => openSessionDetails(sessionPreviews[activeSessionIndex])}
                key={activeSessionIndex} // Key helps with animation
              >
                <div 
                  className="flex items-center gap-2 bg-primary/5 border border-primary/10 px-3 py-2 rounded-md hover:bg-primary/10 transition-all duration-300"
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
                  <div className="flex-shrink-0">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        openSessionDetails(sessionPreviews[activeSessionIndex]);
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
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
          
          <Card className="border-primary/20 w-full">
            <CardHeader className="pb-2 pt-3 px-3">
              <div className="flex justify-between items-start">
                <div>
                  <Badge className="mb-1 bg-primary/20 text-primary hover:bg-primary/30 text-xs px-2 py-0.5">Track Session</Badge>
                  <CardTitle className="text-lg">Speed Endurance</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-0.5 text-xs">
                    <span>4:00 PM</span>
                    <span>•</span>
                    <span>Main Track</span>
                    <span>•</span>
                    <span>Intensity: High</span>
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="border-primary/20 text-primary hover:bg-primary/10 text-xs h-7 px-2">
                  Start Session
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="px-3 py-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 p-1 rounded-md hover:bg-muted/30">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <LineChart className="h-2.5 w-2.5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-xs">Dynamic Warmup</p>
                    <p className="text-xs text-muted-foreground">Duration: 15 min</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-1 rounded-md hover:bg-muted/30">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <Timer className="h-2.5 w-2.5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-xs">6 × 200m</p>
                    <p className="text-xs text-muted-foreground">Pace: 32s • Rest: 2 min</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-1 rounded-md hover:bg-muted/30">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <Timer className="h-2.5 w-2.5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-xs">4 × 300m</p>
                    <p className="text-xs text-muted-foreground">Pace: 48s • Rest: 3 min</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-1 rounded-md hover:bg-muted/30">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <LineChart className="h-2.5 w-2.5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-xs">Cool Down</p>
                    <p className="text-xs text-muted-foreground">Duration: 10 min</p>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="border-t py-2 px-3 flex justify-between text-xs text-muted-foreground">
              <div>Coach: Coach Williams</div>
              <div className="flex items-center">
                <span className="text-primary font-medium">Details</span>
                <ArrowUpRight className="ml-1 h-2.5 w-2.5 text-primary" />
              </div>
            </CardFooter>
          </Card>
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
