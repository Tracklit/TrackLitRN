import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link, useParams } from "wouter";
import { ArrowLeft, Calendar, Clock, FileText, Crown, LockIcon, Tag, TrendingUp, Dumbbell } from "lucide-react";
import { Loader2 } from "lucide-react";

function ProgramDetailContent({ program }: { program: any }) {
  // For uploaded program documents
  if (program.isUploadedProgram && program.programFileUrl) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary" />
            <span className="text-lg font-medium">Uploaded Program Document</span>
          </div>
          <Button asChild>
            <a href={program.programFileUrl} target="_blank" rel="noopener noreferrer">
              View Document
            </a>
          </Button>
        </div>
        
        <div className="p-8 rounded-lg border-2 border-dashed border-muted flex flex-col items-center justify-center">
          <FileText className="h-16 w-16 text-muted mb-4" />
          <p className="text-muted-foreground mb-2">
            This program is available as a downloadable document
          </p>
          <p className="text-sm text-muted-foreground">
            Format: {program.programFileType?.split('/')[1]?.toUpperCase() || 'Document'}
          </p>
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

function ProgramDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  
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
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/programs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Programs
          </Link>
        </Button>
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
              {program.visibility === 'premium' ? (
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