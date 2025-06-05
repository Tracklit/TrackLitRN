import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, useParams } from "wouter";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  FileText, 
  Crown, 
  LockIcon, 
  Tag, 
  TrendingUp, 
  Dumbbell, 
  CheckCircle2,
  Edit,
  Loader2,
  Download,
  ExternalLink,
  CreditCard
} from "lucide-react";
import { ProgramDocumentPreview } from "@/components/program-document-preview";
import { AssignProgramDialog } from "@/components/assign-program-dialog";
import { DeleteProgramDialog } from "@/components/delete-program-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { queryClient } from "@/lib/queryClient";

// Calendar component for displaying program sessions
function ProgramCalendar({ sessions }: { sessions: any[] }) {
  // Set initial date to the first session's month if sessions exist
  const getInitialDate = () => {
    try {
      if (sessions.length > 0 && sessions[0].date) {
        const date = new Date(sessions[0].date);
        // Check if date is valid
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    } catch (error) {
      console.warn('Error setting initial date:', error);
    }
    return new Date();
  };
  
  const [currentDate, setCurrentDate] = useState(getInitialDate);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  
  // Group sessions by date
  const sessionsByDate = sessions.reduce((acc, session) => {
    // Handle different date formats
    let dateKey;
    try {
      if (session.date) {
        // Try to parse the date - could be "Mar-16", "2025-03-16", etc.
        const dateStr = session.date.toString();
        if (dateStr.includes('-') && dateStr.length <= 6) {
          // Format like "Mar-16" - convert to proper date
          const [monthStr, day] = dateStr.split('-');
          const monthMap: { [key: string]: number } = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
          };
          const month = monthMap[monthStr];
          if (month !== undefined) {
            const year = new Date().getFullYear(); // Use current year
            const date = new Date(year, month, parseInt(day));
            if (!isNaN(date.getTime())) {
              dateKey = date.toISOString().split('T')[0];
            }
          }
        } else {
          // Standard date format
          const date = new Date(session.date);
          if (!isNaN(date.getTime())) {
            dateKey = date.toISOString().split('T')[0];
          }
        }
      }
      
      // Fallback to current date if parsing failed
      if (!dateKey) {
        dateKey = new Date().toISOString().split('T')[0];
      }
    } catch (error) {
      console.warn('Error parsing session date:', session.date, error);
      // Fallback to current date if there's an error
      dateKey = new Date().toISOString().split('T')[0];
    }
    
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(session);
    return acc;
  }, {} as { [key: string]: any[] });


  // Get calendar days for current month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
  
  const endDate = new Date(lastDayOfMonth);
  endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()));
  
  const calendarDays = [];
  const currentCalendarDate = new Date(startDate);
  
  while (currentCalendarDate <= endDate) {
    calendarDays.push(new Date(currentCalendarDate));
    currentCalendarDate.setDate(currentCalendarDate.getDate() + 1);
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Training Calendar</h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            ←
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {monthNames[month]} {year}
          </span>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            →
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-muted">
          {dayNames.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium border-r border-border last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => {
            const dateKey = date.toISOString().split('T')[0];
            const daySessions = sessionsByDate[dateKey] || [];
            const isCurrentMonth = date.getMonth() === month;
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                className={`min-h-[80px] p-1 border-r border-b border-border last:border-r-0 ${
                  !isCurrentMonth ? 'bg-muted/30 text-muted-foreground' : 'bg-background'
                } ${isToday ? 'bg-primary/5' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {daySessions.map((session, sessionIndex) => {
                    // Get the first available workout content to display
                    const workoutContent = session.shortDistanceWorkout || 
                                         session.mediumDistanceWorkout || 
                                         session.longDistanceWorkout ||
                                         session.preActivation1 ||
                                         session.preActivation2 ||
                                         session.extraSession ||
                                         session.description ||
                                         'Training Session';
                    
                    return (
                      <div
                        key={sessionIndex}
                        className="text-xs p-1 bg-primary/10 text-primary rounded cursor-pointer hover:bg-primary/20"
                        onClick={() => setSelectedSession(session)}
                        title={workoutContent}
                      >
                        <div className="font-medium mb-1">Day {session.dayNumber}</div>
                        <div className="text-[10px] line-clamp-2 text-primary/80">
                          {workoutContent.length > 30 ? workoutContent.substring(0, 30) + '...' : workoutContent}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Session Details Drawer */}
      <Drawer open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>
              Day {selectedSession?.dayNumber} - {selectedSession?.title}
            </DrawerTitle>
            <DrawerDescription>
              {selectedSession?.date && new Date(selectedSession.date).toLocaleDateString()}
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-4 pb-4 space-y-4 overflow-y-auto">
            {selectedSession?.shortDistanceWorkout && (
              <div>
                <h4 className="font-medium text-sm text-primary mb-1">Short Distance</h4>
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-sm whitespace-pre-line">{selectedSession.shortDistanceWorkout}</p>
                </div>
              </div>
            )}
            
            {selectedSession?.mediumDistanceWorkout && (
              <div>
                <h4 className="font-medium text-sm text-primary mb-1">Medium Distance</h4>
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-sm whitespace-pre-line">{selectedSession.mediumDistanceWorkout}</p>
                </div>
              </div>
            )}
            
            {selectedSession?.longDistanceWorkout && (
              <div>
                <h4 className="font-medium text-sm text-primary mb-1">Long Distance</h4>
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-sm whitespace-pre-line">{selectedSession.longDistanceWorkout}</p>
                </div>
              </div>
            )}
            
            {selectedSession?.preActivation1 && (
              <div>
                <h4 className="font-medium text-sm text-primary mb-1">Pre-Activation 1</h4>
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-sm whitespace-pre-line">{selectedSession.preActivation1}</p>
                </div>
              </div>
            )}
            
            {selectedSession?.preActivation2 && (
              <div>
                <h4 className="font-medium text-sm text-primary mb-1">Pre-Activation 2</h4>
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-sm whitespace-pre-line">{selectedSession.preActivation2}</p>
                </div>
              </div>
            )}
            
            {selectedSession?.extraSession && (
              <div>
                <h4 className="font-medium text-sm text-primary mb-1">Extra Session</h4>
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-sm whitespace-pre-line">{selectedSession.extraSession}</p>
                </div>
              </div>
            )}
          </div>
          
          <DrawerFooter>
            <Button variant="outline" onClick={() => setSelectedSession(null)}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function ProgramDetailContent({ program }: { program: any }) {
  // For uploaded program documents
  if (program.isUploadedProgram && program.programFileUrl) {
    const fileType = program.programFileType || '';
    const fileExtension = fileType.split('/')[1]?.toUpperCase() || 'Document';
    
    // Determine which icon to use based on file type
    let FileIcon = FileText;
    let fileTypeDisplay = 'Document';
    let fileTypeColor = 'text-blue-500';
    
    if (fileType.includes('pdf')) {
      fileTypeDisplay = 'PDF';
      fileTypeColor = 'text-red-500';
    } else if (fileType.includes('word') || fileType.includes('document')) {
      fileTypeDisplay = 'Word Document';
      fileTypeColor = 'text-blue-600';
    } else if (fileType.includes('excel') || fileType.includes('sheet')) {
      fileTypeDisplay = 'Excel Spreadsheet';
      fileTypeColor = 'text-green-600';
    }
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className={`h-5 w-5 mr-2 ${fileTypeColor}`} />
            <span className="text-lg font-medium">Uploaded Training Program</span>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <a href={program.programFileUrl} download>
                Download
              </a>
            </Button>
            <Button asChild>
              <a href={program.programFileUrl} target="_blank" rel="noopener noreferrer">
                View Document
              </a>
            </Button>
          </div>
        </div>
        
        {/* File preview card */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="bg-muted p-6 flex flex-col items-center justify-center">
            {/* PDF preview */}
            {fileType.includes('pdf') ? (
              <div className="w-full max-h-[400px] overflow-hidden mb-4 border rounded-lg shadow-sm">
                <iframe 
                  src={`${program.programFileUrl}#toolbar=0&view=FitH`} 
                  className="w-full h-[400px]"
                  title="PDF Preview"
                />
              </div>
            ) : (
              <div className={`w-20 h-20 rounded-lg ${fileTypeColor} bg-opacity-10 flex items-center justify-center mb-4`}>
                <FileText className={`h-10 w-10 ${fileTypeColor}`} />
              </div>
            )}
            <p className="text-xl font-semibold mb-1">{fileTypeDisplay}</p>
            <p className="text-muted-foreground">
              {fileType.includes('pdf') 
                ? "PDF preview is shown above. Use the buttons to download or view the full document." 
                : "Click the \"View Document\" button to open the program"}
            </p>
          </div>
          
          <div className="p-6 bg-white">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Program Details</h4>
                <p className="text-sm">{program.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">Category</h4>
                  <p className="text-sm capitalize">{program.category || "General"}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">Level</h4>
                  <p className="text-sm capitalize">{program.level || "Beginner"}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">Duration</h4>
                  <p className="text-sm">{program.duration || 7} days</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">File Type</h4>
                  <p className="text-sm">{fileExtension}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // For normal programs with sessions - show calendar view
  return <ProgramCalendar sessions={program.sessions || []} />;
}

// Component to allow program creators to assign programs to athletes


function ProgramDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch program details
  const { data: program, isLoading, error } = useQuery({
    queryKey: ['/api/programs', id],
    queryFn: async () => {
      const response = await fetch(`/api/programs/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch program details");
      }
      return response.json();
    }
  });
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !program) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 mb-4">Failed to load program details</p>
        <Button variant="outline" asChild>
          <Link href="/programs">Back to Programs</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
      <div className="mb-6 flex justify-between items-center">
        <Button variant="outline" asChild>
          <Link href="/programs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Programs
          </Link>
        </Button>
        
        {/* Show action buttons if user is the program creator */}
        {program.userId === user?.id && (
          <div className="flex gap-2">
            {!program.isUploadedProgram && (
              <Button variant="outline" asChild>
                <Link href={`/programs/${id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Program
                </Link>
              </Button>
            )}
            <DeleteProgramDialog
              programId={program.id}
              programTitle={program.title}
              buttonVariant="outline"
            />
          </div>
        )}
      </div>
      
      <PageHeader 
        title={program.title}
        description={program.description}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Main content */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Program Details</CardTitle>
              <CardDescription>
                Created by {program.creatorName || 'Unknown'}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {program.isUploadedProgram && program.programFileUrl ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-blue-500" />
                      <span className="text-lg font-medium">Document-Based Program</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={program.programFileUrl} download>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </a>
                      </Button>
                      <Button size="sm" asChild>
                        <a href={program.programFileUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Document
                        </a>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border overflow-hidden">
                    <iframe 
                      src={`https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(window.location.origin + program.programFileUrl)}`}
                      className="w-full min-h-[600px] border-0"
                      title="Program Document"
                    />
                  </div>
                </div>
              ) : (
                <ProgramDetailContent program={program} />
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Program Information</CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Visibility</h4>
                  {program.visibility === 'premium' ? (
                    <Badge variant="secondary" className="flex items-center w-fit gap-1">
                      <Crown className="h-3 w-3 text-yellow-500" />
                      <span>Premium - {program.price || 0} Spikes</span>
                    </Badge>
                  ) : program.visibility === 'private' ? (
                    <Badge variant="outline" className="flex items-center w-fit gap-1">
                      <LockIcon className="h-3 w-3" />
                      <span>Private</span>
                    </Badge>
                  ) : (
                    <Badge className="flex items-center w-fit">Public</Badge>
                  )}
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Category</h4>
                  <div className="flex items-center text-muted-foreground">
                    <Tag className="h-4 w-4 mr-2" />
                    <span className="capitalize">{program.category || "General"}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Level</h4>
                  <div className="flex items-center text-muted-foreground">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    <span className="capitalize">{program.level || "Beginner"}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Duration</h4>
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{program.duration || 7} days</span>
                  </div>
                </div>
                
                {program.createdAt && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Created</h4>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{new Date(program.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter>
              {/* If user is the program creator, show assign program button */}
              {program.userId === user?.id ? (
                program.isUploadedProgram ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" asChild className="w-full">
                      <a href={program.programFileUrl} download>
                        <FileText className="h-3.5 w-3.5 mr-1.5" />
                        Download
                      </a>
                    </Button>
                    <AssignProgramDialog program={program} fullWidth={true} />
                  </div>
                ) : (
                  <AssignProgramDialog program={program} fullWidth={true} buttonText="Assign Program" />
                )
              ) : program.visibility === 'premium' ? (
                program.priceType === 'money' ? (
                  <Button className="w-full" asChild>
                    <Link href={`/programs/${program.id}/checkout`}>
                      <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                      Purchase ${program.price || 0}
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full">
                    <Crown className="h-3.5 w-3.5 mr-1.5 text-yellow-500" />
                    Purchase ({program.price || 0} Spikes)
                  </Button>
                )
              ) : program.visibility === 'private' ? (
                <Button className="w-full" disabled>
                  <LockIcon className="h-3.5 w-3.5 mr-1.5" />
                  Private Program
                </Button>
              ) : (
                <Button className="w-full">
                  <Dumbbell className="h-3.5 w-3.5 mr-1.5" />
                  Start Program
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function Component() {
  return <ProtectedRoute path="/programs/:id" component={ProgramDetail} />;
}

export default ProgramDetail;