import { useCallback, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileVideo, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploaderProps {
  onVideoUploaded: (videoFile: File | null) => void;
  // Add a reset trigger to sync with parent state
  key?: string;
}

export function Uploader({ onVideoUploaded }: UploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Sync with parent state - if parent clears video externally, reset our state too
  useEffect(() => {
    // Listen for when parent indicates no video by checking if we have a file but parent doesn't
    // This happens when video is cleared externally (like from saved video selection reset)
    // For now, we'll rely on the removeFile callback to handle clearing
  }, []);

  const validateVideoFile = (file: File): boolean => {
    const validTypes = [
      'video/mp4',
      'video/webm', 
      'video/avi',
      'video/mov',
      'video/quicktime', // iPhone MOV files
      'video/3gpp',      // 3GP mobile format
      'video/3gpp2',     // 3G2 mobile format
      'video/x-msvideo', // AVI alternative
      'video/x-ms-wmv',  // WMV format
      'video/x-flv',     // FLV format
      'video/mkv',       // MKV format
      'video/ogg',       // OGG format
      'video/ogv',       // OGV format
      'video/m4v',       // M4V format
      'video/x-m4v'      // M4V alternative
    ];
    const maxSize = 500 * 1024 * 1024; // 500MB

    // Check if file type starts with 'video/' or is in our valid types list
    const isValidType = file.type.startsWith('video/') || validTypes.includes(file.type);
    
    if (!isValidType) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file from your photo library.",
        variant: "destructive"
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload files smaller than 500MB.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (validateVideoFile(file)) {
      setUploadedFile(file);
      onVideoUploaded(file);
      toast({
        title: "Video uploaded",
        description: `${file.name} ready for analysis`
      });
    }
  }, [onVideoUploaded, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
    // Clear the input value after processing to allow re-selecting the same file
    e.target.value = '';
  }, [handleFileUpload]);

  const removeFile = useCallback(() => {
    setUploadedFile(null);
    // Clear the file input value so the same file can be re-selected
    const fileInput = document.getElementById('video-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    // Pass null to parent to clear video and analysis data
    onVideoUploaded(null);
  }, [onVideoUploaded]);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Upload className="text-accent mr-2 h-5 w-5" />
          Upload Video
        </CardTitle>
      </CardHeader>
      <CardContent>
        {uploadedFile ? (
          // File uploaded state
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border">
              <div className="flex items-center space-x-3">
                <FileVideo className="h-8 w-8 text-chart-2" />
                <div>
                  <p className="font-medium text-foreground">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="text-destructive hover:text-destructive/80 p-1"
                data-testid="button-remove-file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          // Upload zone
          <div
            className={`aspect-video rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
              isDragOver 
                ? 'border-primary bg-primary/10' 
                : 'border-border hover:border-primary/50 bg-muted hover:bg-muted/80'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('video-upload')?.click()}
            data-testid="upload-zone"
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">
                  Drop video file here or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  All video formats supported from photo library (max 500MB)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          id="video-upload"
          type="file"
          accept="video/mp4,video/webm,video/avi,video/mov,video/quicktime,video/3gpp,video/3gpp2,video/x-msvideo,video/x-ms-wmv,video/x-flv,video/mkv,video/ogg,video/ogv,video/m4v,video/*"
          onChange={handleFileSelect}
          className="hidden"
          data-testid="input-file"
        />
      </CardContent>
    </Card>
  );
}
