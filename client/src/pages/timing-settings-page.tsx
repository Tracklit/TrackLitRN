import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAthleteProfileSchema } from "@shared/athlete-profile-schema";
import { z } from "zod";

type TimingPreference = "reaction" | "firstFoot" | "onMovement";

// Create form schema with validation - handle string inputs from form fields
const timingSettingsSchema = z.object({
  sprint60m100m: z.boolean(),
  sprint200m: z.boolean(),
  sprint400m: z.boolean(),
  hurdles100m110m: z.boolean(),
  hurdles400m: z.boolean(),
  otherEvent: z.boolean(),
  otherEventName: z.string().optional(),
  // Goal time fields accept strings and convert to numbers
  sprint60m100mGoal: z.string().optional(),
  sprint200mGoal: z.string().optional(),
  sprint400mGoal: z.string().optional(),
  hurdles100m110mGoal: z.string().optional(),
  hurdles400mGoal: z.string().optional(),
  otherEventGoal: z.string().optional(),
  timingPreference: z.enum(["reaction", "firstFoot", "onMovement"]),
});

type TimingSettingsForm = z.infer<typeof timingSettingsSchema>;

export default function TimingSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current athlete profile/timing settings
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['/api/athlete-profile']
  });

  // Initialize form with default values
  const form = useForm<TimingSettingsForm>({
    resolver: zodResolver(timingSettingsSchema),
    defaultValues: {
      sprint60m100m: false,
      sprint200m: false,
      sprint400m: false,
      hurdles100m110m: false,
      hurdles400m: false,
      otherEvent: false,
      otherEventName: "",
      sprint60m100mGoal: "",
      sprint200mGoal: "",
      sprint400mGoal: "",
      hurdles100m110mGoal: "",
      hurdles400mGoal: "",
      otherEventGoal: "",
      timingPreference: "onMovement",
    },
  });

  // Update form when profile data loads
  useEffect(() => {
    if (profile) {
      form.reset({
        sprint60m100m: profile.sprint60m100m || false,
        sprint200m: profile.sprint200m || false,
        sprint400m: profile.sprint400m || false,
        hurdles100m110m: profile.hurdles100m110m || false,
        hurdles400m: profile.hurdles400m || false,
        otherEvent: profile.otherEvent || false,
        otherEventName: profile.otherEventName || "",
        sprint60m100mGoal: profile.sprint60m100mGoal?.toString() || "",
        sprint200mGoal: profile.sprint200mGoal?.toString() || "",
        sprint400mGoal: profile.sprint400mGoal?.toString() || "",
        hurdles100m110mGoal: profile.hurdles100m110mGoal?.toString() || "",
        hurdles400mGoal: profile.hurdles400mGoal?.toString() || "",
        otherEventGoal: profile.otherEventGoal?.toString() || "",
        timingPreference: profile.timingPreference || "onMovement",
      });
    }
  }, [profile, form]);

  // Update timing settings
  const { mutate: saveSettings, isPending } = useMutation({
    mutationFn: async (newSettings: TimingSettingsForm) => {
      // Convert string values to numbers for goal times
      const processedSettings = {
        ...newSettings,
        sprint60m100mGoal: newSettings.sprint60m100mGoal ? parseFloat(newSettings.sprint60m100mGoal) : null,
        sprint200mGoal: newSettings.sprint200mGoal ? parseFloat(newSettings.sprint200mGoal) : null,
        sprint400mGoal: newSettings.sprint400mGoal ? parseFloat(newSettings.sprint400mGoal) : null,
        hurdles100m110mGoal: newSettings.hurdles100m110mGoal ? parseFloat(newSettings.hurdles100m110mGoal) : null,
        hurdles400mGoal: newSettings.hurdles400mGoal ? parseFloat(newSettings.hurdles400mGoal) : null,
        otherEventGoal: newSettings.otherEventGoal ? parseFloat(newSettings.otherEventGoal) : null,
      };
      
      return apiRequest('PATCH', '/api/athlete-profile', processedSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/athlete-profile'] });
      toast({
        title: "Settings saved",
        description: "Your timing settings and event preferences have been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving settings",
        description: "Failed to save timing settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TimingSettingsForm) => {
    saveSettings(data);
  };

  if (isProfileLoading) {
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
          Configure your event preferences and goal times. These settings affect how your race times are calculated in practice sessions.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Events and Goal Times Table */}
          <Card>
            <CardHeader>
              <CardTitle>Events & Goal Times</CardTitle>
              <CardDescription>
                Select the events you participate in and set your goal times.
                Goal times help us calculate your 100% pace for workouts and target times in practice sessions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 items-center font-medium">
                  <div className="col-span-5">Event</div>
                  <div className="col-span-7">Goal Time (seconds)</div>
                </div>
                <Separator />

                {/* 100m Event */}
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5">
                    <FormField
                      control={form.control}
                      name="sprint60m100m"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-100m"
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            100m
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-7">
                    <FormField
                      control={form.control}
                      name="sprint60m100mGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g. 10.50"
                              step="0.01"
                              disabled={!form.watch("sprint60m100m")}
                              data-testid="input-100m-goal"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* 200m Event */}
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5">
                    <FormField
                      control={form.control}
                      name="sprint200m"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-200m"
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            200m
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-7">
                    <FormField
                      control={form.control}
                      name="sprint200mGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g. 21.50"
                              step="0.01"
                              disabled={!form.watch("sprint200m")}
                              data-testid="input-200m-goal"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* 400m Event */}
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5">
                    <FormField
                      control={form.control}
                      name="sprint400m"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-400m"
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            400m
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-7">
                    <FormField
                      control={form.control}
                      name="sprint400mGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g. 48.50"
                              step="0.01"
                              disabled={!form.watch("sprint400m")}
                              data-testid="input-400m-goal"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* 100/110m Hurdles Event */}
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5">
                    <FormField
                      control={form.control}
                      name="hurdles100m110m"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-hurdles100-110"
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            100/110m Hurdles
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-7">
                    <FormField
                      control={form.control}
                      name="hurdles100m110mGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g. 13.80"
                              step="0.01"
                              disabled={!form.watch("hurdles100m110m")}
                              data-testid="input-hurdles100-110-goal"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* 400m Hurdles Event */}
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5">
                    <FormField
                      control={form.control}
                      name="hurdles400m"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-hurdles400"
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            400m Hurdles
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-7">
                    <FormField
                      control={form.control}
                      name="hurdles400mGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g. 54.00"
                              step="0.01"
                              disabled={!form.watch("hurdles400m")}
                              data-testid="input-hurdles400-goal"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Other Event */}
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5">
                    <FormField
                      control={form.control}
                      name="otherEvent"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-other-event"
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Other Event
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-7">
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name="otherEventName"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Event name"
                                disabled={!form.watch("otherEvent")}
                                data-testid="input-other-event-name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="otherEventGoal"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Goal time"
                                step="0.01"
                                disabled={!form.watch("otherEvent")}
                                data-testid="input-other-event-goal"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timing Preference */}
          <Card>
            <CardHeader>
              <CardTitle>Timing Preference</CardTitle>
              <CardDescription>
                Choose how you want your times to be calculated and displayed in practice sessions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="timingPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timing Method</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      data-testid="select-timing-preference"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timing method" />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={isPending}
                data-testid="button-save-settings"
                className="w-full"
              >
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Timing Settings
              </Button>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}