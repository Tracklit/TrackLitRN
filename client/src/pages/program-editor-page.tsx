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
function SessionCard({ session, onClick, onMoveSession }: { 
  session: any, 
  onClick: () => void, 
  onMoveSession: (session: any) => void 
}) {
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
  const programId = parseInt(params.id);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  // All state declarations in one place
  const [currentWeek, setCurrentWeek] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSessionDialogOpen, setIsSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [moveSessionDialogOpen, setMoveSessionDialogOpen] = useState(false);
  const [sessionToMove, setSessionToMove] = useState<any>(null);
  const [targetDayNumber, setTargetDayNumber] = useState<number | null>(null);
  
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
        title: program.title || "",
        description: program.description || "",
        category: program.category || "",
        level: program.level || "",
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
  
  // Function to calculate the total number of days in the program
  const getTotalDays = (): number => {
    if (program?.sessions && program.sessions.length > 0) {
      // Find the highest day number from sessions
      const maxDay = Math.max(...program.sessions.map((session: any) => session.dayNumber || 0));
      return Math.max(maxDay, 1);
    }
    
    // Default to at least 7 days (1 week) if no sessions are available
    return 7;
  };
  
  // Filter sessions for current week
  const weekSessions = program?.sessions?.filter((session: any) => {
    const sessionDayNumber = session.dayNumber;
    return sessionDayNumber > currentWeek * 7 && sessionDayNumber <= (currentWeek + 1) * 7;
  }) || [];
  
  // Get sessions for a specific day
  const getSessionsForDay = (dayNumber: number) => {
    return weekSessions.filter((session: any) => session.dayNumber === dayNumber);
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
  
  // Function to open the move session dialog
  const handleOpenMoveDialog = (session: any) => {
    setSessionToMove(session);
    setTargetDayNumber(session.dayNumber);
    setMoveSessionDialogOpen(true);
  };
  
  // Function to move a session to a different day
  const handleMoveSession = async () => {
    if (!sessionToMove || !targetDayNumber) return;
    
    // Skip if moving to the same day
    if (sessionToMove.dayNumber === targetDayNumber) {
      setMoveSessionDialogOpen(false);
      return;
    }
    
    try {
      // Update the session with the new day number
      const updatedSession = {
        ...sessionToMove,
        dayNumber: targetDayNumber
      };
      
      // Call the API to update the session
      const response = await apiRequest(
        "PUT", 
        `/api/programs/${programId}/sessions/${sessionToMove.id}`, 
        updatedSession
      );
      
      if (!response.ok) {
        throw new Error("Failed to move session");
      }
      
      // Show success message
      toast({
        title: "Session moved",
        description: `Session moved to day ${targetDayNumber}`,
      });
      
      // Close dialog and reset state
      setMoveSessionDialogOpen(false);
      setSessionToMove(null);
      setTargetDayNumber(null);
      
      // Refresh program data
      queryClient.invalidateQueries({ queryKey: [`/api/programs/${programId}`] });
    } catch (error) {
      console.error("Error moving session:", error);
      toast({
        title: "Error",
        description: "Failed to move session",
        variant: "destructive",
      });
    }
  };
  
  // Save program handler
  const handleSaveProgram = () => {
    programForm.handleSubmit((data) => {
      updateProgramMutation.mutate(data);
    })();
  };
  
  // Open session dialog
  const handleOpenSessionDialog = (date: Date, dayNumber: number, session?: any) => {
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
      saveSessionMutation.mutate(data);
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
  
  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
      <PageHeader
        title={program?.title || "Program Editor"}
        description="Create and manage your training program"
        actions={
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link href="/programs">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <Button onClick={handleSaveProgram}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        }
      />
      
      <Tabs defaultValue="weekly">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="weekly">Weekly View</TabsTrigger>
            <TabsTrigger value="settings">Program Settings</TabsTrigger>
          </TabsList>
          
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
        
        <TabsContent value="weekly" className="space-y-4">
          <div className="grid grid-cols-7 gap-4">
            {weekDates.map((day) => (
              <div 
                key={day.dayNumber}
                className={`rounded-lg overflow-hidden ${day.isWeekend ? 'bg-muted/50' : 'bg-card'}`}
              >
                <div className={`p-2 text-center ${day.isWeekend ? 'bg-muted' : 'bg-primary/10'}`}>
                  <div className="text-xs font-medium">{day.dayOfWeek}</div>
                  <div className="text-sm font-bold">{day.dayOfMonth}</div>
                  <div className="text-xs">{day.month}</div>
                </div>
                
                <div className="p-2">
                  <div className="text-xs mb-2 flex items-center justify-between">
                    <span>Day {day.dayNumber}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5"
                      onClick={() => handleOpenSessionDialog(day.date, day.dayNumber)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-[350px] overflow-y-auto">
                    {getSessionsForDay(day.dayNumber).length > 0 ? (
                      getSessionsForDay(day.dayNumber).map((session: any) => (
                        <SessionCard 
                          key={session.id} 
                          session={session} 
                          onClick={() => handleOpenSessionDialog(day.date, day.dayNumber, session)}
                          onMoveSession={handleOpenMoveDialog}
                        />
                      ))
                    ) : (
                      <div className="text-xs text-center py-4 text-muted-foreground">
                        No sessions
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Program Settings</CardTitle>
              <CardDescription>Configure your program details and structure</CardDescription>
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
                          <Input placeholder="Enter program title" {...field} />
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
                          <Textarea 
                            placeholder="Enter program description" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
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
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sprint">Sprint</SelectItem>
                              <SelectItem value="middle">Middle Distance</SelectItem>
                              <SelectItem value="long">Long Distance</SelectItem>
                              <SelectItem value="jumps">Jumps</SelectItem>
                              <SelectItem value="throws">Throws</SelectItem>
                              <SelectItem value="multi">Multi Events</SelectItem>
                              <SelectItem value="general">General</SelectItem>
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
                          <FormLabel>Level</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select level" />
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
                  
                  <Separator />
                  
                  <h3 className="text-lg font-medium">Program Structure</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={programForm.control}
                      name="macroBlockSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Macro Block Size (weeks)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={programForm.control}
                      name="numberOfMacroBlocks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Macro Blocks</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
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
                          <FormLabel>Micro Block Size (days)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Usually 7 days (one week)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="rounded-md bg-muted p-4">
                    <div className="flex items-center space-x-2">
                      <Info className="h-4 w-4 text-muted-foreground" />
                      <h4 className="text-sm font-medium">Program Summary</h4>
                    </div>
                    <div className="mt-2 text-sm">
                      <p>Total program length: {totalProgramDays} days ({totalWeeks} weeks)</p>
                      <p className="mt-1">Structure: {programForm.watch("numberOfMacroBlocks")} macro blocks of {programForm.watch("macroBlockSize")} weeks each</p>
                    </div>
                  </div>
                </div>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSaveProgram}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Session Dialog */}
      <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSession ? "Edit Training Session" : "Add Training Session"}
            </DialogTitle>
            <DialogDescription>
              {selectedDate && (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...sessionForm}>
            <div className="grid gap-4">
              <FormField
                control={sessionForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter session title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={sessionForm.control}
                name="isRestDay"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Rest Day</FormLabel>
                      <FormDescription>
                        Mark this as a rest or recovery day
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
              
              <Tabs defaultValue="sprints">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="sprints">Sprint</TabsTrigger>
                  <TabsTrigger value="middle">Middle</TabsTrigger>
                  <TabsTrigger value="long">Long</TabsTrigger>
                </TabsList>
                
                <TabsContent value="sprints">
                  <FormField
                    control={sessionForm.control}
                    name="shortDistanceWorkout"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sprint Workout</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter workout details for sprint athletes" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="middle">
                  <FormField
                    control={sessionForm.control}
                    name="mediumDistanceWorkout"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Distance Workout</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter workout details for middle distance athletes" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="long">
                  <FormField
                    control={sessionForm.control}
                    name="longDistanceWorkout"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Long Distance Workout</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter workout details for long distance athletes" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
              
              <FormField
                control={sessionForm.control}
                name="preActivation1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pre-Activation 1</FormLabel>
                    <FormControl>
                      <Input placeholder="Warm-up or pre-activation routine" {...field} />
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
                      <Input placeholder="Additional warm-up details" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={sessionForm.control}
                name="extraSession"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Extra Session</FormLabel>
                    <FormControl>
                      <Input placeholder="Additional training (e.g., evening session)" {...field} />
                    </FormControl>
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
                      <Textarea 
                        placeholder="Additional notes or instructions" 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
          
          <DialogFooter className="flex justify-between items-center">
            {editingSession && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSession}
                disabled={deleteSessionMutation.isPending}
              >
                {deleteSessionMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleCloseSessionDialog}
                disabled={saveSessionMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSession}
                disabled={saveSessionMutation.isPending}
              >
                {saveSessionMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                <Save className="h-4 w-4 mr-2" />
                {editingSession ? "Update" : "Create"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Move Session Dialog */}
      <Dialog open={moveSessionDialogOpen} onOpenChange={setMoveSessionDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Move Session</DialogTitle>
            <DialogDescription>
              Move this session to a different day in your program
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="session-title">Session</Label>
              <div className="p-2 border rounded-md bg-muted/50 mt-1">
                {sessionToMove?.title}
              </div>
            </div>
            
            <div>
              <Label htmlFor="current-day">Current Day</Label>
              <div className="p-2 border rounded-md bg-muted/50 mt-1">
                Day {sessionToMove?.dayNumber}
              </div>
            </div>
            
            <div>
              <Label htmlFor="target-day">Target Day</Label>
              <Select 
                value={targetDayNumber?.toString()} 
                onValueChange={(value) => setTargetDayNumber(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: getTotalDays() }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      Day {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveSessionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMoveSession}>
              <MoveHorizontal className="h-4 w-4 mr-2" />
              Move Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function Component() {
  return (
    <ProtectedRoute>
      <ProgramEditorPage />
    </ProtectedRoute>
  );
}