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
      <div className="mt-6 overflow-hidden rounded-md border border-gray-200 dark:border-gray-800">
        <div className="bg-blue-900 text-white px-4 py-3">
          <h3 className="text-lg font-semibold">Target Times</h3>
          <p className="text-sm text-blue-200">
            Based on your goal times, the 100% column shows first foot contact timing (-0.55s)
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-900 text-white border-b border-blue-700">
                <th className="sticky left-0 z-10 bg-inherit whitespace-nowrap px-3 py-3 text-left font-medium">
                  Distance
                </th>
                <th className="px-3 py-3 text-right font-medium">80%</th>
                <th className="px-3 py-3 text-right font-medium">90%</th>
                <th className="px-3 py-3 text-right font-medium">92%</th>
                <th className="px-3 py-3 text-right font-medium">95%</th>
                <th className="px-3 py-3 text-right font-medium">98%</th>
                <th className="px-3 py-3 text-right font-medium">100%</th>
                <th className="px-3 py-3 text-right font-medium">Goal</th>
              </tr>
            </thead>
            <tbody>
              {/* Pace calculations */}
              {(() => {
                // Create pace calculation
                const distances = [
                  "50m", "60m", "80m", "100m", "120m", 
                  "150m", "200m", "220m", "250m", "300m", 
                  "350m", "400m"
                ];
                
                // Calculate all times for all distances
                const timesByDistance = new Map();
                
                // Start with the direct goal times from the user's profile
                if (profile?.sprint60m100mGoal) {
                  // Determine if it's 60m or 100m based on the value
                  const value = parseFloat(profile.sprint60m100mGoal);
                  if (value < 10) {
                    timesByDistance.set("60m", value);
                    // Calculate the corresponding 100m time
                    timesByDistance.set("100m", value * 1.67);
                  } else {
                    timesByDistance.set("100m", value);
                    // Calculate the corresponding 60m time
                    timesByDistance.set("60m", value * 0.6);
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
              
                // Render the rows with alternating backgrounds
                return distances.map((distance, index) => {
                  const time = timesByDistance.get(distance);
                  if (!time) return null;
                  
                  // Calculate percentages
                  const percent80 = (time / 0.8).toFixed(2);
                  const percent90 = (time / 0.9).toFixed(2);
                  const percent92 = (time / 0.92).toFixed(2);
                  const percent95 = (time / 0.95).toFixed(2);
                  const percent98 = (time / 0.98).toFixed(2);
                  const percent100 = (time - 0.55).toFixed(2); // First foot timing
                  
                  // Alternating backgrounds for even/odd rows
                  const isEvenRow = index % 2 === 0;
                  const rowBgClass = isEvenRow ? 
                    "bg-blue-800 text-white" : 
                    "bg-blue-700 text-white";
                  
                  return (
                    <tr key={distance} className={`${rowBgClass} border-b border-blue-600`}>
                      <td className="sticky left-0 z-10 bg-inherit whitespace-nowrap px-3 py-3 font-medium">
                        {distance}
                      </td>
                      <td className="px-3 py-3 text-right">{percent80}s</td>
                      <td className="px-3 py-3 text-right">{percent90}s</td>
                      <td className="px-3 py-3 text-right">{percent92}s</td>
                      <td className="px-3 py-3 text-right">{percent95}s</td>
                      <td className="px-3 py-3 text-right">{percent98}s</td>
                      <td className="px-3 py-3 text-right">{percent100}s</td>
                      <td className="px-3 py-3 text-right font-bold">{time.toFixed(2)}s</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-8 flex justify-center">
        <Button onClick={() => window.history.back()} variant="outline">
          Back
        </Button>
      </div>
    </div>
  );
}