import { useState, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Lock, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: { uploadURL: string; file: File }) => void;
  buttonClassName?: string;
  children: ReactNode;
  requiresSubscription?: boolean;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management with subscription-based restrictions.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Subscription-based access control for premium features
 * - Provides a modal interface for file selection, preview, and upload progress
 * - Automatically handles subscription validation
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL)
 * @param props.onComplete - Callback function called when upload is complete
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 * @param props.requiresSubscription - Whether upload requires a subscription (default: true)
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
  requiresSubscription = true,
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isSubscriber, subscriptionTier, isLoading } = useAuth();
  const { toast } = useToast();

  // Handle file selection and upload
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file size
    if (file.size > maxFileSize) {
      toast({
        title: "File Too Large",
        description: `File size must be less than ${Math.round(maxFileSize / 1048576)}MB`,
        variant: "destructive"
      });
      return;
    }

    // Validate file type (images only for marketplace)
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Only image files are allowed",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Get upload parameters
      const uploadParams = await onGetUploadParameters();
      
      // Upload file
      const response = await fetch(uploadParams.url, {
        method: uploadParams.method,
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      // Extract the URL from the response
      const uploadURL = uploadParams.url.split('?')[0]; // Remove query parameters

      // Call completion callback
      onComplete?.({ uploadURL, file });

      toast({
        title: "Upload Successful",
        description: "Your image has been uploaded successfully",
        variant: "default"
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle subscription check and trigger file input
  const handleUploadClick = () => {
    if (isLoading || isUploading) return;

    if (requiresSubscription && !isSubscriber) {
      toast({
        title: "Subscription Required",
        description: "Image upload is available for Pro and Star subscribers only. Please upgrade your account to use this feature.",
        variant: "destructive"
      });
      return;
    }

    // Trigger file input
    fileInputRef.current?.click();
  };

  // Show upgrade prompt for non-subscribers
  if (requiresSubscription && !isLoading && !isSubscriber) {
    return (
      <Card className="bg-white/5 backdrop-blur-sm border-white/20">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-2">
            <Lock className="h-8 w-8 text-yellow-500" />
          </div>
          <CardTitle className="text-white text-sm">Premium Feature</CardTitle>
          <CardDescription className="text-gray-300 text-xs">
            Image upload requires a subscription
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-3 text-center">
            <div className="flex justify-center gap-2">
              <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                <Crown className="h-3 w-3 mr-1" />
                Pro
              </Badge>
              <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                <Crown className="h-3 w-3 mr-1" />
                Star
              </Badge>
            </div>
            <Button
              onClick={handleUploadClick}
              disabled
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 opacity-50 cursor-not-allowed"
            >
              <Lock className="h-4 w-4 mr-2" />
              Upgrade to Upload
            </Button>
            <p className="text-xs text-gray-400">
              Upgrade to Pro or Star to upload custom preview images for your listings
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Button
        type="button"
        onClick={handleUploadClick}
        className={buttonClassName}
        disabled={isLoading || isUploading}
      >
        {isUploading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
            Uploading...
          </div>
        ) : isLoading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
            Loading...
          </div>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            {children}
          </>
        )}
      </Button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        multiple={maxNumberOfFiles > 1}
      />
    </div>
  );
}