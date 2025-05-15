import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
import { apiRequest } from "@/lib/queryClient";

interface AssignProgramDialogProps {
  program: any;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  fullWidth?: boolean;
  buttonText?: string;
}

export function AssignProgramDialog({ 
  program, 
  className = "", 
  variant = "default",
  size = "sm",
  fullWidth = false,
  buttonText = "Assign"
}: AssignProgramDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Query for potential assignees (athletes the coach can assign programs to)
  const { data: potentialAssignees = [], isLoading } = useQuery({
    queryKey: ['/api/programs', program.id, 'potential-assignees'],
    queryFn: async () => {
      const response = await fetch(`/api/programs/${program.id}/potential-assignees`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch potential assignees");
      }
      return response.json();
    },
    enabled: isOpen, // Only fetch when dialog is open
  });
  
  // Mutation to assign program to user
  const assignMutation = useMutation({
    mutationFn: async (data: { assigneeId: number; notes: string }) => {
      const response = await apiRequest(
        "POST", 
        `/api/programs/${program.id}/assign`, 
        data
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign program");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Program assigned successfully",
      });
      setIsOpen(false);
      setSelectedUser("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ['/api/assigned-programs'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });
  
  const handleSubmit = () => {
    if (!selectedUser) {
      toast({
        title: "Error",
        description: "Please select an athlete to assign this program to",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    assignMutation.mutate({
      assigneeId: parseInt(selectedUser),
      notes,
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={`${fullWidth ? "w-full" : ""} ${className}`}
        >
          <Users className="h-3.5 w-3.5 mr-1.5" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Program to Athlete</DialogTitle>
          <DialogDescription>
            Select an athlete to assign "{program.title}" to. They will receive a notification and can access it from their dashboard.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="assignee" className="text-sm font-medium">
              Select Athlete
            </label>
            {isLoading ? (
              <div className="flex items-center justify-center h-10">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            ) : !potentialAssignees || potentialAssignees.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No eligible athletes found. Invite athletes to your club to assign programs to them.
              </div>
            ) : (
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an athlete" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(potentialAssignees) && potentialAssignees.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name || user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes (Optional)
            </label>
            <Textarea
              id="notes"
              placeholder="Add instructions or notes for the athlete..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !selectedUser}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : "Assign Program"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}