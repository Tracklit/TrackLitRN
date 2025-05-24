import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Download, Edit, ExternalLink, FileText, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { DeleteProgramDialog } from "@/components/delete-program-dialog";

export function Component() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [viewerKey, setViewerKey] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Get program details
  const {
    data: program,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["/api/programs", id],
    queryFn: async () => {
      const response = await fetch(`/api/programs/${id}`);
      if (!response.ok) throw new Error("Failed to fetch program");
      return response.json();
    },
  });
  
  // Google Docs viewer for PDF files
  const pdfViewerUrl = "https://docs.google.com/viewer?embedded=true&url=";
  
  // Create the absolute URL for the document
  const getDocumentUrl = () => {
    if (!program?.programFileUrl) return "";
    
    // If the URL is already absolute, use it as is
    if (program.programFileUrl.startsWith("http")) {
      return program.programFileUrl;
    }
    
    // Otherwise, prepend the origin
    return window.location.origin + program.programFileUrl;
  };
  
  // Create the viewer URL
  const getViewerUrl = () => {
    const docUrl = getDocumentUrl();
    if (!docUrl) return "";
    return `${pdfViewerUrl}${encodeURIComponent(docUrl)}`;
  };
  
  // Extract filename from URL
  const getFileName = () => {
    if (!program?.programFileUrl) return "No document";
    const parts = program.programFileUrl.split("/");
    return parts[parts.length - 1];
  };
  
  const refreshViewer = () => {
    setIsRefreshing(true);
    setViewerKey(Date.now());
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  
  if (isLoading) {
    return (
      <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="rounded-lg bg-slate-200 h-8 w-48 mb-4"></div>
            <div className="h-4 bg-slate-200 rounded w-72 mb-2.5"></div>
            <div className="h-4 bg-slate-200 rounded w-64 mb-2.5"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (isError || !program) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 mb-4">Failed to load program details</p>
        <Button variant="outline" asChild>
          <Link href="/programs">Back to Programs</Link>
        </Button>
      </div>
    );
  }
  
  const documentUrl = getViewerUrl();
  const rawDocumentUrl = getDocumentUrl();
  const fileName = getFileName();
  
  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
      <div className="mb-6 flex justify-between items-center">
        <Button variant="outline" asChild>
          <Link href="/programs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Programs
          </Link>
        </Button>
        
        {/* Show action buttons if user is the program creator */}
        {program.userId === user?.id && (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/programs/${id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Program
              </Link>
            </Button>
            <DeleteProgramDialog
              programId={program.id}
              programTitle={program.title}
              buttonVariant="outline"
            />
          </div>
        )}
      </div>
      
      <PageHeader 
        title={program.title}
        description={program.description || ""}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Main content - Document Viewer */}
        <div className="md:col-span-2">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold">Program Document</CardTitle>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={refreshViewer}
                  disabled={isRefreshing || !program.programFileUrl}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {program.programFileUrl ? (
                <iframe
                  key={viewerKey}
                  src={documentUrl}
                  className="w-full min-h-[70vh] border-0"
                  title="Program Document"
                  allowFullScreen
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-12 bg-muted/50 min-h-[70vh]">
                  <FileText className="h-16 w-16 mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Document Available</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md">
                    This program doesn't have an attached document.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Document action buttons */}
          {program.programFileUrl && (
            <div className="mt-4 flex justify-center gap-4">
              <Button variant="outline" className="flex items-center px-4 py-2" asChild>
                <a href={rawDocumentUrl} download>
                  <Download className="h-4 w-4 mr-2" />
                  Download Document
                </a>
              </Button>
              <Button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700" asChild>
                <a href={rawDocumentUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </a>
              </Button>
            </div>
          )}
        </div>
        
        {/* Side panel with program info */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Program Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Category</h4>
                  <Badge variant="outline" className="capitalize">
                    {program.category || "General"}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Level</h4>
                  <Badge variant="outline" className="capitalize">
                    {program.level || "All Levels"}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Duration</h4>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{program.duration || "--"} weeks</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Created</h4>
                  <div className="text-sm">
                    {program.createdAt ? format(new Date(program.createdAt), 'PPP') : "--"}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">File Type</h4>
                  <div className="text-sm">
                    {program.programFileType || "No file uploaded"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}