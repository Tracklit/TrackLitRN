import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { InsertMeet } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { LocationSearch } from '@/components/location-search';
import { LocationSearchResult } from '@/hooks/use-location-search';

interface CreateMeetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateMeetModal({ isOpen, onClose }: CreateMeetModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [events, setEvents] = useState<string[]>([]);
  const [newEvent, setNewEvent] = useState('');
  const [warmupTime, setWarmupTime] = useState(60);
  const [arrivalTime, setArrivalTime] = useState(90);

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDate('');
      setTime('');
      setLocation('');
      setCoordinates(null);
      setEvents([]);
      setNewEvent('');
      setWarmupTime(60);
      setArrivalTime(90);
    }
  }, [isOpen]);

  const createMeetMutation = useMutation({
    mutationFn: async (meetData: InsertMeet) => {
      try {
        const res = await apiRequest('POST', '/api/meets', meetData);
        
        // Log the raw response for debugging
        console.log('API Response status:', res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Error response:', errorText);
          
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || 'Failed to create meet');
          } catch (e) {
            throw new Error(`Server error: ${errorText}`);
          }
        }
        
        return res.json();
      } catch (error) {
        console.error('Mutation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/meets'] });
      toast({
        title: 'Meet Created',
        description: 'Your track meet has been successfully created',
      });
      onClose();
    },
    onError: (error: Error) => {
      console.error('Error details:', error);
      toast({
        title: 'Error Creating Meet',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleLocationSelect = (selectedLocation: LocationSearchResult) => {
    setLocation(selectedLocation.formatted);
    setCoordinates({
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude
    });
  };

  const addEvent = () => {
    if (newEvent.trim() && !events.includes(newEvent.trim())) {
      setEvents([...events, newEvent.trim()]);
      setNewEvent('');
    }
  };

  const removeEvent = (eventToRemove: string) => {
    setEvents(events.filter(event => event !== eventToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a meet',
        variant: 'destructive',
      });
      return;
    }

    // Form validation
    if (!name.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a meet name',
        variant: 'destructive',
      });
      return;
    }

    if (!date) {
      toast({
        title: 'Missing Information',
        description: 'Please select a date',
        variant: 'destructive',
      });
      return;
    }

    if (!time) {
      toast({
        title: 'Missing Information',
        description: 'Please select a time',
        variant: 'destructive',
      });
      return;
    }

    if (!location) {
      toast({
        title: 'Missing Information',
        description: 'Please select a location',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Combine date and time
      const dateTime = new Date(`${date}T${time}`);
      
      if (isNaN(dateTime.getTime())) {
        throw new Error('Invalid date or time format');
      }

      // Create meet data with properly formatted date
      const meetData = {
        userId: user.id,
        name,
        date: dateTime,
        location,
        events,
        warmupTime,
        arrivalTime,
        coordinates: coordinates
      };
      
      console.log('Submitting meet data:', meetData);
      createMeetMutation.mutate(meetData);
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: 'Validation Error',
        description: error instanceof Error ? error.message : 'Please check the form and try again',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Create New Meet</DialogTitle>
          <p className="text-sm text-muted-foreground">Fill in the details to create a new track meet</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="meet-name">Meet Name</Label>
              <Input 
                id="meet-name" 
                placeholder="e.g. City Championships"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="meet-date">Date</Label>
                <Input 
                  id="meet-date" 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="meet-time">Time</Label>
                <Input 
                  id="meet-time" 
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label>Location</Label>
              <LocationSearch 
                onLocationSelect={handleLocationSelect}
                defaultValue={location}
              />
              {coordinates && (
                <p className="text-xs text-muted-foreground mt-1">
                  Coordinates: {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="meet-events">Events</Label>
              <div className="flex flex-wrap gap-2 mt-2 mb-2">
                {events.map((event) => (
                  <Badge 
                    key={event} 
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    {event}
                    <button 
                      type="button" 
                      onClick={() => removeEvent(event)}
                      className="ml-1 focus:outline-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <div className="flex">
                  <Input 
                    id="new-event"
                    placeholder="Add event"
                    value={newEvent}
                    onChange={(e) => setNewEvent(e.target.value)}
                    className="rounded-r-none border-r-0 h-8 min-w-[100px] max-w-[150px]"
                  />
                  <Button 
                    type="button" 
                    variant="secondary"
                    size="sm"
                    onClick={addEvent}
                    className="rounded-l-none h-8"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div>
              <Label>Preparation Settings</Label>
              <div className="bg-gray-50 p-3 rounded-lg space-y-3 mt-2">
                <div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="warmup-time" className="text-xs">When to start warm-up</Label>
                    <span className="text-sm font-medium">{warmupTime} min</span>
                  </div>
                  <Slider 
                    id="warmup-time"
                    min={30} 
                    max={120} 
                    step={5}
                    value={[warmupTime]}
                    onValueChange={(value) => setWarmupTime(value[0])}
                    className="my-2"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="arrival-time" className="text-xs">Arrival time before event</Label>
                    <span className="text-sm font-medium">{arrivalTime} min</span>
                  </div>
                  <Slider 
                    id="arrival-time"
                    min={60} 
                    max={180} 
                    step={5}
                    value={[arrivalTime]}
                    onValueChange={(value) => setArrivalTime(value[0])}
                    className="my-2"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-primary text-white"
              disabled={createMeetMutation.isPending}
            >
              {createMeetMutation.isPending ? 'Creating...' : 'Create Meet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}