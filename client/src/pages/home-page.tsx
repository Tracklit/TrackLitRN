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
  MessageCircle,
  Circle,
  Star,
  Play,
  Pause
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { CreateMeetModal } from '@/components/create-meet-modal';
import { cn } from '@/lib/utils';
import { useAssignedPrograms } from '@/hooks/use-assigned-programs';
import { useProgramSessions } from '@/hooks/use-program-sessions';
import { SimpleWorkoutLike } from '@/components/workout-reactions';
import { useTicker } from '@/contexts/ticker-context';
import { CommunityCarousel } from '@/components/community-carousel';

import { BackgroundImageContainer, OptimizedBackgroundImage } from '@/components/optimized-background-image';
import { ImageOptimizer, useImageOptimization } from '@/lib/image-optimizer';
import { PreloadImages } from '@/components/preload-images';
import '../styles/image-optimization.css';

import backgroundImage1 from '@assets/istockphoto-691785042-612x612_1750008503978.jpg';
import backgroundImage2 from '@assets/istockphoto-1088544230-612x612_1750008503978.jpg';
import backgroundImage3 from '@assets/istockphoto-1224403019-612x612_1750008503978.jpg';
import backgroundImage4 from '@assets/istockphoto-1253944192-612x612_1750008503979.jpg';
import backgroundImage5 from '@assets/istockphoto-1279168476-612x612_1750008503979.jpg';
import programsBackground from '@assets/image_1750012192490.png';
import practiceBackground from '@assets/Screenshot 2025-06-15 205621_1750013855167.png';
import raceBackground from '@assets/Screenshot 2025-06-15 205651_1750013855167.png';
import toolsBackground from '@assets/Screenshot 2025-06-15 205721_1750013855168.png';
import sprinthiaBackground from '@assets/image_1750019864190.png';

