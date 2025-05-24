import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UploadCloud, Loader2 } from "lucide-react";

interface DocumentUploadDialogProps {
  programId: number;
  onFileUploaded?: () => void;
  triggerButton: React.ReactNode;
}

export default function DocumentUploadDialog({ 
  programId, 
  onFileUploaded,
  triggerButton 
}: DocumentUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  
  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('programFile', file);
      formData.append('isUploadedProgram', 'true');
      
      // Make the file upload request
      const response = await fetch(`/api/programs/${programId}/document`, {
        method: 'PUT',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload document');
      }
      
      return await response.json();
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Document uploaded",
        description: "Your document has been successfully attached to the program.",
      });
      
      // Invalidate related queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/programs', programId] });
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      
      // Close the dialog
      setIsOpen(false);
      
      // Call the callback if provided
      if (onFileUploaded) {
        onFileUploaded();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Could not upload document. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    uploadMutation.mutate(selectedFile);
  };
  
  // Trigger button with click handler to open the dialog
  const trigger = (
    <div onClick={() => setIsOpen(true)}>
      {triggerButton}
    </div>
  );
  
  return (
    <>
      {trigger}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Program Document</DialogTitle>
            <DialogDescription>
              Upload a PDF document to attach to this program. This will be displayed instead of the weekly schedule.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="program-file">Program Document</Label>
                <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center">
                  <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="mb-2 text-sm font-semibold">
                    {selectedFile ? selectedFile.name : "Drag & drop your file here"}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Supported formats: PDF, DOCX, XLSX, PPT (Max 10MB)
                  </p>
                  
                  <Label 
                    htmlFor="program-file" 
                    className="cursor-pointer inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Choose File
                  </Label>
                  <Input
                    id="program-file"
                    type="file"
                    accept=".pdf,.docx,.doc,.xlsx,.xls,.ppt,.pptx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                  </p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={uploadMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!selectedFile || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload Document"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}