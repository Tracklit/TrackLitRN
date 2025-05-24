import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ProtectedRoute } from "@/lib/protected-route";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, Calendar, CalendarDays, ChevronLeft, ChevronRight, Clock, Edit, 
  Info, Loader2, Plus, Save, Trash2, MoveHorizontal, ArrowDownUp 
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isWeekend } from "date-fns";

// Session form validation schema
const sessionFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  dayNumber: z.number().int().positive(),
  orderInDay: z.number().int().positive(),
  date: z.string().optional(),
  shortDistanceWorkout: z.string().optional(),
  mediumDistanceWorkout: z.string().optional(),
  longDistanceWorkout: z.string().optional(),
  preActivation1: z.string().optional(),
  preActivation2: z.string().optional(),
  extraSession: z.string().optional(),
  isRestDay: z.boolean().default(false),
  notes: z.string().optional(),
});

// Program editor form schema
const programEditorSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  category: z.string().optional(),
  level: z.string().optional(),
  // These fields are used to calculate the total program duration
  macroBlockSize: z.number().int().positive(),
  numberOfMacroBlocks: z.number().int().positive(),
  microBlockSize: z.number().int().positive().default(7),
});

type Session = z.infer<typeof sessionFormSchema>;

// Session component with move capability
function SessionCard({ session, onClick, onMoveSession }) {
  return (
    <div 
      className="bg-primary/10 hover:bg-primary/20 transition-colors rounded-md p-2 cursor-pointer text-xs relative group"
      onClick={onClick}
    >
      <div className="font-medium truncate">{session.title}</div>
      {session.isRestDay ? (
        <Badge variant="outline" className="mt-1">Rest Day</Badge>
      ) : (
        <>
          {session.shortDistanceWorkout && (
            <div className="mt-1 truncate text-muted-foreground">{session.shortDistanceWorkout}</div>
          )}
          {session.preActivation1 && (
            <div className="mt-1 truncate text-xs text-muted-foreground/80">Pre: {session.preActivation1}</div>
          )}
        </>
      )}
      
      <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-5 w-5" 
          onClick={(e) => {
            e.stopPropagation();
            onMoveSession(session);
          }}
        >
          <MoveHorizontal className="h-3 w-3 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="h-5 w-5">
          <Edit className="h-3 w-3 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}

export default function ProgramEditorPage() {
  const params = useParams<{ id: string }>();
  const programId = Number(params.id);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // State for weekly view
  const [currentWeek, setCurrentWeek] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  
  // Program query
  const { data: program, isLoading, error } = useQuery({
    queryKey: [`/api/programs/${programId}`],
    enabled: !!programId,
  });
  
  // Program editor form
  const programForm = useForm<z.infer<typeof programEditorSchema>>({
    resolver: zodResolver(programEditorSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      level: "",
      macroBlockSize: 4,
      numberOfMacroBlocks: 3,
      microBlockSize: 7,
    },
  });
  
  // Session form
  const sessionForm = useForm<z.infer<typeof sessionFormSchema>>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      title: "",
      description: "",
      dayNumber: 1,
      orderInDay: 1,
      shortDistanceWorkout: "",
      mediumDistanceWorkout: "",
      longDistanceWorkout: "",
      preActivation1: "",
      preActivation2: "",
      extraSession: "",
      isRestDay: false,
      notes: "",
    },
  });
  
  // Update form with program data when it loads
  useEffect(() => {
    if (program) {
      programForm.reset({
        title: program.title,
        description: program.description || "",
        category: program.category,
        level: program.level,
        macroBlockSize: program.macroBlockSize || 4,
        numberOfMacroBlocks: program.numberOfMacroBlocks || 3,
        microBlockSize: program.microBlockSize || 7,
      });
    }
  }, [program, programForm]);
  
  // Calculate total program days
  const totalProgramDays = programForm.watch("macroBlockSize") 
    * programForm.watch("numberOfMacroBlocks") 
    * programForm.watch("microBlockSize");
  
  // Calculate total weeks
  const totalWeeks = Math.ceil(totalProgramDays / 7);
  
  // Get week dates (Sunday to Saturday)
  const getWeekDates = (weekIndex: number) => {
    const startDate = startOfWeek(new Date()); // Start from current week for now
    const weekStartDate = addDays(startDate, weekIndex * 7);
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStartDate, i);
      return {
        date,
        dayOfWeek: format(date, 'EEEE'),
        dayOfMonth: format(date, 'd'),
        month: format(date, 'MMM'),
        isWeekend: isWeekend(date),
        dayNumber: weekIndex * 7 + i + 1, // 1-indexed day number in the program
      };
    });
  };
  
  // Current week dates
  const weekDates = getWeekDates(currentWeek);
  
  // Filter sessions for current week
  const weekSessions = program?.sessions?.filter(session => {
    const sessionDayNumber = session.dayNumber;
    return sessionDayNumber > currentWeek * 7 && sessionDayNumber <= (currentWeek + 1) * 7;
  }) || [];
  
  // Get sessions for a specific day
  const getSessionsForDay = (dayNumber: number) => {
    return weekSessions.filter(session => session.dayNumber === dayNumber);
  };
  
  // Update program mutation
  const updateProgramMutation = useMutation({
    mutationFn: async (data: z.infer<typeof programEditorSchema>) => {
      const res = await apiRequest("PUT", `/api/programs/${programId}`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update program");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Program updated",
        description: "Your program has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/programs/${programId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Create/update session mutation
  const saveSessionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof sessionFormSchema>) => {
      const url = editingSession?.id 
        ? `/api/programs/${programId}/sessions/${editingSession.id}` 
        : `/api/programs/${programId}/sessions`;
      
      const method = editingSession?.id ? "PUT" : "POST";
      
      try {
        const res = await apiRequest(method, url, data);
        
        if (!res.ok) {
          const errorText = await res.text();
          let errorMessage = "Failed to save session";
          
          try {
            // Try to parse as JSON first
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // If parsing fails, use the text directly
            errorMessage = errorText.length > 100 ? errorText.substring(0, 100) + "..." : errorText;
          }
          
          throw new Error(errorMessage);
        }
        
        // Handle successful response
        const responseText = await res.text();
        if (!responseText) return {};
        
        try {
          return JSON.parse(responseText);
        } catch (e) {
          console.error("Error parsing success response:", e);
          return {};
        }
      } catch (error) {
        console.error("Session save error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: editingSession ? "Session updated" : "Session created",
        description: `Session has been ${editingSession ? "updated" : "created"} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/programs/${programId}`] });
      handleCloseSessionDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      try {
        const res = await apiRequest("DELETE", `/api/programs/${programId}/sessions/${sessionId}`);
        
        if (!res.ok) {
          const errorText = await res.text();
          let errorMessage = "Failed to delete session";
          
          try {
            // Try to parse as JSON first
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // If parsing fails, use the text directly
            errorMessage = errorText.length > 100 ? errorText.substring(0, 100) + "..." : errorText;
          }
          
          throw new Error(errorMessage);
        }
        
        // Handle successful response
        const responseText = await res.text();
        if (!responseText) return {};
        
        try {
          return JSON.parse(responseText);
        } catch (e) {
          console.error("Error parsing success response:", e);
          return {};
        }
      } catch (error) {
        console.error("Session delete error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Session deleted",
        description: "Session has been removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/programs/${programId}`] });
      handleCloseSessionDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Save program handler
  const handleSaveProgram = () => {
    programForm.handleSubmit((data) => {
      updateProgramMutation.mutate(data);
    })();
  };
  
  // Open session dialog
  const handleOpenSessionDialog = (date: Date, dayNumber: number, session?: Session) => {
    setSelectedDate(date);
    setEditingSession(session || null);
    
    // Set default values based on day or existing session
    sessionForm.reset({
      title: session?.title || `Day ${dayNumber} Training`,
      description: session?.description || "Training Session",
      dayNumber: dayNumber,
      orderInDay: session?.orderInDay || 1,
      date: format(date, 'yyyy-MM-dd'),
      shortDistanceWorkout: session?.shortDistanceWorkout || "",
      mediumDistanceWorkout: session?.mediumDistanceWorkout || "",
      longDistanceWorkout: session?.longDistanceWorkout || "",
      preActivation1: session?.preActivation1 || "",
      preActivation2: session?.preActivation2 || "",
      extraSession: session?.extraSession || "",
      isRestDay: session?.isRestDay || false,
      notes: session?.notes || "",
    });
    
    setIsSessionDialogOpen(true);
  };
  
  // Close session dialog
  const handleCloseSessionDialog = () => {
    setIsSessionDialogOpen(false);
    setEditingSession(null);
    setSelectedDate(null);
  };
  
  // Save session handler
  const handleSaveSession = () => {
    sessionForm.handleSubmit((data) => {
      saveSessionMutation.mutate({
        ...data,
        id: editingSession?.id,
      });
    })();
  };
  
  // Delete session handler
  const handleDeleteSession = () => {
    if (editingSession?.id) {
      deleteSessionMutation.mutate(editingSession.id);
    }
  };
  
  // Navigation handlers
  const goToPreviousWeek = () => {
    if (currentWeek > 0) {
      setCurrentWeek(currentWeek - 1);
    }
  };
  
  const goToNextWeek = () => {
    if (currentWeek < totalWeeks - 1) {
      setCurrentWeek(currentWeek + 1);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading program...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error Loading Program</h2>
          <p className="text-muted-foreground">
            There was a problem loading the program. Please try again later.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/programs">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Programs
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  
  // Function to move a session to a different day
  const handleMoveSession = async (session, newDayNumber) => {
    // Skip if moving to the same day
    if (session.dayNumber === newDayNumber) {
      return;
    }
    
    try {
      // Update the session with the new day number
      const updatedSession = {
        ...session,
        dayNumber: newDayNumber
      };
      
      // Call the API to update the session
      const response = await apiRequest(
        "PUT", 
        `/api/programs/${programId}/sessions/${session.id}`, 
        updatedSession
      );
      
      if (!response.ok) {
        throw new Error("Failed to move session");
      }
      
      // Show success message
      toast({
        title: "Session moved",
        description: `Session moved to day ${newDayNumber}`,
      });
      
      // Refresh program data
      queryClient.invalidateQueries({ queryKey: [`/api/programs/${programId}`] });
    } catch (error) {
      console.error("Error moving session:", error);
      toast({
        title: "Error",
        description: "Failed to move session. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
        <div className="mb-6 flex justify-between items-center">
          <Button variant="outline" asChild>
            <Link href="/programs">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Programs
            </Link>
          </Button>
          
          <Button 
            onClick={handleSaveProgram}
            disabled={updateProgramMutation.isPending}
          >
            {updateProgramMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Save className="h-4 w-4 mr-2" />
            Save Program
          </Button>
        </div>
      
      {/* Program Details Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{program?.title || "Program Editor"}</CardTitle>
          <CardDescription>Edit your program's basic information</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...programForm}>
            <div className="space-y-4">
              <FormField
                control={programForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={programForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={programForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sprint">Sprinting</SelectItem>
                          <SelectItem value="distance">Distance Running</SelectItem>
                          <SelectItem value="jumps">Jumping Events</SelectItem>
                          <SelectItem value="throws">Throwing Events</SelectItem>
                          <SelectItem value="multi">Multi-Events</SelectItem>
                          <SelectItem value="general">General Fitness</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={programForm.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience Level</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a level" />
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
                
                <FormField
                  control={programForm.control}
                  name="macroBlockSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Macro Block Size (Weeks)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={12} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={programForm.control}
                  name="numberOfMacroBlocks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Macro Blocks</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={12} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={programForm.control}
                  name="microBlockSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Micro Block Size (Days)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={14} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                <div className="flex items-center mb-1">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  <span className="font-medium">Program Duration:</span> {totalProgramDays} days ({totalWeeks} weeks)
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="font-medium">Structure:</span> {programForm.watch("numberOfMacroBlocks")} macro blocks of {programForm.watch("macroBlockSize")} weeks each
                </div>
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>
      
      {/* Weekly Session View */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center">
            <CardTitle>Weekly Schedule</CardTitle>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToPreviousWeek}
                disabled={currentWeek === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                Week {currentWeek + 1} of {totalWeeks}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToNextWeek}
                disabled={currentWeek >= totalWeeks - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Create and edit sessions for each day of the week
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-7 gap-2 overflow-x-auto pb-2">
            {weekDates.map((day) => (
              <DroppableDay
                key={day.dayNumber}
                day={day}
                sessions={getSessionsForDay(day.dayNumber)}
                onOpenSessionDialog={(date, dayNumber, session) => 
                  handleOpenSessionDialog(date, dayNumber, session)
                }
                onAddSession={(date, dayNumber) => 
                  handleOpenSessionDialog(date, dayNumber)
                }
                onMoveSession={handleMoveSession}
              />
            ))}
          </div>
          
          <div className="mt-6 p-3 bg-primary/5 rounded-md border border-dashed border-primary/20">
            <div className="flex items-center mb-2">
              <Info className="h-4 w-4 mr-2 text-primary" />
              <span className="text-sm font-medium">Drag & Drop Tips</span>
            </div>
            <p className="text-xs text-muted-foreground">
              You can drag and drop sessions between days to rearrange your training schedule. 
              Click on a session to edit its details or add new sessions using the "Add Session" button.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Session Edit Dialog */}
      <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSession ? "Edit Session" : "Create New Session"}
            </DialogTitle>
            <DialogDescription>
              {selectedDate && `${format(selectedDate, 'EEEE, MMMM d, yyyy')} (Day ${sessionForm.watch("dayNumber")})`}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...sessionForm}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={sessionForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={sessionForm.control}
                  name="isRestDay"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-4">
                      <div>
                        <FormLabel>Rest Day</FormLabel>
                        <FormDescription>
                          Mark this as a recovery day
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={sessionForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Tabs defaultValue="short" className="w-full">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="short">Short Distance</TabsTrigger>
                  <TabsTrigger value="medium">Medium Distance</TabsTrigger>
                  <TabsTrigger value="long">Long Distance</TabsTrigger>
                </TabsList>
                
                <TabsContent value="short" className="space-y-4">
                  <FormField
                    control={sessionForm.control}
                    name="shortDistanceWorkout"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Distance Workout</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} />
                        </FormControl>
                        <FormDescription>
                          Training for short distance events (60m-200m)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="medium" className="space-y-4">
                  <FormField
                    control={sessionForm.control}
                    name="mediumDistanceWorkout"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medium Distance Workout</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} />
                        </FormControl>
                        <FormDescription>
                          Training for medium distance events (400m-800m)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="long" className="space-y-4">
                  <FormField
                    control={sessionForm.control}
                    name="longDistanceWorkout"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Long Distance Workout</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} />
                        </FormControl>
                        <FormDescription>
                          Training for long distance events (1500m+)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={sessionForm.control}
                  name="preActivation1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pre-Activation 1</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={sessionForm.control}
                  name="preActivation2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pre-Activation 2</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={sessionForm.control}
                name="extraSession"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Extra Session</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormDescription>
                      Additional training activities or supplementary work
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={sessionForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormDescription>
                      Additional notes or instructions for this session
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
          
          <DialogFooter className="flex justify-between">
            <div>
              {editingSession && (
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteSession}
                  disabled={deleteSessionMutation.isPending}
                >
                  {deleteSessionMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCloseSessionDialog}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveSession}
                disabled={saveSessionMutation.isPending}
              >
                {saveSessionMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingSession ? "Update" : "Create"} Session
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Missing component import
function Link({ href, children, ...props }: { href: string, children: React.ReactNode, [key: string]: any }) {
  const [, navigate] = useLocation();
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate(href);
  };
  
  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}

// Protected route wrapper
export function Component() {
  return (
    <ProtectedRoute path="/programs/:id/edit" component={ProgramEditorPage} />
  );
}