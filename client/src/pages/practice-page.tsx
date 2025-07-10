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
import { Mic, Loader2, MapPin, ChevronLeft, ChevronRight, ChevronDown, Calendar, Play, Pause, Camera, Video, Upload, X, Save, CheckCircle, ClipboardList, Calculator, ChevronUp, CalendarRange, Dumbbell, Target, Timer } from "lucide-react";
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
import { DayPicker } from "react-day-picker";
import { Textarea } from "@/components/ui/textarea";

// Component to render workout content within each card
function WorkoutCardContent({ sessionData, athleteProfile }: { sessionData: any, athleteProfile: any }) {
  if (!sessionData) return null;

  if (sessionData.isRestDay || 
      !sessionData.date || 
      sessionData.date.trim() === '' ||
      (!sessionData.shortDistanceWorkout && 
       !sessionData.mediumDistanceWorkout && 
       !sessionData.longDistanceWorkout)) {
    return (
      <div className="text-center">
        <p className="font-medium text-white">Rest Day</p>
        <p className="text-sm text-white/80">
          Take time to recover and prepare for your next training session.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Pre-activation exercises */}
      {sessionData.preActivation1 && sessionData.preActivation1.trim() !== "" && (
        <div className="flex items-start">
          <div className="bg-white/10 p-1.5 rounded-full mr-3 mt-0.5">
            <CheckCircle className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm text-white mb-1">Pre-Activation</p>
            <div className="whitespace-pre-line text-sm text-white/80 leading-relaxed">
              {sessionData.preActivation1.replace(/^"|"$/g, '')}
            </div>
          </div>
        </div>
      )}

      {/* 60m/100m Sprint */}
      {sessionData.shortDistanceWorkout && 
       sessionData.shortDistanceWorkout.trim() !== "" && 
       (!athleteProfile || athleteProfile.sprint60m100m !== false || 
        (!athleteProfile.sprint60m100m && !athleteProfile.sprint200m && 
         !athleteProfile.sprint400m && !athleteProfile.hurdles100m110m && 
         !athleteProfile.hurdles400m && !athleteProfile.otherEvent)) && (
        <div className="flex items-start">
          <div className="bg-white/10 p-1.5 rounded-full mr-3 mt-0.5">
            <Dumbbell className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm text-white mb-1">60m/100m Sprint</p>
            <div className="whitespace-pre-line text-sm text-white/80 leading-relaxed">
              {sessionData.shortDistanceWorkout.replace(/^"|"$/g, '')}
            </div>
          </div>
        </div>
      )}
      
      {/* 200m Sprint */}
      {sessionData.mediumDistanceWorkout && 
       sessionData.mediumDistanceWorkout.trim() !== "" && 
       (!athleteProfile || athleteProfile.sprint200m || 
        (!athleteProfile.sprint60m100m && !athleteProfile.sprint200m && 
         !athleteProfile.sprint400m && !athleteProfile.hurdles100m110m && 
         !athleteProfile.hurdles400m && !athleteProfile.otherEvent)) && (
        <div className="flex items-start">
          <div className="bg-white/10 p-1.5 rounded-full mr-3 mt-0.5">
            <Dumbbell className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm text-white mb-1">200m Sprint</p>
            <div className="whitespace-pre-line text-sm text-white/80 leading-relaxed">
              {sessionData.mediumDistanceWorkout.replace(/^"|"$/g, '')}
            </div>
          </div>
        </div>
      )}
      
      {/* 400m Sprint */}
      {sessionData.longDistanceWorkout && 
       sessionData.longDistanceWorkout.trim() !== "" && 
       (!athleteProfile || athleteProfile.sprint400m || 
        (!athleteProfile.sprint60m100m && !athleteProfile.sprint200m && 
         !athleteProfile.sprint400m && !athleteProfile.hurdles100m110m && 
         !athleteProfile.hurdles400m && !athleteProfile.otherEvent)) && (
        <div className="flex items-start">
          <div className="bg-white/10 p-1.5 rounded-full mr-3 mt-0.5">
            <Dumbbell className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm text-white mb-1">400m Sprint</p>
            <div className="whitespace-pre-line text-sm text-white/80 leading-relaxed">
              {sessionData.longDistanceWorkout.replace(/^"|"$/g, '')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [showAssignedPrograms, setShowAssignedPrograms] = useState<boolean>(false);
  
  // State for daily workout cards
  const [workoutCards, setWorkoutCards] = useState<any[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  
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

  // Generate workout cards for multiple days when program sessions are available
  useEffect(() => {
    if (programSessions && programSessions.length > 0) {
      setIsLoadingCards(true);
      
      // Create cards for the next 7 days starting from today
      const today = new Date();
      const cards: any[] = [];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // Find session for this date
        const sessionForDate = findSessionForDate(programSessions, date);
        
        if (sessionForDate) {
          cards.push({
            id: `${date.getTime()}-${sessionForDate.dayNumber}`,
            date: date,
            dateString: date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            }),
            dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
            sessionData: sessionForDate,
            isToday: i === 0
          });
        }
      }
      
      setWorkoutCards(cards);
      setIsLoadingCards(false);
    }
  }, [programSessions]);

  // Helper function to find session data for a specific date
  const findSessionForDate = (sessions: any[], targetDate: Date) => {
    if (!sessions || sessions.length === 0) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    const daysDifference = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Find session by calculating day number based on current date
    const targetDayNumber = sessions[0].dayNumber + daysDifference;
    return sessions.find(session => session.dayNumber === targetDayNumber) || null;
  };

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
  const isPremiumUser = athleteProfile?.subscription === 'pro' || athleteProfile?.subscription === 'star';

  // Best times for common distances (in seconds)
  const bestTimes: Record<string, number> = {
    "50": 6.1,
    "60": 7.3,
    "80": 9.6,
    "90": 10.8,
    "100": 12.0,
    "110": 13.2,
    "120": 14.5,
    "150": 18.3,
    "180": 22.1,
    "200": 24.8,
    "220": 27.6,
    "250": 31.7,
    "280": 35.9,
    "300": 38.8,
    "350": 47.2,
    "400": 54.1,
    "500": 72.8,
    "600": 94.5
  };

  // Calculate distance marks at specific points
  const distanceMarks = [50, 60, 80, 90, 100, 110, 120, 150, 180, 200, 220, 250, 280, 300, 350, 400, 500, 600];

  // Function to save the workout and journal entry directly to database
  async function saveWorkout() {
    if (!user) return;
    
    setIsSaving(true);
    console.log('Starting workout save process...');
    
    try {
      // Get today's date for title
      const today = new Date();
      const formattedDate = today.toLocaleDateString('en-CA'); // YYYY-MM-DD
      const entryTitle = `Training - ${formattedDate}`;
      
      // Create journal entry object
      const journalEntry = {
        title: entryTitle,
        content: diaryNotes || 'No notes for this session.',
        mood: moodValue,
        workoutData: {
          program: selectedProgram?.program?.title || 'Training Session',
          session: 'Session',
          dayNumber: 1,
          exercises: [],
          moodRating: moodValue,
          notes: diaryNotes,
          completedAt: new Date().toISOString()
        }
      };

      console.log('Saving journal entry:', journalEntry);

      // Save to journal
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(journalEntry)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to save journal entry: ${errorData}`);
      }

      console.log('Journal entry saved successfully');

      // Show success message
      toast({
        title: "Workout Saved!",
        description: "Your training session has been saved to your journal.",
      });

      // Reset form
      setDiaryNotes('');
      setMoodValue(7);
      
      // Show completion modal
      setSessionCompleteOpen(true);

    } catch (error) {
      console.error('Error saving workout:', error);
      toast({
        title: "Error",
        description: "Failed to save workout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  // Set up effects for program selection and session loading
  useEffect(() => {
    if (assignedPrograms && assignedPrograms.length > 0 && !selectedProgram) {
      setSelectedProgram(assignedPrograms[0]);
    } else if (assignedPrograms && assignedPrograms.length === 0) {
      // Clear selected program if no programs are assigned
      setSelectedProgram(null);
    }
  }, [assignedPrograms, selectedProgram]);

  return (
    <PageContainer className="pb-24">
      {/* Scrollable Daily Workout Cards */}
      <div className="space-y-4">
        {selectedProgram && assignedPrograms && assignedPrograms.length > 0 ? (
          <>
            {/* Text-based program display */}
            {selectedProgram.program?.isTextBased ? (
              <div className="p-3 bg-primary/5" style={{ borderRadius: '6px' }}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Program Content</h3>
                  </div>
                  
                  <div className="bg-muted/30 p-4 max-h-[60vh] overflow-y-auto" style={{ borderRadius: '6px' }}>
                    <div className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                      {selectedProgram.program.textContent}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/20" style={{ borderRadius: '6px' }}>
                    <p>This is a text-based program. Scroll through the content above to find your training sessions and instructions.</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Daily Workout Cards List */
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {isLoadingCards || isLoadingProgramSessions ? (
                  /* Loading skeleton cards */
                  <>
                    {[1, 2, 3].map((index) => (
                      <div key={index} className="p-4 bg-gradient-to-br from-blue-800 to-purple-400" style={{ borderRadius: '6px', boxShadow: '0 0 8px rgba(168, 85, 247, 0.2)' }}>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between mb-3">
                            <Skeleton className="h-5 w-20 bg-white/20" />
                            <Skeleton className="h-4 w-16 bg-white/20" />
                          </div>
                          <Skeleton className="h-4 w-full bg-white/20" />
                          <Skeleton className="h-4 w-3/4 bg-white/20" />
                        </div>
                      </div>
                    ))}
                  </>
                ) : workoutCards.length > 0 ? (
                  /* Render workout cards */
                  workoutCards.map((card) => (
                    <div key={card.id} className={`p-4 bg-gradient-to-br from-blue-800 to-purple-400 ${card.isToday ? 'ring-2 ring-yellow-400' : ''}`} style={{ borderRadius: '6px', boxShadow: '0 0 8px rgba(168, 85, 247, 0.2)' }}>
                      <div className="space-y-3">
                        {/* Date header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-white">{card.dayOfWeek}</h3>
                            {card.isToday && <Badge className="bg-yellow-500 text-black text-xs">Today</Badge>}
                          </div>
                          <span className="text-sm text-white/80">{card.dateString}</span>
                        </div>
                        
                        {/* Workout content */}
                        <WorkoutCardContent sessionData={card.sessionData} athleteProfile={athleteProfile} />
                      </div>
                    </div>
                  ))
                ) : (
                  /* No workout cards */
                  <div className="p-4 bg-gradient-to-br from-blue-800 to-purple-400" style={{ borderRadius: '6px', boxShadow: '0 0 8px rgba(168, 85, 247, 0.2)' }}>
                    <p className="text-center font-medium text-white">No workout sessions available</p>
                    <p className="text-sm text-center text-white/80">
                      Check back later or contact your coach for program updates.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* No assigned programs */
          <div className="p-4 bg-gradient-to-br from-blue-800 to-purple-400" style={{ borderRadius: '6px', boxShadow: '0 0 8px rgba(168, 85, 247, 0.2)' }}>
            <p className="text-center font-medium text-white">No training program assigned</p>
            <p className="text-sm text-center text-white/80 mb-4">
              Contact your coach to get a program assigned to your account.
            </p>
            <Button 
              onClick={() => setShowAssignedPrograms(true)}
              variant="outline"
              size="sm"
              className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              View Available Programs
            </Button>
          </div>
        )}
        
        {/* Target Times Calculator - Always visible and positioned outside transition area */}
        <div className="mt-6">
          <Card className="border border-purple-500/25" style={{ borderRadius: '6px' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Target Times</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCalculatorOpen(true)}
                  className="h-8"
                >
                  Calculate
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mt-2">
                Calculate target times for different distances based on your track type and training goals.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Your Programs section */}
        <div className="space-y-4">
          <Card className="bg-primary/5" style={{ borderRadius: '6px' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium">Your Programs</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAssignedPrograms(true)}
                  className="h-8"
                >
                  View All
                </Button>
              </div>
              
              {isLoadingPrograms ? (
                <div className="mt-3">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              ) : assignedPrograms && assignedPrograms.length > 0 ? (
                <div className="mt-3">
                  <p className="text-sm font-medium text-primary">
                    {selectedProgram?.program?.name || assignedPrograms[0]?.program?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {assignedPrograms.length} program{assignedPrograms.length !== 1 ? 's' : ''} assigned
                  </p>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground">
                    No programs assigned yet. Your coach will assign training programs to your account.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

export default PracticePage; 
