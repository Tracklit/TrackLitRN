import { useEffect, useState, useRef, ChangeEvent } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, Calendar, CalendarDays, Copy, Clock, Edit, 
  Info, Loader2, Plus, Save, Trash2, AlertCircle, Check, ChevronDown, ChevronUp,
  FileText, ExternalLink, Download, Upload, FileUp
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, addDays, parse, addWeeks, startOfWeek, getDay, isValid, parseISO } from "date-fns";
import DocumentUploadDialog from "@/components/document-upload-dialog";
import ProgramDocumentViewer from "@/components/program-document-viewer";

// Program editor form schema
const programEditorSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  category: z.string().optional(),
  level: z.string().optional(),
  startDate: z.string().min(1, { message: "Start date is required" }),
  duration: z.number().min(1, { message: "Duration must be at least 1 day" }),
});

// Session schema - each cell in the spreadsheet is a session
const sessionSchema = z.object({
  id: z.number().optional(),
  programId: z.number().optional(),
  dayNumber: z.number(),
  weekNumber: z.number(),
  content: z.string().optional(),
  isRestDay: z.boolean().default(false),
  date: z.string().optional(),
  orderInDay: z.number().default(1),
  workoutId: z.number().optional(),
  title: z.string().default("Training Session"),
  description: z.string().default(""),
  shortDistanceWorkout: z.string().optional(),
  mediumDistanceWorkout: z.string().optional(),
  longDistanceWorkout: z.string().optional(),
  preActivation1: z.string().optional(),
  preActivation2: z.string().optional(),
  extraSession: z.string().optional(),
  notes: z.string().optional(),
  isCompleted: z.boolean().default(false),
  completedAt: z.string().optional(),
});

type Session = z.infer<typeof sessionSchema>;

// Type for a week of workout data
interface WeekData {
  weekNumber: number;
  startDate: Date;
  days: Session[];
}

