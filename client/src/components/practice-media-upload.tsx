import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Image, FileVideo, Upload, X, Camera, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PracticeMediaUploadProps {
  sessionId: number;
  completionId?: number;
  onComplete?: (mediaId: number) => void;
}

export function PracticeMediaUpload({ 
  sessionId, 
  completionId,
  onComplete 
}: PracticeMediaUploadProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Create XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentCompleted = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      // Create a promise wrapper around XMLHttpRequest
      const response = await new Promise<Response>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(new Response(xhr.response, {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: new Headers({
                'Content-Type': 'application/json'
              })
            }));
          } else {
            reject(new Error('Upload failed'));
          }
        };
        xhr.onerror = () => reject(new Error('Network error during upload'));
        xhr.open('POST', '/api/practice/media');
        xhr.responseType = 'json';
        xhr.send(formData);
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Media uploaded',
        description: 'Your media has been uploaded successfully.'
      });
      
      queryClient.invalidateQueries({
        queryKey: ['/api/practice/completions', completionId],
      });
      
      // Reset form
      setSelectedFile(null);
      setPreview(null);
      setUploadProgress(0);
      
      if (onComplete) {
        onComplete(data.id);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload media. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(null);
      setPreview(null);
      return;
    }

    const file = e.target.files[0];
    setSelectedFile(file);

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Reset the file input
    e.target.value = '';
    
    return () => URL.revokeObjectURL(objectUrl);
  };

  // Handle camera capture for photos
  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  // Prepare the upload
  const handleUpload = async () => {
    if (!selectedFile || !completionId) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('completionId', completionId.toString());
    formData.append('sessionId', sessionId.toString());
    formData.append('type', selectedFile.type.startsWith('video/') ? 'video' : 'image');
    
    uploadMutation.mutate(formData);
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {!selectedFile ? (
            <>
              <div className="flex items-center justify-center p-6 border-2 border-dashed rounded-lg border-slate-300 bg-slate-50">
                <div className="text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Image className="w-8 h-8 text-slate-400" />
                    <FileVideo className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    Upload training photos and videos
                  </p>
                  <div className="flex gap-2 mt-4 justify-center">
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Upload className="w-4 h-4" />
                      Choose File
                    </Button>
                    <Button 
                      onClick={handleCameraCapture}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Camera className="w-4 h-4" />
                      Capture
                    </Button>
                  </div>
                </div>
              </div>
              
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <Input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </>
          ) : (
            <>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 rounded-full p-1 h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
                
                {selectedFile.type.startsWith('image/') ? (
                  <img
                    src={preview || ''}
                    alt="Preview"
                    className="w-full h-auto rounded-lg max-h-[300px] object-contain"
                  />
                ) : (
                  <video
                    src={preview || ''}
                    controls
                    className="w-full h-auto rounded-lg max-h-[300px]"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-slate-500 truncate">
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
                
                {uploadProgress > 0 && uploadMutation.isPending && (
                  <Progress value={uploadProgress} className="h-2" />
                )}
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveFile}
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending || !completionId}
                    className={cn(
                      "flex items-center gap-1",
                      !completionId && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
                
                {!completionId && (
                  <p className="text-xs text-amber-500 italic">
                    Complete the practice session first to enable uploads
                  </p>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Hidden canvas for camera capture */}
        <canvas ref={canvasRef} className="hidden" />
        {isCapturing && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
            <video 
              ref={videoRef}
              autoPlay 
              className="max-w-full max-h-full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}