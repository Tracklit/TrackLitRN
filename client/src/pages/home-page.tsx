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
  Plus,
  Globe,
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
  const [isTickerVisible, setIsTickerVisible] = useState(() => {
    const saved = localStorage.getItem('tickerVisible');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);

  const toggleTickerVisibility = (visible: boolean) => {
    setIsTickerVisible(visible);
    localStorage.setItem('tickerVisible', JSON.stringify(visible));
  };
  
  // Fetch data for stats
  const { data: meets } = useQuery<Meet[]>({
    queryKey: ['/api/meets'],
  });
  
  const { data: results } = useQuery<Result[]>({
    queryKey: ['/api/results'],
  });
  
  // Fetch assigned programs
  const { assignedPrograms, isLoading: isLoadingPrograms } = useAssignedPrograms();
  
  // Get the first assigned program's ID and details
  const primaryProgram = assignedPrograms?.[0] || null;
  const primaryProgramId = primaryProgram?.programId || null;
  
  // Fetch program sessions for the primary program
  const { programSessions, isLoading: isLoadingSessions } = useProgramSessions(primaryProgramId);
  
  // Find today's workout session using actual current date
  const getTodayDateString = () => {
    const today = new Date();
    const month = today.toLocaleDateString('en-US', { month: 'short' });
    const day = today.getDate();
    return `${month}-${day}`;
  };
  
  const todayDate = getTodayDateString();
  const todaySession = programSessions?.find(session => session.date === todayDate) || null;
  
  // Determine Today's Session description based on program type
  const getTodaySessionDescription = () => {
    if (!primaryProgram) {
      return "No program assigned, tap to assign one";
    }
    
    // Check if it's a Google Sheets program
    if (primaryProgram.program?.importedFromSheet && primaryProgram.program?.googleSheetId) {
      if (todaySession) {
        return todaySession.shortDistanceWorkout?.slice(0, 50) + "..." || 
               todaySession.mediumDistanceWorkout?.slice(0, 50) + "..." || 
               todaySession.longDistanceWorkout?.slice(0, 50) + "..." || 
               "View your workout";
      } else {
        return "No workout scheduled for today";
      }
    }
    
    // For text-based programs
    if (primaryProgram.program?.isTextBased) {
      return "View your text-based program";
    }
    
    // For uploaded PDF programs
    if (primaryProgram.program?.isUploadedProgram) {
      return "View your uploaded program";
    }
    
    return "View your workout";
  };
  
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
      profileImageUrl?: string;
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
  


  // Category cards for main navigation
  const categoryCards = [
    {
      title: "Practice",
      description: "Your daily workout",
      icon: <Calendar className="h-6 w-6 text-primary" />,
      href: "/practice",
      disabled: false,
      isSpecial: true,
      backgroundImage: "/practice-background.jpeg"
    },
    {
      title: "Programs",
      description: "Training plans and schedules",
      icon: <BookOpen className="h-6 w-6 text-primary" />,
      href: "/programs",
      disabled: false,
      headerImage: "/programs-card-extreme.webp",
      backgroundImage: "/programs-background.jpeg"
    },
    {
      title: "Race",
      description: "Meets, results and analytics",
      icon: <Trophy className="h-6 w-6 text-primary" />,
      href: "/meets",
      disabled: false,
      headerImage: "/track-image-2-extreme.webp",
      backgroundImage: "/race-background.jpeg"
    },
    {
      title: "Tools",
      description: "Training and performance tools",
      icon: <Clock className="h-6 w-6 text-primary" />,
      href: "/training-tools",
      disabled: false,
      headerImage: "/tools-card-extreme.webp",
      backgroundImage: "/tools-background.jpeg"
    },
    {
      title: "Sprinthia",
      description: "AI training companion",
      icon: <MessageCircle className="h-6 w-6 text-primary" />,
      href: "/sprinthia",
      disabled: false,
      headerImage: "/sprinthia-avatar-extreme.webp",
      backgroundImage: "/sprinthia-background.jpeg"
    }
  ];

  // Quote removed as requested

  return (
    <div className="min-h-screen text-foreground pb-16 bg-background">
      <main className="pt-2 px-4 container mx-auto max-w-7xl">
        {/* Logo will be placed here in the future */}
        <div className="h-1 mx-auto" style={{ maxWidth: "540px" }}>
          {/* Reserved space for logo */}
        </div>

        {/* Quote removed as requested */}
        
        {/* Session Preview Ticker */}
        {sessionPreviews && sessionPreviews.length > 0 && (
          <section className="mb-6 mx-auto" style={{ maxWidth: "540px" }}>
            <div className="grid grid-cols-2 gap-2" style={{ margin: "0 auto" }}>
              <div className="col-span-2">
                {isTickerVisible ? (
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg border relative overflow-hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 absolute right-2 top-2 z-10 text-white/70 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTickerVisibility(!isTickerVisible);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    
                    <div className="overflow-hidden">
                      {isLoadingPreviews ? (
                        <div className="p-3">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <div className="flex-1">
                              <Skeleton className="h-3 w-24 mb-1" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                          </div>
                        </div>
                      ) : sessionPreviews && sessionPreviews.length > 0 ? (
                        <div 
                          className="cursor-pointer p-3"
                          onClick={() => openSessionDetails(sessionPreviews[activeSessionIndex])}
                          key={activeSessionIndex}
                        >
                          <div className="flex items-center gap-2 pr-8">
                            <div className="rounded-full bg-white/20 h-8 w-8 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {sessionPreviews[activeSessionIndex].user?.profileImageUrl ? (
                                <img 
                                  src={sessionPreviews[activeSessionIndex].user.profileImageUrl} 
                                  alt={sessionPreviews[activeSessionIndex].user?.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <UserCircle className="h-4 w-4 text-white" />
                              )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <div className="flex items-center gap-1 mb-0.5">
                                <span className="text-xs font-medium text-white">{sessionPreviews[activeSessionIndex].title}</span>
                                <span className="text-xs text-white/70">· {sessionPreviews[activeSessionIndex].user?.username}</span>
                              </div>
                              <p className="text-xs text-white/80 line-clamp-1">{sessionPreviews[activeSessionIndex].previewText}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 h-12 flex items-center">
                          <span className="text-xs text-white/70">No recent workouts</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end mb-2">
                    <div className="bg-card rounded-lg border">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTickerVisibility(!isTickerVisible);
                        }}
                      >
                        <Globe className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        
        {/* Main Category Cards - Single Column Full Width */}
        <section className="mb-4">
          <div className="max-w-2xl mx-auto">
            {categoryCards.map((card, index) => (
              card.disabled ? (
                <Card key={index} className={`h-[140px] overflow-hidden opacity-30 cursor-not-allowed bg-muted/30 border border-gray-600 ${index > 0 ? 'mt-8' : ''}`}>
                  <CardContent className="p-4 relative h-full flex flex-col justify-center opacity-50">
                    <div className="text-center">
                      <h2 className="text-lg font-bold mb-2 text-muted-foreground/70">{card.title}</h2>
                      <p className="text-muted-foreground/70 text-sm">{card.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Link href={card.href} key={index}>
                  <Card className={`cursor-pointer hover:shadow-lg transition-all duration-300 border border-gray-600 hover:border-primary h-[140px] overflow-hidden group relative ${card.isSpecial ? 'bg-primary/5' : ''} ${index > 0 ? 'mt-8' : ''}`}>
                    {/* Special Practice Session - Full Width */}
                    {card.isSpecial ? (
                      <>
                        {/* Background Image */}
                        {card.backgroundImage && (
                          <div 
                            className="absolute inset-0 bg-cover bg-no-repeat"
                            style={{ 
                              backgroundImage: `url(${card.backgroundImage})`,
                              backgroundPosition: 'center 50%',
                              opacity: 0.5
                            }}
                          />
                        )}
                        <CardContent className="h-full p-4 relative flex flex-col bg-muted/80 dark:bg-muted/80 z-10">
                            <div className="flex flex-col h-full">
                              <div className="mb-3">
                                <h2 className="text-lg font-bold text-center">{card.title}</h2>
                              </div>
                              <div className="flex-1 space-y-2">
                                {/* Show workout details for Google Sheets programs with today's session */}
                                {primaryProgram?.program?.importedFromSheet && todaySession ? (
                                  <>
                                    {todaySession.shortDistanceWorkout && (
                                      <div className="p-2 bg-background/80 dark:bg-background/40 rounded text-sm">
                                        <span className="font-medium text-primary">60m/100m:</span> {todaySession.shortDistanceWorkout.slice(0, 35)}...
                                      </div>
                                    )}
                                    {todaySession.mediumDistanceWorkout && (
                                      <div className="p-2 bg-background/80 dark:bg-background/40 rounded text-sm">
                                        <span className="font-medium text-primary">200m:</span> {todaySession.mediumDistanceWorkout.slice(0, 35)}...
                                      </div>
                                    )}
                                    {todaySession.longDistanceWorkout && (
                                      <div className="p-2 bg-background/80 dark:bg-background/40 rounded text-sm">
                                        <span className="font-medium text-primary">400m:</span> {todaySession.longDistanceWorkout.slice(0, 35)}...
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  /* Show fallback message for other program types or no program */
                                  <div className="p-2 bg-background/80 dark:bg-background/40 rounded text-sm">
                                    <p className="text-muted-foreground text-center">{getTodaySessionDescription()}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                      </>
                    ) : (
                      <>
                        {/* Background Image for regular cards */}
                        {card.backgroundImage && (
                          <div 
                            className="absolute inset-0 bg-cover bg-no-repeat"
                            style={{ 
                              backgroundImage: `url(${card.backgroundImage})`,
                              backgroundPosition: card.title === 'Sprinthia' ? 'center -100px' : 'center 50%',
                              opacity: 0.1
                            }}
                          />
                        )}
                        <CardContent className="p-4 relative h-full flex flex-col justify-center bg-background z-10">
                          <div className="text-center">
                            <h2 className="text-lg font-bold mb-2">{card.title}</h2>
                            <p className="text-muted-foreground text-sm">{card.description}</p>
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



      </main>
      
      {/* Custom Session Modal - Built from scratch */}
      {isSessionModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          onClick={() => setIsSessionModalOpen(false)}
        >
          <div 
            className="bg-slate-800 rounded-lg shadow-2xl border border-slate-600 p-6 mx-4"
            style={{
              width: '100%',
              maxWidth: '28rem',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'static',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                {currentSession?.title}
              </h2>
              <button
                onClick={() => setIsSessionModalOpen(false)}
                className="text-gray-300 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-blue-600/20 h-8 w-8 flex items-center justify-center flex-shrink-0">
                  <UserCircle className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{currentSession?.user?.name}</p>
                  <p className="text-xs text-gray-300">@{currentSession?.user?.username}</p>
                </div>
              </div>
              
              <div className="border-t border-slate-600 pt-4">
                <h3 className="text-sm font-medium mb-2 text-white">Workout Details</h3>
                <p className="text-sm text-gray-300">{currentSession?.previewText}</p>
              </div>
              
              <div className="bg-slate-700 p-3 rounded-md">
                <h4 className="text-xs font-medium mb-2 text-white">Exercise Breakdown</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <Dumbbell className="h-3 w-3 text-blue-400" />
                    <span>6 x 200m at 30s each</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Dumbbell className="h-3 w-3 text-blue-400" />
                    <span>90 second recovery between sets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Dumbbell className="h-3 w-3 text-blue-400" />
                    <span>10 minute cool down</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-600">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSessionModalOpen(false)}
                >
                  Close
                </Button>
                
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
                className="bg-blue-600 hover:bg-blue-700 text-white"
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
            </div>
          </div>
        </div>
      )}
      
      <CreateMeetModal
        isOpen={isCreateMeetOpen}
        onClose={() => setIsCreateMeetOpen(false)}
      />
    </div>
  );
}