function EditableCell({ 
  content, 
  isRestDay, 
  onSave,
  isWeekend = false,
  date
}: { 
  content: string; 
  isRestDay: boolean; 
  onSave: (value: string, isRest: boolean) => void;
  isWeekend?: boolean;
  date?: string;
}) {
  // Initialize component state
  const [isEditing, setIsEditing] = useState(false);
  // Very important: Initialize with content or empty string
  const [value, setValue] = useState(content || "");
  const [isRest, setIsRest] = useState(isRestDay);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Keep value in sync with external content
  useEffect(() => {
    console.log("Content prop changed:", content);
    if (content) {
      setValue(content);
    }
  }, [content]);
  
  // Keep rest state in sync with external isRestDay
  useEffect(() => {
    setIsRest(isRestDay);
  }, [isRestDay]);

  // Auto-focus text area when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onSave(value, isRest);
    setIsEditing(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "MMM d");
    } catch (e) {
      return "";
    }
  };

  return (
    <TableCell 
      className={`border p-0 relative min-h-[80px] ${(value || content) ? 'bg-gray-950' : 'bg-gray-700'}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isEditing) setIsEditing(true);
      }}
    >
      {isEditing ? (
        <div className="p-2 h-full">
          {/* Removed Rest Day toggle as requested */}
          <Textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter workout details..."
            className="min-h-[64px] font-sans text-sm p-2 border-0 focus:ring-0"
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 px-3" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              className="h-7 px-3" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSave();
              }}
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-2 min-h-[80px] h-full flex flex-col">
          {/* Removed Rest Day badge as requested */}
          <div className="mt-1 flex-1 font-sans text-sm whitespace-pre-wrap">
            {value || content ? (
              <span>{value || content}</span>
            ) : (
              <div className="flex items-center justify-center h-full">
                {/* Empty cell - no text */}
              </div>
            )}
          </div>
          <div className="flex justify-end opacity-0 hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}>
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </TableCell>
  );
}

function ProgramEditorPage() {
  const params = useParams<{ id: string }>();
  const programId = parseInt(params.id);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [isAddingWeek, setIsAddingWeek] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Text-based program state
  const [textContent, setTextContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Zoom and pan state for pinch-to-zoom functionality
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Program details form
  const form = useForm<z.infer<typeof programEditorSchema>>({
    resolver: zodResolver(programEditorSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      level: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
      duration: 7,
    },
  });

  // Fetch program data with cache busting for program 22
  const { data: program = {}, isLoading: programLoading } = useQuery<any>({
    queryKey: ['/api/programs', programId],
    queryFn: async () => {
      const response = await fetch(`/api/programs/${programId}?t=${Date.now()}`);
      if (!response.ok) throw new Error('Failed to fetch program');
      const data = await response.json();
      console.log("Raw program data:", data);
      return data;
    },
    enabled: !isNaN(programId),
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache
  });

  // Fetch program sessions with direct access to the API and simpler data handling
  const { data: sessions = [], isLoading: sessionsLoading, refetch: refetchSessions } = useQuery<Session[]>({
    queryKey: ['/api/programs', programId, 'sessions'],
    queryFn: async () => {
      if (!programId) return [];
      
      // Direct fetch of the program with sessions
      try {
        const response = await fetch(`/api/programs/${programId}`);
        if (!response.ok) throw new Error('Failed to fetch program sessions');
        
        const data = await response.json();
        // Add more detailed logging to see exactly what data we're getting
        console.log(`Fetched program ${programId} with:`, {
          title: data.title,
          description: data.description,
          sessionCount: data.sessions?.length || 0
        });
        
        // Extra check to make data visible in console
        if (data.sessions && data.sessions.length > 0) {
          console.log("First session data:", data.sessions[0]);
        }
        
        if (data.sessions && Array.isArray(data.sessions)) {
          // Immediately save the program details to the form
          form.reset({
            title: data.title || "",
            description: data.description || "",
            category: data.category || "",
            level: data.level || "",
            startDate: data.startDate ? format(new Date(data.startDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
            duration: data.duration || 7,
          });
          
          return data.sessions;
        }
        return [];
      } catch (err) {
        console.error("Error fetching sessions:", err);
        return [];
      }
    },
    enabled: !isNaN(programId),
    refetchOnWindowFocus: false, // Disable automatic refetching
    staleTime: 0, // Always fetch fresh data
  });

  // Delete document mutation
  const deleteDocument = useMutation({
    mutationFn: async () => {
      // Make a PUT request to update the program and remove the document
      const response = await apiRequest('PUT', `/api/programs/${programId}`, {
        programFileUrl: null,
        programFileType: null,
        isUploadedProgram: false
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
      
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Document deleted",
        description: "The document has been removed from this program.",
      });
      
      // Refresh program data
      queryClient.invalidateQueries({ queryKey: ['/api/programs', programId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting document",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle document deletion
  const handleDeleteDocument = () => {
    deleteDocument.mutate();
  };
  
  // Upload document mutation
  const uploadDocument = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      // Make a POST request to upload the document
      const response = await fetch(`/api/programs/${programId}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload document');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document uploaded",
        description: "Your document has been successfully uploaded to the program.",
      });
      
      // Close the upload dialog
      setUploadDialogOpen(false);
      
      // Reset the selected file
      setSelectedFile(null);
      
      // Reset upload state
      setIsUploading(false);
      
      // Refresh program data
      queryClient.invalidateQueries({ queryKey: ['/api/programs', programId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error uploading document",
        description: error.message,
        variant: "destructive",
      });
      
      // Reset upload state
      setIsUploading(false);
    }
  });
  
  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };
  
  // Handle document upload
  const handleUploadDocument = () => {
    if (selectedFile) {
      setIsUploading(true);
      uploadDocument.mutate(selectedFile);
    } else {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to upload.",
        variant: "destructive",
      });
    }
  };
  
  // Update program mutation
  const updateProgram = useMutation({
    mutationFn: async (data: z.infer<typeof programEditorSchema>) => {
      console.log("Making PUT request to /api/programs/" + programId, data);
      const response = await apiRequest('PUT', `/api/programs/${programId}`, data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Program updated",
        description: "Your program has been successfully updated.",
      });
      
      // Get latest program data by forcing a refresh
      queryClient.invalidateQueries({ queryKey: ['/api/programs', programId] });
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating program",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Add/update session mutation
  const updateSession = useMutation({
    mutationFn: async (data: Partial<Session>) => {
      // Create a complete copy of the data to ensure it's properly sent
      const completeData = {
        programId,
        weekNumber: data.weekNumber,
        dayNumber: data.dayNumber,
        content: data.content || "",
        shortDistanceWorkout: data.content || "", // Ensure this field is always set
        description: data.content || "",          // Ensure this field is always set
        title: data.content?.split('\n')[0] || "Training Session",
        isRestDay: data.isRestDay || false,
        date: data.date || format(new Date(), "yyyy-MM-dd"),
      };
      
      console.log("Sending session data:", completeData);
      
      if (data.id) {
        return apiRequest('PUT', `/api/programs/${programId}/sessions/${data.id}`, completeData);
      } else {
        return apiRequest('POST', `/api/programs/${programId}/sessions`, completeData);
      }
    },
    onSuccess: (response) => {
      console.log("Session update response:", response);
      
      toast({
        title: "Session updated",
        description: "Your session has been successfully updated.",
      });
      
      // Force reload all related data to ensure UI is updated
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/programs', programId] });
      queryClient.invalidateQueries({ queryKey: ['/api/programs', programId, 'sessions'] });
      
      // Force an immediate refetch to update the UI
      setTimeout(() => {
        refetchSessions();
      }, 100);
    },
    onError: (error: Error) => {
      console.error("Error updating session:", error);
      toast({
        title: "Error updating session",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete session mutation
  const deleteSession = useMutation({
    mutationFn: async (sessionId: number) => {
      return apiRequest('DELETE', `/api/programs/${programId}/sessions/${sessionId}`);
    },
    onSuccess: () => {
      toast({
        title: "Session deleted",
        description: "Your session has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/programs', programId, 'sessions'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting session",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Initialize form when program data is loaded
  useEffect(() => {
    if (program) {
      form.reset({
        title: program.title || "",
        description: program.description || "",
        category: program.category || "",
        level: program.level || "",
        startDate: program.startDate ? format(new Date(program.startDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        duration: program.duration || 7,
      });
    }
  }, [program, form]);

  // Reset zoom states since zoom functionality is removed
  useEffect(() => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  }, []);

  // Check if the program has an uploaded document
  const hasUploadedDocument = program && 
    (program.isUploadedProgram === true || (program.programFileUrl && program.programFileUrl.length > 0));
  
  // Use the actual document URL from the program data
  const pdfViewerUrl = "https://docs.google.com/viewer?embedded=true&url=";
  
  // Get the actual file URL that has been uploaded
  const actualProgramFileUrl = program?.programFileUrl || "";
  
  // Determine if we should show document view or weekly schedule
  const isUploadedDocumentProgram = hasUploadedDocument;
  
  // For embedding in iframe, use Google Docs viewer to ensure compatibility
  const documentUrl = `${pdfViewerUrl}${encodeURIComponent(actualProgramFileUrl)}`;
  
  // For direct download/open links, use the raw URL
  const rawDocumentUrl = actualProgramFileUrl;
  const documentType = program?.programFileType || "application/pdf";

  // Organize sessions into weeks when data is loaded
  useEffect(() => {
    if (program && !isUploadedDocumentProgram) {
      // Use program start date or today if not available
      const baseDate = program.startDate ? new Date(program.startDate) : new Date();
      
      if (sessions && sessions.length > 0) {
        const weeklyData: { [key: number]: Session[] } = {};
        
        // Group sessions by week number
        sessions.forEach((session: Session) => {
          const weekNum = session.weekNumber || 0;
          if (!weeklyData[weekNum]) {
            weeklyData[weekNum] = [];
          }
          weeklyData[weekNum].push(session);
        });
        
        // Convert grouped data to weeks array
        const weeksArray: WeekData[] = Object.keys(weeklyData).map((weekNum) => {
          const weekNumber = parseInt(weekNum);
          // Use the proper week start calculation that aligns to Sunday
          const weekStartDate = getWeekStartDate(baseDate, weekNumber);
          
          return {
            weekNumber,
            startDate: weekStartDate,
            days: weeklyData[weekNumber],
          };
        });
        
        // Sort weeks by number
        weeksArray.sort((a, b) => a.weekNumber - b.weekNumber);
        setWeeks(weeksArray);
      } else {
        // Create weeks based on program duration (convert days to weeks, minimum 1 week)
        const programWeeks = Math.max(1, Math.ceil((program.duration || 7) / 7));
        const newWeeks: WeekData[] = [];
        for (let i = 0; i < programWeeks; i++) {
          newWeeks.push({
            weekNumber: i,
            startDate: getWeekStartDate(baseDate, i),
            days: [],
          });
        }
        setWeeks(newWeeks);
      }
    }
  }, [sessions, program]);

  // Handle adding a new week
  const handleAddWeek = () => {
    setIsAddingWeek(true);
    
    if (weeks.length > 0) {
      const lastWeek = weeks[weeks.length - 1];
      const newWeekNumber = lastWeek.weekNumber + 1;
      const baseDate = form.getValues("startDate") 
        ? new Date(form.getValues("startDate")) 
        : new Date();
      const newStartDate = getWeekStartDate(baseDate, newWeekNumber);
      
      const newWeeks = [...weeks, {
        weekNumber: newWeekNumber,
        startDate: newStartDate,
        days: [],
      }];
      
      setWeeks(newWeeks);
    } else {
      // If no weeks exist yet, create the first week
      const baseDate = form.getValues("startDate") 
        ? new Date(form.getValues("startDate")) 
        : new Date();
        
      setWeeks([{
        weekNumber: 0,
        startDate: getWeekStartDate(baseDate, 0),
        days: [],
      }]);
    }
    
    setIsAddingWeek(false);
  };

  // Handle adding 5 more weeks at once
  const handleAddFiveWeeks = () => {
    if (weeks.length > 0) {
      const lastWeek = weeks[weeks.length - 1];
      const newWeeks = [...weeks];
      const baseDate = form.getValues("startDate") 
        ? new Date(form.getValues("startDate")) 
        : new Date();
      
      for (let i = 1; i <= 5; i++) {
        const newWeekNumber = lastWeek.weekNumber + i;
        const newStartDate = getWeekStartDate(baseDate, newWeekNumber);
        
        newWeeks.push({
          weekNumber: newWeekNumber,
          startDate: newStartDate,
          days: [],
        });
      }
      
      setWeeks(newWeeks);
    } else {
      handleAddWeek();
    }
  };

  // Handle deleting a week
  const handleDeleteWeek = (weekNumber: number) => {
    // Find any sessions in this week
    const weekSessions = sessions.filter((s: Session) => s.weekNumber === weekNumber);
    
    // If there are sessions, confirm deletion
    if (weekSessions.length > 0) {
      if (!confirm(`This will delete ${weekSessions.length} session(s) in Week ${weekNumber + 1}. Continue?`)) {
        return;
      }
      
      // Delete all sessions in this week
      weekSessions.forEach((session: Session) => {
        if (session.id) {
          deleteSession.mutate(session.id);
        }
      });
    }
    
    // Remove the week from the UI
    setWeeks(weeks.filter(w => w.weekNumber !== weekNumber));
    
    toast({
      title: "Week deleted",
      description: `Week ${weekNumber + 1} has been removed from the program.`,
    });
  };

  // Create a local state to store session content
  const [localSessionContent, setLocalSessionContent] = useState<{
    [key: string]: {
      content: string,
      isRestDay: boolean
    }
  }>({});
  
  // Maintain a local cache of session content
  const [savedSessions, setSavedSessions] = useState<Record<string, string>>({});
  
  // Initialize text content when program data loads
  useEffect(() => {
    console.log("Content prop changed:", program.textContent);
    if (program.textContent !== undefined && program.textContent !== null) {
      setTextContent(program.textContent);
    } else if (program.isTextBased && program.textContent === null) {
      // For text-based programs with null content, start with empty string
      setTextContent('');
    }
  }, [program.textContent, program.isTextBased]);
  
  // Text-based program save handler
  const handleSaveTextContent = async () => {
    setIsSaving(true);
    try {
      const response = await apiRequest('PUT', `/api/programs/${programId}`, {
        textContent: textContent
      });
      
      if (response.ok) {
        toast({
          title: "Program updated",
          description: "Your text content has been saved successfully.",
        });
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/programs', programId] });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save text content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Session content update handler with persistent local storage
  const handleCellUpdate = (weekNumber: number, dayNumber: number, content: string, isRestDay: boolean) => {
    const date = getDateForWeekDay(weekNumber, dayNumber);
    const cellKey = `${weekNumber}-${dayNumber}`;
    
    // First, update our local cache
    setSavedSessions(prev => ({
      ...prev,
      [cellKey]: content
    }));
    
    // Store in localStorage for persistence between page navigations
    try {
      const storageKey = `program_${programId}_session_${cellKey}`;
      localStorage.setItem(storageKey, content);
    } catch (e) {
      console.error("Could not save to localStorage:", e);
    }
    
    // Check if session exists already
    const existingSession = sessions.find((s: Session) => 
      Number(s.weekNumber) === Number(weekNumber) && Number(s.dayNumber) === Number(dayNumber)
    );
    
    console.log("Saving session content:", { content, weekNumber, dayNumber });
    
    // Prepare complete session data to ensure all fields are properly set
    const sessionData = {
      programId,
      weekNumber,
      dayNumber,
      content,
      isRestDay,
      date: format(date, "yyyy-MM-dd"),
      title: content.split('\n')[0] || "Training Session",
      description: content,
      shortDistanceWorkout: content, // Critical for display
    };
    
    if (existingSession && existingSession.id) {
      console.log("Updating existing session:", existingSession.id);
      
      // Send a direct API request instead of using the mutation to ensure it's properly saved
      fetch(`/api/programs/${programId}/sessions/${existingSession.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...existingSession,
          ...sessionData
        })
      })
      .then(response => {
        if (response.ok) {
          toast({
            title: "Session updated",
            description: "Your workout has been saved successfully.",
          });
          // Force a complete data refresh
          refetchSessions();
        } else {
          toast({
            title: "Error saving session",
            description: "There was a problem saving your workout.",
            variant: "destructive"
          });
        }
      });
    } else {
      console.log("Creating new session");
      
      // Send a direct API request for session creation
      fetch(`/api/programs/${programId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Failed to create session");
        }
      })
      .then(data => {
        toast({
          title: "Session created",
          description: "Your workout has been saved successfully.",
        });
        // Force a complete data refresh
        refetchSessions();
      })
      .catch(error => {
        toast({
          title: "Error creating session",
          description: "There was a problem saving your workout.",
          variant: "destructive"
        });
      });
    }
  };

  // Helper to get the correct start of week (Sunday) for any given date
  const getWeekStartDate = (date: Date, weekOffset: number = 0) => {
    // Get the start of the week (Sunday) for the given date
    const startOfCurrentWeek = startOfWeek(date, { weekStartsOn: 0 }); // 0 = Sunday
    // Add the week offset
    return addWeeks(startOfCurrentWeek, weekOffset);
  };

  // Helper to get date for a specific week and day
  const getDateForWeekDay = (weekNumber: number, dayNumber: number) => {
    const week = weeks.find(w => w.weekNumber === weekNumber);
    if (!week) return new Date();
    
    return addDays(week.startDate, dayNumber);
  };

  // Form submission handler
  const onSubmit = (data: z.infer<typeof programEditorSchema>) => {
    updateProgram.mutate(data);
  };

  const isLoading = programLoading || sessionsLoading;
  const isSubmitting = updateProgram.isPending;

  // Load saved sessions from localStorage on component mount
  useEffect(() => {
    if (programId) {
      const savedSessionData: Record<string, string> = {};
      
      // Check for saved sessions in localStorage
      for (let week = 0; week < 12; week++) {
        for (let day = 0; day < 7; day++) {
          const cellKey = `${week}-${day}`;
          const storageKey = `program_${programId}_session_${cellKey}`;
          
          try {
            const savedContent = localStorage.getItem(storageKey);
            if (savedContent) {
              savedSessionData[cellKey] = savedContent;
            }
          } catch (e) {
            console.error("Error reading from localStorage:", e);
          }
        }
      }
      
      setSavedSessions(savedSessionData);
    }
  }, [programId]);
  
  // Enhanced function to get cell content for a specific week and day
  const getCellContent = (weekNumber: number, dayNumber: number) => {
    const cellKey = `${weekNumber}-${dayNumber}`;
    
    // First check localStorage/saved state
    if (savedSessions[cellKey]) {
      return {
        content: savedSessions[cellKey],
        isRestDay: false,
        date: format(getDateForWeekDay(weekNumber, dayNumber), "yyyy-MM-dd"),
        id: undefined,
      };
    }
    
    // Find all matching sessions for this week and day (there might be duplicates)
    const matchingSessions = sessions.filter((s: Session) => {
      return Number(s.weekNumber) === Number(weekNumber) && Number(s.dayNumber) === Number(dayNumber);
    });
    
    // If we have multiple matching sessions, use the most recent one (highest ID)
    const session = matchingSessions.length > 0 
      ? matchingSessions.reduce((latest, current) => {
          return (!latest.id || (current.id && current.id > latest.id)) ? current : latest;
        }, {} as Session)
      : null;
    
    // Extract content from the session object, trying all possible fields
    let displayContent = "";
    
    if (session) {
      // Look for content in all possible fields, prioritizing shortDistanceWorkout
      if (session.shortDistanceWorkout && session.shortDistanceWorkout.trim() !== "") {
        displayContent = session.shortDistanceWorkout;
      } else if (session.description && session.description.trim() !== "") {
        displayContent = session.description;
      } else if (session.content && session.content.trim() !== "") {
        displayContent = session.content;
      }
      
      // Also save this content to localStorage for persistence
      if (displayContent) {
        try {
          const storageKey = `program_${programId}_session_${cellKey}`;
          localStorage.setItem(storageKey, displayContent);
          
          // Update our local state as well
          setSavedSessions(prev => ({
            ...prev,
            [cellKey]: displayContent
          }));
        } catch (e) {
          console.error("Could not save to localStorage:", e);
        }
      }
    }
    
    // Build the cell data object with all necessary information
    return {
      content: displayContent,
      isRestDay: session?.isRestDay || false,
      date: session?.date || format(getDateForWeekDay(weekNumber, dayNumber), "yyyy-MM-dd"),
      id: session?.id,
    };
  };

  // Function to determine if a day is a weekend
  const isWeekendDay = (dayNumber: number) => {
    return dayNumber === 0 || dayNumber === 6; // Sunday or Saturday
  };

  // Special handling for text-based programs
  if (program.isTextBased) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/programs")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{program.title}</h1>
              <p className="text-muted-foreground">Text-based program</p>
            </div>
          </div>
          
          <Button
            onClick={handleSaveTextContent}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <Textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Enter your program content here..."
              className="min-h-[600px] font-mono text-sm resize-none border-0 focus:ring-0 p-0"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Special handling for uploaded document programs
  if (isUploadedDocumentProgram) {
    const fileType = program.programFileType || '';
    const fileName = program.programFileUrl?.split('/').pop() || "Program Document";
    
    return (
      <div className="container max-w-full p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/programs")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Document Program Editor</h1>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/programs/${programId}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="program-editor-form"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Program Details Card */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Program Details</CardTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={(e) => {
                e.stopPropagation();
                setDetailsExpanded(!detailsExpanded);
              }}>
                {detailsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className={`p-4 ${detailsExpanded ? 'block' : 'hidden'}`}>
            <Form {...form}>
              <form id="program-editor-form" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="flex flex-wrap gap-4 items-end">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="flex-1 min-w-[200px]">
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Program title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="w-40">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full justify-start text-left font-normal ${!field.value && "text-muted-foreground"}`}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "MMM d, yyyy")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <FormLabel>Duration (days)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            placeholder="7" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Program description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sprint">Sprint</SelectItem>
                              <SelectItem value="middle-distance">Middle Distance</SelectItem>
                              <SelectItem value="long-distance">Long Distance</SelectItem>
                              <SelectItem value="jumps">Jumps</SelectItem>
                              <SelectItem value="throws">Throws</SelectItem>
                              <SelectItem value="multi">Multi-Events</SelectItem>
                              <SelectItem value="general">General</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                              <SelectItem value="elite">Elite</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Document Viewer Card */}
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Document</CardTitle>
            <p className="text-sm text-muted-foreground">This program uses an uploaded document instead of a weekly schedule</p>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4 p-3 border rounded-lg bg-slate-50">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-500" />
                <p className="font-medium">{fileName}</p>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={program.programFileUrl} download>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
                <Button size="sm" asChild>
                  <a href={program.programFileUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open
                  </a>
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDeleteDocument()}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
            
            {/* Document preview iframe */}
            <div className="w-full h-[600px] border rounded-lg overflow-hidden">
              {actualProgramFileUrl ? (
                <iframe 
                  src={documentUrl} 
                  className="w-full h-full"
                  title="Document Preview"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-gray-100 dark:bg-gray-900">
                  <FileText className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">No Document Uploaded</h3>
                  <p className="text-center text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                    This program doesn't have an uploaded document yet. Upload a PDF file to see it displayed here.
                  </p>
                  <Button 
                    onClick={() => {
                      console.log("Opening upload dialog");
                      setUploadDialogOpen(true);
                    }} 
                    className="flex items-center px-4 py-2"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              )}
            </div>
            
            {/* Document action buttons */}
            {actualProgramFileUrl && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-400 mb-4">
                  If the document doesn't display correctly, you can download it or open it in a new tab.
                </p>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" className="flex items-center px-4 py-2" asChild>
                    <a href={rawDocumentUrl} download>
                      <Download className="h-4 w-4 mr-2" />
                      Download Document
                    </a>
                  </Button>
                  <Button className="flex items-center px-4 py-2 bg-amber-400 hover:bg-amber-500 text-black" asChild>
                    <a href={rawDocumentUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create the upload document dialog component
  const renderUploadDialog = () => {
    return (
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a PDF document to attach to this program. This will be displayed instead of the weekly schedule.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-4 items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
              {selectedFile ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <span className="font-medium">{selectedFile.name}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </>
              ) : (
                <>
                  <FileUp className="h-12 w-12 text-gray-400" />
                  <p className="text-center text-sm">
                    Drag and drop a PDF file here, or click to browse
                  </p>
                </>
              )}
              
              <Input
                type="file"
                id="document-upload"
                className="hidden"
                accept=".pdf"
                onChange={handleFileChange}
              />
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('document-upload')?.click()}
                className="mt-2"
              >
                <Upload className="h-4 w-4 mr-2" />
                {selectedFile ? 'Choose a Different File' : 'Select PDF File'}
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => {
                setUploadDialogOpen(false);
                setSelectedFile(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUploadDocument}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Standard program with weekly schedule view
  return (
    <div className="container max-w-full p-4">
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a PDF document to attach to this program. This will be displayed instead of the weekly schedule.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-4 items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
              {selectedFile ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <span className="font-medium">{selectedFile.name}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </>
              ) : (
                <>
                  <FileUp className="h-12 w-12 text-gray-400" />
                  <p className="text-center text-sm">
                    Drag and drop a PDF file here, or click to browse
                  </p>
                </>
              )}
              
              <Input
                type="file"
                id="document-upload"
                className="hidden"
                accept=".pdf"
                onChange={handleFileChange}
              />
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('document-upload')?.click()}
                className="mt-2"
              >
                <Upload className="h-4 w-4 mr-2" />
                {selectedFile ? 'Choose a Different File' : 'Select PDF File'}
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => {
                setUploadDialogOpen(false);
                setSelectedFile(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUploadDocument}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/programs")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Program Editor</h1>
        </div>
        <div className="flex gap-2">
          <Button
            type="submit"
            form="program-editor-form"
            disabled={isSubmitting}
            size="icon"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Card>
          <div 
            className="flex items-center justify-between p-4 cursor-pointer border-b border-gray-800"
            onClick={() => setDetailsExpanded(!detailsExpanded)}
          >
            <div className="font-medium">Program Details</div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">
                {program?.title || "Untitled Program"}
                {program?.startDate && ` • Started ${format(new Date(program.startDate), "MMM d, yyyy")}`}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 p-0" onClick={(e) => {
                e.stopPropagation();
                setDetailsExpanded(!detailsExpanded);
              }}>
                {detailsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <CardContent className={`p-4 ${detailsExpanded ? 'block' : 'hidden'}`}>
            <Form {...form}>
              <form id="program-editor-form" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="flex flex-wrap gap-4 items-end">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="flex-1 min-w-[200px]">
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Program title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="w-auto">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                type="button"
                                variant={"outline"}
                                className={`pl-3 text-left font-normal ${
                                  !field.value ? "text-muted-foreground" : ""
                                }`}
                              >
                                {field.value ? (
                                  format(new Date(field.value), "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <FormLabel>Duration (days)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            placeholder="7" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="flex-1 basis-full">
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Program description"
                            {...field}
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold">Training Schedule</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Info className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Training Schedule Help</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Click on any cell to add or edit workout details. You can mark days as rest days.
                </p>
                <p className="text-sm text-muted-foreground">
                  Use the calendar to schedule your training across weeks and days.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="w-full border rounded-lg overflow-x-auto">
          <div className="p-4 min-w-[1400px]">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div>
                <div className="space-y-8">
                  {weeks.map((week) => (
                    <div key={week.weekNumber} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">
                        Week {week.weekNumber + 1}: {format(week.startDate, "MMM d")} - {format(addDays(week.startDate, 6), "MMM d, yyyy")}
                      </h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        onClick={() => handleDeleteWeek(week.weekNumber)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Week
                      </Button>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-1/8">
                            <div className="flex flex-col items-center">
                              <span>Sunday</span>
                              <span className="text-xs text-gray-400">{format(addDays(week.startDate, 0), "MMM d")}</span>
                            </div>
                          </TableHead>
                          <TableHead className="w-1/8">
                            <div className="flex flex-col items-center">
                              <span>Monday</span>
                              <span className="text-xs text-gray-400">{format(addDays(week.startDate, 1), "MMM d")}</span>
                            </div>
                          </TableHead>
                          <TableHead className="w-1/8">
                            <div className="flex flex-col items-center">
                              <span>Tuesday</span>
                              <span className="text-xs text-gray-400">{format(addDays(week.startDate, 2), "MMM d")}</span>
                            </div>
                          </TableHead>
                          <TableHead className="w-1/8">
                            <div className="flex flex-col items-center">
                              <span>Wednesday</span>
                              <span className="text-xs text-gray-400">{format(addDays(week.startDate, 3), "MMM d")}</span>
                            </div>
                          </TableHead>
                          <TableHead className="w-1/8">
                            <div className="flex flex-col items-center">
                              <span>Thursday</span>
                              <span className="text-xs text-gray-400">{format(addDays(week.startDate, 4), "MMM d")}</span>
                            </div>
                          </TableHead>
                          <TableHead className="w-1/8">
                            <div className="flex flex-col items-center">
                              <span>Friday</span>
                              <span className="text-xs text-gray-400">{format(addDays(week.startDate, 5), "MMM d")}</span>
                            </div>
                          </TableHead>
                          <TableHead className="w-1/8">
                            <div className="flex flex-col items-center">
                              <span>Saturday</span>
                              <span className="text-xs text-gray-400">{format(addDays(week.startDate, 6), "MMM d")}</span>
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          {[0, 1, 2, 3, 4, 5, 6].map((dayNumber) => {
                            const cellData = getCellContent(week.weekNumber, dayNumber);
                            return (
                              <EditableCell
                                key={`${week.weekNumber}-${dayNumber}`}
                                content={cellData.content}
                                isRestDay={cellData.isRestDay}
                                date={cellData.date}
                                isWeekend={isWeekendDay(dayNumber)}
                                onSave={(content, isRest) => 
                                  handleCellUpdate(week.weekNumber, dayNumber, content, isRest)
                                }
                              />
                            );
                          })}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Add Week buttons moved completely outside the scrollable container */}
        <div className="flex justify-center gap-4 pt-4">
          <Button 
            variant="outline" 
            onClick={handleAddWeek}
            disabled={isAddingWeek}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Week
          </Button>
          <Button 
            variant="outline" 
            onClick={handleAddFiveWeeks}
            disabled={isAddingWeek}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add 5 Weeks
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Component() {
  return <ProgramEditorPage />;
}