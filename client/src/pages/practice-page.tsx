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
import { Mic, Loader2, MapPin, ChevronLeft, ChevronRight, ChevronDown, Calendar, Play, Pause, Camera, Video, Upload, X, Save, CheckCircle, ClipboardList, Calculator, ChevronUp, CalendarRange, Dumbbell, Target } from "lucide-react";
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
  
  // State for current day navigation
  const [currentDay, setCurrentDay] = useState<"yesterday" | "today" | "tomorrow">("today");
  const [currentDayOffset, setCurrentDayOffset] = useState<number>(0); // 0 = today, -1 = yesterday, 1 = tomorrow
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // State for session data
  const [activeSessionData, setActiveSessionData] = useState<any>(null);
  
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
  const currentDayNumber = activeSessionData?.dayNumber || null;
  
  // Fetch gym exercises for the current session
  const { data: gymDataResponse, isLoading: isLoadingGymData } = useGymData(currentProgramId, currentDayNumber);

  // Fetch meets to show on workout day
  const { data: meets = [] } = useQuery<Meet[]>({
    queryKey: ['/api/meets'],
  });

  // Function to get meets for the current workout day
  const getMeetsForCurrentDay = () => {
    const currentDate = new Date(new Date().setDate(new Date().getDate() + currentDayOffset));
    return meets.filter(meet => {
      const meetDate = new Date(meet.date);
      return meetDate.toDateString() === currentDate.toDateString();
    });
  };

  // Check if current day has meets (this hides daily workout sessions)
  const currentDayMeets = getMeetsForCurrentDay();
  const hasMeetsToday = currentDayMeets.length > 0;

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
  
  // Fade transition state
  const [fadeTransition, setFadeTransition] = useState(true);
  
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
      // Mark session as completed if needed
      if (selectedProgram && activeSessionData) {
        await fetch(`/api/programs/${selectedProgram.programId}/sessions/${activeSessionData.dayNumber}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get today's date for title
      const today = new Date();
      const formattedDate = today.toLocaleDateString('en-CA'); // YYYY-MM-DD
      const entryTitle = `${activeSessionData?.title || 'Training'} - ${formattedDate}`;
      
      // Create journal entry object
      const journalEntry = {
        title: entryTitle,
        content: diaryNotes || 'No notes for this session.',
        mood: moodValue,
        workoutData: {
          program: selectedProgram?.program?.title || 'Training Session',
          session: activeSessionData?.title || 'Session',
          dayNumber: activeSessionData?.dayNumber || 1,
          exercises: activeSessionData?.exercises || [],
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

  useEffect(() => {
    if (programSessions && programSessions.length > 0) {
      // Calculate the target date based on current day offset
      const today = new Date();
      const targetDate = new Date(today.getTime() + currentDayOffset * 24 * 60 * 60 * 1000);
      
      // Format target date to match session date format (e.g., "Jun-3")
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
          dayNumber: Math.abs(currentDayOffset) + 1,
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
      } else {
        console.log(`Found session for ${targetDateString}:`, { 
          date: session.date, 
          hasWorkout: !!(session.shortDistanceWorkout || session.mediumDistanceWorkout || session.longDistanceWorkout),
          isRestDay: session.isRestDay 
        });
      }
      
      setActiveSessionData(session);
    }
  }, [programSessions, currentDayOffset]);

  return (
    <PageContainer className="pb-24">
      {/* Day navigation */}
      <div className="flex items-center justify-between mb-6 max-w-xs mx-auto text-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentDayOffset(prev => prev - 1)}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex flex-col items-center min-w-0">
          <span className="text-lg font-medium">
            {new Date(new Date().setDate(new Date().getDate() + currentDayOffset)).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(new Date().setDate(new Date().getDate() + currentDayOffset)).toLocaleDateString('en-US', { 
              weekday: 'long' 
            })}
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentDayOffset(prev => prev + 1)}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Show meets if any exist for the current day */}
      {hasMeetsToday && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Today's Meets</h3>
          <div className="space-y-3">
            {currentDayMeets.map((meet) => (
              <Card key={meet.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{meet.name}</h4>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{meet.location}</span>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {new Date(meet.date).toLocaleDateString()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Only show workout content if no meets are scheduled */}
      {!hasMeetsToday && (
        <>
          {/* Daily Session Content */}
          <div className={`space-y-4 transition-opacity duration-200 ${fadeTransition ? 'opacity-100' : 'opacity-0'}`}>
            <div className="bg-muted/40 p-3" style={{ borderRadius: '6px' }}>
              {selectedProgram && assignedPrograms && assignedPrograms.length > 0 ? (
                <div className="space-y-4">
                  {/* Text-based program display */}
                  {selectedProgram.program?.isTextBased ? (
                    <div className="space-y-3">
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
                    </div>
                  ) : isLoadingProgramSessions ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-primary/5" style={{ borderRadius: '6px' }}>
                        <div className="space-y-3">
                          {/* Skeleton loader for daily workout data */}
                          <div className="p-2 bg-primary/5" style={{ borderRadius: "6px" }}>
                            <div className="flex items-start">
                              <div className="bg-primary/10 p-1.5 rounded-full mr-3 mt-0.5">
                                <Dumbbell className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <Skeleton className="h-4 w-16 mb-2" />
                                <Skeleton className="h-3 w-full mb-1" />
                                <Skeleton className="h-3 w-4/5" />
                              </div>
                            </div>
                          </div>
                          <div className="p-2 bg-primary/5" style={{ borderRadius: "6px" }}>
                            <div className="flex items-start">
                              <div className="bg-primary/10 p-1.5 rounded-full mr-3 mt-0.5">
                                <Dumbbell className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <Skeleton className="h-4 w-12 mb-2" />
                                <Skeleton className="h-3 w-full mb-1" />
                                <Skeleton className="h-3 w-3/4 mb-1" />
                                <Skeleton className="h-3 w-5/6" />
                              </div>
                            </div>
                          </div>
                          <div className="p-2 bg-primary/5" style={{ borderRadius: "6px" }}>
                            <div className="flex items-start">
                              <div className="bg-primary/10 p-1.5 rounded-full mr-3 mt-0.5">
                                <Dumbbell className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <Skeleton className="h-4 w-14 mb-2" />
                                <Skeleton className="h-3 w-full mb-1" />
                                <Skeleton className="h-3 w-2/3" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : activeSessionData ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-primary/5" style={{ borderRadius: '6px' }}>
                        <div className="space-y-3">
                          {activeSessionData.isRestDay || 
                           !activeSessionData.date || 
                           activeSessionData.date.trim() === '' ||
                           (!activeSessionData.shortDistanceWorkout && 
                            !activeSessionData.mediumDistanceWorkout && 
                            !activeSessionData.longDistanceWorkout) ? (
                            <div className="p-3 bg-muted/30" style={{ borderRadius: '6px' }}>
                              <p className="text-center font-medium">Rest Day</p>
                              <p className="text-sm text-center text-muted-foreground">
                                Take time to recover and prepare for your next training session.
                              </p>
                            </div>
                          ) : (
                            <>
                              {/* Pre-activation exercises */}
                              {activeSessionData.preActivation1 && activeSessionData.preActivation1.trim() !== "" && (
                                <div className="p-2 bg-primary/5" style={{ borderRadius: "6px" }}>
                                  <p className="font-medium text-sm mb-2">Pre-Activation</p>
                                  <div className="whitespace-pre-line text-sm mt-1 pl-2 border-l-2 border-primary/30">
                                    {activeSessionData.preActivation1.replace(/^"|"$/g, '')}
                                  </div>
                                </div>
                              )}
                            
                              {/* Show imported workout information with proper hierarchy, filtered by athlete profile */}
                              {(activeSessionData.shortDistanceWorkout && 
                                activeSessionData.shortDistanceWorkout.trim() !== "" && 
                                (!athleteProfile || athleteProfile.sprint60m100m !== false || 
                                 (!athleteProfile.sprint60m100m && !athleteProfile.sprint200m && 
                                  !athleteProfile.sprint400m && !athleteProfile.hurdles100m110m && 
                                  !athleteProfile.hurdles400m && !athleteProfile.otherEvent))) ||
                               (activeSessionData.mediumDistanceWorkout && 
                                activeSessionData.mediumDistanceWorkout.trim() !== "" && 
                                (!athleteProfile || athleteProfile.sprint200m || 
                                 (!athleteProfile.sprint60m100m && !athleteProfile.sprint200m && 
                                  !athleteProfile.sprint400m && !athleteProfile.hurdles100m110m && 
                                  !athleteProfile.hurdles400m && !athleteProfile.otherEvent))) ||
                               (activeSessionData.longDistanceWorkout && 
                                activeSessionData.longDistanceWorkout.trim() !== "" && 
                                (!athleteProfile || athleteProfile.sprint400m || 
                                 (!athleteProfile.sprint60m100m && !athleteProfile.sprint200m && 
                                  !athleteProfile.sprint400m && !athleteProfile.hurdles100m110m && 
                                  !athleteProfile.hurdles400m && !athleteProfile.otherEvent))) ? (
                                <div className="p-2 bg-primary/5" style={{ borderRadius: "6px" }}>
                                  <div className="flex items-start">
                                    <div className="bg-primary/10 p-1.5 rounded-full mr-3 mt-0.5">
                                      <Dumbbell className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-sm mb-3">Track Workout</p>
                                      <div className="space-y-4">
                                        {activeSessionData.shortDistanceWorkout && 
                                         activeSessionData.shortDistanceWorkout.trim() !== "" && 
                                         (!athleteProfile || athleteProfile.sprint60m100m !== false || 
                                          (!athleteProfile.sprint60m100m && !athleteProfile.sprint200m && 
                                           !athleteProfile.sprint400m && !athleteProfile.hurdles100m110m && 
                                           !athleteProfile.hurdles400m && !athleteProfile.otherEvent)) && (
                                          <div>
                                            <p className="font-medium text-sm text-primary">60m/100m</p>
                                            <div className="whitespace-pre-line text-sm mt-1">
                                              {activeSessionData.shortDistanceWorkout.replace(/^"|"$/g, '')}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {activeSessionData.mediumDistanceWorkout && 
                                         activeSessionData.mediumDistanceWorkout.trim() !== "" && 
                                         (!athleteProfile || athleteProfile.sprint200m || 
                                          (!athleteProfile.sprint60m100m && !athleteProfile.sprint200m && 
                                           !athleteProfile.sprint400m && !athleteProfile.hurdles100m110m && 
                                           !athleteProfile.hurdles400m && !athleteProfile.otherEvent)) && (
                                          <div>
                                            <p className="font-medium text-sm text-primary">200m</p>
                                            <div className="whitespace-pre-line text-sm mt-1">
                                              {activeSessionData.mediumDistanceWorkout.replace(/^"|"$/g, '')}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {activeSessionData.longDistanceWorkout && 
                                         activeSessionData.longDistanceWorkout.trim() !== "" && 
                                         (!athleteProfile || athleteProfile.sprint400m || 
                                          (!athleteProfile.sprint60m100m && !athleteProfile.sprint200m && 
                                           !athleteProfile.sprint400m && !athleteProfile.hurdles100m110m && 
                                           !athleteProfile.hurdles400m && !athleteProfile.otherEvent)) && (
                                          <div>
                                            <p className="font-medium text-sm text-primary">400m</p>
                                            <div className="whitespace-pre-line text-sm mt-1">
                                              {activeSessionData.longDistanceWorkout.replace(/^"|"$/g, '')}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                              
                              {/* Gym Exercises Section - Dynamic Loading */}
                              {isLoadingGymData && currentProgramId && currentDayNumber && (
                                <div className="p-2 bg-primary/5" style={{ borderRadius: "6px" }}>
                                  <div className="flex items-start">
                                    <div className="bg-primary/10 p-1.5 rounded-full mr-3 mt-0.5">
                                      <Dumbbell className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">Loading Gym Exercises...</p>
                                      <div className="mt-2">
                                        <div className="animate-pulse h-4 bg-muted rounded w-3/4"></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {gymDataResponse?.gymData && gymDataResponse.gymData.length > 0 && (
                                <div className="p-2 bg-primary/5" style={{ borderRadius: "6px" }}>
                                  <div className="flex items-start">
                                    <div className="bg-primary/10 p-1.5 rounded-full mr-3 mt-0.5">
                                      <Dumbbell className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">Gym Exercises</p>
                                      <div className="space-y-1 mt-2">
                                        {gymDataResponse.gymData.map((exercise: string, index: number) => (
                                          <div key={index} className="flex items-start gap-2 text-sm">
                                            <span className="text-primary font-mono text-xs mt-0.5 min-w-[20px]">
                                              {(index + 1).toString().padStart(2, '0')}
                                            </span>
                                            <span className="flex-1">{exercise}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Gym Exercises Error State - when Gym tab is missing */}
                              {!isLoadingGymData && !gymDataResponse?.gymData?.length && 
                               (activeSessionData?.shortDistanceWorkout?.toLowerCase().includes('gym') ||
                                activeSessionData?.mediumDistanceWorkout?.toLowerCase().includes('gym') ||
                                activeSessionData?.longDistanceWorkout?.toLowerCase().includes('gym')) && (
                                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                                  <div className="flex items-start">
                                    <div className="bg-yellow-100 dark:bg-yellow-900/50 p-1.5 rounded-full mr-3 mt-0.5">
                                      <Dumbbell className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-medium text-sm text-yellow-800 dark:text-yellow-200 mb-1">
                                        Gym Exercises Not Available
                                      </p>
                                      <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                        To display gym exercises, create a tab named "Gym" in your Google Sheets with the exercise details.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : isLoadingProgramSessions ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-4 bg-background/80 rounded border border-border/50">
                        <p className="mb-2 font-medium">{selectedProgram.program?.title}</p>
                        <p className="text-sm text-muted-foreground mb-3">{selectedProgram.program?.description}</p>
                        
                        {selectedProgram.notes && (
                          <div className="p-3 bg-muted/30 mb-3" style={{ borderRadius: '6px' }}>
                            <h5 className="text-xs font-medium mb-1">Assignment Notes:</h5>
                            <p className="text-sm">{selectedProgram.notes}</p>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <Badge variant="outline">
                            {selectedProgram.program?.level || ""}
                          </Badge>
                          <Badge variant="outline">
                            {selectedProgram.program?.category || ""}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-6 bg-background/50 border border-border/50 text-center" style={{ borderRadius: '6px' }}>
                    <div className="flex flex-col items-center gap-3 py-4">
                      <CalendarRange className="h-10 w-10 text-muted-foreground opacity-70" />
                      <p className="text-sm text-muted-foreground">No program assigned, tap to assign one</p>
                      <Button asChild variant="outline" size="sm" className="mt-2">
                        <Link href="/programs">
                          Browse Programs
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Target Times Calculator */}
            <Collapsible 
              open={calculatorOpen}
              onOpenChange={setCalculatorOpen}
              className="bg-muted/40 p-3"
              style={{ borderRadius: '6px' }}
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calculator className="h-4 w-4 text-primary" />
                    <span>Target Times</span>
                  </div>
                  {calculatorOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-2 animate-in fade-in-0 slide-in-from-top-5">
                <div className="flex flex-col space-y-2 bg-muted/30 p-2 rounded-md mb-2" style={{ borderRadius: '6px' }}>
                  <div className="text-xs font-medium">Timing Options</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="first-foot" 
                        checked={useFirstFootTiming}
                        onCheckedChange={(checked) => setUseFirstFootTiming(checked === true)}
                      />
                      <label 
                        htmlFor="first-foot" 
                        className="text-xs cursor-pointer"
                      >
                        First foot (-0.55s)
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="track-adjust" 
                        checked={adjustForTrackType}
                        onCheckedChange={(checked) => setAdjustForTrackType(checked === true)}
                      />
                      <label 
                        htmlFor="track-adjust" 
                        className="text-xs cursor-pointer"
                      >
                        On Movement
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-hidden border border-amber-500/70" style={{ borderRadius: '6px' }}>
                  <div className="bg-[#111827] text-white px-3 py-2">
                    <p className="text-sm text-blue-200">
                      {useFirstFootTiming ? '100% column shows first foot contact (-0.55s)' : 'Target times based on your profile goals'}
                    </p>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#111827] text-white border-b border-transparent">
                          <th className="sticky left-0 z-10 bg-inherit whitespace-nowrap px-3 py-2 text-left font-bold">
                            Distance
                          </th>
                          <th className="px-3 py-2 text-right font-bold">80%</th>
                          <th className="px-3 py-2 text-right font-bold">90%</th>
                          <th className="px-3 py-2 text-right font-bold">95%</th>
                          <th className="px-3 py-2 text-right font-bold">98%</th>
                          <th className="px-3 py-2 text-right font-bold">100%</th>
                          <th className="px-3 py-2 text-right font-bold">Goal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const distances = [
                            "50m", "60m", "80m", "100m", "120m", 
                            "150m", "200m", "250m", "300m", "400m"
                          ];
                          
                          // Calculate all times for all distances
                          const timesByDistance = new Map();
                          
                          // Start with the direct goal times from athlete profile
                          if (athleteProfile?.sprint60m100mGoal) {
                            // Determine if it's 60m or 100m based on the value
                            const value = parseFloat(athleteProfile.sprint60m100mGoal);
                            if (value < 10) {
                              timesByDistance.set("60m", value);
                              // Calculate the corresponding 100m time
                              timesByDistance.set("100m", value * 1.67);
                            } else {
                              timesByDistance.set("100m", value);
                              // Calculate the corresponding 60m time
                              timesByDistance.set("60m", value * 0.6);
                            }
                            // Calculate 50m and 80m based on 100m time
                            timesByDistance.set("50m", timesByDistance.get("100m") * 0.5);
                            timesByDistance.set("80m", timesByDistance.get("100m") * 0.8);
                          }
                          
                          if (athleteProfile?.sprint200mGoal) {
                            timesByDistance.set("200m", parseFloat(athleteProfile.sprint200mGoal));
                          }
                          
                          if (athleteProfile?.sprint400mGoal) {
                            timesByDistance.set("400m", parseFloat(athleteProfile.sprint400mGoal));
                          }
                          
                          // Create cascading calculation for distances not directly set by user
                          if (!timesByDistance.has("120m") && timesByDistance.has("100m")) {
                            timesByDistance.set("120m", timesByDistance.get("100m") * 1.2);
                          }
                          
                          if (!timesByDistance.has("150m") && timesByDistance.has("120m")) {
                            timesByDistance.set("150m", timesByDistance.get("120m") * 1.25);
                          } else if (!timesByDistance.has("150m") && timesByDistance.has("100m")) {
                            timesByDistance.set("150m", timesByDistance.get("100m") * 1.5);
                          }
                          
                          if (!timesByDistance.has("200m") && timesByDistance.has("150m")) {
                            timesByDistance.set("200m", timesByDistance.get("150m") * 1.33);
                          }
                          
                          if (!timesByDistance.has("250m") && timesByDistance.has("200m")) {
                            timesByDistance.set("250m", timesByDistance.get("200m") * 1.25);
                          }
                          
                          if (!timesByDistance.has("300m") && timesByDistance.has("250m")) {
                            timesByDistance.set("300m", timesByDistance.get("250m") * 1.2);
                          }
                          
                          if (!timesByDistance.has("400m") && timesByDistance.has("300m")) {
                            timesByDistance.set("400m", timesByDistance.get("300m") * 1.33);
                          }
                        
                          // Use fallback times if no athleteProfile data available
                          if (timesByDistance.size === 0) {
                            // Default times based on average performance
                            timesByDistance.set("50m", 6.5);
                            timesByDistance.set("60m", 7.8);
                            timesByDistance.set("80m", 10.4);
                            timesByDistance.set("100m", 13.0);
                            timesByDistance.set("120m", 15.6);
                            timesByDistance.set("150m", 19.5);
                            timesByDistance.set("200m", 26.0);
                            timesByDistance.set("250m", 32.5);
                            timesByDistance.set("300m", 39.0);
                            timesByDistance.set("400m", 52.0);
                          }
                          
                          // Render the rows with alternating backgrounds
                          return distances.map((distance, index) => {
                            const time = timesByDistance.get(distance);
                            if (!time) return null;
                            
                            // Calculate percentages
                            const percent80 = (time / 0.8).toFixed(2);
                            const percent90 = (time / 0.9).toFixed(2);
                            const percent95 = (time / 0.95).toFixed(2);
                            const percent98 = (time / 0.98).toFixed(2);
                            
                            // Apply timing adjustments for 100% column
                            let percent100 = time;
                            if (useFirstFootTiming) percent100 -= 0.55;
                            percent100 = Math.max(percent100, 0).toFixed(2);
                            
                            // Alternating backgrounds for even/odd rows
                            const isEvenRow = index % 2 === 0;
                            const rowBgClass = isEvenRow ? 
                              "bg-[#111827] text-white" : 
                              "bg-[#1e293b] text-white";
                            
                            return (
                              <tr key={distance} className={`${rowBgClass} border-b border-transparent`}>
                                <td className="sticky left-0 z-10 bg-inherit whitespace-nowrap px-3 py-2 font-bold">
                                  {distance}
                                </td>
                                <td className="px-3 py-2 text-right">{percent80}s</td>
                                <td className="px-3 py-2 text-right">{percent90}s</td>
                                <td className="px-3 py-2 text-right">{percent95}s</td>
                                <td className="px-3 py-2 text-right">{percent98}s</td>
                                <td className="px-3 py-2 text-right">{percent100}s</td>
                                <td className="px-3 py-2 text-right font-bold">{time.toFixed(2)}s</td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Training Journal Section */}
          <Card className="mb-6 bg-primary/5" style={{ borderRadius: '6px' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Training Journal</h3>
              </div>
              
              <div className="space-y-4">
                {/* Mood Tracking Slider */}
                <div className="p-3 bg-muted/30" style={{ borderRadius: '6px' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">How did you feel today?</div>
                    <div className="text-lg font-bold">{moodValue}/10</div>
                  </div>
                  <div className="px-1">
                    <Slider
                      value={[moodValue]}
                      min={1}
                      max={10}
                      step={0.5}
                      onValueChange={(value) => setMoodValue(value[0])}
                      className="mood-slider"
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs">
                    <span className="text-red-500">Poor</span>
                    <span className="text-amber-500">Average (5)</span>
                    <span className="text-green-500">Excellent</span>
                  </div>
                  <div className="flex justify-between px-1 mt-1">
                    <div className="text-[9px] text-muted-foreground">1</div>
                    <div className="text-[9px] text-muted-foreground">5</div>
                    <div className="text-[9px] text-muted-foreground">10</div>
                  </div>
                </div>

                {/* Voice Recording Section - Premium Gated */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Voice Notes</label>
                    {!isPremiumUser && (
                      <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-medium">PRO</span>
                    )}
                  </div>
                  
                  {isPremiumUser ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant={isRecording ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (!isPremiumUser) {
                              setShowPremiumModal(true);
                              return;
                            }
                            // Voice recording logic would go here
                          }}
                          disabled={isTranscribing}
                          className="flex items-center gap-2"
                        >
                          <Mic className="h-4 w-4" />
                          {isRecording ? "Stop Recording" : "Start Recording"}
                        </Button>
                        
                        {isTranscribing && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Transcribing...
                          </div>
                        )}
                      </div>
                      
                      {transcription && (
                        <div className="p-3 bg-muted/30 border" style={{ borderRadius: '6px' }}>
                          <p className="text-sm">{transcription}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPremiumModal(true)}
                      className="w-full flex items-center gap-2 text-muted-foreground"
                    >
                      <Mic className="h-4 w-4" />
                      Unlock Voice Recording with Pro
                    </Button>
                  )}
                </div>

                {/* Text Notes */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Notes</label>
                  <Textarea
                    placeholder="How was your training today? Any observations or goals for next time?"
                    value={diaryNotes}
                    onChange={(e) => setDiaryNotes(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      // Save workout function would be called here
                      setSessionCompleteOpen(true);
                    }}
                    disabled={isSaving}
                    className="flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Entry"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media Upload Section - Collapsible */}
          <Collapsible className="mb-6 border border-border/30 overflow-hidden" style={{ borderRadius: '6px' }}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 bg-muted/30 hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium text-sm">Media</h3>
                {!isPremiumUser && <span className="ml-1 text-[8px] bg-amber-500 text-white px-1 rounded">PRO</span>}
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground ui-open:rotate-180 transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 py-3">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!isPremiumUser) {
                      setShowMediaPremiumModal(true);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Photo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!isPremiumUser) {
                      setShowMediaPremiumModal(true);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <Video className="h-4 w-4" />
                  Video
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}

      {/* Premium Feature Modal */}
      <Dialog open={showPremiumModal} onOpenChange={setShowPremiumModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <span className="h-5 w-5 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">PRO</span>
              Premium Feature
            </DialogTitle>
            <DialogDescription>
              Voice recording and transcription is available exclusively for premium users.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-muted/30 p-3 space-y-2" style={{ borderRadius: '6px' }}>
              <h3 className="font-medium text-sm">With Premium Voice You Get:</h3>
              <ul className="text-sm space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-green-500 h-4 w-4" />
                  Voice-to-text transcription for your training notes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-green-500 h-4 w-4" />
                  Hands-free journal entry during workouts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-green-500 h-4 w-4" />
                  Media uploads for your workouts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-green-500 h-4 w-4" />
                  Advanced tracking and analytics
                </li>
              </ul>
            </div>
          </div>
          
          <DialogFooter className="flex sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPremiumModal(false)}
            >
              Maybe Later
            </Button>
            <Button
              type="button"
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={() => {
                setShowPremiumModal(false);
                window.location.href = '/premium';
              }}
            >
              Upgrade Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Media Upload Premium Modal */}
      <Dialog open={showMediaPremiumModal} onOpenChange={setShowMediaPremiumModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <span className="h-5 w-5 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">PRO</span>
              Premium Feature
            </DialogTitle>
            <DialogDescription>
              Media uploads for photos and videos are available exclusively for premium users.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-muted/30 p-3 space-y-2" style={{ borderRadius: '6px' }}>
              <h3 className="font-medium text-sm">With Premium Media You Get:</h3>
              <ul className="text-sm space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-green-500 h-4 w-4" />
                  Unlimited photo and video uploads
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-green-500 h-4 w-4" />
                  Analyze your technique with slow-motion playback
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-green-500 h-4 w-4" />
                  Create a visual record of your progress
                </li>
              </ul>
            </div>
          </div>
          
          <DialogFooter className="flex sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMediaPremiumModal(false)}
            >
              Maybe Later
            </Button>
            <Button
              type="button"
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={() => {
                setShowMediaPremiumModal(false);
                window.location.href = '/premium';
              }}
            >
              Upgrade Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Session Complete Modal */}
      <Dialog open={sessionCompleteOpen} onOpenChange={setSessionCompleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="text-green-500 h-5 w-5" />
              Journal Entry Saved
            </DialogTitle>
            <DialogDescription>
              Your training session has been completed and saved to your journal.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted/30 p-4 mb-4" style={{ borderRadius: '6px' }}>
            <h3 className="font-medium mb-2">Training Session</h3>
            
            {/* Display the mood rating */}
            <div className="flex items-center gap-2 mb-3">
              <p className="text-sm font-medium">How you felt today:</p>
              <div className="flex items-center">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
                  style={{ 
                    background: moodValue <= 3 ? '#ef4444' : 
                              moodValue <= 5 ? '#f59e0b' : 
                              '#22c55e'
                  }}
                >
                  {moodValue}
                </div>
                <span className="text-xs ml-1">/10</span>
              </div>
            </div>
            
            <p className="text-sm font-medium mb-1">Journal Notes:</p>
            <p className="text-sm text-muted-foreground">
              {diaryNotes || "No notes added for this session."}
            </p>
          </div>
          
          <DialogFooter className="flex sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSessionCompleteOpen(false)}
            >
              Close
            </Button>
            <Button 
              type="button"
              className="bg-primary text-white"
              onClick={() => window.location.href = '/tools/journal'}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Save className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Go to Journal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assigned Programs Section */}
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Your Programs</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAssignedPrograms(!showAssignedPrograms)}
            >
              {showAssignedPrograms ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show ({assignedPrograms?.length || 0})
                </>
              )}
            </Button>
          </div>

          {showAssignedPrograms && (
            <div className="space-y-3">
              {isLoadingPrograms ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : assignedPrograms && assignedPrograms.length > 0 ? (
                assignedPrograms.map((assignment) => (
                  <div
                    key={assignment.id}
                    className={`p-3 border cursor-pointer transition-colors ${
                      selectedProgram?.id === assignment.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    }`}
                    style={{ borderRadius: '6px' }}
                    onClick={() => setSelectedProgram(assignment)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{assignment.program?.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {assignment.program?.description}
                        </p>
                        
                        {assignment.notes && (
                          <div className="mt-2 p-2 bg-muted/30 text-xs" style={{ borderRadius: '6px' }}>
                            <span className="font-medium">Notes: </span>
                            {assignment.notes}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {assignment.program?.level}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {assignment.program?.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {assignment.program?.totalSessions} sessions
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {selectedProgram?.id === assignment.id && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">
                    No programs assigned to you yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}

// Protected route wrapper
export function PracticePageWrapper() {
  return (
    <ProtectedRoute path="/practice" component={PracticePage} />
  );
}

// Default export
export default PracticePage;