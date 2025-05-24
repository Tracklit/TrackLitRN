import { useState } from "react";
import { ImageUpload } from "@/components/ui/image-upload";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ProgramCoverUploadProps {
  programId: number;
  initialImageUrl?: string;
  className?: string;
}

export function ProgramCoverUpload({ 
  programId, 
  initialImageUrl = '',
  className = ''
}: ProgramCoverUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Handle cover image upload
  const handleCoverImageUpload = async (fileOrUrl: string | File) => {
    // If it's a string URL and not a File object, we're just setting the initial state
    if (typeof fileOrUrl === 'string') {
      // If empty string, it means we're clearing the image
      if (!fileOrUrl) {
        // Here we would handle clearing the image, but we'll keep it simple for now
        return null;
      }
      return fileOrUrl;
    }
    
    // Otherwise, it's a File object from the file input
    const file = fileOrUrl as File;
    if (!programId || !file) return null;
    
    try {
      setIsUploading(true);
      
      // Create form data for the upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload the image using fetch directly
      const response = await fetch(`/api/programs/${programId}/cover-image`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload cover image: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Refresh program data
      queryClient.invalidateQueries({ queryKey: ['/api/programs', programId] });
      
      toast({
        title: "Cover image updated",
        description: "Program preview image has been updated successfully."
      });
      
      return data.coverImageUrl;
    } catch (error) {
      console.error("Error updating cover image:", error);
      toast({
        title: "Error updating cover image",
        description: "Failed to update program cover image.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      <label className="text-sm font-medium">Program Cover Image</label>
      <div className="border border-gray-700 rounded-md p-1 bg-gray-900">
        <ImageUpload 
          initialImageUrl={initialImageUrl} 
          onImageUploaded={(file) => handleCoverImageUpload(file)} 
          className="h-[180px] w-full"
        />
        {isUploading && (
          <div className="mt-2 flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            Uploading image...
          </div>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        Upload a cover image to make your program more visually appealing.
      </div>
    </div>
  );
}