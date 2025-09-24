import { useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, FileVideo } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploaderProps {
  onVideoUploaded: (file: File | null) => void;
  currentFile: File | null;
}

export function Uploader({ onVideoUploaded, currentFile }: UploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (limit to 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select a video smaller than 100MB",
        variant: "destructive"
      });
      return;
    }

    console.log('📹 Video file selected:', file.name, file.size, 'bytes');
    onVideoUploaded(file);

    toast({
      title: "Video uploaded",
      description: `Selected ${file.name} for analysis`
    });
  }, [onVideoUploaded, toast]);

  const handleRemoveFile = useCallback(() => {
    onVideoUploaded(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    toast({
      title: "Video removed",
      description: "File has been cleared"
    });
  }, [onVideoUploaded, toast]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please drop a video file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please drop a video smaller than 100MB",
        variant: "destructive"
      });
      return;
    }

    console.log('📹 Video file dropped:', file.name, file.size, 'bytes');
    onVideoUploaded(file);

    toast({
      title: "Video uploaded",
      description: `Dropped ${file.name} for analysis`
    });
  }, [onVideoUploaded, toast]);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Video
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!currentFile ? (
          <div
            className="border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            data-testid="upload-drop-zone"
          >
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload Exercise Video</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click to browse or drag and drop a video file
            </p>
            <p className="text-xs text-muted-foreground">
              Supports MP4, WebM, MOV • Max size: 100MB
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="file-input"
            />
          </div>
        ) : (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileVideo className="h-8 w-8 text-blue-500" />
                <div>
                  <h4 className="font-medium">{currentFile.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(currentFile.size)} • {currentFile.type}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleRemoveFile}
                variant="ghost"
                size="sm"
                data-testid="button-remove-file"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}