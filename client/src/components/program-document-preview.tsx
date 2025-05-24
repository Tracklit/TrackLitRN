import { useState } from 'react';
import { FileText, ExternalLink, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProgramDocumentPreviewProps {
  fileUrl: string;
  title?: string;
  fileType?: string;
}

export function ProgramDocumentPreview({ fileUrl, title = "Program Document", fileType = "" }: ProgramDocumentPreviewProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewerKey, setViewerKey] = useState(Date.now());
  
  // Google Docs viewer URL for PDF and other documents
  const pdfViewerUrl = "https://docs.google.com/viewer?embedded=true&url=";
  
  // Create an absolute URL if needed
  const absoluteFileUrl = fileUrl.startsWith('http') 
    ? fileUrl 
    : window.location.origin + fileUrl;
  
  // Create the viewer URL
  const documentViewerUrl = `${pdfViewerUrl}${encodeURIComponent(absoluteFileUrl)}`;
  
  // Determine file type display
  let fileTypeDisplay = 'Document';
  let fileTypeColor = 'text-blue-500';
  
  if (fileType.includes('pdf')) {
    fileTypeDisplay = 'PDF';
    fileTypeColor = 'text-red-500';
  } else if (fileType.includes('word') || fileType.includes('document')) {
    fileTypeDisplay = 'Word Document';
    fileTypeColor = 'text-blue-600';
  } else if (fileType.includes('excel') || fileType.includes('sheet')) {
    fileTypeDisplay = 'Excel Spreadsheet';
    fileTypeColor = 'text-green-600';
  }
  
  const refreshViewer = () => {
    setIsRefreshing(true);
    setViewerKey(Date.now());
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={refreshViewer}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center">
              <FileText className={`h-5 w-5 mr-2 ${fileTypeColor}`} />
              <span className="font-medium">{fileTypeDisplay}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={absoluteFileUrl} download>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
              <Button size="sm" asChild>
                <a href={absoluteFileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open
                </a>
              </Button>
            </div>
          </div>
          
          <iframe
            key={viewerKey}
            src={documentViewerUrl}
            className="w-full min-h-[600px] border-0"
            title="Program Document"
            allowFullScreen
          />
        </div>
      </CardContent>
    </Card>
  );
}