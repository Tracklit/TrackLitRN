import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CheckIcon, Apple, Timer, Hotel, Terminal } from 'lucide-react';
import { Meet, Reminder } from '@shared/schema';
import { Badge } from '@/components/ui/badge';

// Define timeline item types for the preparation steps
interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timeDescription: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'upcoming';
  date: Date;
}

interface PreparationTimelineProps {
  meet: Meet;
  reminders?: Reminder[];
  onCustomize?: () => void;
}

export function PreparationTimeline({ meet, reminders, onCustomize }: PreparationTimelineProps) {
  // This would normally come from the backend based on the meet date
  // and would be actual reminders
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([
    {
      id: '1',
      title: 'Prepare equipment',
      timeDescription: '3 days before meet',
      icon: <CheckIcon className="h-4 w-4" />,
      status: 'completed',
      date: new Date(new Date(meet.date).getTime() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      title: 'Nutrition plan',
      description: 'High protein, complex carbs, stay hydrated',
      timeDescription: '2 days before meet',
      icon: <Apple className="h-4 w-4" />,
      status: 'current',
      date: new Date(new Date(meet.date).getTime() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      title: 'Light warmup run',
      timeDescription: '1 day before meet',
      icon: <Timer className="h-4 w-4" />,
      status: 'upcoming',
      date: new Date(new Date(meet.date).getTime() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: '4',
      title: 'Early sleep with 8+ hours',
      timeDescription: 'Night before meet',
      icon: <Hotel className="h-4 w-4" />,
      status: 'upcoming',
      date: new Date(new Date(meet.date).getTime() - 12 * 60 * 60 * 1000)
    },
    {
      id: '5',
      title: 'Meet day warmup',
      timeDescription: `${meet.warmupTime} min before event`,
      icon: <Terminal className="h-4 w-4" />,
      status: 'upcoming',
      date: new Date(new Date(meet.date).getTime() - meet.warmupTime * 60 * 1000)
    },
  ]);
  
  const markAsCompleted = (id: string) => {
    setTimelineItems(items => 
      items.map(item => 
        item.id === id ? { ...item, status: 'completed' as const } : item
      )
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <p className="text-sm text-darkGray mb-4">
        Your preparation plan for <span className="font-medium">{meet.name}</span>
      </p>
      
      {/* Timeline */}
      <div className="space-y-4">
        {timelineItems.map((item, index) => (
          <div className="flex" key={item.id}>
            <div className="flex flex-col items-center mr-4">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                item.status === 'completed' ? "bg-success/10" : 
                item.status === 'current' ? "bg-primary" : "bg-lightGray"
              )}>
                <span className={cn(
                  item.status === 'completed' ? "text-success" : 
                  item.status === 'current' ? "text-white" : "text-darkGray"
                )}>
                  {item.icon}
                </span>
              </div>
              {index < timelineItems.length - 1 && (
                <div className="h-full w-0.5 bg-lightGray mt-1"></div>
              )}
            </div>
            
            <div className="pt-1 pb-4 flex-1">
              <div className="flex justify-between items-start">
                <p className={cn(
                  "text-sm font-medium",
                  item.status === 'completed' ? "line-through text-darkGray/60" : ""
                )}>
                  {item.title}
                </p>
                {item.status === 'current' && (
                  <Badge variant="accent">TODAY</Badge>
                )}
              </div>
              
              {item.description && (
                <p className={cn(
                  "text-xs text-darkGray mt-1",
                  item.status === 'completed' ? "text-darkGray/60" : ""
                )}>
                  {item.description}
                </p>
              )}
              
              <p className={cn(
                "text-xs text-darkGray mt-2",
                item.status === 'completed' ? "text-darkGray/60" : ""
              )}>
                {item.timeDescription}
              </p>
              
              {item.status === 'current' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 h-8 text-primary p-0"
                  onClick={() => markAsCompleted(item.id)}
                >
                  Mark as done
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <Button 
        className="w-full mt-4" 
        variant="outline"
        onClick={onCustomize}
      >
        Customize Plan
      </Button>
    </div>
  );
}