export default function HomePage() {
  const { user } = useAuth();
  const [isCreateMeetOpen, setIsCreateMeetOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  // Critical dashboard images for preloading with 80% compression
  const dashboardImages = [
    practiceBackground,
    programsBackground,
    raceBackground,
    toolsBackground,
    sprinthiaBackground
  ];

  // Preload critical images with compression
  const { imagesLoaded } = useImageOptimization(dashboardImages);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);
  const [isSessionFading, setIsSessionFading] = useState(false);
  const [showProgramsPreview, setShowProgramsPreview] = useState(false);
  const { isTickerVisible, toggleTickerVisibility } = useTicker();
  
  // Fetch data for stats
  const { data: meets } = useQuery<Meet[]>({
    queryKey: ['/api/meets'],
  });
  
  const { data: results } = useQuery<Result[]>({
    queryKey: ['/api/results'],
  });
  
  // Static content for practice card - no more dynamic workout fetching
  
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
  
  // Interval for rotating through sessions with fade transition
  useEffect(() => {
    if (!sessionPreviews?.length) return;
    
    const interval = setInterval(() => {
      setIsSessionFading(true);
      setTimeout(() => {
        setActiveSessionIndex(prev => 
          prev >= (sessionPreviews.length - 1) ? 0 : prev + 1
        );
        setIsSessionFading(false);
      }, 300); // Fade out duration
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
  


  // Background images for cards
  const backgroundImages = [
    backgroundImage1,
    backgroundImage2,
    backgroundImage3,
    backgroundImage4,
    backgroundImage5
  ];

  // Get assigned programs data - replicate practice page logic
  const { assignedPrograms, isLoading: isLoadingPrograms } = useAssignedPrograms();
  
  // Use the same selectedProgram logic as practice page
  const selectedProgram = assignedPrograms && assignedPrograms.length > 0 ? assignedPrograms[0] : null;
  
  // Fetch program sessions exactly like practice page
  const { 
    programSessions, 
    isLoading: isLoadingProgramSessions 
  } = useProgramSessions(selectedProgram?.programId || null);

  // State for session data - replicate practice page
  const [activeSessionData, setActiveSessionData] = useState<any>(null);

  // Replicate the exact useEffect from practice page that finds today's session
  useEffect(() => {
    if (programSessions && programSessions.length > 0) {
      // Calculate the target date based on current day offset (today = 0)
      const today = new Date();
      const targetDate = new Date(today.getTime() + 0 * 24 * 60 * 60 * 1000); // 0 for today
      
      // Format target date to match session date format (e.g., "Jun-25")
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const targetDateString = `${monthNames[targetDate.getMonth()]}-${targetDate.getDate()}`;
      
      console.log(`Looking for session with date: ${targetDateString}`);
      console.log('Available sessions:', programSessions.slice(0, 5).map(s => ({ date: s.date, hasWorkout: !!(s.shortDistanceWorkout || s.mediumDistanceWorkout || s.longDistanceWorkout) })));
      
      // Find session that matches the target date
      let session = programSessions.find(s => s.date === targetDateString);
      
      // If no session found for this date, create a rest day session
      if (!session) {
        console.log(`No session found for ${targetDateString}, creating rest day`);
        session = {
          dayNumber: 1,
          date: targetDateString,
          preActivation1: null,
          preActivation2: null,
          shortDistanceWorkout: null,
          mediumDistanceWorkout: null,
          longDistanceWorkout: null,
          extraSession: null,
          title: "Rest Day",
          description: "Rest and Recovery",
          notes: null,
          completed: false,
          completed_at: null,
          isRestDay: true
        };
      }
      
      console.log('Found session for', targetDateString, ':', session ? { date: session.date, hasWorkout: !!(session.shortDistanceWorkout || session.mediumDistanceWorkout || session.longDistanceWorkout) } : null);
      setActiveSessionData(session);
    }
  }, [programSessions]);

  const todaysSession = activeSessionData;

  // Get next scheduled meet
  const nextMeet = meets?.find(meet => new Date(meet.date) > new Date());
  const raceDescription = nextMeet 
    ? `${nextMeet.title} - ${new Date(nextMeet.date).toLocaleDateString()}`
    : "No upcoming meets scheduled";

  // Get current program description
  let programsDescription = "Training plans and schedules";
  if (isLoadingPrograms) {
    programsDescription = "Loading programs...";
  } else if (selectedProgram) {
    // The API should return enriched data with program details
    // If program object exists, use its title, otherwise use programId as fallback
    if (selectedProgram.program?.title) {
      programsDescription = selectedProgram.program.title;
    } else if (selectedProgram.programId) {
      programsDescription = `Program ${selectedProgram.programId}`;
    } else {
      programsDescription = "Unknown Program";
    }
  }

  // Category cards for main navigation
  const categoryCards = [
    {
      title: "Practice",
      description: "Your daily workout",
      icon: <Calendar className="h-6 w-6 text-primary" />,
      href: "/practice",
      disabled: false,
      isSpecial: true,
      backgroundImage: practiceBackground,
      hasBackground: true,
      hasPreview: true
    },
    {
      title: "Programs",
      description: programsDescription,
      icon: <BookOpen className="h-6 w-6 text-primary" />,
      href: "/programs",
      disabled: false,
      backgroundImage: practiceBackground,
      hasBackground: true
    },
    {
      title: "Race",
      description: raceDescription,
      icon: <Trophy className="h-6 w-6 text-primary" />,
      href: "/meets",
      disabled: false,
      backgroundImage: practiceBackground,
      hasBackground: true
    },
    {
      title: "Tools",
      description: "Training and performance tools",
      icon: <Clock className="h-6 w-6 text-primary" />,
      href: "/training-tools",
      disabled: false,
      backgroundImage: practiceBackground,
      hasBackground: true
    },
    {
      title: "Sprinthia",
      description: "World's First AI Track Coach & Companion",
      icon: <MessageCircle className="h-6 w-6 text-primary" />,
      href: "/sprinthia",
      disabled: false,
      backgroundImage: practiceBackground,
      hasBackground: true,
      showStar: true
    }
  ];

  // Quote removed as requested

  return (
    <div className="min-h-screen text-foreground pb-16 bg-background" style={{ overscrollBehavior: 'none', marginTop: '-15px' }}>
      {/* Preload critical images */}
      <PreloadImages images={dashboardImages} quality={20} priority={true} />
      
      {/* Fixed Community Activity Ticker - Below Header */}
      <div className={`fixed top-[60px] left-5 right-5 z-40 transition-transform duration-300 ease-in-out ${isTickerVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="mx-auto" style={{ maxWidth: "500px" }}>
          <div className="bg-gradient-to-br from-purple-500 to-blue-800 relative rounded-sm">
            {/* Control buttons with higher z-index */}
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-[80]">
              <button
                type="button"
                className="h-6 w-6 text-white/70 hover:text-white flex items-center justify-center rounded transition-colors bg-black/10 hover:bg-black/20"
                onClick={() => setIsCarouselPaused(!isCarouselPaused)}
                title={isCarouselPaused ? "Resume ticker" : "Pause ticker"}
              >
                {isCarouselPaused ? (
                  <Play className="h-3 w-3" />
                ) : (
                  <Pause className="h-3 w-3" />
                )}
              </button>
            </div>
            
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 z-[80]">
              <button
                type="button"
                className="h-6 w-6 text-white/70 hover:text-white flex items-center justify-center rounded transition-colors bg-black/10 hover:bg-black/20"
                onClick={() => {
                  console.log('X button clicked, hiding ticker');
                  toggleTickerVisibility(false);
                }}
                title="Hide ticker"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            
            {/* Carousel content */}
            <div className="relative h-20 overflow-hidden">
              <CommunityCarousel isPaused={isCarouselPaused} onPauseToggle={setIsCarouselPaused} />
            </div>
          </div>
        </div>
      </div>

      <main className={`px-4 container mx-auto max-w-7xl ${isTickerVisible ? 'pt-24' : 'pt-20'}`}>
        {/* Logo will be placed here in the future */}
        <div className="h-1 mx-auto" style={{ maxWidth: "540px" }}>
          {/* Reserved space for logo */}
        </div>

        {/* Quote removed as requested */}
        


        
        {/* Main Category Cards - Single Column Full Width */}
        <section className="mb-4">
          <div className="max-w-2xl mx-auto">
            {categoryCards.map((card, index) => 
              card.disabled ? (
                <Card key={index} className={`h-[90px] overflow-hidden opacity-30 cursor-not-allowed bg-muted/30 shadow-2xl ${index > 0 ? 'mt-3' : ''}`} style={{ border: '0.5px solid rgba(168, 85, 247, 0.25)' }}>
                  <CardContent className="p-4 relative h-full flex flex-col justify-center opacity-50">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <h2 className="font-bold mb-2 text-muted-foreground/70" style={{ fontSize: '16px' }}>{card.title}</h2>
                        <p className="text-muted-foreground/70 text-sm flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full" />
                          {card.description}
                        </p>
                      </div>
                      <span className="text-muted-foreground/70 text-sm ml-4">&gt;</span>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Link href={card.href} key={index}>
                  <Card className={`cursor-pointer shadow-2xl h-[90px] overflow-hidden group relative bg-primary/5 ${index > 0 ? 'mt-3' : ''}`} style={{ border: '0.5px solid rgba(168, 85, 247, 0.25)' }}>
                    {/* Background image for cards that have it */}
                    {card.hasBackground && (
                      <div 
                        className="absolute inset-0 bg-cover bg-bottom bg-no-repeat opacity-80"
                        style={{
                          backgroundImage: `url(${card.backgroundImage})`,
                          zIndex: 0
                        }}
                      />
                    )}
                    
                    {/* Special Practice Session - Full Width */}
                    {card.isSpecial ? (
                      <>
                        <CardContent className="h-full p-4 relative flex flex-col z-10">
                            <div className="flex flex-col h-full">
                              <div className="flex-1 space-y-2">
                                {/* Static content for consistency with other cards */}
                                <div className="flex items-center justify-between">
                                  <div className="text-left">
                                    <h2 className="font-bold mb-2" style={{ fontSize: '16px' }}>
                                      Hi {user?.name?.split(' ')[0] || user?.username || 'there'} <span className="text-base">👋</span> Ready to train?
                                    </h2>
                                    <p className="text-muted-foreground text-sm flex items-center gap-2">
                                      <div className="w-2 h-2 bg-blue-400 rounded-full" />
                                      Your daily session and journaling
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 ml-4">
                                    {card.hasPreview && (
                                      <Button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setShowProgramsPreview(true);
                                        }}
                                        size="sm"
                                        variant="ghost"
                                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 p-2"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <span className="text-muted-foreground text-sm">&gt;</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                      </>
                    ) : (
                      <CardContent className="p-4 relative h-full flex flex-col justify-center z-10">
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <h2 className="font-bold mb-2 flex items-center gap-2" style={{ fontSize: '18px' }}>
                              {card.title}
                              {card.showStar && (
                                <svg 
                                  className="w-4 h-4 text-yellow-400 fill-yellow-400" 
                                  viewBox="0 0 24 24" 
                                  fill="currentColor"
                                >
                                  <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z" />
                                </svg>
                              )}
                            </h2>
                            <p className="text-muted-foreground text-sm flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-400 rounded-full" />
                              {card.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {card.hasPreview && (
                              <Button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setShowProgramsPreview(true);
                                }}
                                size="sm"
                                variant="ghost"
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 p-2"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <span className="text-muted-foreground text-sm">&gt;</span>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </Link>
              )
            )}
          </div>
        </section>

        {/* Programs Preview Dialog */}
        {showProgramsPreview && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }}
            onClick={() => setShowProgramsPreview(false)}
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
                  Today's Session Preview
                </h2>
                <button
                  onClick={() => setShowProgramsPreview(false)}
                  className="text-gray-300 hover:text-white p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-4">
                {todaysSession && (todaysSession.shortDistanceWorkout || todaysSession.mediumDistanceWorkout || todaysSession.longDistanceWorkout || todaysSession.isRestDay) ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-400" />
                      <span className="font-medium text-white">{selectedProgram?.program?.title}</span>
                    </div>
                    
                    {todaysSession.isRestDay ? (
                      <div className="p-4 bg-slate-700/50 rounded-md text-center">
                        <p className="font-medium text-white">Rest Day</p>
                        <p className="text-sm text-gray-300">Take time to recover</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {todaysSession.shortDistanceWorkout && (
                          <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
                            <p className="text-sm font-medium mb-2 text-blue-400">Short Distance</p>
                            <p className="text-sm text-gray-200">{todaysSession.shortDistanceWorkout}</p>
                          </div>
                        )}
                        {todaysSession.mediumDistanceWorkout && (
                          <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
                            <p className="text-sm font-medium mb-2 text-blue-400">Medium Distance</p>
                            <p className="text-sm text-gray-200">{todaysSession.mediumDistanceWorkout}</p>
                          </div>
                        )}
                        {todaysSession.longDistanceWorkout && (
                          <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
                            <p className="text-sm font-medium mb-2 text-blue-400">Long Distance</p>
                            <p className="text-sm text-gray-200">{todaysSession.longDistanceWorkout}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-end pt-2">
                      <Link href="/practice">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                          Start Practice
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : selectedProgram?.program?.isUploadedProgram ? (
                  // Fallback for uploaded document programs
                  <div className="text-center py-6">
                    <div className="flex items-center gap-2 justify-center mb-4">
                      <Calendar className="h-4 w-4 text-blue-400" />
                      <span className="font-medium text-white">{selectedProgram?.program?.title}</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-4">Check Program</p>
                    <Link href="/practice">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                        View Program
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-300 mb-4">
                      {selectedProgram ? 
                        "No session scheduled for today" : 
                        "No programs assigned yet"
                      }
                    </p>
                    {!selectedProgram && (
                      <Link href="/programs">
                        <Button variant="outline" className="border-slate-600 text-gray-200 hover:bg-slate-700">
                          Browse Programs
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
