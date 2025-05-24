import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Image } from "lucide-react";
import { ProgramCoverUpload } from "@/components/program-cover-upload";
import { PageHeader } from "@/components/page-header";
import { ProtectedRoute } from "@/lib/protected-route";

function ProgramCoverPage() {
  const { id } = useParams<{ id: string }>();
  const programId = parseInt(id);
  
  // Fetch program details
  const { data: program = {}, isLoading } = useQuery<any>({
    queryKey: ['/api/programs', programId],
    enabled: !isNaN(programId),
  });

  if (isLoading) {
    return <div className="container flex items-center justify-center min-h-screen">Loading program details...</div>;
  }

  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
      <div className="mb-6 flex items-center">
        <Button variant="outline" asChild>
          <Link href={`/programs/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Program
          </Link>
        </Button>
      </div>
      
      <PageHeader 
        title={`Upload Cover Image for ${program.title || 'Program'}`}
        description="Add a custom cover image to make your program more visually appealing"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Image className="h-5 w-5 mr-2" />
              Program Cover Image
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProgramCoverUpload 
              programId={programId} 
              initialImageUrl={program.coverImageUrl || ''} 
              className="w-full"
            />
            
            <div className="mt-6 text-sm text-muted-foreground">
              <p>A good cover image will help your program stand out in the listings and give users a visual preview of what to expect.</p>
              <p className="mt-2">Recommended image size: 1200 x 630 pixels</p>
            </div>
          </CardContent>
        </Card>
        
        <div className="flex flex-col space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Program Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <div className="text-lg font-semibold">{program.title || 'Program Title'}</div>
                <div className="text-sm text-muted-foreground mt-1">{program.category ? program.category.replace('_', ' ') : 'Category'} • {program.level || 'Level'}</div>
                <div className="mt-3 text-sm">{program.description || 'No description provided'}</div>
                
                <div className="mt-4">
                  <Button asChild>
                    <Link href={`/programs/${id}`}>
                      View Program Details
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Tips for Great Cover Images</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm space-y-2">
                <li>Use high-quality, relevant images that represent your program</li>
                <li>Avoid text-heavy images as they may not be readable in thumbnails</li>
                <li>Consider using images that convey the intensity or focus of your program</li>
                <li>Ensure good contrast so the image is visible in both light and dark modes</li>
                <li>For sprint programs, consider action shots of sprinters or starting blocks</li>
                <li>For distance programs, scenic running routes or finish lines work well</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Export the component to be used in App.tsx with the route
export default ProgramCoverPage;