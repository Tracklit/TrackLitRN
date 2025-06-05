import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HamburgerMenu } from '@/components/ui/hamburger-menu';
import { Meet, Result, WorkoutSessionPreview } from '@shared/schema';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton } from "@/components/card-skeleton";
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
  BookOpen,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { CreateMeetModal } from '@/components/create-meet-modal';
import { cn } from '@/lib/utils';
import { useAssignedPrograms } from '@/hooks/use-assigned-programs';
import { useProgramSessions } from '@/hooks/use-program-sessions';
import { SimpleWorkoutLike } from '@/components/workout-reactions';
import { trackImages } from '@/lib/image-preloader';

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
  
  // Find today's workout session (Jun-5, 2025)
  const todayDate = "Jun-5";
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
      headerImage: "/programs-card-compressed.jpeg"
    },
    {
      title: "Race",
      description: "Meets, results and analytics",
      icon: <Trophy className="h-6 w-6 text-primary" />,
      href: "/meets",
      disabled: false,
    },
    {
      title: "Tools",
      description: "Training and performance tools",
      icon: <Clock className="h-6 w-6 text-primary" />,
      href: "/training-tools",
      disabled: false,
      headerImage: "/tools-card-compressed.jpeg"
    },
    {
      title: "Sprinthia",
      description: "AI training companion",
      icon: <MessageCircle className="h-6 w-6 text-primary" />,
      href: "/sprinthia",
      disabled: false,
      headerImage: "/sprinthia-avatar-compressed.jpeg"
    },
    {
      title: "Today's Session",
      description: todaySession ? 
        `${todaySession.shortDistanceWorkout?.slice(0, 50)}...` || 
        `${todaySession.mediumDistanceWorkout?.slice(0, 50)}...` || 
        `${todaySession.longDistanceWorkout?.slice(0, 50)}...` || 
        "View your workout" 
        : "View your workout",
      icon: <Calendar className="h-6 w-6 text-primary" />,
      href: "/practice",
      disabled: false,
      isSpecial: true
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
        
        {/* Session Preview Ticker */}
        {isTickerVisible && (
          <section className="mb-4 mx-auto" style={{ maxWidth: "540px" }}>
            <div className="px-4 relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 absolute right-4 top-1/2 -translate-y-1/2 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTickerVisible(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
              {isLoadingPreviews ? (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : sessionPreviews && sessionPreviews.length > 0 && (
                <div 
                  className="cursor-pointer animate-fadeIn pr-8"
                  onClick={() => window.open('https://www.instagram.com/joacim.lauri/', '_blank')}
                >
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                        <UserCircle className="h-5 w-5 text-gray-300" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-sm">
                          {sessionPreviews[activeSessionIndex]?.user?.name || sessionPreviews[activeSessionIndex]?.user?.username || 'Anonymous'}
                        </h3>
                        <p className="text-gray-400 text-xs">Posted a workout session</p>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="text-gray-300 text-sm leading-relaxed">
                      {sessionPreviews[activeSessionIndex]?.previewText}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <SimpleWorkoutLike 
                        sessionId={sessionPreviews[activeSessionIndex]?.workoutId}
                        size="sm"
                        showText={false}
                      />
                      <span className="text-gray-500 text-xs">
                        {sessionPreviews.length > 1 && `${activeSessionIndex + 1} of ${sessionPreviews.length}`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
        
        {/* Main Category Cards - 2x3 grid layout */}
        <section className="mb-4">
          <div className="grid grid-cols-2 gap-2 mx-auto" style={{ maxWidth: "540px", margin: "0 auto 8px" }}>
            {categoryCards.map((card, index) => (
              card.disabled ? (
                <Card key={index} className="h-[140px] overflow-hidden opacity-30 cursor-not-allowed bg-muted/30 border-muted/50">
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
                  <Card className={`cursor-pointer hover:shadow-md transition-all duration-300 border border-muted hover:border-primary h-[140px] overflow-hidden group relative ${card.isSpecial ? 'border-primary/30 bg-primary/5' : ''}`}>
                    {/* Special Today's Session - Full Canvas */}
                    {card.isSpecial ? (
                      <CardContent className="h-full p-3 relative flex flex-col bg-muted/80 dark:bg-muted/80">
                        <div className="flex flex-col h-full">
                          <div className="flex items-center gap-2 mb-2">
                            {card.icon}
                            <h2 className="text-sm font-bold">{card.title}</h2>
                          </div>
                          <div className="flex-1 space-y-1">
                            {todaySession?.shortDistanceWorkout && (
                              <div className="p-1.5 bg-background/80 dark:bg-background/40 rounded text-xs">
                                <span className="font-medium text-primary">Short:</span> {todaySession.shortDistanceWorkout.slice(0, 30)}...
                              </div>
                            )}
                            {todaySession?.mediumDistanceWorkout && (
                              <div className="p-1.5 bg-background/80 dark:bg-background/40 rounded text-xs">
                                <span className="font-medium text-primary">Medium:</span> {todaySession.mediumDistanceWorkout.slice(0, 30)}...
                              </div>
                            )}
                            {todaySession?.longDistanceWorkout && (
                              <div className="p-1.5 bg-background/80 dark:bg-background/40 rounded text-xs">
                                <span className="font-medium text-primary">Long:</span> {todaySession.longDistanceWorkout.slice(0, 30)}...
                              </div>
                            )}
                            {!todaySession && (
                              <p className="text-muted-foreground text-xs">View your workout</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    ) : (
                      <>
                        {/* Header Image - Top Half */}
                        <div 
                          className="h-1/2 bg-cover bg-center bg-no-repeat relative"
                          style={{ 
                            backgroundImage: `url(${card.headerImage || trackImages[index % 4]})`,
                            backgroundPosition: card.headerImage 
                              ? (card.title === 'Programs' || card.title === 'Tools' ? 'center' : 'center -85px')
                              : 'center'
                          }}
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
                      </>
                    )}
                  </Card>
                </Link>
              )
            ))}
          </div>
        </section>


        
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
