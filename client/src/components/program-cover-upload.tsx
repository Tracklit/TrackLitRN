import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, Loader2, X } from "lucide-react";

interface ProgramCoverUploadProps {
  programId: number;
  initialImageUrl?: string;
  className?: string;
}

export function ProgramCoverUpload({ programId, initialImageUrl, className }: ProgramCoverUploadProps) {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setImage(file);
    
    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!image) return null;
      
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', image);
      
      const response = await fetch(`/api/programs/${programId}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setUploading(false);
      
      toast({
        title: "Cover image uploaded",
        description: "Your program cover image has been updated successfully",
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/programs', programId] });
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
    },
    onError: (error) => {
      setUploading(false);
      
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    }
  });

  const handleClearImage = () => {
    setImage(null);
    if (previewUrl && !initialImageUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(initialImageUrl || null);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {previewUrl ? (
        <div className="relative rounded-lg overflow-hidden bg-gray-900 border border-gray-800">
          <img 
            src={previewUrl} 
            alt="Program cover preview" 
            className="w-full h-auto object-cover max-h-[300px]"
          />
          
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
            <div className="flex gap-2">
              <Button 
                onClick={() => document.getElementById('cover-image-input')?.click()}
                size="sm"
                variant="secondary"
              >
                Change Image
              </Button>
              
              <Button 
                onClick={handleClearImage}
                size="sm"
                variant="destructive"
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div 
          className="border-2 border-dashed border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center h-[200px] bg-gray-800/50 hover:bg-gray-800 transition-colors cursor-pointer"
          onClick={() => document.getElementById('cover-image-input')?.click()}
        >
          <ImagePlus className="h-10 w-10 mb-4 text-gray-400" />
          <p className="text-sm text-gray-400 text-center mb-2">
            Drag and drop your cover image here, or click to browse
          </p>
          <p className="text-xs text-gray-500 text-center">
            Supported formats: JPEG, PNG, WebP
          </p>
        </div>
      )}
      
      <input
        id="cover-image-input"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      {image && (
        <div className="mt-4 flex justify-end">
          <Button 
            onClick={() => uploadMutation.mutate()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Save Cover Image'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}