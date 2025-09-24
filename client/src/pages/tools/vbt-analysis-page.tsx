import { useState } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Upload, BarChart3, Zap, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/page-header";

export default function VBTAnalysisPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleStartAnalysis = () => {
    setIsAnalyzing(true);
    // Simulate analysis process
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 pb-20">
      <PageHeader
        title="VBT Analysis"
        description="Velocity-based training analysis and metrics"
      />

      <div className="grid gap-6 max-w-4xl mx-auto">
        {/* Main Analysis Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Velocity Analysis
            </CardTitle>
            <CardDescription>
              Upload exercise videos to analyze bar velocity, power output, and training metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload Section */}
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload Exercise Video</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload videos of squats, deadlifts, bench press, or other exercises to analyze velocity metrics
              </p>
              <Button 
                onClick={handleStartAnalysis}
                disabled={isAnalyzing}
                data-testid="button-upload-video"
              >
                {isAnalyzing ? "Analyzing..." : "Choose Video File"}
              </Button>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    <h4 className="font-medium">Velocity Tracking</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Measure bar velocity and movement speed throughout each rep
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <h4 className="font-medium">Power Analysis</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Calculate power output and force-velocity relationships
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <h4 className="font-medium">Training Zones</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Identify optimal training zones for strength, power, and speed
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Notice */}
        <Card className="w-full">
          <CardContent className="p-6 text-center">
            <div className="flex flex-col items-center justify-center">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Advanced VBT Features Coming Soon!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We're developing comprehensive velocity-based training analysis tools.
              </p>
            </div>
            
            <div className="bg-primary/10 p-4 rounded-lg text-left">
              <h4 className="font-medium mb-2">Features in development:</h4>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                <li>Real-time velocity measurement</li>
                <li>Power-velocity profiling</li>
                <li>Load-velocity relationships</li>
                <li>1RM estimation from velocity</li>
                <li>Training zone recommendations</li>
                <li>Progress tracking and analytics</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Protected route wrapper
export function Component() {
  return (
    <ProtectedRoute path="/tools/vbt-analysis" component={VBTAnalysisPage} />
  );
}