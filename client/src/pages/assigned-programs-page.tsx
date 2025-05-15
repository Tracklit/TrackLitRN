import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, CheckCircle2, Clock, Calendar, ArrowRight, Dumbbell, FileText } from "lucide-react";
import { Link } from "wouter";
import { ProtectedRoute } from "@/lib/protected-route";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

function AssignedProgramsContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("pending");

  // Fetch assigned programs
  const { data: assignedPrograms, isLoading } = useQuery({
    queryKey: ['/api/assigned-programs'],
    queryFn: async () => {
      const response = await fetch('/api/assigned-programs');
      if (!response.ok) {
        throw new Error("Failed to fetch assigned programs");
      }
      return response.json();
    }
  });

  // Mutation to update program assignment status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const response = await fetch(`/api/program-assignments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update assignment status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assigned-programs'] });
      toast({
        title: "Status updated",
        description: "The program assignment status has been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAccept = (id: number) => {
    updateStatusMutation.mutate({ id, status: 'accepted' });
  };

  const handleReject = (id: number) => {
    updateStatusMutation.mutate({ id, status: 'rejected' });
  };

  const handleComplete = (id: number) => {
    updateStatusMutation.mutate({ id, status: 'completed' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredPrograms = assignedPrograms?.filter((assignment: any) => {
    if (activeTab === "all") return true;
    return assignment.status === activeTab;
  }) || [];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          {filteredPrograms.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-muted-foreground mb-4">
                {activeTab === "pending" 
                  ? "No pending program assignments found." 
                  : activeTab === "accepted"
                  ? "No accepted program assignments found."
                  : activeTab === "completed"
                  ? "No completed program assignments found."
                  : "No program assignments found."}
              </p>
              {activeTab === "all" && (
                <p className="text-sm text-muted-foreground">
                  Join a club or contact a coach to get assigned training programs.
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPrograms.map((assignment: any) => (
                <Card key={assignment.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{assignment.program?.title || "Unnamed Program"}</CardTitle>
                        <CardDescription>
                          Assigned by {assignment.assigner?.name || assignment.assigner?.username || "Unknown Coach"}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={
                          assignment.status === "completed" 
                            ? "default" 
                            : assignment.status === "accepted" 
                            ? "outline"
                            : assignment.status === "rejected"
                            ? "destructive" 
                            : "secondary"
                        }
                      >
                        {assignment.status === "completed" && <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                        {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2">
                      {assignment.notes && (
                        <div className="text-sm">
                          <span className="font-medium">Coach's notes:</span> {assignment.notes}
                        </div>
                      )}
                      
                      <div className="flex gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>
                            Assigned {new Date(assignment.assignedAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {assignment.program?.duration && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{assignment.program.duration} days</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex justify-between pt-2">
                    {assignment.status === "pending" ? (
                      <div className="flex gap-2 w-full">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleReject(assignment.id)}
                        >
                          Decline
                        </Button>
                        <Button 
                          className="flex-1"
                          onClick={() => handleAccept(assignment.id)}
                        >
                          Accept
                        </Button>
                      </div>
                    ) : assignment.status === "accepted" ? (
                      <div className="flex gap-2 w-full">
                        <Button 
                          variant="outline"
                          className="flex-1"
                          asChild
                        >
                          <Link to={`/programs/${assignment.programId}`}>
                            <Dumbbell className="h-4 w-4 mr-2" />
                            View Program
                          </Link>
                        </Button>
                        <Button 
                          className="flex-1"
                          onClick={() => handleComplete(assignment.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark Complete
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="secondary"
                        asChild
                        className="w-full"
                      >
                        <Link to={`/programs/${assignment.programId}`}>
                          {assignment.program?.isUploadedProgram ? (
                            <>
                              <FileText className="h-4 w-4 mr-2" />
                              View Document
                            </>
                          ) : (
                            <>
                              <Dumbbell className="h-4 w-4 mr-2" />
                              View Program
                            </>
                          )}
                        </Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function Component() {
  return (
    <div className="container max-w-screen-xl mx-auto py-4 md:py-8 px-4">
      <PageHeader
        title="Assigned Programs"
        description="View and manage programs assigned to you by coaches"
        actions={<Users className="h-6 w-6 text-muted-foreground" />}
      />
      <Separator className="my-6" />
      <AssignedProgramsContent />
    </div>
  );
}

export default function AssignedProgramsPage() {
  return (
    <ProtectedRoute
      path="/assigned-programs"
      component={Component}
    />
  );
}