import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Save, Edit } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

// Create a schema for the form with Zod
const athleteProfileSchema = z.object({
  sprint60m100m: z.boolean().default(false),
  sprint200m: z.boolean().default(false),
  sprint400m: z.boolean().default(false),
  hurdles100m110m: z.boolean().default(false),
  hurdles400m: z.boolean().default(false),
  otherEvent: z.boolean().default(false),
  otherEventName: z.string().optional(),
  sprint60m100mGoal: z.string().optional().transform(val => val ? parseFloat(val) : null),
  sprint200mGoal: z.string().optional().transform(val => val ? parseFloat(val) : null),
  sprint400mGoal: z.string().optional().transform(val => val ? parseFloat(val) : null),
  hurdles100m110mGoal: z.string().optional().transform(val => val ? parseFloat(val) : null),
  hurdles400mGoal: z.string().optional().transform(val => val ? parseFloat(val) : null),
  otherEventGoal: z.string().optional().transform(val => val ? parseFloat(val) : null),
  otherEventDistance: z.string().optional(),
  timingPreference: z.enum(["on_movement", "first_foot"]).default("on_movement"),
  

});

type AthleteProfileFormValues = z.infer<typeof athleteProfileSchema>;

export default function AthleteProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch the user's profile data
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["/api/athlete-profile"],
    enabled: !!user,
  });

  // Create form with react-hook-form and zod resolver
  const form = useForm<AthleteProfileFormValues>({
    resolver: zodResolver(athleteProfileSchema),
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
      timingPreference: "on_movement",
    },
  });

  // Update form values when profile data is loaded
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
        timingPreference: profile.timingPreference || "on_movement",
      });
    }
  }, [profile, form]);

  // Mutation for creating/updating profile
  const { mutate: saveProfile, isPending: isSaving } = useMutation({
    mutationFn: async (data: AthleteProfileFormValues) => {
      if (profile) {
        // Update existing profile
        return apiRequest("PATCH", "/api/athlete-profile", data);
      } else {
        // Create new profile
        return apiRequest("POST", "/api/athlete-profile", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/athlete-profile"] });
      toast({
        title: "Profile Saved",
        description: "Your athlete profile has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save your athlete profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: AthleteProfileFormValues) => {
    saveProfile(data);
  };

  // Check if the form has any changes
  const hasFormChanges = () => {
    if (!profile) return true; // New profile, always allow save
    return JSON.stringify(form.getValues()) !== JSON.stringify({
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
      timingPreference: profile.timingPreference || "on_movement",
    });
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
        <h1 className="text-2xl font-bold">Athlete Profile</h1>
        <p className="text-muted-foreground">
          Select your events and set your goal times to personalize your workout paces.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Events</CardTitle>
          <CardDescription>
            Select the events you participate in and set your goal times.
            Goal times help us calculate your 100% pace for workouts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 items-center font-medium">
                  <div className="col-span-5">Event</div>
                  <div className="col-span-7">Goal Time</div>
                </div>
                <Separator />

                {/* 60m/100m Event */}
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
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            60m / 100m
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
                              placeholder="e.g. 10.5"
                              step="0.01"
                              disabled={!form.watch("sprint60m100m")}
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
                              placeholder="e.g. 21.5"
                              step="0.01"
                              disabled={!form.watch("sprint200m")}
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
                              placeholder="e.g. 48.5"
                              step="0.01"
                              disabled={!form.watch("sprint400m")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* 100m/110m Hurdles Event */}
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
                              placeholder="e.g. 13.8"
                              step="0.01"
                              disabled={!form.watch("hurdles100m110m")}
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
                              placeholder="e.g. 54.0"
                              step="0.01"
                              disabled={!form.watch("hurdles400m")}
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
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Other
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    {form.watch("otherEvent") && (
                      <FormField
                        control={form.control}
                        name="otherEventName"
                        render={({ field }) => (
                          <FormItem className="mt-2">
                            <FormControl>
                              <Input
                                placeholder="Event name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  <div className="col-span-7">
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
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Timing Preference */}
                <FormField
                  control={form.control}
                  name="timingPreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timing Preference</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select timing preference" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="on_movement">On Movement (-0.15s)</SelectItem>
                          <SelectItem value="first_foot">First Foot (-0.55s)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose how you want your goal times calculated on the Practice card.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSaving || (!hasFormChanges() && profile)}
                className="w-full md:w-auto"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Pace Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Target Times Table</CardTitle>
          <CardDescription>
            This table shows your target times at different percentages based on your goal times. 
            The 100% column represents first foot contact timing (-0.55s from goal time).
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px] sticky left-0 bg-background shadow-sm z-10">Distance</TableHead>
                <TableHead>80%</TableHead>
                <TableHead>90%</TableHead>
                <TableHead>92%</TableHead>
                <TableHead>95%</TableHead>
                <TableHead>98%</TableHead>
                <TableHead>100%</TableHead>
                <TableHead>Goal Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { distance: "50m", baseDistance: "100m", factor: 0.5 },
                { distance: "60m", baseDistance: "100m", factor: 0.6 },
                { distance: "80m", baseDistance: "100m", factor: 0.8 },
                { distance: "100m", baseDistance: "100m", factor: 1.0 },
                { distance: "120m", baseDistance: "100m", factor: 1.2 },
                { distance: "150m", baseDistance: "120m", factor: 1.25 },
                { distance: "200m", baseDistance: "150m", factor: 1.33 },
                { distance: "220m", baseDistance: "200m", factor: 1.1 },
                { distance: "250m", baseDistance: "220m", factor: 1.14 },
                { distance: "300m", baseDistance: "250m", factor: 1.2 },
                { distance: "350m", baseDistance: "300m", factor: 1.17 },
                { distance: "400m", baseDistance: "350m", factor: 1.14 }
              ].map((item) => {
                // Calculate all times based on cascading values
                
                // Find the base time for the cascading calculation
                let baseTime = null;
                // Find all defined distances and their times
                const timesByDistance = new Map();
                
                // Start with the direct goal times from the user's profile
                if (profile?.sprint60m100mGoal) {
                  // Determine if it's 60m or 100m based on the value
                  if (parseFloat(profile.sprint60m100mGoal) < 10) {
                    timesByDistance.set("60m", parseFloat(profile.sprint60m100mGoal));
                    // Calculate the corresponding 100m time
                    timesByDistance.set("100m", parseFloat(profile.sprint60m100mGoal) * 1.67);
                  } else {
                    timesByDistance.set("100m", parseFloat(profile.sprint60m100mGoal));
                    // Calculate the corresponding 60m time
                    timesByDistance.set("60m", parseFloat(profile.sprint60m100mGoal) * 0.6);
                  }
                  // Calculate 50m and 80m based on 100m time
                  timesByDistance.set("50m", timesByDistance.get("100m") * 0.5);
                  timesByDistance.set("80m", timesByDistance.get("100m") * 0.8);
                }
                
                if (profile?.sprint200mGoal) {
                  timesByDistance.set("200m", parseFloat(profile.sprint200mGoal));
                }
                
                if (profile?.sprint400mGoal) {
                  timesByDistance.set("400m", parseFloat(profile.sprint400mGoal));
                }
                
                // Create cascading calculation for distances not directly set by user
                if (!timesByDistance.has("120m") && timesByDistance.has("100m")) {
                  timesByDistance.set("120m", timesByDistance.get("100m") * 1.2);
                }
                
                if (!timesByDistance.has("150m") && timesByDistance.has("120m")) {
                  timesByDistance.set("150m", timesByDistance.get("120m") * 1.25);
                }
                
                if (!timesByDistance.has("200m") && timesByDistance.has("150m")) {
                  timesByDistance.set("200m", timesByDistance.get("150m") * 1.33);
                }
                
                if (!timesByDistance.has("220m") && timesByDistance.has("200m")) {
                  timesByDistance.set("220m", timesByDistance.get("200m") * 1.1);
                }
                
                if (!timesByDistance.has("250m") && timesByDistance.has("220m")) {
                  timesByDistance.set("250m", timesByDistance.get("220m") * 1.14);
                }
                
                if (!timesByDistance.has("300m") && timesByDistance.has("250m")) {
                  timesByDistance.set("300m", timesByDistance.get("250m") * 1.2);
                }
                
                if (!timesByDistance.has("350m") && timesByDistance.has("300m")) {
                  timesByDistance.set("350m", timesByDistance.get("300m") * 1.17);
                }
                
                if (!timesByDistance.has("400m") && timesByDistance.has("350m")) {
                  timesByDistance.set("400m", timesByDistance.get("350m") * 1.14);
                }
                
                // Get the scaled goal time for this row's distance
                const scaledGoalTime = timesByDistance.get(item.distance);
                
                // If there's no time for this distance after all calculations, skip row
                if (!scaledGoalTime) return null;
                
                // Calculate time at various percentages
                const percent80 = (scaledGoalTime / 0.8).toFixed(2);
                const percent90 = (scaledGoalTime / 0.9).toFixed(2);
                const percent92 = (scaledGoalTime / 0.92).toFixed(2);
                const percent95 = (scaledGoalTime / 0.95).toFixed(2);
                const percent98 = (scaledGoalTime / 0.98).toFixed(2);
                const percent100 = (scaledGoalTime - 0.55).toFixed(2); // First foot timing
                
                return (
                  <TableRow 
                    key={item.distance} 
                    className={
                      item.distance === "50m" || 
                      item.distance === "80m" || 
                      item.distance === "120m" || 
                      item.distance === "200m" || 
                      item.distance === "250m" || 
                      item.distance === "350m" 
                        ? "bg-blue-50 dark:bg-blue-950/20" 
                        : ""
                    }
                  >
                    <TableCell className="font-medium sticky left-0 bg-inherit shadow-sm">{item.distance}</TableCell>
                    <TableCell>{percent80}s</TableCell>
                    <TableCell>{percent90}s</TableCell>
                    <TableCell>{percent92}s</TableCell>
                    <TableCell>{percent95}s</TableCell>
                    <TableCell>{percent98}s</TableCell>
                    <TableCell>{percent100}s</TableCell>
                    <TableCell className="font-bold">{scaledGoalTime.toFixed(2)}s</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          <div className="mt-4 text-xs text-muted-foreground">
            <p>* The table shows times based on your goal times and scaled for each distance.</p>
            <p>* For distances longer than 100m, a deceleration factor is applied to account for speed endurance.</p>
            <p>* The 100% column shows times with first foot contact timing (-0.55s from goal time).</p>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-8 flex justify-center">
        <Button onClick={() => window.history.back()} variant="outline">
          Back
        </Button>
      </div>
    </div>
  );
}