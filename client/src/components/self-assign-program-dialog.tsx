import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, User } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";

interface SelfAssignProgramDialogProps {
  program: any;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  fullWidth?: boolean;
  buttonText?: string;
}

export function SelfAssignProgramDialog({ 
  program, 
  className = "", 
  variant = "default",
  size = "sm",
  fullWidth = false,
  buttonText = "Start Program"
}: SelfAssignProgramDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Mutation to assign program to yourself
  const assignMutation = useMutation({
    mutationFn: async (data: { notes: string }) => {
      const response = await apiRequest(
        "POST", 
        `/api/programs/${program.id}/self-assign`, 
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
        description: "Program assigned to yourself successfully",
      });
      setIsOpen(false);
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ['/api/assigned-programs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/purchased-programs'] });
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
    setIsSubmitting(true);
    assignMutation.mutate({
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
          <User className="h-3.5 w-3.5 mr-1.5" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start This Program</DialogTitle>
          <DialogDescription>
            You're about to start "{program.title}". You can track your progress and mark sessions as completed.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Personal Notes (Optional)
            </label>
            <Textarea
              id="notes"
              placeholder="Add any personal goals or notes for this program..."
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
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : "Start Program"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}