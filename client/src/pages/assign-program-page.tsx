import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Users, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BackNavigation } from "@/components/back-navigation";
import { apiRequest } from "@/lib/queryClient";
import type { TrainingProgram, User } from "../../../shared/schema";

export function AssignProgramPage() {
  const [, params] = useRoute("/assign-program/:programId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch program details
  const { data: program, isLoading: isProgramLoading } = useQuery<TrainingProgram>({
    queryKey: [`/api/programs/${params?.programId}`],
    enabled: !!params?.programId
  });

  // Fetch potential assignees
  const { data: potentialAssignees, isLoading: isLoadingAssignees } = useQuery<User[]>({
    queryKey: [`/api/programs/${params?.programId}/potential-assignees`],
    enabled: !!params?.programId
  });

  // Fetch current user
  const { data: user } = useQuery<User>({
    queryKey: ['/api/user']
  });

  const assignMutation = useMutation({
    mutationFn: async (data: { programId: number; assigneeId: number; notes?: string }) => {
      const response = await fetch(`/api/assign-program`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign program');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Program Assigned Successfully",
        description: "The athlete will receive a notification and can access the program from their dashboard.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assigned-programs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/purchased-programs'] });
      setLocation('/programs');
    },
    onError: (error: Error) => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign program. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async () => {
    if (!selectedUser || !program?.id) {
      toast({
        title: "Validation Error",
        description: "Please select an athlete and ensure program is loaded.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let assigneeId: number;
      
      if (selectedUser === "myself") {
        if (!user?.id) {
          throw new Error("User not found");
        }
        assigneeId = user.id;
      } else {
        assigneeId = parseInt(selectedUser);
        if (isNaN(assigneeId)) {
          throw new Error("Invalid assignee selected");
        }
      }

      console.log('Submitting assignment:', {
        programId: program.id,
        assigneeId,
        notes: notes.trim() || undefined
      });

      await assignMutation.mutateAsync({
        programId: program.id,
        assigneeId,
        notes: notes.trim() || undefined
      });
    } catch (error) {
      console.error('Assignment error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isProgramLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
        <BackNavigation />
        <div className="container mx-auto px-4 pt-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Program Not Found</h1>
            <p className="text-muted-foreground">The program you're trying to assign could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <BackNavigation />
      
      <div className="container mx-auto px-4 pt-20 pb-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Assign Program</h1>
            </div>
            <p className="text-muted-foreground">
              Assign "{program.title}" to an athlete. They will receive a notification and can access it from their dashboard.
            </p>
          </div>

          {/* Program Info Card */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-2">{program.title}</h2>
            {program.description && (
              <p className="text-muted-foreground mb-4">{program.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>Duration: {program.duration} weeks</span>
              <span>Sessions: {program.totalSessions}</span>
              <span>Level: {program.level}</span>
              <span>Category: {program.category}</span>
            </div>
          </div>

          {/* Assignment Form */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="space-y-6">
              {/* Athlete Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Select Athlete</label>
                {isLoadingAssignees ? (
                  <div className="flex items-center justify-center h-12">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                ) : (!potentialAssignees || (potentialAssignees.length === 0 && !user)) ? (
                  <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                    <p className="text-sm text-muted-foreground">
                      No eligible athletes found. Invite athletes to your club to assign programs to them.
                    </p>
                  </div>
                ) : (
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select an athlete" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Myself</SelectLabel>
                        <SelectItem value="myself">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            Assign to myself
                          </div>
                        </SelectItem>
                      </SelectGroup>
                      
                      {Array.isArray(potentialAssignees) && potentialAssignees.length > 0 && (
                        <SelectGroup>
                          <SelectLabel>Other Athletes</SelectLabel>
                          {potentialAssignees.map((athlete: any) => (
                            <SelectItem key={athlete.id} value={athlete.id.toString()}>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                {athlete.name || athlete.username}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              {/* Notes */}
              <div className="space-y-3">
                <label htmlFor="notes" className="text-sm font-medium">
                  Notes (Optional)
                </label>
                <Textarea
                  id="notes"
                  placeholder="Add instructions or notes for the athlete..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[120px] bg-slate-700/50 border-slate-600"
                />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Button 
                variant="outline" 
                onClick={() => setLocation('/programs')}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !selectedUser}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Assign Program
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}