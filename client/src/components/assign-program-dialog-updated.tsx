import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

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
  variant = "outline", 
  size = "sm", 
  fullWidth = false, 
  buttonText = "Assign Program" 
}: AssignProgramDialogProps) {
  const [, setLocation] = useLocation();

  const handleAssignClick = () => {
    setLocation(`/assign-program/${program.id}`);
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={`${fullWidth ? "w-full" : ""} ${className}`}
      onClick={handleAssignClick}
    >
      <Users className="h-3.5 w-3.5 mr-1.5" />
      {buttonText}
    </Button>
  );
}