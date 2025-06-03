import { useState, useEffect, useRef } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import OpenAI from "openai";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { useAssignedPrograms } from "@/hooks/use-assigned-programs";
import { useProgramSessions } from "@/hooks/use-program-sessions";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Mic, Loader2, MapPin, ChevronLeft, ChevronRight, ChevronDown, Calendar, Play, Pause, Camera, Video, Upload, X, Save, CheckCircle, ClipboardList } from "lucide-react";
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
  
  // Fetch program sessions if we have a selected program
  const { 
    programSessions, 
    isLoading: isLoadingProgramSessions 
  } = useProgramSessions(selectedProgram?.programId || null);

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
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showMediaPremiumModal, setShowMediaPremiumModal] = useState(false);
  
  // Journal states
  const [diaryNotes, setDiaryNotes] = useState<string>("");
  const [moodValue, setMoodValue] = useState<number>(7);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionCompleteOpen, setSessionCompleteOpen] = useState(false);
  
  // Fade transition state
  const [fadeTransition, setFadeTransition] = useState(true);
  
  // Check if user is premium (Pro or Star subscription)
  const isPremiumUser = athleteProfile?.subscription === 'pro' || athleteProfile?.subscription === 'star';

  return (
    <PageContainer
      breadcrumbs={[
        { name: "Practice", href: "/practice" }
      ]}
    >
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
            {currentDayOffset === -1 ? "Yesterday" : 
             currentDayOffset === 0 ? "Today" : 
             currentDayOffset === 1 ? "Tomorrow" :
             `${Math.abs(currentDayOffset)} days ${currentDayOffset > 0 ? 'ahead' : 'ago'}`}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(new Date().setDate(new Date().getDate() + currentDayOffset)).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
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
          {/* Training Journal Section */}
          <Card className="mb-6 border border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Training Journal</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">How do you feel?</span>
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm"
                    style={{ 
                      background: moodValue <= 3 ? '#ef4444' : 
                                moodValue <= 5 ? '#f59e0b' : 
                                '#22c55e'
                    }}
                  >
                    {moodValue}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Mood Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Mood (1-10)</label>
                    <span className="text-xs text-muted-foreground">{moodValue}/10</span>
                  </div>
                  <Slider
                    value={[moodValue]}
                    onValueChange={(value) => setMoodValue(value[0])}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
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
                        <div className="p-3 bg-muted/30 rounded-md border">
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
          <Collapsible className="mb-6 border border-border/30 rounded-md overflow-hidden">
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
            <div className="bg-muted/30 p-3 rounded-md space-y-2">
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
            <div className="bg-muted/30 p-3 rounded-md space-y-2">
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
          
          <div className="bg-muted/30 p-4 rounded-md mb-4">
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
    </PageContainer>
  );
}

// Protected route wrapper
export function PracticePageWrapper() {
  return (
    <ProtectedRoute path="/practice" component={PracticePage} />
  );
}