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
import { useTicker } from '@/contexts/ticker-context';

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

  // Category cards for main navigation
  const categoryCards = [
    {
      title: "Practice",
      description: "Your daily workout",
      icon: <Calendar className="h-6 w-6 text-primary" />,
      href: "/practice",
      disabled: false,
      isSpecial: true,
      backgroundImage: programsBackground,
      hasBackground: true
    },
    {
      title: "Programs",
      description: "Training plans and schedules",
      icon: <BookOpen className="h-6 w-6 text-primary" />,
      href: "/programs",
      disabled: false,
      backgroundImage: practiceBackground,
      hasBackground: true
    },
    {
      title: "Race",
      description: "Meets, results and analytics",
      icon: <Trophy className="h-6 w-6 text-primary" />,
      href: "/meets",
      disabled: false,
      backgroundImage: raceBackground,
      hasBackground: true
    },
    {
      title: "Tools",
      description: "Training and performance tools",
      icon: <Clock className="h-6 w-6 text-primary" />,
      href: "/training-tools",
      disabled: false,
      backgroundImage: toolsBackground,
      hasBackground: true
    },
    {
      title: "Sprinthia",
      description: "World's First AI Track Coach & Companion",
      icon: <MessageCircle className="h-6 w-6 text-primary" />,
      href: "/sprinthia",
      disabled: false,
      backgroundImage: toolsBackground,
      hasBackground: true
    }
  ];

  // Quote removed as requested

  return (
    <div className="min-h-screen text-foreground pb-16 bg-background">
      {/* Preload critical images */}
      <PreloadImages images={dashboardImages} quality={20} priority={true} />
      
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
                  <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg border border-gray-700 relative overflow-hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 absolute right-2 top-2 z-10 text-white/70 hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTickerVisibility(!isTickerVisible);
                      }}
                    >
                      <Globe className="h-4 w-4" />
                    </Button>
                    
                    <div className="overflow-hidden">
                      {isLoadingPreviews ? (
                        <div className="p-3">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-6 rounded-full bg-gray-700" />
                            <div className="flex-1">
                              <Skeleton className="h-3 w-24 mb-1 bg-gray-700" />
                              <Skeleton className="h-3 w-32 bg-gray-700" />
                            </div>
                          </div>
                        </div>
                      ) : sessionPreviews && sessionPreviews.length > 0 ? (
                        <div 
                          className={`cursor-pointer p-3 transition-opacity duration-300 ease-in-out ${
                            isSessionFading ? 'opacity-0' : 'opacity-100'
                          }`}
                          onClick={() => openSessionDetails(sessionPreviews[activeSessionIndex])}
                          key={activeSessionIndex}
                        >
                          <div className="flex items-center gap-2 pr-8">
                            <div className="rounded-full bg-gray-700/50 h-8 w-8 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-600">
                              {sessionPreviews[activeSessionIndex].user?.profileImageUrl ? (
                                <img 
                                  src={sessionPreviews[activeSessionIndex].user.profileImageUrl} 
                                  alt={sessionPreviews[activeSessionIndex].user?.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <UserCircle className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <div className="flex items-center gap-1 mb-0.5">
                                <span className="text-xs font-medium text-yellow-400">{sessionPreviews[activeSessionIndex].title}</span>
                                <span className="text-xs text-gray-300">· {sessionPreviews[activeSessionIndex].user?.username}</span>
                              </div>
                              <p className="text-xs text-gray-400 line-clamp-1">{sessionPreviews[activeSessionIndex].previewText}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 h-12 flex items-center">
                          <span className="text-xs text-gray-400">No recent workouts</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        )}

        
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
                        <p className="text-muted-foreground/70 text-sm">{card.description}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground/70" />
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
                                    <h2 className="font-bold mb-2" style={{ fontSize: '16px' }}>Today's Workout</h2>
                                    <p className="text-muted-foreground text-sm">Your daily session and journaling</p>
                                  </div>
                                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                      </>
                    ) : (
                      <CardContent className="p-4 relative h-full flex flex-col justify-center z-10">
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <h2 className="font-bold mb-2" style={{ fontSize: '16px' }}>{card.title}</h2>
                            <p className="text-muted-foreground text-sm">{card.description}</p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </Link>
              )
            )}
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
