import { useState, useEffect, useMemo } from 'react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { formatDistanceToNow as formatDistanceToNowFn } from 'date-fns';
import { Button } from '@/components/ui/button';
import { 
  CheckIcon, 
  Apple, 
  Timer, 
  Hotel, 
  Terminal,
  Dumbbell,
  Droplet,
  UtensilsCrossed,
  PlusCircle
} from 'lucide-react';
import { Meet, Reminder } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { CreateReminderDialog } from './create-reminder-dialog';
import { CustomizePreparationModal } from './customize-preparation-modal';

// Define timeline item types for the preparation steps
interface TimelineItem {
  id: string;
  title: string;
  description?: string | null;
  timeDescription: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'upcoming';
  date: Date;
  reminderId?: number; // Link to actual reminder if it's from the database
  category?: string;
}

interface PreparationTimelineProps {
  meet: Meet;
  reminders?: Reminder[];
  onCustomize?: () => void;
}

// Get icon by category
const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'nutrition':
      return <Apple className="h-4 w-4" />;
    case 'warmup':
      return <Timer className="h-4 w-4" />;
    case 'rest':
      return <Hotel className="h-4 w-4" />;
    case 'exercise':
      return <Dumbbell className="h-4 w-4" />;
    case 'hydration':
      return <Droplet className="h-4 w-4" />;
    case 'meal':
      return <UtensilsCrossed className="h-4 w-4" />;
    default:
      return <CheckIcon className="h-4 w-4" />;
  }
};

// Get reminder status based on dates
const getReminderStatus = (reminderDate: Date, isCompleted: boolean): 'completed' | 'current' | 'upcoming' => {
  const now = new Date();
  
  if (isCompleted) {
    return 'completed';
  }
  
  // Today (compare year, month, day only)
  if (
    reminderDate.getFullYear() === now.getFullYear() &&
    reminderDate.getMonth() === now.getMonth() &&
    reminderDate.getDate() === now.getDate()
  ) {
    return 'current';
  }
  
  // Past but not completed
  if (reminderDate < now) {
    return 'current'; // Still show as current since it needs action
  }
  
  // Future
  return 'upcoming';
};

// Generate default reminders if none exist
const generateDefaultReminders = (meet: Meet): TimelineItem[] => {
  const meetDate = new Date(meet.date);
  
  return [
    {
      id: 'default-1',
      title: 'Nutrition preparation',
      description: 'Focus on complex carbs, lean protein, and hydration',
      timeDescription: '2 days before meet',
      icon: <Apple className="h-4 w-4" />,
      status: getReminderStatus(new Date(meetDate.getTime() - 2 * 24 * 60 * 60 * 1000), false),
      date: new Date(meetDate.getTime() - 2 * 24 * 60 * 60 * 1000),
      category: 'nutrition'
    },
    {
      id: 'default-2',
      title: 'Check equipment',
      description: 'Prepare uniform, spikes, gear, and competition items',
      timeDescription: '1 day before meet',
      icon: <CheckIcon className="h-4 w-4" />,
      status: getReminderStatus(new Date(meetDate.getTime() - 1 * 24 * 60 * 60 * 1000), false),
      date: new Date(meetDate.getTime() - 1 * 24 * 60 * 60 * 1000),
      category: 'exercise'
    },
    {
      id: 'default-3',
      title: 'Early sleep with 8+ hours',
      description: 'Get restful sleep to be fresh for competition',
      timeDescription: 'Night before meet',
      icon: <Hotel className="h-4 w-4" />,
      status: getReminderStatus(new Date(meetDate.getTime() - 12 * 60 * 60 * 1000), false),
      date: new Date(meetDate.getTime() - 12 * 60 * 60 * 1000),
      category: 'rest'
    },
    {
      id: 'default-4',
      title: 'Hydration schedule',
      description: '16-20oz water 2-3 hours before, 7-10oz 20 minutes before event',
      timeDescription: 'Day of meet',
      icon: <Droplet className="h-4 w-4" />,
      status: getReminderStatus(new Date(meetDate.getTime() - 3 * 60 * 60 * 1000), false),
      date: new Date(meetDate.getTime() - 3 * 60 * 60 * 1000),
      category: 'hydration'
    },
    {
      id: 'default-5',
      title: 'Meet day warmup',
      description: 'Complete warmup routine including drills and strides',
      timeDescription: `${meet.warmupTime || 60} min before event`,
      icon: <Timer className="h-4 w-4" />,
      status: getReminderStatus(new Date(meetDate.getTime() - (meet.warmupTime || 60) * 60 * 1000), false),
      date: new Date(meetDate.getTime() - (meet.warmupTime || 60) * 60 * 1000),
      category: 'warmup'
    },
  ];
};

