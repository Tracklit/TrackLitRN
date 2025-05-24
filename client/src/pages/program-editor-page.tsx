import { useEffect, useState, useRef } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ProtectedRoute } from "@/lib/protected-route";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
  Info, Loader2, Plus, Save, Trash2, AlertCircle, Check, ChevronDown, ChevronUp
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, addDays, parse, addWeeks, startOfWeek, getDay, isValid, parseISO } from "date-fns";

// Program editor form schema
const programEditorSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  category: z.string().optional(),
  level: z.string().optional(),
  startDate: z.string().min(1, { message: "Start date is required" }),
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
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(content);
  const [isRest, setIsRest] = useState(isRestDay);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
      className={`border p-0 relative min-h-[100px] ${isWeekend ? 'bg-gray-50' : ''} ${isRest ? 'bg-gray-100' : ''}`}
      onClick={() => !isEditing && setIsEditing(true)}
    >
      {isEditing ? (
        <div className="p-2 h-full">
          <div className="flex justify-between items-center mb-2">
            <Badge variant="outline" className="text-xs">
              {formatDate(date)}
            </Badge>
            <div className="flex items-center gap-2">
              <span className="text-xs">Rest day</span>
              <Switch 
                checked={isRest} 
                onCheckedChange={setIsRest} 
              />
            </div>
          </div>
          <Textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter workout details..."
            className="min-h-[80px] text-sm p-2 border-0 focus:ring-0"
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-2 min-h-[100px] h-full flex flex-col">
          <div className="flex justify-between">
            <Badge variant="outline" className="text-xs">
              {formatDate(date)}
            </Badge>
            {isRest && (
              <Badge variant="secondary" className="text-xs">
                Rest Day
              </Badge>
            )}
          </div>
          <div className="mt-1 flex-1 text-sm whitespace-pre-wrap">
            {content || (
              <span className="text-gray-400 italic">
                Click to add workout...
              </span>
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

export default function ProgramEditorPage() {
  const params = useParams<{ id: string }>();
  const programId = parseInt(params.id);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [isAddingWeek, setIsAddingWeek] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  // Program details form
  const form = useForm<z.infer<typeof programEditorSchema>>({
    resolver: zodResolver(programEditorSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      level: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
    },
  });

  // Fetch program data
  const { data: program, isLoading: programLoading } = useQuery({
    queryKey: ['/api/programs', programId],
    enabled: !isNaN(programId),
  });

  // Fetch program sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/programs', programId, 'sessions'],
    enabled: !isNaN(programId),
  });

  // Update program mutation
  const updateProgram = useMutation({
    mutationFn: async (data: z.infer<typeof programEditorSchema>) => {
      return apiRequest(`/api/programs/${programId}`, {
        method: 'PUT',
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Program updated",
        description: "Your program has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/programs', programId] });
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
      if (data.id) {
        return apiRequest(`/api/programs/${programId}/sessions/${data.id}`, {
          method: 'PUT',
          data,
        });
      } else {
        return apiRequest(`/api/programs/${programId}/sessions`, {
          method: 'POST',
          data,
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Session updated",
        description: "Your session has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/programs', programId, 'sessions'] });
    },
    onError: (error: Error) => {
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
      return apiRequest(`/api/programs/${programId}/sessions/${sessionId}`, {
        method: 'DELETE',
      });
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
      });
    }
  }, [program, form]);

  // Organize sessions into weeks when data is loaded
  useEffect(() => {
    if (sessions && program?.startDate) {
      const startDate = new Date(program.startDate);
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
        const weekStartDate = addWeeks(startDate, weekNumber);
        
        return {
          weekNumber,
          startDate: weekStartDate,
          days: weeklyData[weekNumber],
        };
      });
      
      // Sort weeks by number
      weeksArray.sort((a, b) => a.weekNumber - b.weekNumber);
      
      // If no weeks exist, create the first 5 weeks
      if (weeksArray.length === 0) {
        const newWeeks: WeekData[] = [];
        for (let i = 0; i < 5; i++) {
          newWeeks.push({
            weekNumber: i,
            startDate: addWeeks(startDate, i),
            days: [],
          });
        }
        setWeeks(newWeeks);
      } else {
        setWeeks(weeksArray);
      }
    }
  }, [sessions, program]);

  // Handle adding a new week
  const handleAddWeek = () => {
    setIsAddingWeek(true);
    
    if (weeks.length > 0) {
      const lastWeek = weeks[weeks.length - 1];
      const newWeekNumber = lastWeek.weekNumber + 1;
      const newStartDate = addWeeks(lastWeek.startDate, 1);
      
      const newWeeks = [...weeks, {
        weekNumber: newWeekNumber,
        startDate: newStartDate,
        days: [],
      }];
      
      setWeeks(newWeeks);
    } else {
      // If no weeks exist yet, create the first week
      const startDate = form.getValues("startDate") 
        ? new Date(form.getValues("startDate")) 
        : new Date();
        
      setWeeks([{
        weekNumber: 0,
        startDate,
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
      
      for (let i = 1; i <= 5; i++) {
        const newWeekNumber = lastWeek.weekNumber + i;
        const newStartDate = addWeeks(lastWeek.startDate, i);
        
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

  // Handle session content update
  const handleCellUpdate = (weekNumber: number, dayNumber: number, content: string, isRestDay: boolean) => {
    const date = getDateForWeekDay(weekNumber, dayNumber);
    
    // Check if session exists already
    const existingSession = sessions?.find((s: Session) => 
      s.weekNumber === weekNumber && s.dayNumber === dayNumber
    );
    
    if (existingSession) {
      updateSession.mutate({
        ...existingSession,
        content,
        isRestDay,
        title: content.split('\n')[0] || "Training Session",
        description: content,
      });
    } else {
      updateSession.mutate({
        programId,
        weekNumber,
        dayNumber,
        content,
        isRestDay,
        date: format(date, "yyyy-MM-dd"),
        title: content.split('\n')[0] || "Training Session",
        description: content,
      });
    }
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

  // Get cell content for a specific week and day
  const getCellContent = (weekNumber: number, dayNumber: number) => {
    const session = sessions?.find((s: Session) => 
      s.weekNumber === weekNumber && s.dayNumber === dayNumber
    );
    
    return {
      content: session?.content || session?.description || "",
      isRestDay: session?.isRestDay || false,
      date: session?.date || format(getDateForWeekDay(weekNumber, dayNumber), "yyyy-MM-dd"),
      id: session?.id,
    };
  };

  // Function to determine if a day is a weekend
  const isWeekendDay = (dayNumber: number) => {
    return dayNumber === 0 || dayNumber === 6; // Sunday or Saturday
  };

  return (
    <ProtectedRoute>
      <div className="container max-w-full p-4">
        <div className="flex justify-between items-center mb-4">
          <PageHeader>
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
          </PageHeader>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/programs/${programId}`)}
            >
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
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
                  Save Program
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Program Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Program description"
                            {...field}
                          />
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
                              <SelectItem value="middle_distance">Middle Distance</SelectItem>
                              <SelectItem value="long_distance">Long Distance</SelectItem>
                              <SelectItem value="jumps">Jumps</SelectItem>
                              <SelectItem value="throws">Throws</SelectItem>
                              <SelectItem value="multi">Multi-events</SelectItem>
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
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full pl-3 text-left font-normal ${
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
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Training Schedule</h2>
          <p className="text-sm text-gray-600 mb-4">
            Click on any cell to add or edit workout details. You can mark days as rest days.
          </p>
          
          <ScrollArea className="w-full border rounded-lg">
            <div className="p-4 min-w-[1000px]">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-8">
                  {weeks.map((week, weekIndex) => (
                    <div key={week.weekNumber} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">
                          Week {week.weekNumber + 1}: {format(week.startDate, "MMM d")} - {format(addDays(week.startDate, 6), "MMM d, yyyy")}
                        </h3>
                      </div>
                      
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-1/8">Sunday</TableHead>
                            <TableHead className="w-1/8">Monday</TableHead>
                            <TableHead className="w-1/8">Tuesday</TableHead>
                            <TableHead className="w-1/8">Wednesday</TableHead>
                            <TableHead className="w-1/8">Thursday</TableHead>
                            <TableHead className="w-1/8">Friday</TableHead>
                            <TableHead className="w-1/8">Saturday</TableHead>
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
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export function Component() {
  return <ProgramEditorPage />;
}