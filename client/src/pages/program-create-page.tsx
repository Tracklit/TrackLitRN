import { ProtectedRoute } from "@/lib/protected-route";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, CalendarDays, Clock, Crown, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";

// Form validation schema
const programFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  category: z.string().min(1, { message: "Please select a category" }),
  level: z.string().min(1, { message: "Please select a level" }),
  duration: z.coerce.number().min(1, { message: "Duration must be at least 1 day" }),
  visibility: z.enum(["private", "public", "premium"], {
    required_error: "Please select a visibility option",
  }),
  price: z.coerce.number().min(0, { message: "Price cannot be negative" }).optional(),
});

export default function ProgramCreatePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  // Form setup
  const form = useForm<z.infer<typeof programFormSchema>>({
    resolver: zodResolver(programFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      level: "beginner",
      duration: 7,
      visibility: "private",
      price: 0,
    },
  });
  
  // Create program mutation
  const createProgramMutation = useMutation({
    mutationFn: async (data: z.infer<typeof programFormSchema>) => {
      const res = await apiRequest("POST", "/api/programs", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create program");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Program created",
        description: "Your training program has been created successfully",
      });
      navigate("/programs");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (data: z.infer<typeof programFormSchema>) => {
    createProgramMutation.mutate(data);
  };
  
  return (
    <div className="container max-w-screen-xl mx-auto p-4 pt-20 md:pt-24 md:pl-72 pb-20">
      <PageHeader
        title="Create Training Program"
        description="Design a new training program for yourself or to share with others"
      />
      
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/programs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Programs
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Program Details</CardTitle>
              <CardDescription>Create your training program with all the necessary details</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 12-Week Sprint Training" {...field} />
                        </FormControl>
                        <FormDescription>
                          Give your program a clear, descriptive title
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your program, its goals, and who it's designed for..." 
                            {...field} 
                            rows={4}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide details about what athletes will achieve with this program
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="sprint">Sprinting</SelectItem>
                              <SelectItem value="distance">Distance Running</SelectItem>
                              <SelectItem value="jumps">Jumping Events</SelectItem>
                              <SelectItem value="throws">Throwing Events</SelectItem>
                              <SelectItem value="multi">Multi-Events</SelectItem>
                              <SelectItem value="general">General Fitness</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the track & field specialty this program focuses on
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Experience Level</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                              <SelectItem value="elite">Elite</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Target experience level for this program
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program Duration (Days)</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={365} {...field} />
                        </FormControl>
                        <FormDescription>
                          How many days will this program last?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="visibility"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Program Visibility</FormLabel>
                        <FormControl>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            className="grid grid-cols-1 md:grid-cols-3 gap-2"
                          >
                            <FormItem className="flex flex-col items-center space-y-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/30 transition-colors [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
                              <FormControl>
                                <RadioGroupItem value="private" />
                              </FormControl>
                              <div className="space-y-1 text-center">
                                <p className="font-medium">Private</p>
                                <p className="text-xs text-muted-foreground">
                                  Only visible to assigned athletes or clubs
                                </p>
                              </div>
                            </FormItem>
                            <FormItem className="flex flex-col items-center space-y-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/30 transition-colors [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
                              <FormControl>
                                <RadioGroupItem value="public" />
                              </FormControl>
                              <div className="space-y-1 text-center">
                                <p className="font-medium">Public</p>
                                <p className="text-xs text-muted-foreground">
                                  Anyone can view and use the program
                                </p>
                              </div>
                            </FormItem>
                            <FormItem className="flex flex-col items-center space-y-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/30 transition-colors [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5">
                              <FormControl>
                                <RadioGroupItem value="premium" />
                              </FormControl>
                              <div className="space-y-1 text-center flex flex-col items-center">
                                <p className="font-medium flex items-center">
                                  <Crown className="h-4 w-4 mr-1 text-yellow-500" />
                                  Premium
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Users pay Spikes to access
                                </p>
                              </div>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          Choose how your program is shared with others
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("visibility") === "premium" && (
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (Spikes)</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} {...field} />
                          </FormControl>
                          <FormDescription>
                            How many spikes will users need to spend to purchase this program?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" type="button" asChild>
                      <Link href="/programs">Cancel</Link>
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createProgramMutation.isPending}
                    >
                      {createProgramMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Program
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Program Preview</CardTitle>
              <CardDescription>Here's how your program will look</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-36 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-md mb-4"></div>
              <h3 className="text-lg font-semibold mb-1">
                {form.watch("title") || "Program Title"}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {form.watch("description") || "Program description will appear here..."}
              </p>
              <div className="flex items-center text-sm text-muted-foreground mb-2">
                <CalendarDays className="h-4 w-4 mr-1" />
                <span>{form.watch("duration") || 0} days</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                <span>
                  {form.watch("level") === "beginner" ? "Beginner level" :
                   form.watch("level") === "intermediate" ? "Intermediate level" :
                   form.watch("level") === "advanced" ? "Advanced level" : 
                   form.watch("level") === "elite" ? "Elite level" : "Select a level"}
                </span>
              </div>
              
              {form.watch("visibility") === "premium" && (
                <div className="mt-4 p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-md flex items-center">
                  <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    Premium: {form.watch("price") || 0} Spikes
                  </span>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
              <div className="text-sm text-muted-foreground flex items-center">
                {form.watch("visibility") === "public" && "Public program"}
                {form.watch("visibility") === "private" && "Private program"}
                {form.watch("visibility") === "premium" && (
                  <span className="flex items-center">
                    <Crown className="h-3.5 w-3.5 mr-1 text-yellow-500" />
                    Premium program
                  </span>
                )}
              </div>
              {form.watch("category") && (
                <div className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  {form.watch("category")}
                </div>
              )}
            </CardFooter>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
              <CardDescription>After creating your program:</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal pl-5 space-y-2 text-sm">
                <li>Add training sessions to your program</li>
                <li>Set up specific workouts for each day</li>
                <li>Customize the training intensity and volume</li>
                <li>Add notes and instructions for athletes</li>
                <li>Preview how the program will look to users</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Protected route wrapper
export function Component() {
  return (
    <ProtectedRoute path="/programs/create" component={ProgramCreatePage} />
  );
}