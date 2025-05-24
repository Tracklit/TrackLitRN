import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, RefreshCw, FileText } from "lucide-react";
import DocumentUploadDialog from "@/components/document-upload-dialog";

interface Program {
  id: number;
  title: string;
  programFileUrl?: string | null;
  isUploadedProgram?: boolean;
}

interface ProgramDocumentViewerProps {
  program: Program;
  onFileUploaded?: () => void;
  isEditable?: boolean;
}

export default function ProgramDocumentViewer({ program, onFileUploaded, isEditable = false }: ProgramDocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [viewerKey, setViewerKey] = useState(Date.now());
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  
  // Google Docs viewer URL for PDF and other documents
  const pdfViewerUrl = "https://docs.google.com/viewer?embedded=true&url=";
  
  useEffect(() => {
    if (program?.programFileUrl) {
      // Use absolute URL for external documents
      const fullUrl = program.programFileUrl.startsWith('http') 
        ? program.programFileUrl 
        : window.location.origin + program.programFileUrl;
      
      setFileUrl(fullUrl);
    } else {
      setFileUrl(null);
    }
  }, [program]);

  const refreshViewer = () => {
    setIsLoading(true);
    // Force iframe to reload by changing the key
    setViewerKey(Date.now());
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleFileUploaded = () => {
    if (onFileUploaded) {
      onFileUploaded();
    }
    refreshViewer();
  };

  // Construct the full viewer URL with the document URL as a parameter
  const documentViewerUrl = fileUrl ? `${pdfViewerUrl}${encodeURIComponent(fileUrl)}` : '';

  return (
    <Card className="w-full shadow-lg overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Program Document</CardTitle>
        <div className="flex space-x-2">
          {isEditable && (
            <DocumentUploadDialog 
              programId={program.id} 
              onFileUploaded={handleFileUploaded}
              triggerButton={
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  {program.programFileUrl ? "Replace Document" : "Upload Document"}
                </Button>
              }
            />
          )}
          
          {fileUrl && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={refreshViewer}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {fileUrl ? (
          <iframe
            key={viewerKey}
            src={documentViewerUrl}
            className="w-full min-h-[70vh] border-0"
            title="Program Document"
            allowFullScreen
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-12 bg-muted/50 min-h-[70vh]">
            <FileText className="h-16 w-16 mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Document Available</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              This program doesn't have an attached document yet.
              {isEditable && " Upload a PDF or other document to make it available here."}
            </p>
            
            {isEditable && (
              <DocumentUploadDialog 
                programId={program.id} 
                onFileUploaded={handleFileUploaded}
                triggerButton={
                  <Button variant="default" size="lg">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                }
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}