import { useState, useEffect, useRef } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import OpenAI from "openai";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

import { useProgramSessions } from "@/hooks/use-program-sessions";
import { useGymData } from "@/hooks/use-gym-data";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
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
import { Mic, Loader2, MapPin, ChevronLeft, ChevronRight, ChevronDown, Calendar, Play, Pause, Camera, Video, Upload, X, Save, CheckCircle, ClipboardList, Calculator, ChevronUp, CalendarRange, Target, Timer, Circle, PenTool } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Define the journal entry type
interface JournalEntry {
  id: number;
  userId: number;
  title: string;
  notes: string;
  type: string;
  content: any; // This will store mood ratings and workout details
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// Journal Entry Modal Component
function JournalEntryModal({ isOpen, onClose, date }: { isOpen: boolean; onClose: () => void; date: string }) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [type, setType] = useState("workout");
  const [mood, setMood] = useState([5]);
  const [energy, setEnergy] = useState([5]);
  const [motivation, setMotivation] = useState([5]);
  const [confidence, setConfidence] = useState([5]);
  const [soreness, setSoreness] = useState([5]);
  const [isPublic, setIsPublic] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create mutation for adding journal entry
  const createMutation = useMutation({
    mutationFn: async (entryData: any) => {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create journal entry');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journal'] });
      toast({
        title: "Journal Entry Created",
        description: "Your journal entry has been saved successfully.",
        duration: 3000,
      });
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Entry",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setNotes("");
    setType("workout");
    setMood([5]);
    setEnergy([5]);
    setMotivation([5]);
    setConfidence([5]);
    setSoreness([5]);
    setIsPublic(false);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your journal entry.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const entryData = {
      title: title.trim(),
      notes: notes.trim(),
      type,
      isPublic,
      content: {
        mood: mood[0],
        energy: energy[0],
        motivation: motivation[0],
        confidence: confidence[0],
        soreness: soreness[0],
        date: date,
      },
    };

