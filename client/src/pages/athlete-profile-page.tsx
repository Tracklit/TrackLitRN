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
import { Loader2, Save } from "lucide-react";

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
  timingPreference: z.enum(["on_movement", "first_foot"]).default("on_movement"),
});

type AthleteProfileFormValues = z.infer<typeof athleteProfileSchema>;

export default function AthleteProfilePage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch the user's profile data
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["/api/athlete-profile"],
    enabled: isAuthenticated,
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
        return apiRequest("/api/athlete-profile", {
          method: "PATCH",
          data,
        });
      } else {
        // Create new profile
        return apiRequest("/api/athlete-profile", {
          method: "POST",
          data,
        });
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
    </div>
  );
}