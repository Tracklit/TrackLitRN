import { useState, useEffect, useRef } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import OpenAI from "openai";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { useAssignedPrograms } from "@/hooks/use-assigned-programs";
import { useProgramSessions } from "@/hooks/use-program-sessions";
import { useGymData } from "@/hooks/use-gym-data";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Meet } from "@shared/schema";
import { PageContainer } from "@/components/page-container";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Mic, 
  Loader2, 
  MapPin, 
  ChevronDown, 
  Calendar, 
  Play, 
  Pause, 
  Camera, 
  Video, 
  Upload, 
  X, 
  Save, 
  CheckCircle, 
  ClipboardList, 
  Calculator, 
  ChevronUp, 
  CalendarRange, 
  Dumbbell, 
  Target, 
  Timer,
  Book,
  TrendingUp
} from "lucide-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WorkoutReactions } from "@/components/workout-reactions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DayPicker } from "react-day-picker";
import { Textarea } from "@/components/ui/textarea";

function PracticePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch assigned programs
  const { assignedPrograms, isLoading: isLoadingPrograms } = useAssignedPrograms();
  
  // Fetch athlete profile to check subscription
  const { data: athleteProfile } = useQuery({
    queryKey: ["/api/athlete-profile"],
    enabled: !!user,
  });
  
  // State for selected program
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  
  // State for modals
  const [targetTimesOpen, setTargetTimesOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [currentCardData, setCurrentCardData] = useState<any>(null);
  
  // Calculator states
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [useFirstFootTiming, setUseFirstFootTiming] = useState(false);
  const [adjustForTrackType, setAdjustForTrackType] = useState(false);
  const [currentTrackType, setCurrentTrackType] = useState<"indoor" | "outdoor">("outdoor");
  
  // Fetch program sessions if we have a selected program
  const { 
    programSessions, 
    isLoading: isLoadingProgramSessions 
  } = useProgramSessions(selectedProgram?.programId || null);

  // Get program ID and day number for gym data fetching
  const currentProgramId = selectedProgram?.programId || null;
  
  // Fetch gym exercises for the current session - only if we have a valid session with gym content
  const { data: gymDataResponse, isLoading: isLoadingGymData } = useGymData(
    currentProgramId, 
    currentCardData?.dayNumber || null
  );

  // Fetch meets to show on workout day
  const { data: meets = [] } = useQuery<Meet[]>({
    queryKey: ['/api/meets'],
  });

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // Modal states
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showMediaPremiumModal, setShowMediaPremiumModal] = useState(false);
  const [sessionCompleteOpen, setSessionCompleteOpen] = useState(false);
  
  // Journal states
  const [moodValue, setMoodValue] = useState(5);
  const [diaryNotes, setDiaryNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Check if user is premium (Pro or Star subscription)
  const isPremium = athleteProfile?.subscription === "pro" || athleteProfile?.subscription === "star";
  const isFreeTier = !isPremium;
  
  // Generate workout cards for the next 7 days
  const generateWorkoutCards = () => {
    const cards = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Find session for this date
      const sessionForDate = findSessionForDate(date);
      
      // Check if there are meets on this date
      const meetsForDate = meets.filter(meet => {
        const meetDate = new Date(meet.date);
        return meetDate.toDateString() === date.toDateString();
      });
      
      cards.push({
        date,
        session: sessionForDate,
        meets: meetsForDate,
        dayOffset: i,
        id: `card-${i}`
      });
    }
    
    return cards;
  };
  
  // Find session for a specific date
  const findSessionForDate = (date: Date) => {
    if (!programSessions || !selectedProgram) return null;
    
    const startDate = new Date(selectedProgram.createdAt);
    const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Find session by day offset
    const session = programSessions.find(s => {
      const sessionDate = new Date(startDate);
      sessionDate.setDate(startDate.getDate() + (s.dayNumber - 1));
      return sessionDate.toDateString() === date.toDateString();
    });
    
    return session;
  };
  
  // Set the first assigned program as selected if available
  useEffect(() => {
    if (assignedPrograms && assignedPrograms.length > 0 && !selectedProgram) {
      setSelectedProgram(assignedPrograms[0]);
    }
  }, [assignedPrograms, selectedProgram]);
  
  // Add haptic feedback function
  const triggerHapticFeedback = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50); // Light haptic feedback
    }
  };
  
  // Handle card snap (when a card comes into view)
  const handleCardSnap = (cardData: any) => {
    setCurrentCardData(cardData);
    triggerHapticFeedback();
  };
  
  // Open Target Times modal
  const openTargetTimes = (cardData: any) => {
    setCurrentCardData(cardData);
    setTargetTimesOpen(true);
  };
  
  // Open Journal modal
  const openJournal = (cardData: any) => {
    setCurrentCardData(cardData);
    setJournalOpen(true);
  };
  
  // Format date for display
  const formatDateForDisplay = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };
  
  // Render workout card
  const renderWorkoutCard = (cardData: any) => {
    const { date, session, meets, dayOffset, id } = cardData;
    const hasWorkout = session && (
      session.shortDistanceWorkout ||
      session.mediumDistanceWorkout ||
      session.longDistanceWorkout ||
      session.preActivation1 ||
      session.preActivation2 ||
      session.extraSession
    );
    
    return (
      <Card 
        key={id}
        data-card={id}
        className="min-h-[400px] mb-6 bg-gradient-to-br from-blue-600 to-purple-600 text-white border-0 shadow-lg"
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          scrollSnapAlign: 'center',
          scrollSnapStop: 'always',
        }}
      >
        <CardContent className="p-6">
          {/* Header with date and icons */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-2xl font-bold">{formatDateForDisplay(date)}</h3>
              <p className="text-white/80 text-sm">
                {date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
            
            {/* Action Icons */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => openTargetTimes(cardData)}
              >
                <Calculator className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => openJournal(cardData)}
              >
                <Book className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Workout Content */}
          {meets.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-yellow-300" />
                <span className="text-lg font-semibold">Meet Day</span>
              </div>
              {meets.map((meet, index) => (
                <div key={index} className="bg-white/10 rounded-lg p-4">
                  <h4 className="font-semibold text-lg">{meet.name}</h4>
                  <p className="text-white/80">{meet.location}</p>
                  <p className="text-sm text-white/70 mt-1">
                    {new Date(meet.date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : hasWorkout ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Dumbbell className="h-5 w-5 text-green-300" />
                <span className="text-lg font-semibold">Training Day</span>
              </div>
              
              {/* Session Details */}
              <div className="space-y-3">
                {session.shortDistanceWorkout && (
                  <div className="bg-white/10 rounded-lg p-3">
                    <h5 className="font-medium text-sm text-white/80">Short Distance</h5>
                    <p className="text-white">{session.shortDistanceWorkout}</p>
                  </div>
                )}
                
                {session.mediumDistanceWorkout && (
                  <div className="bg-white/10 rounded-lg p-3">
                    <h5 className="font-medium text-sm text-white/80">Medium Distance</h5>
                    <p className="text-white">{session.mediumDistanceWorkout}</p>
                  </div>
                )}
                
                {session.longDistanceWorkout && (
                  <div className="bg-white/10 rounded-lg p-3">
                    <h5 className="font-medium text-sm text-white/80">Long Distance</h5>
                    <p className="text-white">{session.longDistanceWorkout}</p>
                  </div>
                )}
                
                {session.preActivation1 && (
                  <div className="bg-white/10 rounded-lg p-3">
                    <h5 className="font-medium text-sm text-white/80">Pre-Activation 1</h5>
                    <p className="text-white">{session.preActivation1}</p>
                  </div>
                )}
                
                {session.preActivation2 && (
                  <div className="bg-white/10 rounded-lg p-3">
                    <h5 className="font-medium text-sm text-white/80">Pre-Activation 2</h5>
                    <p className="text-white">{session.preActivation2}</p>
                  </div>
                )}
                
                {session.extraSession && (
                  <div className="bg-white/10 rounded-lg p-3">
                    <h5 className="font-medium text-sm text-white/80">Extra Session</h5>
                    <p className="text-white">{session.extraSession}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-white/60 mb-2">
                <Calendar className="h-12 w-12 mx-auto mb-3" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Rest Day</h4>
              <p className="text-white/80">No training scheduled for today</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  if (isLoadingPrograms) {
    return (
      <ProtectedRoute>
        <PageContainer>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </PageContainer>
      </ProtectedRoute>
    );
  }
  
  if (!assignedPrograms || assignedPrograms.length === 0) {
    return (
      <ProtectedRoute>
        <PageContainer>
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-2xl font-bold mb-2">No Programs Assigned</h3>
            <p className="text-muted-foreground mb-6">
              You don't have any training programs assigned yet.
            </p>
            <Button asChild>
              <Link href="/programs">Browse Programs</Link>
            </Button>
          </div>
        </PageContainer>
      </ProtectedRoute>
    );
  }
  
  const workoutCards = generateWorkoutCards();
  
  return (
    <ProtectedRoute>
      <PageContainer>
        <div className="relative">
          {/* Programs Dropdown - Top Right */}
          <div className="absolute top-0 right-0 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white/90 backdrop-blur-sm">
                  Your Programs
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {assignedPrograms.map((program) => (
                  <DropdownMenuItem
                    key={program.programId}
                    onClick={() => setSelectedProgram(program)}
                    className={selectedProgram?.programId === program.programId ? "bg-accent" : ""}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{program.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {program.category} • {program.level}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Workout Cards */}
          <div className="mt-16">
            <h1 className="text-3xl font-bold mb-8 text-center">Training Schedule</h1>
            
            <div 
              className="max-w-md mx-auto h-[calc(100vh-200px)] overflow-y-auto scroll-smooth"
              style={{
                scrollSnapType: 'y mandatory',
                scrollPadding: '20px',
              }}
              onScroll={(e) => {
                // Check if a card is in the center and trigger haptic feedback
                const container = e.target as HTMLElement;
                const cards = container.querySelectorAll('[data-card]');
                const containerRect = container.getBoundingClientRect();
                const centerY = containerRect.top + containerRect.height / 2;
                
                cards.forEach((card) => {
                  const cardRect = card.getBoundingClientRect();
                  const cardCenterY = cardRect.top + cardRect.height / 2;
                  
                  // Check if card is centered (within 50px of center)
                  if (Math.abs(cardCenterY - centerY) < 50) {
                    const cardId = card.getAttribute('data-card');
                    if (cardId && currentCardData?.id !== cardId) {
                      const cardData = workoutCards.find(c => c.id === cardId);
                      if (cardData) {
                        handleCardSnap(cardData);
                      }
                    }
                  }
                });
              }}
            >
              {workoutCards.map(renderWorkoutCard)}
            </div>
          </div>
        </div>
        
        {/* Target Times Modal */}
        <Dialog open={targetTimesOpen} onOpenChange={setTargetTimesOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Target Times Calculator
              </DialogTitle>
              <DialogDescription>
                Calculate your target times for different distances
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">
                Target times calculator will be implemented here
              </p>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Journal Modal */}
        <Dialog open={journalOpen} onOpenChange={setJournalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Training Journal
              </DialogTitle>
              <DialogDescription>
                Record your thoughts and upload media from your session
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">
                Journal entry functionality will be implemented here
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </ProtectedRoute>
  );
}

export function PracticePageWrapper() {
  return <PracticePage />;
}