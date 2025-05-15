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
  
  // Function to save a session to the workout library
  const saveSessionToLibrary = async () => {
    if (!currentSession) return;
    
    setIsSavingSession(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Success notification would go here
    
    setIsSessionModalOpen(false);
    setIsSavingSession(false);
  };

  // Category cards for main navigation
  const categoryCards = [
    {
      title: "Practice",
      description: "Manage daily workouts and track progress",
      icon: <Dumbbell className="h-5 w-5" />,
      href: "/practice",
      color: "from-violet-500 to-indigo-600"
    },
    {
      title: "Competitions",
      description: "Plan and analyze meets and events",
      icon: <Trophy className="h-5 w-5" />,
      href: "/meets",
      color: "from-amber-500 to-orange-600" 
    },
    {
      title: "Clubs & Teams",
      description: "Connect with your training groups",
      icon: <Users className="h-5 w-5" />,
      href: "/clubs",
      color: "from-emerald-500 to-teal-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <HamburgerMenu />
      
      {/* Session Preview Ticker */}
      {isTickerVisible && (
        <div className="relative left-0 right-0 z-10 bg-background/80 backdrop-blur-sm pt-8 pb-1 border-b border-border/20">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => setIsTickerVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="px-4 pb-0 ml-6">
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
        
        {/* Main Navigation Categories */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {categoryCards.map((card, index) => (
              <Link href={card.href} key={index}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-2 pt-6">
                    <div className="flex justify-between items-start">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center bg-gradient-to-r ${card.color} text-white`}>
                        {card.icon}
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-lg mt-4">{card.title}</CardTitle>
                    <CardDescription className="text-muted-foreground text-sm">
                      {card.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
        
        {/* Today's Sessions */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Today's Sessions</h2>
            <Button variant="ghost" size="sm" className="text-primary">
              View All <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          
          <Card className="mb-4">
            <CardHeader className="pb-2">
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
              <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center">
                <UserCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{currentSession?.user?.name}</p>
                <p className="text-xs text-muted-foreground">@{currentSession?.user?.username}</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="text-sm font-semibold mb-2">Workout Summary</h4>
              <p className="text-sm text-muted-foreground mb-4">{currentSession?.previewText}</p>
              
              <h4 className="text-sm font-semibold mb-2">Session Details</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Dumbbell className="h-3 w-3 text-primary" />
                  <span>15 minute warmup</span>
                </li>
                <li className="flex items-center gap-2">
                  <Dumbbell className="h-3 w-3 text-primary" />
                  <span>6x200m at 32 seconds per rep</span>
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