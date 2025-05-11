import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { insertReminderSchema, Meet } from '@shared/schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Apple, Timer, Hotel, Dumbbell, Droplet, UtensilsCrossed } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Reminder categories with icon mappings
const REMINDER_CATEGORIES = [
  { value: 'nutrition', label: 'Nutrition', icon: <Apple className="h-4 w-4 mr-2" /> },
  { value: 'warmup', label: 'Warmup', icon: <Timer className="h-4 w-4 mr-2" /> },
  { value: 'rest', label: 'Rest', icon: <Hotel className="h-4 w-4 mr-2" /> },
  { value: 'exercise', label: 'Exercise', icon: <Dumbbell className="h-4 w-4 mr-2" /> },
  { value: 'hydration', label: 'Hydration', icon: <Droplet className="h-4 w-4 mr-2" /> },
  { value: 'meal', label: 'Meal Planning', icon: <UtensilsCrossed className="h-4 w-4 mr-2" /> },
];

// Predefined nutrition tips
const NUTRITION_TIPS = [
  "Hydrate well during the 48 hours before competition.",
  "Consume carbs 3-4 hours before the event for steady energy.",
  "Avoid heavy, fatty meals the day before competition.",
  "Focus on easily digestible foods morning of the meet.",
  "Have a light, high-carb snack 1-2 hours before your event.",
  "Replenish electrolytes if competing in hot weather.",
  "Avoid trying new foods on competition day.",
  "Pack energy bars and sports drinks for quick fuel between events."
];

// Predefined warmup tips
const WARMUP_TIPS = [
  "Start with 10 minutes of light jogging to raise your heart rate.",
  "Include dynamic stretches focusing on the muscles you'll use in competition.",
  "Perform 4-6 strides at 80-90% of race pace.",
  "Gradually increase intensity as you approach competition time.",
  "Complete your final warmup 15-20 minutes before your event.",
  "Include event-specific drills in your warmup routine.",
  "Keep moving with light activity if there's a delay before your event.",
  "Visualize your race strategy during warmup."
];

// Form schema for creating reminders
const formSchema = z.object({
  userId: z.number(),
  meetId: z.number(),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  category: z.string().min(1, { message: "Please select a category" }),
  timeOffset: z.number({ 
    required_error: "Please specify when the reminder should occur",
    invalid_type_error: "Must be a number" 
  }),
  timeUnit: z.enum(["minutes", "hours", "days"], {
    required_error: "Please select a time unit"
  }),
  isCompleted: z.boolean().default(false)
});

type FormValues = z.infer<typeof formSchema>;

interface CreateReminderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  meet: Meet;
  useSuggestion?: boolean;
}

export function CreateReminderDialog({ isOpen, onClose, meet, useSuggestion = false }: CreateReminderDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Default based on category
  const getSuggestionForCategory = (category: string): string => {
    switch(category) {
      case 'nutrition':
        return NUTRITION_TIPS[Math.floor(Math.random() * NUTRITION_TIPS.length)];
      case 'warmup':
        return WARMUP_TIPS[Math.floor(Math.random() * WARMUP_TIPS.length)];
      case 'hydration':
        return "Drink 16-20oz of water 2-3 hours before your event, and another 7-10oz 15-20 minutes before start.";
      case 'rest':
        return "Aim for 8-9 hours of sleep the night before competition.";
      case 'meal':
        return "Pre-competition meal: lean protein, complex carbs, and a small amount of healthy fats.";
      case 'exercise':
        return "Complete a tapering workout 2 days before the meet to allow for recovery.";
      default:
        return "";
    }
  };
  
  // Create form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: meet.userId,
      meetId: meet.id,
      title: "",
      description: "",
      category: "nutrition",
      timeOffset: meet.warmupTime || 60,
      timeUnit: "minutes",
      isCompleted: false
    }
  });
  
  // React to category changes for suggestions
  React.useEffect(() => {
    if (useSuggestion) {
      const subscription = form.watch((value, { name }) => {
        if (name === 'category') {
          const category = form.getValues('category');
          form.setValue('description', getSuggestionForCategory(category));
        }
      });
      
      return () => subscription.unsubscribe();
    }
  }, [form, useSuggestion]);
  
  // Create reminder mutation
  const createReminderMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Calculate the reminder time based on the meet date and offset
      const meetDate = new Date(meet.date);
      let offsetMs = data.timeOffset;
      
      // Convert to milliseconds
      if (data.timeUnit === 'minutes') {
        offsetMs = data.timeOffset * 60 * 1000;
      } else if (data.timeUnit === 'hours') {
        offsetMs = data.timeOffset * 60 * 60 * 1000;
      } else if (data.timeUnit === 'days') {
        offsetMs = data.timeOffset * 24 * 60 * 60 * 1000;
      }
      
      const reminderDate = new Date(meetDate.getTime() - offsetMs);
      
      // Prepare data for API
      const reminderData = {
        userId: data.userId,
        meetId: data.meetId,
        title: data.title,
        description: data.description,
        date: reminderDate.toISOString(),
        category: data.category,
        isCompleted: false
      };
      
      const response = await apiRequest('POST', '/api/reminders', reminderData);
      if (!response.ok) {
        throw new Error('Failed to create reminder');
      }
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/reminders'] });
      queryClient.invalidateQueries({ queryKey: [`/api/meets/${meet.id}/reminders`] });
      
      toast({
        title: "Reminder created",
        description: "Your preparation reminder has been added to the timeline.",
      });
      
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error creating reminder",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form submission
  const onSubmit = (values: FormValues) => {
    createReminderMutation.mutate(values);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Preparation Reminder</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Reminder title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                      {REMINDER_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center">
                            {category.icon}
                            {category.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex space-x-3">
              <FormField
                control={form.control}
                name="timeOffset"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Time Before Event</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="timeUnit"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Unit</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add details, instructions, or tips..."
                      className="min-h-24"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createReminderMutation.isPending}
              >
                {createReminderMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : "Create Reminder"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}