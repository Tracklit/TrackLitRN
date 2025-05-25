import { useState } from "react";
import { ProtectedRoute } from "@/lib/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { PageHeader } from "@/components/page-header";

export default function IntervalTimerPage() {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Training Tools", href: "/training-tools" },
    { label: "Interval Timer", href: "/tools/interval-timer" },
  ];

  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 pb-20">
      <Breadcrumb items={breadcrumbItems} />
      
      <PageHeader
        title="Interval Timer"
        description="Set up customized interval training"
      />

      <Card className="w-full max-w-xl mx-auto">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center justify-center h-40">
            <RefreshCw className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Coming Soon!</p>
            <p className="text-sm text-muted-foreground">
              We're working on building an advanced interval timer to help you with your training.
            </p>
          </div>
          
          <div className="mt-8 bg-primary/10 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Features in development:</h3>
            <ul className="text-sm text-muted-foreground text-left list-disc pl-5 space-y-1">
              <li>Custom work/rest intervals</li>
              <li>Multiple interval sets</li>
              <li>Visual and audio cues</li>
              <li>Save and load interval presets</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Protected route wrapper
export function Component() {
  return (
    <ProtectedRoute path="/tools/interval-timer" component={IntervalTimerPage} />
  );
}