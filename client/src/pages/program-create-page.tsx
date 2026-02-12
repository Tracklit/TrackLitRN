import { useState } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { 
  ArrowLeft, 
  FileUp,
  BookOpen,
  Loader2,
  Upload,
  CheckCircle2,
  Bot,
  Zap,
  Crown,
  Copy,
  Calendar,
  Grid3X3,
  FileText,
  Sparkles,
  Download
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { GoogleSheetImportDialog } from "@/components/google-sheet-import-dialog";

interface CreateProgramForm {
  title: string;
  description: string;
  visibility: 'public' | 'premium' | 'private';
  price: number;
  priceType: 'spikes' | 'money';
  duration: number;
  textContent?: string;
  addToSubscription?: boolean;
}

interface SprinthiaFormData {
  totalLengthWeeks: number;
  blocks: number;
  workoutsPerWeek: number;
  gymWorkoutsPerWeek: number;
  blockFocus: 'speed' | 'speed-maintenance' | 'speed-endurance' | 'mixed' | 'short-to-long' | 'long-to-short';
  aiPrompt: string;
}

function ProgramCreatePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const [selectedMethod, setSelectedMethod] = useState<'builder' | 'upload' | 'text' | 'sprinthia' | 'template' | null>(null);
  const [isNavigatingToEdit, setIsNavigatingToEdit] = useState(false);
  const [isImportDrawerOpen, setIsImportDrawerOpen] = useState(false);
  const [formData, setFormData] = useState<CreateProgramForm>({
    title: "",
    description: "",
    visibility: "public",
    price: 0,
    priceType: "spikes",
    duration: 4,
    textContent: "",
    addToSubscription: false
  });

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Template state
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [templateProgramTitle, setTemplateProgramTitle] = useState('');
  const [templateStartDate, setTemplateStartDate] = useState<Date | undefined>(new Date());
  const [isCreatingFromTemplate, setIsCreatingFromTemplate] = useState(false);
  
  // Fetch user's templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/programs/templates'],
    queryFn: async () => {
      const response = await fetch('/api/programs/templates', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
    enabled: selectedMethod === 'template',
  });
  
  // Sprinthia form state
  const [sprinthiaData, setSprinthiaData] = useState<SprinthiaFormData>({
    totalLengthWeeks: 4,
    blocks: 2,
    workoutsPerWeek: 4,
    gymWorkoutsPerWeek: 2,
    blockFocus: 'speed',
    aiPrompt: ''
  });
  
  // Sprinthia state
  const [isGeneratingProgram, setIsGeneratingProgram] = useState(false);
  const [generatedProgram, setGeneratedProgram] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showUsageLimitModal, setShowUsageLimitModal] = useState(false);
  const [usageLimitType, setUsageLimitType] = useState<'creation' | 'regeneration'>('creation');

  const createProgramMutation = useMutation({
    mutationFn: async (data: CreateProgramForm) => {
      const programData = {
        ...data,
        isTextBased: selectedMethod === 'text',
      };
      const response = await apiRequest("POST", "/api/programs", programData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create program");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      if (selectedMethod === 'text') {
        toast({
          title: "Success",
          description: "Text-based program created successfully!",
        });
        setLocation('/programs');
      } else {
        setIsNavigatingToEdit(true);
        setLocation(`/programs/${data.id}/edit`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadProgramMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/programs/upload", {
        method: "POST",
        body: formData,
        credentials: "include",  // Added credentials to include session cookie
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to upload program";
        try {
          const error = JSON.parse(errorText);
          errorMessage = error.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Program uploaded successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      setUploadSuccess(true);
      setTimeout(() => {
        setLocation(`/programs/${data.id}`);
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Program title is required",
        variant: "destructive",
      });
      return;
    }

    createProgramMutation.mutate(formData);
  };

  const handleFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Program title is required",
        variant: "destructive",
      });
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("programFile", uploadFile);  // Changed from "file" to "programFile"
    formDataToSend.append("title", formData.title);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("visibility", formData.visibility);
    formDataToSend.append("price", formData.price.toString());
    formDataToSend.append("priceType", formData.priceType);
    formDataToSend.append("duration", formData.duration.toString());  // Added missing duration field

    uploadProgramMutation.mutate(formDataToSend);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Program title is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.textContent?.trim()) {
      toast({
        title: "Error",
        description: "Program content is required",
        variant: "destructive",
      });
      return;
    }

    createProgramMutation.mutate(formData);
  };

  const updateFormData = (field: keyof CreateProgramForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Check subscription limits for Sprinthia
  const checkSprinthiaUsage = () => {
    if (!user) return { allowed: false, reason: 'no-user' };
    
    const tier = user.subscriptionTier || 'free';
    if (tier === 'free') {
      return { allowed: false, reason: 'non-paying' };
    }
    
    // Check program creation limits (these would need to be tracked in the backend)
    const programsCreated = user.sprinthiaProgramsCreated || 0;
    const maxPrograms = tier === 'pro' ? 3 : tier === 'star' ? 12 : 0;
    
    if (programsCreated >= maxPrograms) {
      return { allowed: false, reason: 'creation-limit', current: programsCreated, max: maxPrograms };
    }
    
    return { allowed: true };
  };

  const checkRegenerationUsage = () => {
    if (!user) return { allowed: false, reason: 'no-user' };
    
    const tier = user.subscriptionTier || 'free';
    if (tier === 'free') {
      return { allowed: false, reason: 'non-paying' };
    }
    
    // Check regeneration limits (these would need to be tracked per program)
    const regenerationsUsed = user.sprinthiaRegenerationsUsed || 0;
    const maxRegenerations = tier === 'pro' ? 3 : tier === 'star' ? 12 : 0;
    
    if (regenerationsUsed >= maxRegenerations) {
      return { allowed: false, reason: 'regeneration-limit', current: regenerationsUsed, max: maxRegenerations };
    }
    
    return { allowed: true };
  };

  const generateSprinthiaProgram = async () => {
    const usageCheck = checkSprinthiaUsage();
    if (!usageCheck.allowed) {
      setUsageLimitType('creation');
      setShowUsageLimitModal(true);
      return;
    }

    setIsGeneratingProgram(true);
    try {
      const response = await apiRequest('POST', '/api/sprinthia/generate-program', {
        ...sprinthiaData,
        title: formData.title,
        description: formData.description
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate program');
      }
      
      const result = await response.json();
      setGeneratedProgram(result.content);
      
      toast({
        title: "Program Generated",
        description: "Your AI-powered training program has been created!",
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate program. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingProgram(false);
    }
  };

  const regenerateProgram = async () => {
    const usageCheck = checkRegenerationUsage();
    if (!usageCheck.allowed) {
      setUsageLimitType('regeneration');
      setShowUsageLimitModal(true);
      return;
    }

    setIsRegenerating(true);
    try {
      const response = await apiRequest('POST', '/api/sprinthia/regenerate-program', {
        ...sprinthiaData,
        title: formData.title,
        description: formData.description,
        previousContent: generatedProgram
      });
      
      if (!response.ok) {
        throw new Error('Failed to regenerate program');
      }
      
      const result = await response.json();
      setGeneratedProgram(result.content);
      
      toast({
        title: "Program Regenerated",
        description: "Your training program has been updated with new AI suggestions!",
      });
    } catch (error: any) {
      toast({
        title: "Regeneration Failed",
        description: error.message || "Failed to regenerate program. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const continueToEdit = () => {
    // Copy generated content to formData and switch to text mode
    setFormData(prev => ({ ...prev, textContent: generatedProgram || '' }));
    setSelectedMethod('text');
    setGeneratedProgram(null);
  };

  if (uploadSuccess || isNavigatingToEdit) {
    return (
      <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            {uploadSuccess ? "Program Uploaded Successfully!" : "Program Created Successfully!"}
          </h2>
          <p className="text-muted-foreground mb-4">Redirecting to program editor...</p>
          
          {/* Loading skeleton for edit page */}
          <div className="w-full max-w-2xl mt-8 space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>
              
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 14 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/programs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Programs
          </Link>
        </Button>
      </div>

      <PageHeader 
        title="Create New Program"
        description="Build a training program for your athletes or share with the community"
      />

      <div className="mt-8">
        {!selectedMethod ? (
          <div className="max-w-3xl mx-auto space-y-8">
            {/* BUILD FROM SCRATCH Section */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Build from Scratch</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Program Builder - Popular */}
                <Card 
                  className="cursor-pointer overflow-hidden relative group hover:border-primary/50 transition-all duration-200 bg-card"
                  onClick={() => setSelectedMethod('builder')}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Grid3X3 className="h-6 w-6 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-base font-semibold">Program Builder</h2>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">POPULAR</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Drag-and-drop sessions, exercises, and weekly structure with full control over every detail.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Build with Sprinthia AI Coach - powered by Aria */}
                <Card 
                  className="cursor-pointer overflow-hidden relative group hover:border-purple-500/50 transition-all duration-200 bg-card"
                  onClick={() => setSelectedMethod('sprinthia')}
                >
                  {/* Powered by Aria badge in top right corner */}
                  <div className="absolute top-2 right-2 z-10">
                    <img 
                      src="/images/powered-by-aria.png" 
                      alt="Powered by Aria" 
                      className="h-5 opacity-80"
                    />
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Sparkles className="h-6 w-6 text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h2 className="text-base font-semibold">Build with Sprinthia AI Coach</h2>
                          {user?.subscriptionTier === 'free' && (
                            <Crown className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">Describe your goals and let AI generate a full program you can review and customize.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Text Based */}
                <Card 
                  className="cursor-pointer overflow-hidden relative group hover:border-primary/50 transition-all duration-200 bg-card"
                  onClick={() => setSelectedMethod('text')}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-slate-500/10">
                        <FileText className="h-6 w-6 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-base font-semibold mb-1">Text Based</h2>
                        <p className="text-sm text-muted-foreground">Quick and simple — paste or type your program as a scrollable text list.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* From Template */}
                <Card 
                  className="cursor-pointer overflow-hidden relative group hover:border-amber-500/50 transition-all duration-200 bg-card"
                  onClick={() => setSelectedMethod('template')}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <Copy className="h-6 w-6 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-base font-semibold mb-1">From Template</h2>
                        <p className="text-sm text-muted-foreground">Start from one of your saved templates or community-shared program blueprints.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* IMPORT AN EXISTING PROGRAM Section */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Import an Existing Program</h3>
              
              {/* Unified Upload Zone */}
              <Card 
                className="cursor-pointer overflow-hidden relative group hover:border-primary/50 transition-all duration-200 bg-card border-dashed border-2"
                onClick={() => setSelectedMethod('upload')}
              >
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-muted mb-4">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-lg font-semibold mb-2">Upload or Import a File</h2>
                  <p className="text-sm text-muted-foreground mb-4">Drag & drop your training document or spreadsheet, or click to browse</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground border">PDF</span>
                    <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground border">DOCX</span>
                    <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground border">XLSX</span>
                    <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground border">CSV</span>
                    <span 
                      className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground border cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                      onClick={(e) => { e.stopPropagation(); setIsImportDrawerOpen(true); }}
                    >
                      Google Sheets
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* CSV Template Download Banner */}
              <Card className="mt-4 bg-muted/30 border">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <FileUp className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Need a starting format?</h3>
                      <p className="text-xs text-muted-foreground">Download our CSV template with pre-built columns for dates, event groups, sessions, and exercises — fill it in and re-upload.</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="shrink-0 border-green-500/50 text-green-500 hover:bg-green-500/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Download CSV template
                      const csvContent = `TrackLit Training Program Template,,,,,,
Instructions: Fill in each row with one day's training. Use separate rows for each event group if workouts differ.,,,,,,
Delete these instruction rows and example data before uploading.,,,,,,
,,,,,,
Date,Session Type,Event Group,Exercise / Workout,Sets x Reps / Distance,Intensity (%),Rest / Notes
3/3/2025,Sprint,100m,Sprintprep 1 (warmup + accelerations),See notes,,Jump rope / med ball tosses / rollups / multibounds / progressive sprints 20-80m
3/3/2025,Supplementary,Elite,Core / upper body circuit,,,
3/4/2025,Tempo,100m,Tempo Runs,5 x 200m,65-70%,4 min rest between reps
3/5/2025,Gym,100m,Deep Squats,5 x 8,,Progressive loading
3/5/2025,Gym,100m,Deadlift,5 x 6,,
3/5/2025,Gym,100m,Backstep Lunges,4 x 8 (4 per leg),,
3/5/2025,Gym,100m,Calf Raises,4 x 12,,Weight optional
3/5/2025,Gym,100m,Back Extension,4 x 25,,
3/5/2025,Gym,100m,Conc. Hamstring Curl,4 x 8,,
3/6/2025,Recovery,100m,Core,,,
3/6/2025,Supplementary,Elite,Core / upper body circuit,,,
3/7/2025,Speed,100m,Phosphate System,2 x 3 x 60m,90-92%,Walk back rest / 4 min between sets
3/8/2025,Gym,100m,Gym Session 0.5,,,See gym reference sheet
3/9/2025,Rest,100m,Rest Day,,,
3/10/2025,Speed,100m,F4s Sprint Sets,1x4x60 + 1x5x60 + 1x3x60m,90%,Walk rest / 2 min alt / 4 min between sets
3/10/2025,Supplementary,Elite,Core / upper body circuit,,,
,,,,,,
=== WEEK 2 (Microdose Week) ===,,,,,,
3/11/2025,Gym (Micro),100m,Box Jumps,3 x 4,,
3/11/2025,Gym (Micro),100m,Deep Squats,4 x 4,,
3/11/2025,Gym (Micro),100m,Lunges,3 x 3 per leg,,
3/11/2025,Gym (Micro),100m,ISO Mid-thigh Pull,3 x 3 (4s hold),,
3/11/2025,Gym (Micro),100m,Eccentric Hamstring,3 x 4,,
3/11/2025,Gym (Micro),100m,Ankle Hops,4 x 6,,
3/12/2025,Gym (Micro),100m,Box Jumps Frog,2 x 3,,Reduced volume
3/12/2025,Gym (Micro),100m,Deep Squats,3 x 3,,
3/12/2025,Gym (Micro),100m,Lunges,2 x 3 per leg,,
3/12/2025,Gym (Micro),100m,Eccentric Hamstring,2 x 4,,
3/13/2025,Recovery,100m,Core,,,
,,,,,,
=== REFERENCE: SESSION TYPES ===,,,,,,
Sprint - Sprint prep / acceleration / block work,,,,,,
Tempo - Sub-maximal aerobic capacity runs (60-80%),,,,,,
Speed - Maximal or near-maximal sprint work (90-100%),,,,,,
Gym - Strength / weightroom sessions,,,,,,
Gym (Micro) - Microdose / reduced-volume strength,,,,,,
Recovery - Core / mobility / active recovery,,,,,,
Supplementary - Extra sessions (elite athletes),,,,,,
Rest - Full rest day,,,,,,
Competition - Meet / race day,,,,,,
,,,,,,
=== REFERENCE: EVENT GROUPS ===,,,,,,
100m | 200m | 400m | Hurdles | All | Elite,,,,,,
,,,,,,
=== REFERENCE: INTENSITY GUIDE ===,,,,,,
80% - Easy / warmup pace,,,,,,
85% - Moderate / controlled,,,,,,
90% - Fast / quality reps,,,,,,
92% - High quality,,,,,,
92-95% - Near max,,,,,,
95-100% - Max effort / competition,,,,,,`;
                      
                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'TrackLit_Program_Template.csv';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <Button 
              variant="outline" 
              className="mb-6"
              onClick={() => setSelectedMethod(null)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Choose Different Method
            </Button>

            {selectedMethod === 'builder' && (
              <Card className="border-2">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-primary" />
                    Build Custom Program
                  </CardTitle>
                  <CardDescription>
                    Create a structured training program with custom sessions and exercises
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleFormSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Program Title *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => updateFormData("title", e.target.value)}
                          placeholder="Enter program title..."
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => updateFormData("description", e.target.value)}
                          placeholder="Describe your training program..."
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="duration">Duration (weeks)</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="1"
                          max="52"
                          value={formData.duration}
                          onChange={(e) => updateFormData("duration", parseInt(e.target.value) || 1)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="visibility">Visibility</Label>
                        <Select
                          value={formData.visibility}
                          onValueChange={(value) => updateFormData("visibility", value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public (Free)</SelectItem>
                            <SelectItem value="premium">Premium (Paid)</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {formData.visibility === 'premium' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                        <div>
                          <Label htmlFor="priceType">Price Type</Label>
                          <Select
                            value={formData.priceType}
                            onValueChange={(value) => updateFormData("priceType", value as any)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="spikes">Spikes</SelectItem>
                              <SelectItem value="money">Money (USD)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="price">
                            Price ({formData.priceType === 'money' ? '$' : 'Spikes'})
                          </Label>
                          <Input
                            id="price"
                            type="number"
                            min="0"
                            step={formData.priceType === 'money' ? "0.01" : "1"}
                            value={formData.price}
                            onChange={(e) => updateFormData("price", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={createProgramMutation.isPending}
                      data-testid="button-create-program"
                    >
                      {createProgramMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating Program...
                        </>
                      ) : (
                        <>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Create Program
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {selectedMethod === 'upload' && (
              <Card className="border-2">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center">
                    <FileUp className="h-5 w-5 mr-2 text-primary" />
                    Upload or Import Program
                  </CardTitle>
                  <CardDescription>
                    Import training documents in PDF, Word, Excel, or CSV format
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleFileUpload} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="upload-title">Program Title *</Label>
                        <Input
                          id="upload-title"
                          value={formData.title}
                          onChange={(e) => updateFormData("title", e.target.value)}
                          placeholder="Enter program title..."
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="upload-description">Description</Label>
                        <Textarea
                          id="upload-description"
                          value={formData.description}
                          onChange={(e) => updateFormData("description", e.target.value)}
                          placeholder="Describe your training program..."
                          rows={3}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="file-upload">Program File *</Label>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        required
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Supported formats: PDF, DOC, DOCX, XLS, XLSX, CSV (Max 15MB)
                      </p>
                      <Button
                        type="button"
                        variant="link"
                        className="text-primary p-0 h-auto mt-1"
                        onClick={() => setIsImportDrawerOpen(true)}
                      >
                        Or import from Google Sheets
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="upload-visibility">Visibility</Label>
                        <Select
                          value={formData.visibility}
                          onValueChange={(value) => updateFormData("visibility", value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public (Free)</SelectItem>
                            <SelectItem value="premium">Premium (Paid)</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {formData.visibility === 'premium' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                        <div>
                          <Label htmlFor="upload-priceType">Price Type</Label>
                          <Select
                            value={formData.priceType}
                            onValueChange={(value) => updateFormData("priceType", value as any)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="spikes">Spikes</SelectItem>
                              <SelectItem value="money">Money (USD)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="upload-price">
                            Price ({formData.priceType === 'money' ? '$' : 'Spikes'})
                          </Label>
                          <Input
                            id="upload-price"
                            type="number"
                            min="0"
                            step={formData.priceType === 'money' ? "0.01" : "1"}
                            value={formData.price}
                            onChange={(e) => updateFormData("price", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Add to Subscription Option */}
                    <div className="flex items-center space-x-2 p-4 border rounded-lg bg-blue-50/50">
                      <Checkbox
                        id="add-to-subscription"
                        checked={formData.addToSubscription}
                        onCheckedChange={(checked) => updateFormData("addToSubscription", checked as boolean)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor="add-to-subscription"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                        >
                          <Crown className="h-4 w-4 mr-2 text-yellow-500" />
                          Add to my subscription offering
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Include this program automatically in your coaching subscription for subscribers
                        </p>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={uploadProgramMutation.isPending}
                      data-testid="button-upload-program"
                    >
                      {uploadProgramMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading Program...
                        </>
                      ) : (
                        <>
                          <FileUp className="h-4 w-4 mr-2" />
                          Upload Program
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}


            {selectedMethod === 'text' && (
              <Card className="border-2">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-primary" />
                    Text Based Program
                  </CardTitle>
                  <CardDescription>
                    Create a simple text-based program that displays as a scrollable list in practice view
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="text-title">Program Title *</Label>
                        <Input
                          id="text-title"
                          placeholder="Enter program title"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          required
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="text-description">Description</Label>
                        <Textarea
                          id="text-description"
                          placeholder="Brief description of your program"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          className="mt-1"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="text-content">Program Content *</Label>
                        <Textarea
                          id="text-content"
                          placeholder="Enter your complete training program here. Users will see this as a scrollable list in practice view. Include dates, exercises, instructions, and any other details you want to share."
                          value={formData.textContent}
                          onChange={(e) => setFormData(prev => ({ ...prev, textContent: e.target.value }))}
                          required
                          className="mt-1 min-h-[300px] font-mono text-sm"
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                          This text will be displayed exactly as you type it. Use line breaks and formatting to organize your content.
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="text-visibility">Visibility</Label>
                        <Select 
                          value={formData.visibility} 
                          onValueChange={(value: 'public' | 'premium' | 'private') => 
                            setFormData(prev => ({ ...prev, visibility: value }))
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={createProgramMutation.isPending || !formData.title || !formData.textContent}
                      data-testid="button-create-text-program"
                    >
                      {createProgramMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating Program...
                        </>
                      ) : (
                        <>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Create Text Program
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {selectedMethod === 'sprinthia' && (
              <div className="space-y-6">
                {!generatedProgram ? (
                  <Card className="border-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-amber-500/50">
                    <CardHeader className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 border-b border-amber-500/20">
                      <CardTitle className="flex items-center text-amber-100">
                        <Bot className="h-5 w-5 mr-2 text-amber-400" />
                        Build With Sprinthia AI
                      </CardTitle>
                      <CardDescription className="text-amber-200/80">
                        Create an AI-powered training program with custom parameters and intelligent recommendations. Once generated, you will be able to manually edit before saving.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-amber-100">Program Title *</Label>
                            <Input
                              placeholder="Enter program title"
                              value={formData.title}
                              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                              className="mt-1 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400"
                            />
                          </div>

                          <div>
                            <Label className="text-amber-100">Total Length (weeks)</Label>
                            <Select 
                              value={sprinthiaData.totalLengthWeeks.toString()} 
                              onValueChange={(value) => setSprinthiaData(prev => ({ ...prev, totalLengthWeeks: parseInt(value) }))}
                            >
                              <SelectTrigger className="mt-1 bg-slate-800/50 border-slate-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-600">
                                {Array.from({ length: 12 }, (_, i) => (
                                  <SelectItem key={i + 1} value={(i + 1).toString()} className="text-white hover:bg-slate-700">
                                    {i + 1} week{i !== 0 ? 's' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-amber-100">Number of Blocks</Label>
                            <Select 
                              value={sprinthiaData.blocks.toString()} 
                              onValueChange={(value) => setSprinthiaData(prev => ({ ...prev, blocks: parseInt(value) }))}
                            >
                              <SelectTrigger className="mt-1 bg-slate-800/50 border-slate-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-600">
                                {Array.from({ length: 6 }, (_, i) => (
                                  <SelectItem key={i + 1} value={(i + 1).toString()} className="text-white hover:bg-slate-700">
                                    {i + 1} block{i !== 0 ? 's' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-amber-100">Workouts Per Week</Label>
                            <Select 
                              value={sprinthiaData.workoutsPerWeek.toString()} 
                              onValueChange={(value) => setSprinthiaData(prev => ({ ...prev, workoutsPerWeek: parseInt(value) }))}
                            >
                              <SelectTrigger className="mt-1 bg-slate-800/50 border-slate-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-600">
                                {Array.from({ length: 7 }, (_, i) => (
                                  <SelectItem key={i + 1} value={(i + 1).toString()} className="text-white hover:bg-slate-700">
                                    {i + 1} workout{i !== 0 ? 's' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-amber-100">Gym Workouts Per Week</Label>
                            <Select 
                              value={sprinthiaData.gymWorkoutsPerWeek.toString()} 
                              onValueChange={(value) => setSprinthiaData(prev => ({ ...prev, gymWorkoutsPerWeek: parseInt(value) }))}
                            >
                              <SelectTrigger className="mt-1 bg-slate-800/50 border-slate-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-600">
                                {Array.from({ length: 6 }, (_, i) => (
                                  <SelectItem key={i} value={i.toString()} className="text-white hover:bg-slate-700">
                                    {i} workout{i !== 1 ? 's' : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-amber-100">Block Focus</Label>
                            <Select 
                              value={sprinthiaData.blockFocus} 
                              onValueChange={(value: SprinthiaFormData['blockFocus']) => setSprinthiaData(prev => ({ ...prev, blockFocus: value }))}
                            >
                              <SelectTrigger className="mt-1 bg-slate-800/50 border-slate-600 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-600">
                                <SelectItem value="speed" className="text-white hover:bg-slate-700">Speed</SelectItem>
                                <SelectItem value="speed-maintenance" className="text-white hover:bg-slate-700">Speed Maintenance</SelectItem>
                                <SelectItem value="speed-endurance" className="text-white hover:bg-slate-700">Speed Endurance</SelectItem>
                                <SelectItem value="mixed" className="text-white hover:bg-slate-700">Mixed</SelectItem>
                                <SelectItem value="short-to-long" className="text-white hover:bg-slate-700">Short to Long</SelectItem>
                                <SelectItem value="long-to-short" className="text-white hover:bg-slate-700">Long to Short</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label className="text-amber-100">Description & AI Prompt</Label>
                          <Textarea
                            placeholder="Describe your program goals and any specific requirements for the AI. Be as detailed as possible to get better results."
                            value={sprinthiaData.aiPrompt}
                            onChange={(e) => setSprinthiaData(prev => ({ ...prev, aiPrompt: e.target.value }))}
                            className="mt-1 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400 min-h-[120px]"
                          />
                          <p className="text-sm text-amber-200/70 mt-2">
                            Example: "Create a program for a high school sprinter focusing on 100m and 200m events. Include warm-up routines, sprint drills, and recovery sessions."
                          </p>
                        </div>

                        <div className="flex flex-col gap-3">
                          {(!formData.title || !sprinthiaData.aiPrompt) && !isGeneratingProgram && (
                            <div className="bg-amber-900/30 border border-amber-600/50 rounded-md p-3 text-center">
                              <p className="text-amber-200/90 text-sm font-medium">
                                Please fill in the {!formData.title && !sprinthiaData.aiPrompt ? 'Program Title and AI Prompt' : !formData.title ? 'Program Title' : 'AI Prompt'} to generate
                              </p>
                            </div>
                          )}
                          
                          <Button 
                            onClick={generateSprinthiaProgram}
                            disabled={isGeneratingProgram || !formData.title || !sprinthiaData.aiPrompt}
                            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            data-testid="button-generate-sprinthia-program"
                          >
                            {isGeneratingProgram ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating Program...
                              </>
                            ) : (
                              <>
                                <Zap className="h-4 w-4 mr-2" />
                                Generate Training Program
                              </>
                            )}
                          </Button>
                          
                          {user && (
                            <div className="text-center text-sm text-amber-200/70">
                              {user.subscriptionTier === 'pro' && `${3 - (user.sprinthiaProgramsCreated || 0)} program creations remaining`}
                              {user.subscriptionTier === 'star' && `${12 - (user.sprinthiaProgramsCreated || 0)} program creations remaining`}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-amber-500/50">
                    <CardHeader className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-b border-green-500/20">
                      <CardTitle className="flex items-center text-green-100">
                        <CheckCircle2 className="h-5 w-5 mr-2 text-green-400" />
                        Program Generated Successfully
                      </CardTitle>
                      <CardDescription className="text-green-200/80">
                        Your AI-powered training program is ready! Review the content and choose your next action.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                          <pre className="text-sm text-white whitespace-pre-wrap font-mono">{generatedProgram}</pre>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Button 
                            onClick={continueToEdit}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                            data-testid="button-continue-to-edit"
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Continue to Edit and Save
                          </Button>
                          
                          <Button 
                            onClick={regenerateProgram}
                            disabled={isRegenerating}
                            variant="outline"
                            className="border-amber-500 text-amber-400 hover:bg-amber-500/10"
                            data-testid="button-regenerate-program"
                          >
                            {isRegenerating ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Regenerating...
                              </>
                            ) : (
                              <>
                                <Zap className="h-4 w-4 mr-2" />
                                Rewrite
                              </>
                            )}
                          </Button>
                        </div>
                        
                        {user && (
                          <div className="text-center text-sm text-amber-200/70">
                            {user.subscriptionTier === 'pro' && `${3 - (user.sprinthiaRegenerationsUsed || 0)} regenerations remaining`}
                            {user.subscriptionTier === 'star' && `${12 - (user.sprinthiaRegenerationsUsed || 0)} regenerations remaining`}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {selectedMethod === 'template' && (
              <Card className="border-2 border-emerald-500/30">
                <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10">
                  <CardTitle className="flex items-center">
                    <Copy className="h-5 w-5 mr-2 text-emerald-500" />
                    Create from Template
                  </CardTitle>
                  <CardDescription>
                    Choose one of your saved templates to quickly create a new program
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {templatesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="text-center py-8">
                      <Copy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Templates Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        You haven't saved any program templates yet. Create a program first, then save it as a template from the Program Editor.
                      </p>
                      <Button variant="outline" onClick={() => setSelectedMethod('builder')}>
                        Create a Program
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <Label>Select Template</Label>
                        <Select
                          value={selectedTemplateId?.toString() || ''}
                          onValueChange={(value) => {
                            const template = templates.find((t: any) => t.id === parseInt(value));
                            setSelectedTemplateId(parseInt(value));
                            if (template) {
                              setTemplateProgramTitle(template.title.replace(' (Template)', ''));
                            }
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Choose a template..." />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((template: any) => (
                              <SelectItem key={template.id} value={template.id.toString()}>
                                {template.title} ({template.duration} days)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedTemplateId && (
                        <>
                          <div>
                            <Label>Program Title</Label>
                            <Input
                              value={templateProgramTitle}
                              onChange={(e) => setTemplateProgramTitle(e.target.value)}
                              placeholder="Enter program title"
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label>Start Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full mt-1 justify-start text-left font-normal"
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {templateStartDate ? format(templateStartDate, "PPP") : "Pick a date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <CalendarComponent
                                  mode="single"
                                  selected={templateStartDate}
                                  onSelect={setTemplateStartDate}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          <Button 
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                            disabled={!templateProgramTitle.trim() || isCreatingFromTemplate}
                            onClick={async () => {
                              setIsCreatingFromTemplate(true);
                              try {
                                const response = await fetch(`/api/programs/create-from-template/${selectedTemplateId}`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  credentials: 'include',
                                  body: JSON.stringify({
                                    title: templateProgramTitle,
                                    startDate: templateStartDate?.toISOString(),
                                  })
                                });
                                
                                if (response.ok) {
                                  const data = await response.json();
                                  toast({
                                    title: "Program Created",
                                    description: `"${templateProgramTitle}" has been created from template with ${data.copiedSessions} session(s).`,
                                  });
                                  queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
                                  setLocation(`/programs/${data.program.id}/edit`);
                                } else {
                                  const error = await response.json();
                                  throw new Error(error.error || 'Failed to create program');
                                }
                              } catch (error: any) {
                                toast({
                                  title: "Error",
                                  description: error.message || "Failed to create program from template",
                                  variant: "destructive",
                                });
                              } finally {
                                setIsCreatingFromTemplate(false);
                              }
                            }}
                          >
                            {isCreatingFromTemplate ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-2" />
                                Create Program from Template
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Google Sheet Import Drawer */}
      <GoogleSheetImportDialog
        open={isImportDrawerOpen}
        onOpenChange={setIsImportDrawerOpen}
        onSuccess={(programId) => {
          setIsImportDrawerOpen(false);
          toast({
            title: "Success",
            description: "Program imported successfully!",
          });
          setLocation(`/programs/${programId}`);
        }}
      />

      {/* Usage Limit Modal */}
      <AlertDialog open={showUsageLimitModal} onOpenChange={setShowUsageLimitModal}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-100">
              Subscription Required
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              {usageLimitType === 'creation' ? (
                user?.subscriptionTier === 'free' ? (
                  <>
                    Sprinthia AI program generation is available for Pro and Star subscribers only.
                    <br /><br />
                    <strong>Upgrade to unlock:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li><strong>Pro:</strong> 3 AI program creations per month + 3 regenerations</li>
                      <li><strong>Star:</strong> 12 AI program creations per month + 12 regenerations</li>
                    </ul>
                  </>
                ) : (
                  <>
                    You've reached your monthly limit of {user?.subscriptionTier === 'pro' ? '3' : '12'} AI program creations.
                    <br /><br />
                    Your limit will reset at the beginning of next month.
                    {user?.subscriptionTier === 'pro' && ' Or upgrade to Star for 12 creations per month!'}
                  </>
                )
              ) : (
                user?.subscriptionTier === 'free' ? (
                  <>
                    Program regeneration is available for Pro and Star subscribers only.
                    <br /><br />
                    Upgrade to unlock unlimited improvements to your AI-generated programs.
                  </>
                ) : (
                  <>
                    You've reached your monthly limit of {user?.subscriptionTier === 'pro' ? '3' : '12'} regenerations.
                    <br /><br />
                    Your limit will reset at the beginning of next month.
                  </>
                )
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-600 text-slate-100 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setShowUsageLimitModal(false);
                setLocation('/profile');
              }}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900"
            >
              View Subscription Plans
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function Component() {
  return <ProtectedRoute path="/programs/create" component={ProgramCreatePage} />;
}

export default ProgramCreatePage;