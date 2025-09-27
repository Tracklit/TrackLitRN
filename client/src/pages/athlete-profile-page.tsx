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
import { Loader2, Save, Edit, Settings, Calculator } from "lucide-react";
import { Switch } from "@/components/ui/switch";
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
  
  // State for manual editing mode
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualTimes, setManualTimes] = useState({
    "60m": "",
    "100m": "",
    "200m": "",
    "300m": "",
    "400m": ""
  });

  // Function to calculate times automatically based on key distances
  const calculateAutomaticTimes = () => {
    const times = {};
    const watchValues = form.watch();
    
    // Get base times from form
    const sprint100Goal = watchValues.sprint60m100mGoal;
    const sprint200Goal = watchValues.sprint200mGoal;
    const sprint400Goal = watchValues.sprint400mGoal;
    
    if (sprint100Goal) {
      const time100 = parseFloat(sprint100Goal);
      times["100m"] = time100.toFixed(2);
      times["60m"] = (time100 * 0.6).toFixed(2);
      times["50m"] = (time100 * 0.5).toFixed(2);
      times["80m"] = (time100 * 0.8).toFixed(2);
      times["120m"] = (time100 * 1.2).toFixed(2);
      times["150m"] = (time100 * 1.5).toFixed(2);
    }
    
    if (sprint200Goal) {
      times["200m"] = parseFloat(sprint200Goal).toFixed(2);
      if (!times["250m"]) {
        times["250m"] = (parseFloat(sprint200Goal) * 1.25).toFixed(2);
      }
    }
    
    if (sprint400Goal) {
      times["400m"] = parseFloat(sprint400Goal).toFixed(2);
      times["300m"] = (parseFloat(sprint400Goal) * 0.75).toFixed(2);
    }
    
    // Calculate 300m from 200m if not available from 400m
    if (!times["300m"] && times["200m"]) {
      times["300m"] = (parseFloat(times["200m"]) * 1.5).toFixed(2);
    }
    
    return times;
  };

  // Function to calculate times from manual input
  const calculateFromManualTimes = () => {
    const times = { ...manualTimes };
    
    // Auto-calculate other distances based on manual inputs
    if (manualTimes["60m"]) {
      const time60 = parseFloat(manualTimes["60m"]);
      if (!times["100m"]) times["100m"] = (time60 * 1.67).toFixed(2);
      times["50m"] = (time60 * 0.83).toFixed(2);
      times["80m"] = (time60 * 1.33).toFixed(2);
    }
    
    if (manualTimes["100m"]) {
      const time100 = parseFloat(manualTimes["100m"]);
      if (!times["60m"]) times["60m"] = (time100 * 0.6).toFixed(2);
      times["50m"] = (time100 * 0.5).toFixed(2);
      times["80m"] = (time100 * 0.8).toFixed(2);
      times["120m"] = (time100 * 1.2).toFixed(2);
      times["150m"] = (time100 * 1.5).toFixed(2);
    }
    
    if (manualTimes["200m"]) {
      const time200 = parseFloat(manualTimes["200m"]);
      times["250m"] = (time200 * 1.25).toFixed(2);
      if (!times["300m"]) times["300m"] = (time200 * 1.5).toFixed(2);
    }
    
    if (manualTimes["300m"]) {
      const time300 = parseFloat(manualTimes["300m"]);
      if (!times["200m"]) times["200m"] = (time300 * 0.67).toFixed(2);
      if (!times["400m"]) times["400m"] = (time300 * 1.33).toFixed(2);
    }
    
    if (manualTimes["400m"]) {
      const time400 = parseFloat(manualTimes["400m"]);
      if (!times["300m"]) times["300m"] = (time400 * 0.75).toFixed(2);
    }
    
    return times;
  };

  // Function to get all calculated times
  const getAllTimes = () => {
    return isManualMode ? calculateFromManualTimes() : calculateAutomaticTimes();
  };

  // Function to calculate pace percentages
  const calculatePace = (baseTime, percentage) => {
    if (!baseTime) return "-";
    const time = parseFloat(baseTime);
    const adjustedTime = time / (percentage / 100);
    return adjustedTime.toFixed(2);
  };

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
      timingPreference: "onMovement",
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
        timingPreference: profile.timingPreference || "onMovement",
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
      timingPreference: profile.timingPreference || "onMovement",
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
          <CardTitle>Events</CardTitle>
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
                    Updating
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Profile
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Enhanced Target Times Table */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-amber-500" />
                Target Times
              </CardTitle>
              <CardDescription>
                {isManualMode 
                  ? "Manual mode: Edit specific distances directly" 
                  : "Automatic mode: Times calculated from your goal events"}
              </CardDescription>
            </div>
            
            {/* Toggle Switch */}
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <label htmlFor="manual-mode" className="text-sm font-medium">
                {isManualMode ? "Manual" : "Auto"}
              </label>
              <Switch
                id="manual-mode"
                checked={isManualMode}
                onCheckedChange={setIsManualMode}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-hidden rounded-md border border-amber-500/70">
            <div className="bg-[#111827] text-white px-4 py-3">
              <p className="text-sm text-blue-200">
                {form.watch("timingPreference") === "first_foot" 
                  ? "Times shown with first foot contact timing (-0.55s)"
                  : "Times shown with movement timing (-0.15s)"}
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr className="bg-[#111827] text-white border-b border-transparent">
                    <th className="sticky left-0 z-10 bg-inherit whitespace-nowrap px-3 py-3 text-left font-bold">
                      Distance
                    </th>
                    <th className="px-3 py-3 text-right font-bold">80%</th>
                    <th className="px-3 py-3 text-right font-bold">90%</th>
                    <th className="px-3 py-3 text-right font-bold">95%</th>
                    <th className="px-3 py-3 text-right font-bold">98%</th>
                    <th className="px-3 py-3 text-right font-bold">100%</th>
                    <th className="px-3 py-3 text-right font-bold">Goal</th>
                  </tr>
                </thead>
                <TableBody>
                  {(() => {
                    const calculatedTimes = getAllTimes();
                    const distances = ["50m", "60m", "80m", "100m", "120m", "150m", "200m", "250m", "300m", "400m"];
                    const editableDistances = ["60m", "100m", "200m", "300m", "400m"];
                    const timingAdjustment = form.watch("timingPreference") === "first_foot" ? 0.55 : 0.15;
                    
                    return distances.map((distance) => {
                      const baseTime = calculatedTimes[distance];
                      const isEditable = isManualMode && editableDistances.includes(distance);
                      
                      return (
                        <TableRow key={distance} className="border-gray-700">
                          <TableCell className="sticky left-0 z-10 bg-[#1f2937] text-white font-medium px-3 py-2 border-r border-gray-600">
                            {distance}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-right bg-[#1f2937] text-white">
                            {baseTime ? calculatePace(baseTime, 80) : "-"}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-right bg-[#1f2937] text-white">
                            {baseTime ? calculatePace(baseTime, 90) : "-"}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-right bg-[#1f2937] text-white">
                            {baseTime ? calculatePace(baseTime, 95) : "-"}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-right bg-[#1f2937] text-white">
                            {baseTime ? calculatePace(baseTime, 98) : "-"}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-right bg-[#1f2937] text-white">
                            {baseTime ? (parseFloat(baseTime) - timingAdjustment).toFixed(2) : "-"}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-right bg-[#1f2937] text-white">
                            {isEditable ? (
                              <div className="flex justify-end">
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={manualTimes[distance] || ""}
                                  onChange={(e) => setManualTimes(prev => ({
                                    ...prev,
                                    [distance]: e.target.value
                                  }))}
                                  className="w-20 h-8 text-right bg-gray-800 text-white border-gray-600 focus:border-amber-500"
                                  placeholder="0.00"
                                />
                              </div>
                            ) : (
                              baseTime || "-"
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}