    createMutation.mutate(entryData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Journal Entry - {date}</DialogTitle>
          <DialogDescription>
            Record your thoughts, feelings, and notes about your training session.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter journal entry title..."
              className="w-full"
            />
          </div>

          {/* Notes Textarea */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write your thoughts about today's training..."
              className="min-h-[100px]"
            />
          </div>

          {/* Mood Ratings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">How are you feeling? (1-10)</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Mood</span>
                <div className="flex items-center gap-3">
                  <Slider
                    value={mood}
                    onValueChange={setMood}
                    max={10}
                    min={1}
                    step={1}
                    className="w-32"
                  />
                  <span className="text-sm font-medium w-6">{mood[0]}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Energy</span>
                <div className="flex items-center gap-3">
                  <Slider
                    value={energy}
                    onValueChange={setEnergy}
                    max={10}
                    min={1}
                    step={1}
                    className="w-32"
                  />
                  <span className="text-sm font-medium w-6">{energy[0]}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Motivation</span>
                <div className="flex items-center gap-3">
                  <Slider
                    value={motivation}
                    onValueChange={setMotivation}
                    max={10}
                    min={1}
                    step={1}
                    className="w-32"
                  />
                  <span className="text-sm font-medium w-6">{motivation[0]}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Confidence</span>
                <div className="flex items-center gap-3">
                  <Slider
                    value={confidence}
                    onValueChange={setConfidence}
                    max={10}
                    min={1}
                    step={1}
                    className="w-32"
                  />
                  <span className="text-sm font-medium w-6">{confidence[0]}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Soreness</span>
                <div className="flex items-center gap-3">
                  <Slider
                    value={soreness}
                    onValueChange={setSoreness}
                    max={10}
                    min={1}
                    step={1}
                    className="w-32"
                  />
                  <span className="text-sm font-medium w-6">{soreness[0]}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Public Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Make this entry public</label>
            <Switch
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              "Save Entry"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Component to render workout content within each card
function WorkoutCard({ card, programId, onOpenJournal }: { card: any, programId: number | null, onOpenJournal: (date: string) => void }) {
  const { data: gymDataResponse } = useGymData(programId, card.sessionData?.dayNumber);
  const gymData = gymDataResponse?.gymData || [];
  
  return (
    <div className={`p-4 ${card.isToday ? 'ring-2 ring-yellow-400' : ''}`} style={{ background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)', borderRadius: '6px', boxShadow: '0 0 8px rgba(168, 85, 247, 0.2)' }}>
      <div className="space-y-3">
        {/* Date header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-white">{card.dayOfWeek}</h3>
            {card.isToday && <Badge className="bg-yellow-500 text-black text-xs">Today</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenJournal(card.dateString)}
              className="h-8 px-3 text-white hover:bg-white/10 text-xs"
              data-testid="button-finish-session"
            >
              Finish
            </Button>
            <span className="text-sm text-white/80">{card.dateString}</span>
          </div>
        </div>
        
        {/* Workout content */}
        <WorkoutCardContent sessionData={card.sessionData} gymData={gymData} />
      </div>
    </div>
  );
}

function WorkoutCardContent({ sessionData, gymData }: { sessionData: any, gymData?: any }) {
  if (!sessionData) return null;

  // Check if gym exercises are present
  const hasGymExercises = gymData && gymData.length > 0;

  // Extract gym number from session data
  const extractGymNumber = () => {
    const fields = [
      sessionData.shortDistanceWorkout,
      sessionData.mediumDistanceWorkout,
      sessionData.longDistanceWorkout,
      sessionData.preActivation1,
      sessionData.preActivation2,
      sessionData.extraSession
    ];

    for (const field of fields) {
      if (field && typeof field === 'string') {
        const match = field.match(/Gym\s*(\d+)/i);
        if (match && match[1]) {
          return match[1];
        }
      }
    }
    return null;
  };

  const gymNumber = extractGymNumber();

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

      {/* Hide distance workouts if gym exercises are present */}
      {!hasGymExercises && (
        <>
          {/* 60m/100m Sprint */}
          {sessionData.shortDistanceWorkout && 
           sessionData.shortDistanceWorkout.trim() !== "" && (
            <div className="p-4 bg-white/10 rounded-lg">
              <div className="flex items-start">
                <div className="bg-white/10 p-1.5 rounded-full mr-3 mt-0.5">
                  <Circle className="h-4 w-4 text-white fill-current" />
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
           sessionData.mediumDistanceWorkout.trim() !== "" && (
            <div className="p-4 bg-white/10 rounded-lg">
              <div className="flex items-start">
                <div className="bg-white/10 p-1.5 rounded-full mr-3 mt-0.5">
                  <Circle className="h-4 w-4 text-white fill-current" />
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
           sessionData.longDistanceWorkout.trim() !== "" && (
            <div className="p-4 bg-white/10 rounded-lg">
              <div className="flex items-start">
                <div className="bg-white/10 p-1.5 rounded-full mr-3 mt-0.5">
                  <Circle className="h-4 w-4 text-white fill-current" />
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
        </>
      )}

      {/* Gym Exercises */}
      {hasGymExercises && (
        <div className="p-4 bg-white/10 rounded-lg">
          <div className="flex items-start">
            <div className="bg-white/10 p-1.5 rounded-full mr-3 mt-0.5">
              <Circle className="h-4 w-4 text-white fill-current" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-white mb-1">
                {gymNumber ? `Gym ${gymNumber}` : 'Gym Exercises'}
              </p>
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
  
  
  // State for selected program
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [showAssignedPrograms, setShowAssignedPrograms] = useState<boolean>(false);
  
  // State for daily workout cards
  const [workoutCards, setWorkoutCards] = useState<any[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [daysToShow, setDaysToShow] = useState(7);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Journal navigation
  const handleOpenJournal = (date: string) => {
    // Navigate to journal page with date parameter using wouter for better performance
    window.history.pushState({}, '', `/journal-entry?date=${encodeURIComponent(date)}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };
  
  // Storage utility that handles tracking prevention
  const safeStorage = {
    isAvailable: (() => {
      try {
        const test = '__tracklit_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch {
        return false;
      }
    })(),
    
    getItem: (key: string) => {
      try {
        if (!safeStorage.isAvailable) return null;
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    
    setItem: (key: string, value: string) => {
      try {
        if (!safeStorage.isAvailable) return false;
        localStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    }
  };

  // Session-based fallback storage for when localStorage is blocked
  const [sessionSettings, setSessionSettings] = useState<{
    adjustForTrackType?: boolean;
    currentTrackType?: "indoor" | "outdoor";
    timingMethod?: "reaction" | "firstFoot" | "onMovement";
  }>({});

  // Calculator states with robust storage handling
  const [targetTimesModalOpen, setTargetTimesModalOpen] = useState(false);
  const [adjustForTrackType, setAdjustForTrackType] = useState(() => {
    const stored = safeStorage.getItem('tracklit_adjustForTrackType');
    return stored ? JSON.parse(stored) : sessionSettings.adjustForTrackType ?? false;
  });
  const [currentTrackType, setCurrentTrackType] = useState<"indoor" | "outdoor">(() => {
    const stored = safeStorage.getItem('tracklit_currentTrackType');
    return (stored && (stored === 'indoor' || stored === 'outdoor')) ? stored as "indoor" | "outdoor" : sessionSettings.currentTrackType ?? "outdoor";
  });
  const [timingMethod, setTimingMethod] = useState<"reaction" | "firstFoot" | "onMovement">(() => {
    // First try to get from athlete profile, then localStorage, then fallback
    const stored = safeStorage.getItem('tracklit_timingMethod');
    return (stored && ['reaction', 'firstFoot', 'onMovement'].includes(stored)) ? stored as "reaction" | "firstFoot" | "onMovement" : sessionSettings.timingMethod ?? "firstFoot";
  });
  
  // Goal times state with localStorage persistence
  const [goal100m, setGoal100m] = useState(() => {
    const stored = safeStorage.getItem('tracklit_goal100m');
    return stored ? parseFloat(stored) : 11.0;
  });
  const [goal200m, setGoal200m] = useState(() => {
    const stored = safeStorage.getItem('tracklit_goal200m');
    return stored ? parseFloat(stored) : 22.5;
  });
  const [goal400m, setGoal400m] = useState(() => {
    const stored = safeStorage.getItem('tracklit_goal400m');
    return stored ? parseFloat(stored) : 50.0;
  });
  const [goalHurdles100, setGoalHurdles100] = useState(() => {
    const stored = safeStorage.getItem('tracklit_goalHurdles100');
    return stored ? parseFloat(stored) : 13.5;
  });
  const [goalHurdles400, setGoalHurdles400] = useState(() => {
    const stored = safeStorage.getItem('tracklit_goalHurdles400');
    return stored ? parseFloat(stored) : 54.0;
  });

  
  // Target times calculator using user-set goal times
  const calculateTargetTimes = () => {
    
    // Calculate base times for each distance from the set goals
    const baseTimesByDistance: { [key: string]: number } = {};
    
    // If 100m goal is set, use it as base for short distances
    if (goal100m && goal100m > 0) {
      let adjusted100m = goal100m;
      if (timingMethod === "firstFoot") adjusted100m -= 0.55;
      if (timingMethod === "onMovement") adjusted100m -= 0.15;
      
      baseTimesByDistance["50m"] = adjusted100m * 0.50;
      baseTimesByDistance["60m"] = adjusted100m * 0.60;
      baseTimesByDistance["80m"] = adjusted100m * 0.80;
      baseTimesByDistance["100m"] = adjusted100m;
      
      // Calculate 120m and 150m times with indoor adjustments
      let time120m = adjusted100m * 1.20;
      let time150m = adjusted100m * 1.50;
      
      // Add indoor track adjustments for specific distances
      if (currentTrackType === "indoor") {
        time120m += 0.2;  // Add 0.2s for 120m indoor
        time150m += 0.42; // Add 0.2s + 0.22s = 0.42s for 150m indoor
      }
      
      baseTimesByDistance["120m"] = time120m;
      baseTimesByDistance["150m"] = time150m;
    }
    
    // If 200m goal is set, use it as base for medium distances  
    if (goal200m && goal200m > 0) {
      let adjusted200m = goal200m;
      // No timing adjustments for 200m, 250m, 300m distances
      
      baseTimesByDistance["200m"] = adjusted200m;
      baseTimesByDistance["250m"] = adjusted200m * 1.25; // Calculated from 200m
      baseTimesByDistance["300m"] = adjusted200m * 1.50; // Calculated from 200m
    }
    
    // If 400m goal is set, use it as base
    if (goal400m && goal400m > 0) {
      let adjusted400m = goal400m;
      if (timingMethod === "firstFoot") adjusted400m -= 0.55;
      if (timingMethod === "onMovement") adjusted400m -= 0.15;
      
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
  
  // Load timing method from localStorage on component mount
  useEffect(() => {
    const savedTimingMethod = safeStorage.getItem('tracklit_timingMethod');
    if (savedTimingMethod) {
      setTimingMethod(savedTimingMethod);
    }
  }, []);

  
  // Fetch program sessions if we have a selected program
  const { 
    programSessions, 
    isLoading: isLoadingProgramSessions 
  } = useProgramSessions(selectedProgram?.programId || null);

  // Generate workout cards starting from today's date
  useEffect(() => {
    if (programSessions && programSessions.length > 0) {
      setIsLoadingCards(true);
      
      // Create cards for the specified number of days starting from today
      const today = new Date();
      const cards: any[] = [];
      
      for (let i = 0; i < daysToShow; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // Find session for this specific date
        const sessionForDate = findSessionForDate(programSessions, date);
        
        // Always create a card for each day, even if no session data exists
        cards.push({
          id: `${date.getTime()}-${i}`,
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
      
      setWorkoutCards(cards);
      setIsLoadingCards(false);
    }
  }, [programSessions, daysToShow]);

  // Helper function to parse session date string (e.g., "Mar-16") to Date object
  const parseSessionDate = (dateString: string): Date | null => {
    if (!dateString || typeof dateString !== 'string') return null;
    
    // Parse format like "Mar-16"
    const [monthStr, dayStr] = dateString.split('-');
    if (!monthStr || !dayStr) return null;
    
    const monthMap: { [key: string]: number } = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    const month = monthMap[monthStr];
    const day = parseInt(dayStr);
    
    if (month === undefined || isNaN(day)) return null;
    
    // Use current year or next year if the date already passed
    const currentYear = new Date().getFullYear();
    const testDate = new Date(currentYear, month, day);
    
    return testDate;
  };

  // Helper function to check if a date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Helper function to find session data for a specific date
  const findSessionForDate = (sessions: any[], targetDate: Date) => {
    if (!sessions || sessions.length === 0) return null;
    
    // Format target date as MMM-DD (e.g., "Jul-11") to match the session data format
    const month = targetDate.toLocaleDateString('en-US', { month: 'short' });
    const day = targetDate.getDate().toString();
    const targetDateString = `${month}-${day}`;
    
    console.log('Looking for session with date:', targetDateString);
    console.log('Available sessions (first 10):', sessions.slice(0, 10).map(s => ({ date: s.date, dayNumber: s.dayNumber })));
    
    // Find session by exact date match
    const matchedSession = sessions.find(session => session.date === targetDateString);
    
    console.log('Found session for', targetDateString, ':', matchedSession ? 
      { date: matchedSession.date, dayNumber: matchedSession.dayNumber, hasWorkout: !!(matchedSession.shortDistanceWorkout || matchedSession.mediumDistanceWorkout || matchedSession.longDistanceWorkout) } : 
      'NOT FOUND');
    
    return matchedSession || null;
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
  const isPremiumUser = user?.subscriptionTier === 'pro' || user?.subscriptionTier === 'star';

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
    if (!availablePrograms || availablePrograms.length === 0) {
      setSelectedProgram(null);
      localStorage.removeItem('selectedProgramId');
      return;
    }

    // Try to load saved program from localStorage
    const savedProgramId = localStorage.getItem('selectedProgramId');

    if (savedProgramId) {
      // Find the saved program in available programs
      const savedProgram = availablePrograms.find(p => p.id === savedProgramId);
      if (savedProgram && savedProgram.id !== selectedProgram?.id) {
        setSelectedProgram(savedProgram);
        return;
      }
    }

    // If no saved selection and no current selection, auto-select first program
    if (!selectedProgram && !savedProgramId) {
      setSelectedProgram(availablePrograms[0]);
      localStorage.setItem('selectedProgramId', availablePrograms[0].id);
    }
  }, [availablePrograms]); // Only depend on availablePrograms

  return (
    <PageContainer className="pb-24">
      {/* Fixed Header */}
      <div className="fixed top-16 left-0 right-0 z-40 border-b shadow-sm" style={{ background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)' }}>
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowAssignedPrograms(true)}
                className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white"
              >
                <ClipboardList className="h-3 w-3" />
                Your Programs
              </button>
            </div>
          </div>
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
                        programId={selectedProgram?.programId || null}
                        onOpenJournal={handleOpenJournal}
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

      {/* Floating Target Times Button */}
      <button
        onClick={() => setTargetTimesModalOpen(!targetTimesModalOpen)}
        className="fixed bottom-20 right-4 z-[110] w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center transform hover:scale-110 active:scale-95"
        data-testid="button-target-times"
      >
        <div className="flex flex-col items-center justify-center">
          <Timer className="h-7 w-7 mb-0.5" />
          <span className="text-xs font-bold">%</span>
        </div>
      </button>

      {/* Target Times Drawer */}
      <div className={`fixed inset-0 z-[100] flex transition-all duration-300 ease-out ${
        targetTimesModalOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            targetTimesModalOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setTargetTimesModalOpen(false)}
        />
        
        {/* Drawer Content */}
        <div className={`relative ml-auto w-full max-w-md h-full backdrop-blur-xl border-l border-purple-500/30 shadow-2xl transform transition-all duration-500 ease-out ${
          targetTimesModalOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col overflow-hidden`} style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #581c87 50%, #1e3a8a 100%)' }}>
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pt-20 pb-24 space-y-6 relative">
              {/* Close Button */}
              <button
                onClick={() => setTargetTimesModalOpen(false)}
                className="absolute top-4 right-4 h-8 w-8 text-white hover:bg-purple-500/20 rounded-lg transition-all duration-200 flex items-center justify-center z-10"
              >
                <X className="h-4 w-4" />
              </button>
              {/* Track Type Selection */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-white">Track Type</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setCurrentTrackType("outdoor");
                      const saved = safeStorage.setItem('tracklit_currentTrackType', 'outdoor');
                      if (!saved) {
                        setSessionSettings(prev => ({ ...prev, currentTrackType: "outdoor" }));
                      }
                    }}
                    className={`flex-1 h-11 px-4 rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 ${
                      currentTrackType === "outdoor" 
                        ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/50" 
                        : "bg-white/10 text-white border border-purple-400/30 hover:bg-purple-500/20 shadow-md"
                    }`}
                  >
                    Outdoor
                  </button>
                  <button
                    onClick={() => {
                      setCurrentTrackType("indoor");
                      const saved = safeStorage.setItem('tracklit_currentTrackType', 'indoor');
                      if (!saved) {
                        setSessionSettings(prev => ({ ...prev, currentTrackType: "indoor" }));
                      }
                    }}
                    className={`flex-1 h-11 px-4 rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 ${
                      currentTrackType === "indoor" 
                        ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/50" 
                        : "bg-white/10 text-white border border-purple-400/30 hover:bg-purple-500/20 shadow-md"
                    }`}
                  >
                    Indoor
                  </button>
                </div>
              </div>
              
              {/* Adjust for Track Type Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-semibold text-white">Adjust for Track Type</label>
                    <p className="text-xs text-white/70 mt-1">Apply track-specific timing adjustments</p>
                  </div>
                  <Switch
                    checked={adjustForTrackType}
                    onCheckedChange={(checked) => {
                      setAdjustForTrackType(checked);
                      const saved = safeStorage.setItem('tracklit_adjustForTrackType', JSON.stringify(checked));
                      if (!saved) {
                        setSessionSettings(prev => ({ ...prev, adjustForTrackType: checked }));
                      }
                    }}
                    className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-blue-500 data-[state=unchecked]:bg-white/20"
                  />
                </div>
              </div>
              
              {/* Timing Options */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-white">Timing Method</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setTimingMethod("reaction");
                      const saved = safeStorage.setItem('tracklit_timingMethod', 'reaction');
                      if (!saved) {
                        setSessionSettings(prev => ({ ...prev, timingMethod: "reaction" }));
                      }
                    }}
                    className={`flex-1 h-10 px-3 rounded-lg font-medium text-xs transition-all duration-300 transform hover:scale-105 ${
                      timingMethod === "reaction" 
                        ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/50" 
                        : "bg-white/10 text-white border border-purple-400/30 hover:bg-purple-500/20 shadow-md"
                    }`}
                  >
                    Reaction
                  </button>
                  <button
                    onClick={() => {
                      setTimingMethod("firstFoot");
                      const saved = safeStorage.setItem('tracklit_timingMethod', 'firstFoot');
                      if (!saved) {
                        setSessionSettings(prev => ({ ...prev, timingMethod: "firstFoot" }));
                      }
                    }}
                    className={`flex-1 h-10 px-3 rounded-lg font-medium text-xs transition-all duration-300 transform hover:scale-105 ${
                      timingMethod === "firstFoot" 
                        ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/50" 
                        : "bg-white/10 text-white border border-purple-400/30 hover:bg-purple-500/20 shadow-md"
                    }`}
                  >
                    First Foot
                  </button>
                  <button
                    onClick={() => {
                      setTimingMethod("onMovement");
                      const saved = safeStorage.setItem('tracklit_timingMethod', 'onMovement');
                      if (!saved) {
                        setSessionSettings(prev => ({ ...prev, timingMethod: "onMovement" }));
                      }
                    }}
                    className={`flex-1 h-10 px-3 rounded-lg font-medium text-xs transition-all duration-300 transform hover:scale-105 ${
                      timingMethod === "onMovement" 
                        ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/50" 
                        : "bg-white/10 text-white border border-purple-400/30 hover:bg-purple-500/20 shadow-md"
                    }`}
                  >
                    On Movement
                  </button>
                </div>
              </div>

              {/* Goal Times Input Section */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-white">Goal Times</label>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-purple-400/30 space-y-3">
                  <div className="text-xs text-white/70 mb-3">
                    Set your personal best or goal times for accurate target calculations
                  </div>
                  
                  {/* 100m Goal */}
                  <div className="flex items-center gap-3">
                    <div className="w-16 text-xs text-white font-medium">100m</div>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={goal100m}
                        onChange={(e) => {
                          const normalizedValue = e.target.value.replace(',', '.');
                          const value = parseFloat(normalizedValue) || 11.0;
                          setGoal100m(value);
                          safeStorage.setItem('tracklit_goal100m', value.toString());
                        }}
                        step="0.01"
                        min="8"
                        max="20"
                        className="w-full h-8 px-3 bg-white/10 border border-purple-400/30 rounded-lg text-white text-xs placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        data-testid="input-goal-100m"
                      />
                    </div>
                    <div className="text-xs text-white/60">sec</div>
                  </div>

                  {/* 200m Goal */}
                  <div className="flex items-center gap-3">
                    <div className="w-16 text-xs text-white font-medium">200m</div>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={goal200m}
                        onChange={(e) => {
                          const normalizedValue = e.target.value.replace(',', '.');
                          const value = parseFloat(normalizedValue) || 22.5;
                          setGoal200m(value);
                          safeStorage.setItem('tracklit_goal200m', value.toString());
                        }}
                        step="0.01"
                        min="18"
                        max="40"
                        className="w-full h-8 px-3 bg-white/10 border border-purple-400/30 rounded-lg text-white text-xs placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        data-testid="input-goal-200m"
                      />
                    </div>
                    <div className="text-xs text-white/60">sec</div>
                  </div>

                  {/* 400m Goal */}
                  <div className="flex items-center gap-3">
                    <div className="w-16 text-xs text-white font-medium">400m</div>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={goal400m}
                        onChange={(e) => {
                          const normalizedValue = e.target.value.replace(',', '.');
                          const value = parseFloat(normalizedValue) || 50.0;
                          setGoal400m(value);
                          safeStorage.setItem('tracklit_goal400m', value.toString());
                        }}
                        step="0.01"
                        min="40"
                        max="80"
                        className="w-full h-8 px-3 bg-white/10 border border-purple-400/30 rounded-lg text-white text-xs placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        data-testid="input-goal-400m"
                      />
                    </div>
                    <div className="text-xs text-white/60">sec</div>
                  </div>

                  {/* 100m/110m Hurdles Goal */}
                  <div className="flex items-center gap-3">
                    <div className="w-16 text-xs text-white font-medium">Hurdles</div>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={goalHurdles100}
                        onChange={(e) => {
                          const normalizedValue = e.target.value.replace(',', '.');
                          const value = parseFloat(normalizedValue) || 13.5;
                          setGoalHurdles100(value);
                          safeStorage.setItem('tracklit_goalHurdles100', value.toString());
                        }}
                        step="0.01"
                        min="10"
                        max="20"
                        className="w-full h-8 px-3 bg-white/10 border border-purple-400/30 rounded-lg text-white text-xs placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        data-testid="input-goal-hurdles100"
                      />
                    </div>
                    <div className="text-xs text-white/60">sec</div>
                  </div>

                  {/* 400m Hurdles Goal */}
                  <div className="flex items-center gap-3">
                    <div className="w-16 text-xs text-white font-medium">400H</div>
                    <div className="flex-1">
                      <input
                        type="number"
                        value={goalHurdles400}
                        onChange={(e) => {
                          const normalizedValue = e.target.value.replace(',', '.');
                          const value = parseFloat(normalizedValue) || 54.0;
                          setGoalHurdles400(value);
                          safeStorage.setItem('tracklit_goalHurdles400', value.toString());
                        }}
                        step="0.01"
                        min="45"
                        max="70"
                        className="w-full h-8 px-3 bg-white/10 border border-purple-400/30 rounded-lg text-white text-xs placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        data-testid="input-goal-hurdles400"
                      />
                    </div>
                    <div className="text-xs text-white/60">sec</div>
                  </div>
                </div>
              </div>

              {/* Target Times Table */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-white">Target Times</label>
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-purple-400/30 shadow-xl">
                  <div className="relative">
                    {(() => {
                      const data = calculateTargetTimes();
                      if (data.distances.length === 0) {
                        return (
                          <div className="p-6 text-center">
                            <p className="text-sm text-white/80">No goal times set in your profile.</p>
                            <p className="text-xs mt-2 text-white/60">Update your profile to see target times.</p>
                          </div>
                        );
                      }
                      return (
                        <div className="flex">
                          {/* Frozen Distance Column */}
                          <div className="flex-shrink-0 bg-purple-900/20 border-r border-purple-400/30">
                            <div className="w-16 px-2 py-3 text-xs font-bold text-center bg-purple-500/30 border-b border-purple-400/30 text-white">
                              Dist
                            </div>
                            {data.distances.map((distance, index) => (
                              <div key={`frozen-${distance}`} className={`w-16 px-2 py-2.5 text-xs font-semibold text-center border-b border-purple-400/20 last:border-b-0 text-white ${
                                index % 2 === 0 ? 'bg-gray-900' : 'bg-purple-900/40'
                              }`}>
                                {distance}
                              </div>
                            ))}
                          </div>
                          
                          {/* Scrollable Percentage Columns */}
                          <div className="overflow-x-auto flex-1">
                            <div className="flex min-w-fit">
                              {data.percentages.map((percentage) => (
                                <div key={`col-${percentage}`} className="flex-shrink-0 w-14">
                                  <div className="px-1 py-3 text-xs font-bold text-center bg-purple-500/30 border-b border-purple-400/30 text-white">
                                    {percentage}%
                                  </div>
                                  {data.distances.map((distance, index) => (
                                    <div key={`${distance}-${percentage}`} className={`px-1 py-2.5 text-xs text-center font-mono border-b border-purple-400/20 last:border-b-0 text-white hover:bg-purple-500/20 transition-colors duration-200 ${
                                      index % 2 === 0 ? 'bg-gray-900' : 'bg-purple-900/40'
                                    }`}>
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


              <div className="text-xs text-white/60 bg-purple-900/10 rounded-lg p-3 border border-purple-400/20">
                Times are estimates based on selected track type and timing method. Percentages represent speed intensity levels.
                {!safeStorage.isAvailable && (
                  <div className="mt-2 pt-2 border-t border-purple-400/20">
                    ⚠️ Settings will persist during this session only due to browser privacy settings.
                  </div>
                )}
              </div>
            </div>
          </div>
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
          <div className="relative bg-gradient-to-br from-blue-800 to-purple-400 rounded-lg shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
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
                        // Save selection to localStorage for persistence
                        localStorage.setItem('selectedProgramId', programAssignment.id);
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
