import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type TimingPreference = "reaction" | "firstFoot" | "onMovement";

interface TimingSettings {
  timingPreference: TimingPreference;
}

export default function TimingSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [timingPreference, setTimingPreference] = useState<TimingPreference>("onMovement");

  // Fetch current timing settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/athlete-profile'],
    select: (data: any) => ({
      timingPreference: data?.timingPreference || "onMovement"
    })
  });

  // Update timing settings
  const { mutate: saveSettings, isPending } = useMutation({
    mutationFn: async (newSettings: TimingSettings) => {
      return apiRequest('PATCH', '/api/athlete-profile', newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/athlete-profile'] });
      toast({
        title: "Settings saved",
        description: "Your timing preferences have been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving settings",
        description: "Failed to save timing preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Set initial value when data loads
  useState(() => {
    if (settings?.timingPreference) {
      setTimingPreference(settings.timingPreference);
    }
  })

  const handleSave = () => {
    saveSettings({ timingPreference });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Timing Settings</h1>
        <p className="text-muted-foreground">
          Configure how your race times are measured and displayed in the practice timing drawer.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timing Preference</CardTitle>
          <CardDescription>
            Choose how you want your times to be calculated and displayed in practice sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="timing-preference">Timing Method</Label>
            <Select 
              value={timingPreference} 
              onValueChange={(value: TimingPreference) => setTimingPreference(value)}
              data-testid="select-timing-preference"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timing method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reaction" data-testid="option-reaction">
                  Reaction Time - From gun to finish
                </SelectItem>
                <SelectItem value="firstFoot" data-testid="option-firstfoot">
                  First Foot - From first movement to finish  
                </SelectItem>
                <SelectItem value="onMovement" data-testid="option-onmovement">
                  On Movement - From body movement to finish
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              This affects how target times are calculated in your practice sessions.
            </p>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={isPending}
            data-testid="button-save-settings"
            className="w-full"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Timing Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}