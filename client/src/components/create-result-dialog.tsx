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
import { Meet, Result } from '@shared/schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Track events
const TRACK_EVENTS = [
  '100m', '200m', '400m', '800m', '1500m', '3000m', '5000m', '10000m',
  '110mh', '400mh', '3000sc',
  'long_jump', 'triple_jump', 'high_jump', 'pole_vault',
  'shot_put', 'discus', 'javelin', 'hammer'
];

// Form schema
const formSchema = z.object({
  meetId: z.number({ 
    required_error: "Please select a meet" 
  }),
  event: z.string().min(1, { message: "Please select an event" }),
  performance: z.number({ 
    required_error: "Please enter your result",
    invalid_type_error: "Please enter a valid number" 
  }),
  wind: z.number().nullable().optional(),
  place: z.number().int().positive().nullable().optional(),
  notes: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface CreateResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  meets: Meet[];
}

export function CreateResultDialog({ isOpen, onClose, meets }: CreateResultDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Create form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      meetId: meets.length > 0 ? meets[0].id : undefined,
      event: '100m',
      performance: undefined,
      wind: null,
      place: null,
      notes: ''
    }
  });
  
  // Get current event for conditional fields
  const currentEvent = form.watch('event');
  const isWindAffectedEvent = ['100m', '200m', 'long_jump', 'triple_jump'].includes(currentEvent);
  
  // Mutation for creating a result
  const createResultMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Find the meet to get the date
      const meet = meets.find(m => m.id === data.meetId);
      if (!meet) throw new Error("Selected meet not found");
      
      // Convert result based on event type
      const resultData = {
        userId: 1, // Current user ID (should come from auth context)
        meetId: data.meetId,
        event: data.event,
        performance: data.performance,
        wind: data.wind,
        place: data.place,
        notes: data.notes || null,
        date: meet.date // Use meet date for the result
      };
      
      const response = await apiRequest('POST', '/api/results', resultData);
      if (!response.ok) {
        throw new Error('Failed to create result');
      }
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/results'] });
      
      toast({
        title: "Result added",
        description: "Your performance has been recorded successfully.",
      });
      
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error adding result",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form submission
  const onSubmit = (values: FormValues) => {
    createResultMutation.mutate(values);
  };
  
  // Helper to format result labels
  const formatResultLabel = (event: string) => {
    if (['100m', '200m', '400m', '800m', '1500m', '3000m', '5000m', '10000m', '110mh', '400mh', '3000sc'].includes(event)) {
      return "Time (seconds)";
    } else if (['long_jump', 'triple_jump', 'high_jump', 'pole_vault'].includes(event)) {
      return "Distance/Height (meters)";
    } else if (['shot_put', 'discus', 'javelin', 'hammer'].includes(event)) {
      return "Distance (meters)";
    }
    return "Result";
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Competition Result</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="meetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meet</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a meet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {meets.map((meet) => (
                        <SelectItem key={meet.id} value={meet.id.toString()}>
                          {meet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="event"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an event" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TRACK_EVENTS.map((event) => (
                        <SelectItem key={event} value={event}>
                          {event}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="performance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{formatResultLabel(currentEvent)}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter your result"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Wind field - only shown for relevant events */}
            {isWindAffectedEvent && (
              <FormField
                control={form.control}
                name="wind"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wind Speed (m/s)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Enter wind speed (optional)"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseFloat(e.target.value) : null;
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="place"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Place (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter your place in the event"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value) : null;
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add notes about your performance..."
                      className="min-h-20"
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
                disabled={createResultMutation.isPending}
              >
                {createResultMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : "Save Result"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}