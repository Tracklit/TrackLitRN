import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ExternalLink, Download, RefreshCw } from "lucide-react";

interface DocumentViewerProps {
  fileUrl: string | null;
  fileName?: string;
  className?: string;
  minHeight?: string;
}

export default function DocumentViewer({ 
  fileUrl, 
  fileName = "Program Document", 
  className = "", 
  minHeight = "600px" 
}: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [viewerKey, setViewerKey] = useState(Date.now());
  
  // Google Docs viewer URL for PDF and other documents
  const pdfViewerUrl = "https://docs.google.com/viewer?embedded=true&url=";
  
  const refreshViewer = () => {
    setIsLoading(true);
    // Force iframe to reload by changing the key
    setViewerKey(Date.now());
    setTimeout(() => setIsLoading(false), 1000);
  };

  // Construct the full URL for the document
  const fullUrl = fileUrl && !fileUrl.startsWith('http') 
    ? window.location.origin + fileUrl 
    : fileUrl;
    
  // Construct the full viewer URL with the document URL as a parameter
  const documentViewerUrl = fullUrl ? `${pdfViewerUrl}${encodeURIComponent(fullUrl)}` : '';

  return (
    <Card className={`w-full shadow-lg overflow-hidden ${className}`}>
      <CardContent className="p-0">
        {fileUrl ? (
          <div className="relative">
            <iframe
              key={viewerKey}
              src={documentViewerUrl}
              className="w-full border-0"
              style={{ minHeight }}
              title="Document Viewer"
              allowFullScreen
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <Button 
                size="sm" 
                variant="secondary"
                className="bg-white/90 hover:bg-white"
                onClick={refreshViewer}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                size="sm" 
                variant="secondary"
                className="bg-white/90 hover:bg-white"
                asChild
              >
                <a href={fullUrl} download>
                  <Download className="h-4 w-4" />
                </a>
              </Button>
              <Button 
                size="sm" 
                variant="secondary"
                className="bg-white/90 hover:bg-white"
                asChild
              >
                <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-12 bg-muted/50" style={{ minHeight }}>
            <FileText className="h-16 w-16 mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Document Available</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              This program doesn't have an attached document yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}