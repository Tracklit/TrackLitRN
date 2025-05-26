import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LogoDemo() {
  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
      <PageHeader
        title="Spike Logo Options"
        description="Choose your favorite spike logo design for the Spikes system"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Version 1 - Simple Geometric */}
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-lg">Version 1: Simple Geometric</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center items-center h-32 bg-muted/20 rounded-lg">
              <img src="/spike-logo-v1.svg" alt="Spike Logo V1" className="w-12 h-12" />
            </div>
            <p className="text-sm text-muted-foreground">
              Clean triangular design with gradient fill and subtle highlights. 
              Perfect for a professional, minimalist look.
            </p>
            <div className="flex items-center justify-center gap-2 text-amber-500">
              <img src="/spike-logo-v1.svg" alt="Spike" className="w-5 h-5" />
              <span className="font-semibold">1,250 Spikes</span>
            </div>
          </CardContent>
        </Card>

        {/* Version 2 - Detailed with Threads */}
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-lg">Version 2: Detailed Threads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center items-center h-32 bg-muted/20 rounded-lg">
              <img src="/spike-logo-v2.svg" alt="Spike Logo V2" className="w-12 h-12" />
            </div>
            <p className="text-sm text-muted-foreground">
              Realistic spike with threading details and grip lines. 
              Shows authentic track shoe spike craftsmanship.
            </p>
            <div className="flex items-center justify-center gap-2 text-amber-500">
              <img src="/spike-logo-v2.svg" alt="Spike" className="w-5 h-5" />
              <span className="font-semibold">1,250 Spikes</span>
            </div>
          </CardContent>
        </Card>

        {/* Version 3 - Modern Dynamic */}
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-lg">Version 3: Modern Dynamic</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center items-center h-32 bg-muted/20 rounded-lg">
              <img src="/spike-logo-v3.svg" alt="Spike Logo V3" className="w-12 h-12" />
            </div>
            <p className="text-sm text-muted-foreground">
              Dynamic spike with motion lines and energy effects. 
              Conveys speed, power, and athletic performance.
            </p>
            <div className="flex items-center justify-center gap-2 text-amber-500">
              <img src="/spike-logo-v3.svg" alt="Spike" className="w-5 h-5" />
              <span className="font-semibold">1,250 Spikes</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">Design Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium text-amber-500">Version 1 Features:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Clean geometric shape</li>
              <li>• Professional appearance</li>
              <li>• Easy to recognize at small sizes</li>
              <li>• Works well in monochrome</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-amber-500">Version 2 Features:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Authentic spike details</li>
              <li>• Threaded grip texture</li>
              <li>• Realistic proportions</li>
              <li>• Track athlete familiarity</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-amber-500">Version 3 Features:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Dynamic motion effects</li>
              <li>• Energy and speed emphasis</li>
              <li>• Modern gradient styling</li>
              <li>• Eye-catching glow effect</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}