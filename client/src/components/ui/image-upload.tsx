import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  initialImageUrl?: string;
  onImageUploaded: (imageUrl: string) => void;
  className?: string;
}

export function ImageUpload({ 
  initialImageUrl, 
  onImageUploaded, 
  className = "" 
}: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState<string>(initialImageUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // Call the onImageUploaded callback with the file
      // This allows parent components to handle the upload process
      onImageUploaded(file as unknown as string);
      
      // We'll set the imageUrl if the parent successfully uploads and provides a URL
      // Otherwise this component will just be used to capture the file
    } catch (error) {
      console.error('Error handling image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    onImageUploaded("");
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="image-upload"
      />
      
      {imageUrl ? (
        <div className="relative rounded-md overflow-hidden">
          <img 
            src={imageUrl} 
            alt="Program cover" 
            className="w-full h-40 object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center h-40 cursor-pointer bg-gray-50 dark:bg-gray-900 dark:border-gray-700"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center text-center">
            <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isUploading ? "Uploading..." : "Click to upload a cover image"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              JPG, PNG, GIF up to 5MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}