export function PreparationTimeline({ meet, reminders: initialReminders, onCustomize }: PreparationTimelineProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  // Fetch reminders from API
  const { data: remindersData, isLoading } = useQuery({
    queryKey: [`/api/meets/${meet.id}/reminders`],
    queryFn: async () => {
      const response = await fetch(`/api/meets/${meet.id}/reminders`);
      if (!response.ok) {
        throw new Error('Failed to fetch reminders');
      }
      return response.json() as Promise<Reminder[]>;
    },
    initialData: initialReminders || [],
  });

  // Convert reminders to timeline items
  const timelineItems = useMemo(() => {
    // Use fetched reminders if available, otherwise use initialized reminders
    const reminders = remindersData || [];
    
    // If no reminders, generate default ones
    if (reminders.length === 0) {
      return generateDefaultReminders(meet);
    }
    
    // Map reminders to timeline items
    return reminders.map(reminder => {
      const reminderDate = new Date(reminder.date);
      
      return {
        id: `reminder-${reminder.id}`,
        reminderId: reminder.id,
        title: reminder.title,
        description: reminder.description,
        timeDescription: formatDistanceToNowFn(reminderDate, { addSuffix: true }),
        icon: getCategoryIcon(reminder.category),
        status: getReminderStatus(reminderDate, reminder.isCompleted || false),
        date: reminderDate,
        category: reminder.category
      };
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [remindersData, meet]);

  // Mark reminder as completed
  const updateReminderMutation = useMutation({
    mutationFn: async (reminderId: number) => {
      const response = await apiRequest('PATCH', `/api/reminders/${reminderId}`, {
        isCompleted: true
      });
      
      if (!response.ok) {
        throw new Error('Failed to update reminder');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/meets/${meet.id}/reminders`] });
      toast({
        title: "Reminder updated",
        description: "Marked as completed in your preparation plan."
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating reminder",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // For default reminders we just update local state
  const [completedDefaultReminders, setCompletedDefaultReminders] = useState<Set<string>>(new Set());

  const handleMarkAsCompleted = (item: TimelineItem) => {
    if (item.reminderId) {
      // For real reminders, update in database
      updateReminderMutation.mutate(item.reminderId);
    } else {
      // For default reminders, just update local state
      setCompletedDefaultReminders(prev => new Set(prev).add(item.id));
    }
  };

  // Get the effective status (considering local state for default reminders)
  const getEffectiveStatus = (item: TimelineItem) => {
    if (item.reminderId) {
      return item.status;
    }
    
    // For default reminders, check local state
    if (completedDefaultReminders.has(item.id)) {
      return 'completed';
    }
    
    return item.status;
  };

  return (
    <div className="bg-[#081020] border border-blue-800/60 rounded-xl shadow-md p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-blue-300">
          Your preparation plan for <span className="font-medium text-white">{meet.name}</span>
        </p>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 text-xs text-blue-300 hover:text-white hover:bg-blue-800/30"
          onClick={() => setIsAddReminderOpen(true)}
        >
          <PlusCircle className="h-3.5 w-3.5 mr-1" />
          Add Reminder
        </Button>
      </div>
      
      {/* Timeline */}
      {isLoading ? (
        <div className="py-8 text-center text-sm text-blue-400">
          Loading preparation plan...
        </div>
      ) : timelineItems.length === 0 ? (
        <div className="py-8 text-center text-sm text-blue-400">
          No preparation reminders yet. Add your first one to create a plan.
        </div>
      ) : (
        <div className="space-y-4">
          {timelineItems.map((item, index) => {
            const effectiveStatus = getEffectiveStatus(item);
            
            return (
              <div className="flex" key={item.id}>
                <div className="flex flex-col items-center mr-4">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    effectiveStatus === 'completed' ? "bg-green-800/30" : 
                    effectiveStatus === 'current' ? "bg-amber-600" : "bg-blue-900/40"
                  )}>
                    <span className={cn(
                      effectiveStatus === 'completed' ? "text-green-400" : 
                      effectiveStatus === 'current' ? "text-white" : "text-blue-300"
                    )}>
                      {item.icon}
                    </span>
                  </div>
                  {index < timelineItems.length - 1 && (
                    <div className="h-full w-0.5 bg-blue-800/40 mt-1"></div>
                  )}
                </div>
                
                <div className="pt-1 pb-4 flex-1">
                  <div className="flex justify-between items-start">
                    <p className={cn(
                      "text-sm font-medium",
                      effectiveStatus === 'completed' 
                        ? "line-through text-blue-400/60" 
                        : effectiveStatus === 'current' 
                          ? "text-white" 
                          : "text-blue-200"
                    )}>
                      {item.title}
                    </p>
                    {effectiveStatus === 'current' && (
                      <Badge className="bg-amber-600 hover:bg-amber-700 text-white">TODAY</Badge>
                    )}
                  </div>
                  
                  {item.description && (
                    <p className={cn(
                      "text-xs mt-1",
                      effectiveStatus === 'completed' 
                        ? "text-blue-400/60" 
                        : "text-blue-300"
                    )}>
                      {item.description}
                    </p>
                  )}
                  
                  <p className={cn(
                    "text-xs mt-2",
                    effectiveStatus === 'completed' 
                      ? "text-blue-400/60" 
                      : "text-blue-400"
                  )}>
                    {item.timeDescription}
                  </p>
                  
                  {effectiveStatus === 'current' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 h-8 text-amber-500 hover:text-amber-400 hover:bg-blue-900/30 p-0"
                      onClick={() => handleMarkAsCompleted(item)}
                      disabled={updateReminderMutation.isPending}
                    >
                      Mark as done
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="flex space-x-3 mt-4">
        <Button 
          className="flex-1 border-blue-700 text-blue-300 hover:bg-blue-900/30 hover:text-blue-100" 
          variant="outline"
          onClick={() => setIsCustomizeOpen(true)}
        >
          Customize Plan
        </Button>
        
        <Button
          className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
          variant="default"
          onClick={() => setIsAddReminderOpen(true)}
        >
          Add Reminder
        </Button>
      </div>
      
      {/* Create Reminder Dialog */}
      {isAddReminderOpen && (
        <CreateReminderDialog
          isOpen={isAddReminderOpen}
          onClose={() => setIsAddReminderOpen(false)}
          meet={meet}
          useSuggestion={true}
        />
      )}
      
      {/* Customize Preparation Modal */}
      {isCustomizeOpen && (
        <CustomizePreparationModal
          isOpen={isCustomizeOpen}
          onClose={() => setIsCustomizeOpen(false)}
          meet={meet}
        />
      )}
    </div>
  );
}
