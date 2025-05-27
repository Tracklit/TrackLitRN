import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HamburgerMenu } from '@/components/ui/hamburger-menu';
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
import { SimpleWorkoutLike } from '@/components/workout-reactions';
import trackImage1 from "@assets/IMG_4075.JPG?url";
import trackImage2 from "@assets/IMG_4076.JPG?url";
import trackImage3 from "@assets/IMG_4077.JPG?url";
import trackImage4 from "@assets/IMG_4078.JPG?url";

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
      disabled: false,
    },
    {
      title: "Programs",
      description: "Training plans and schedules",
      icon: <BookOpen className="h-6 w-6 text-primary" />,
      href: "/programs",
      disabled: false,
    },
    {
      title: "Competitions",
      description: "Meets, results and analytics",
      icon: <Trophy className="h-6 w-6 text-primary" />,
      href: "/meets",
      disabled: false,
    },
    {
      title: "Clubs & Groups",
      description: "Coming soon",
      icon: <Users className="h-6 w-6 text-muted-foreground" />,
      href: user?.role === 'admin' ? "/clubs" : "#",
      disabled: user?.role !== 'admin',
    }
  ];

  // Quote removed as requested

  return (
    <div className="min-h-screen text-foreground pb-16">
      <main className="pt-2 px-4 container mx-auto max-w-7xl">
        {/* Logo will be placed here in the future */}
        <div className="h-1 mb-2 mx-auto" style={{ maxWidth: "540px" }}>
          {/* Reserved space for logo */}
        </div>

        {/* Quote removed as requested */}
        
        {/* Main Category Cards - 2 column layout with smaller sizes for mobile */}
        <section className="mb-4">
          <div className="grid grid-cols-2 gap-2 mx-auto" style={{ maxWidth: "540px", margin: "0 auto 8px" }}>
            {categoryCards.map((card, index) => (
              card.disabled ? (
                <Card key={index} className="h-[140px] mx-auto mb-2 overflow-hidden opacity-30 cursor-not-allowed bg-muted/30 border-muted/50">
                  <CardContent className="p-2.5 relative h-full flex flex-col justify-center opacity-50">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="p-1.5 rounded-full bg-muted/50 border border-muted/50">
                        <div className="h-4 w-4 flex items-center justify-center text-muted-foreground/70">
                          {card.icon}
                        </div>
                      </div>
                      <div>
                        <h2 className="text-base font-bold mb-0.5 text-muted-foreground/70">{card.title}</h2>
                        <p className="text-muted-foreground/70 text-xs px-1 line-clamp-2 overflow-hidden">{card.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Link href={card.href} key={index}>
                  <Card className="cursor-pointer hover:shadow-md transition-all duration-300 border border-muted hover:border-primary h-[140px] mx-auto mb-2 overflow-hidden group relative">
                    {/* Header Image - Top Half */}
                    <div 
                      className="h-1/2 bg-cover bg-center bg-no-repeat relative"
                      style={{ backgroundImage: `url(${[trackImage1, trackImage2, trackImage3, trackImage4][index % 4]})` }}
                    >
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    
                    {/* Content - Bottom Half */}
                    <CardContent className="h-1/2 p-2.5 relative flex flex-col justify-center bg-background">
                      <div className="flex flex-col items-center text-center">
                        <h2 className="text-sm font-bold mb-1">{card.title}</h2>
                        <p className="text-muted-foreground text-xs px-1 line-clamp-2 overflow-hidden">{card.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            ))}
          </div>
        </section>
        
        {/* Today's Session Preview */}
        {/* Today's Session Link */}
        <section className="mb-4 mx-auto" style={{ maxWidth: "540px" }}>
          <Link href="/practice">
            <Card className="border-primary/20 w-full hover:bg-primary/5 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Today's Session</h3>
                    <p className="text-sm text-muted-foreground">View your workout</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-primary" />
              </CardContent>
            </Card>
          </Link>
        </section>

        {/* Session Preview Ticker - Moved below Today's Session */}
        {isTickerVisible && (
          <section className="mb-4 mx-auto" style={{ maxWidth: "540px" }}>
            <div className="px-4">
              {sessionPreviews && (
                <div 
                  className="cursor-pointer animate-fadeIn"
                  onClick={() => openSessionDetails(sessionPreviews[activeSessionIndex])}
                  key={activeSessionIndex} // Key helps with animation
                >
                  <div 
                    className="flex items-center gap-2 px-3 py-1 hover:bg-primary/10 transition-all duration-300 relative"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 -ml-3 absolute left-0 top-1/2 -translate-y-1/2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsTickerVisible(false);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="w-6"></div> {/* Spacer to offset the X button */}
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
          </section>
        )}
        
        {/* Show ticker button */}
        {!isTickerVisible && (
          <section className="mb-4 mx-auto" style={{ maxWidth: "540px" }}>
            <div className="px-4 flex justify-end">
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
          </section>
        )}
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
            <div className="flex items-center gap-2">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                >
                  Close
                </Button>
              </DialogClose>
              
              {/* Like functionality for other users' workouts */}
              {currentSession?.workoutId && (
                <SimpleWorkoutLike 
                  sessionId={currentSession.workoutId} 
                  className="ml-2"
                />
              )}
            </div>
            
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
