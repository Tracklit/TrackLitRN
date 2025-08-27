import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Save, Mic, MicOff, Volume2, Star, Crown } from "lucide-react";
import { Link } from "wouter";

export default function JournalEntryPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get date from URL parameters (optimized)
  const dateParam = useRef(new URLSearchParams(window.location.search).get('date') || new Date().toLocaleDateString()).current;
  
  // Fetch athlete profile for subscription check
  const { data: athleteProfile } = useQuery({
    queryKey: ["/api/athlete-profile"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
  
  // Form state
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [mood, setMood] = useState([5]);
  const [isPublic, setIsPublic] = useState(false);
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Check if user has Pro/Star subscription (multiple ways to check)
  const userTier = user?.subscriptionTier || athleteProfile?.subscription || 'free';
  const hasVoiceAccess = userTier === 'pro' || userTier === 'star';
  

  
  // Get subscription icon
  const getSubscriptionIcon = (tier: string) => {
    if (tier === 'star') return <Star className="h-3 w-3" />;
    if (tier === 'pro') return <Crown className="h-3 w-3" />;
    return null;
  };
  
  // Voice recording functions
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Recording Failed",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [toast]);
  
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);
  
  const transcribeAudio = useCallback(async () => {
    if (!audioBlob) return;
    
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Transcription failed');
      }
      
      const { text } = await response.json();
      setNotes(prev => prev + (prev ? '\n\n' : '') + text);
      
      toast({
        title: "Voice Transcribed",
        description: "Your voice note has been converted to text.",
      });
    } catch (error) {
      toast({
        title: "Transcription Failed",
        description: "Unable to transcribe voice recording. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  }, [audioBlob, toast]);
  
  const playAudio = useCallback(() => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      setIsPlaying(true);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
    }
  }, [audioBlob]);
  
  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);
  
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
      setLocation('/practice');
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
      type: "workout",
      isPublic,
      content: {
        mood: mood[0],
        date: dateParam,
      },
    };

    createMutation.mutate(entryData);
  };

  const getMoodLabel = (value: number) => {
    if (value <= 2) return 'Poor';
    if (value <= 4) return 'Fair';
    if (value <= 6) return 'Good';
    if (value <= 8) return 'Great';
    return 'Excellent';
  };

  const getMoodColor = (value: number) => {
    if (value <= 2) return 'text-red-500';
    if (value <= 4) return 'text-orange-500';
    if (value <= 6) return 'text-yellow-500';
    if (value <= 8) return 'text-green-500';
    return 'text-green-600';
  };

  // Show loading state while fetching athlete profile
  if (!user) {
    return (
      <PageContainer>
        <div className="max-w-2xl mx-auto p-4">
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded mb-4"></div>
            <div className="h-96 bg-white/10 rounded"></div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/practice">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Journal Entry</h1>
              <p className="text-muted-foreground">{dateParam}</p>
            </div>
          </div>
        </div>

        {/* Journal Form */}
        <Card className="bg-gradient-to-br from-blue-800 to-purple-400 border-none" style={{ borderRadius: '6px', boxShadow: '0 0 8px rgba(168, 85, 247, 0.2)' }}>
          <CardHeader>
            <CardTitle className="text-white">Training Journal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter journal entry title..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                maxLength={100}
              />
            </div>

            {/* Notes Textarea with Voice Recording */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">Notes</label>
                {hasVoiceAccess && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-white/20 text-white text-xs">
                      {getSubscriptionIcon(userTier)}
                      <span className="ml-1">{userTier.toUpperCase()}</span>
                    </Badge>
                    <div className="h-4 w-px bg-white/20"></div>
                    <span className="text-xs text-white/60">Voice Recording</span>
                  </div>
                )}
              </div>
              
              {/* Voice Recording Controls */}
              {hasVoiceAccess && (
                <div className="bg-white/5 border border-white/20 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant={isRecording ? "destructive" : "default"}
                        size="sm"
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isTranscribing}
                        className={`h-9 px-3 ${
                          isRecording 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                        }`}
                      >
                        {isRecording ? (
                          <>
                            <MicOff className="h-4 w-4 mr-2" />
                            <span className="text-sm">Stop Recording</span>
                          </>
                        ) : (
                          <>
                            <Mic className="h-4 w-4 mr-2" />
                            <span className="text-sm">Start Recording</span>
                          </>
                        )}
                      </Button>
                      
                      {isRecording && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-white/60">Recording...</span>
                        </div>
                      )}
                    </div>
                    
                    {audioBlob && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={playAudio}
                          disabled={isPlaying}
                          className="h-8 px-2 text-white hover:bg-white/10"
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={transcribeAudio}
                          disabled={isTranscribing}
                          className="h-8 px-2 text-white hover:bg-white/10"
                        >
                          {isTranscribing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Transcribe"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did your training go today? Share your thoughts..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60 min-h-[120px]"
                maxLength={1000}
              />
              
              {!hasVoiceAccess && (
                <div className="bg-white/5 border border-white/20 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-white/10 rounded-lg flex items-center justify-center">
                        <Mic className="h-4 w-4 text-white/60" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">Voice Recording</div>
                        <div className="text-xs text-white/60">Available with Pro/Star subscription</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-white/20 text-white/60 text-xs">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Mood Slider */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Overall Mood</label>
                <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-lg font-bold ${getMoodColor(mood[0])}`}>
                      {mood[0]}/10
                    </span>
                    <span className={`text-sm font-medium ${getMoodColor(mood[0])}`}>
                      {getMoodLabel(mood[0])}
                    </span>
                  </div>
                  <Slider
                    value={mood}
                    onValueChange={setMood}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-white/60 mt-2">
                    <span>1</span>
                    <span>10</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Public Toggle */}
            <div className="flex items-center justify-between bg-white/10 border border-white/20 rounded-lg p-4">
              <div>
                <label className="text-sm font-medium text-white">Share this entry publically</label>
                <p className="text-xs text-white/60 mt-1">
                  Share this entry with your coach and teammates
                </p>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={setIsPublic}
                className="data-[state=checked]:bg-white/20"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Link to="/practice" className="flex-1">
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                  Cancel
                </Button>
              </Link>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="flex-1 bg-white/20 hover:bg-white/30 text-white border-white/20"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Entry
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}