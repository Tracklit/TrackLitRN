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
  Loader2
} from "lucide-react";
import { AssignProgramDialog } from "@/components/assign-program-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { queryClient } from "@/lib/queryClient";

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
  
  // For normal programs with sessions
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Program Sessions</h3>
      
      {/* This would be replaced with actual program session data */}
      <div className="space-y-4">
        {Array.from({ length: program.duration || 7 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Day {index + 1}</CardTitle>
              <CardDescription>Session Details</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Session content would be displayed here.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
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
        
        {/* Show Edit button only if user is the program creator */}
        {program.userId === user?.id && (
          <Button variant="outline" asChild>
            <Link href={`/programs/${id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Program
            </Link>
          </Button>
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
              <ProgramDetailContent program={program} />
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
                <Button className="w-full">
                  <Crown className="h-3.5 w-3.5 mr-1.5 text-yellow-500" />
                  Purchase ({program.price || 0} Spikes)
                </Button>
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