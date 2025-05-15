import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Program } from "@shared/schema";

interface SelfAssignProgramDialogProps {
  program: Program;
  buttonText?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function SelfAssignProgramDialog({ 
  program, 
  buttonText = "Start Free", 
  size = "default", 
  variant = "default" 
}: SelfAssignProgramDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const selfAssignMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/programs/${program.id}/self-assign`, { notes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assigned-programs"] });
      toast({
        title: "Program Assigned",
        description: "You have successfully assigned the program to yourself. You can view it in your assigned programs.",
      });
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to assign program",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    selfAssignMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size={size} variant={variant}>{buttonText}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start Training Program</DialogTitle>
          <DialogDescription>
            You're about to start "{program.title}". Add any notes about your goals for this program.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes or goals for this program..."
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={selfAssignMutation.isPending}
            >
              {selfAssignMutation.isPending ? "Starting..." : "Start Program"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}