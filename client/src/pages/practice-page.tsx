import { useState, useEffect, useRef } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import OpenAI from "openai";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

import { useProgramSessions } from "@/hooks/use-program-sessions";
import { useGymData } from "@/hooks/use-gym-data";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
function WorkoutCard({ card, athleteProfile }: { card: any, athleteProfile: any }) {
  const { gymData } = useGymData(card.sessionData?.dayNumber);
  
  return (
    <div className={`p-4 bg-gradient-to-br from-blue-800 to-purple-400 ${card.isToday ? 'ring-2 ring-yellow-400' : ''}`} style={{ borderRadius: '6px', boxShadow: '0 0 8px rgba(168, 85, 247, 0.2)' }}>
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
        <WorkoutCardContent sessionData={card.sessionData} athleteProfile={athleteProfile} gymData={gymData} />
      </div>
    </div>
  );
}

function WorkoutCardContent({ sessionData, athleteProfile, gymData }: { sessionData: any, athleteProfile: any, gymData?: any }) {
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
    <div className="space-y-4">
      {/* Pre-activation exercises */}
      {sessionData.preActivation1 && sessionData.preActivation1.trim() !== "" && (
        <div className="p-4 bg-white/10 rounded-lg">
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
        </div>
      )}

      {/* 60m/100m Sprint */}
      {sessionData.shortDistanceWorkout && 
       sessionData.shortDistanceWorkout.trim() !== "" && 
       (!athleteProfile || athleteProfile.sprint60m100m !== false || 
        (!athleteProfile.sprint60m100m && !athleteProfile.sprint200m && 
         !athleteProfile.sprint400m && !athleteProfile.hurdles100m110m && 
         !athleteProfile.hurdles400m && !athleteProfile.otherEvent)) && (
        <div className="p-4 bg-white/10 rounded-lg">
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
        </div>
      )}
      
      {/* 200m Sprint */}
      {sessionData.mediumDistanceWorkout && 
       sessionData.mediumDistanceWorkout.trim() !== "" && 
       (!athleteProfile || athleteProfile.sprint200m || 
        (!athleteProfile.sprint60m100m && !athleteProfile.sprint200m && 
         !athleteProfile.sprint400m && !athleteProfile.hurdles100m110m && 
         !athleteProfile.hurdles400m && !athleteProfile.otherEvent)) && (
        <div className="p-4 bg-white/10 rounded-lg">
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
        </div>
      )}
      
      {/* 400m Sprint */}
      {sessionData.longDistanceWorkout && 
       sessionData.longDistanceWorkout.trim() !== "" && 
       (!athleteProfile || athleteProfile.sprint400m || 
        (!athleteProfile.sprint60m100m && !athleteProfile.sprint200m && 
         !athleteProfile.sprint400m && !athleteProfile.hurdles100m110m && 
         !athleteProfile.hurdles400m && !athleteProfile.otherEvent)) && (
        <div className="p-4 bg-white/10 rounded-lg">
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
        </div>
      )}

      {/* Gym Exercises */}
      {gymData && gymData.length > 0 && (
        <div className="p-4 bg-white/10 rounded-lg">
          <div className="flex items-start">
            <div className="bg-white/10 p-1.5 rounded-full mr-3 mt-0.5">
              <Dumbbell className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-white mb-1">Gym Exercises</p>
              <div className="space-y-2">
                {gymData.map((exercise: string, index: number) => (
                  <div key={index} className="text-sm text-white/80 leading-relaxed">
                    {exercise}
                  </div>
                ))}
              </div>
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
  const queryClient = useQueryClient();
  
  // Fetch available programs (purchased and assigned)
  const { data: availablePrograms = [], isLoading: isLoadingPrograms } = useQuery({
    queryKey: ["/api/purchased-programs"],
    enabled: !!user,
  });
  
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
  const [daysToShow, setDaysToShow] = useState(7);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Calculator states
  const [targetTimesExpanded, setTargetTimesExpanded] = useState(false);
  const [useFirstFootTiming, setUseFirstFootTiming] = useState(false);
  const [adjustForTrackType, setAdjustForTrackType] = useState(false);
  const [currentTrackType, setCurrentTrackType] = useState<"indoor" | "outdoor">("outdoor");
  const [useOnMovement, setUseOnMovement] = useState(false);
  
  // Target times calculator with comprehensive format
  const calculateTargetTimes = () => {
    if (!athleteProfile) {
      return {
        distances: [],
        percentages: [],
        getTime: () => "-"
      };
    }
    
    // Get base goal times from athlete profile
    const goal100m = athleteProfile.sprint60m100mGoal;
    const goal200m = athleteProfile.sprint200mGoal;
    const goal400m = athleteProfile.sprint400mGoal;
    
    // If no goals are set, return empty calculator
    if (!goal100m && !goal200m && !goal400m) {
      return {
        distances: [],
        percentages: [],
        getTime: () => "-"
      };
    }
    
    // Track type adjustments
    const trackAdjustment = currentTrackType === "indoor" ? 0.98 : 1.0;
    
    // Calculate base times for each distance from the set goals
    const baseTimesByDistance: { [key: string]: number } = {};
    
    // If 100m goal is set, use it as base for short distances
    if (goal100m) {
      let adjusted100m = goal100m * trackAdjustment;
      if (useFirstFootTiming) adjusted100m -= 0.55;
      if (useOnMovement) adjusted100m -= 0.15;
      
      baseTimesByDistance["50m"] = adjusted100m * 0.50;
      baseTimesByDistance["60m"] = adjusted100m * 0.60;
      baseTimesByDistance["80m"] = adjusted100m * 0.80;
      baseTimesByDistance["100m"] = adjusted100m;
      baseTimesByDistance["120m"] = adjusted100m * 1.20; // Calculated from 100m
      baseTimesByDistance["150m"] = adjusted100m * 1.50; // Calculated from 100m
    }
    
    // If 200m goal is set, use it as base for medium distances  
    if (goal200m) {
      let adjusted200m = goal200m * trackAdjustment;
      if (useFirstFootTiming) adjusted200m -= 0.55;
      if (useOnMovement) adjusted200m -= 0.15;
      
      baseTimesByDistance["200m"] = adjusted200m;
      baseTimesByDistance["250m"] = adjusted200m * 1.25; // Calculated from 200m
      baseTimesByDistance["300m"] = adjusted200m * 1.50; // Calculated from 200m
    }
    
    // If 400m goal is set, use it as base
    if (goal400m) {
      let adjusted400m = goal400m * trackAdjustment;
      if (useFirstFootTiming) adjusted400m -= 0.55;
      if (useOnMovement) adjusted400m -= 0.15;
      
      baseTimesByDistance["400m"] = adjusted400m;
    }
    
    // Get available distances based on set goals
    const availableDistances = Object.keys(baseTimesByDistance).sort((a, b) => {
      const getDistance = (d: string) => parseInt(d.replace('m', ''));
      return getDistance(a) - getDistance(b);
    });
    
    const percentages = [60, 65, 70, 75, 80, 85, 90, 95, 100];
    
    return {
      distances: availableDistances,
      percentages,
      getTime: (distance: string, percentage: number) => {
        const baseTime = baseTimesByDistance[distance];
        if (!baseTime) return "-";
        
        // Percentage represents speed percentage - so 80% speed means 100/80 = 1.25x the time
        const adjustedTime = baseTime * (100 / percentage);
        return adjustedTime.toFixed(2);
      }
    };
  };
  

  
  // Fetch program sessions if we have a selected program
  const { 
    programSessions, 
    isLoading: isLoadingProgramSessions 
  } = useProgramSessions(selectedProgram?.programId || null);

  // Generate workout cards for multiple days when program sessions are available
  useEffect(() => {
    if (programSessions && programSessions.length > 0) {
      setIsLoadingCards(true);
      
      // Create cards for the specified number of days starting from today
      const today = new Date();
      const cards: any[] = [];
      
      for (let i = 0; i < daysToShow; i++) {
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
  }, [programSessions, daysToShow]);

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

  // Function to load more days
  const loadMoreDays = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setDaysToShow(prev => prev + 7);
      setIsLoadingMore(false);
    }, 500);
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
    if (availablePrograms && availablePrograms.length > 0 && !selectedProgram) {
      setSelectedProgram(availablePrograms[0]);
    } else if (availablePrograms && availablePrograms.length === 0) {
      // Clear selected program if no programs are available
      setSelectedProgram(null);
    }
  }, [availablePrograms, selectedProgram]);

  return (
    <PageContainer className="pb-24">
      {/* Fixed Target Times Header */}
      <div className="fixed top-16 left-0 right-0 z-50 bg-black border-b shadow-sm">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setTargetTimesExpanded(!targetTimesExpanded)}
                className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white"
              >
                <Calculator className="h-3 w-3" />
                Target Times
                <ChevronDown className={`h-3 w-3 transition-transform ${targetTimesExpanded ? 'rotate-180' : ''}`} />
              </button>
              <button 
                onClick={() => setShowAssignedPrograms(true)}
                className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white"
              >
                <ClipboardList className="h-3 w-3" />
                Your Programs
              </button>
            </div>
          </div>
          
          {/* Collapsible Content */}
          {targetTimesExpanded && (
            <div className="px-4 pb-4 space-y-3 border-t">
              <div className="space-y-2 pt-3">
                <label className="text-xs font-medium text-white">Track Type</label>
                <div className="flex gap-2">
                  <Button
                    variant={currentTrackType === "outdoor" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentTrackType("outdoor")}
                    className="h-7 text-xs"
                  >
                    Outdoor
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-white">Timing Options</label>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="firstFootTiming"
                      checked={useFirstFootTiming}
                      onCheckedChange={(checked) => setUseFirstFootTiming(checked as boolean)}
                    />
                    <label htmlFor="firstFootTiming" className="text-xs text-white">
                      First Foot
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="onMovement"
                      checked={useOnMovement}
                      onCheckedChange={(checked) => setUseOnMovement(checked as boolean)}
                    />
                    <label htmlFor="onMovement" className="text-xs text-white">
                      On Movement
                    </label>
                  </div>
                </div>
              </div>

              {/* Target Times Table */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-white">Target Times</label>
                <div className="bg-muted/20 rounded-md overflow-hidden">
                  <div className="relative">
                    {(() => {
                      const data = calculateTargetTimes();
                      return (
                        <div className="flex">
                          {/* Frozen Distance Column */}
                          <div className="flex-shrink-0 bg-background border-r border-border">
                            <div className="w-20 px-2 py-1.5 text-xs font-medium text-center bg-muted/50 border-b border-border">
                              Distance
                            </div>
                            {data.distances.map((distance) => (
                              <div key={`frozen-${distance}`} className="w-20 px-2 py-1.5 text-xs font-medium text-center bg-background border-b border-border last:border-b-0">
                                {distance}
                              </div>
                            ))}
                          </div>
                          
                          {/* Scrollable Percentage Columns */}
                          <div className="overflow-x-auto flex-1">
                            <div className="flex min-w-fit">
                              {data.percentages.map((percentage) => (
                                <div key={`col-${percentage}`} className="flex-shrink-0 w-16">
                                  <div className="px-1 py-1.5 text-xs font-medium text-center bg-muted/50 border-b border-border">
                                    {percentage}%
                                  </div>
                                  {data.distances.map((distance) => (
                                    <div key={`${distance}-${percentage}`} className="px-1 py-1.5 text-xs text-center font-mono bg-background border-b border-border last:border-b-0">
                                      {data.getTime(distance, percentage)}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="text-xs text-white/80">
                Times are estimates based on selected track type and timing method.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Daily Workout Cards - with top padding for fixed header */}
      <div className="pt-16 space-y-4">
        {selectedProgram && availablePrograms && availablePrograms.length > 0 ? (
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
            ) : selectedProgram.program?.isUploadedProgram && selectedProgram.program?.programFileUrl ? (
              /* Uploaded document program display */
              <div className="p-3 bg-primary/5" style={{ borderRadius: '6px' }}>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Upload className="h-5 w-5 text-primary" />
                    <h3 className="font-medium">Program Document</h3>
                  </div>
                  
                  <div className="bg-muted/30 p-2" style={{ borderRadius: '6px' }}>
                    <iframe
                      src={selectedProgram.program.programFileUrl}
                      className="w-full h-[70vh] border-0"
                      style={{ borderRadius: '4px' }}
                      title="Program Document"
                    />
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/20" style={{ borderRadius: '6px' }}>
                    <p>This is an uploaded program document. Use the controls in the viewer to navigate through your training program.</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Daily Workout Cards List */
              <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
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
                  <>
                    {workoutCards.map((card) => (
                      <WorkoutCard 
                        key={card.id} 
                        card={card} 
                        athleteProfile={athleteProfile} 
                      />
                    ))}
                    
                    {/* Load More button for Google Sheet programs */}
                    {selectedProgram?.program?.importedFromSheet && (
                      <div className="flex justify-center pt-4">
                        <Button
                          onClick={loadMoreDays}
                          disabled={isLoadingMore}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                        >
                          {isLoadingMore ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" />
                              Load More Days
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </>
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


      </div>

      {/* Assigned Programs Modal - Custom React Native Style */}
      {showAssignedPrograms && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowAssignedPrograms(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-black rounded-lg shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Your Programs</h2>
              <p className="text-sm text-gray-300 mt-1">
                Select a training program to view or switch between your assigned programs.
              </p>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {isLoadingPrograms ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-gray-700 animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-gray-700 rounded animate-pulse mb-1" />
                        <div className="h-3 w-24 bg-gray-700 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : availablePrograms && availablePrograms.length > 0 ? (
                <div className="space-y-3">
                  {availablePrograms.map((programAssignment) => (
                    <div 
                      key={programAssignment.id} 
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                        selectedProgram?.id === programAssignment.id 
                          ? 'bg-blue-600 border-2 border-blue-400 shadow-sm' 
                          : 'bg-gray-800 border-2 border-transparent active:bg-gray-700'
                      }`}
                      onClick={async () => {
                        setSelectedProgram(programAssignment);
                        setShowAssignedPrograms(false);
                        // Reset days to show when switching programs
                        setDaysToShow(7);
                        // Force refresh of workout cards when switching programs
                        setWorkoutCards([]);
                        setIsLoadingCards(true);
                        // Invalidate and refetch program sessions for the new program
                        await queryClient.invalidateQueries({
                          queryKey: ["/api/program-sessions", programAssignment.programId]
                        });
                      }}
                      style={{ touchAction: 'manipulation' }}
                    >
                      <div className="flex-shrink-0">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          selectedProgram?.id === programAssignment.id ? 'bg-blue-500' : 'bg-gray-700'
                        }`}>
                          <ClipboardList className={`h-5 w-5 ${
                            selectedProgram?.id === programAssignment.id ? 'text-white' : 'text-gray-300'
                          }`} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate text-white">
                          {programAssignment.program?.title || 'Unnamed Program'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {programAssignment.program?.category || 'Training Program'} • {programAssignment.program?.duration || 0} days
                        </p>
                      </div>
                      {selectedProgram?.id === programAssignment.id && (
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 bg-blue-400 rounded-full" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClipboardList className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-sm text-gray-300 mb-2">
                    No programs assigned yet
                  </p>
                  <p className="text-xs text-gray-500">
                    Your coach will assign training programs to your account.
                  </p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-700">
              <button 
                onClick={() => setShowAssignedPrograms(false)}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg font-medium active:bg-gray-700 transition-colors"
                style={{ touchAction: 'manipulation' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </PageContainer>
  );
}

export default PracticePage; 
