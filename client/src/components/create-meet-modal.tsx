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
  const [websiteUrl, setWebsiteUrl] = useState('');

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
      setWebsiteUrl('');
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
    console.log('Selected location in create-meet-modal:', selectedLocation);
    
    try {
      // Set the location name
      setLocation(selectedLocation.formatted);
      
      // Set coordinates
      setCoordinates({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude
      });
      
      console.log('Location and coordinates set successfully');
    } catch (error) {
      console.error('Error handling location selection:', error);
      toast({
        title: "Error",
        description: "Failed to set location data",
        variant: "destructive"
      });
    }
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

    if (!location || !coordinates) {
      toast({
        title: 'Missing Information',
        description: 'Please select a location from the dropdown',
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
        websiteUrl: websiteUrl.trim() || undefined,
        coordinates: coordinates ? {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        } : undefined
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-[#0c1525] border-blue-800/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white">Create New Meet</DialogTitle>
          <p className="text-sm text-blue-300">Fill in the details to create a new track meet</p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="meet-name" className="text-white">Meet Name</Label>
              <Input 
                id="meet-name" 
                placeholder="e.g. City Championships"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-[#081020] border-blue-800/50 text-white placeholder:text-blue-400/50"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="meet-date" className="text-white">Date</Label>
                <Input 
                  id="meet-date" 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="bg-[#081020] border-blue-800/50 text-white"
                />
              </div>
              <div>
                <Label htmlFor="meet-time" className="text-white">Time</Label>
                <Input 
                  id="meet-time" 
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="bg-[#081020] border-blue-800/50 text-white"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-white">Location</Label>
              <LocationSearch 
                onLocationSelect={handleLocationSelect}
                defaultValue={location}
              />
              {coordinates && (
                <p className="text-xs text-blue-300 mt-1">
                  Coordinates: {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="meet-url" className="text-white">Official Website (Optional)</Label>
              <Input 
                id="meet-url" 
                type="url"
                placeholder="https://example.com/meet-info"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="bg-[#081020] border-blue-800/50 text-white placeholder:text-gray-400"
              />
            </div>
            
            <div>
              <Label htmlFor="meet-events" className="text-white">Events</Label>
              <div className="flex flex-wrap gap-2 mt-2 mb-2">
                {events.map((event) => (
                  <Badge 
                    key={event} 
                    variant="outline"
                    className="flex items-center gap-1 bg-blue-900/30 text-blue-200 border-blue-700/50"
                  >
                    {event}
                    <button 
                      type="button" 
                      onClick={() => removeEvent(event)}
                      className="ml-1 focus:outline-none text-blue-300 hover:text-blue-100"
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
                    className="rounded-r-none border-r-0 h-8 min-w-[100px] max-w-[150px] bg-[#081020] border-blue-800/50 text-white placeholder:text-blue-400/50"
                  />
                  <Button 
                    type="button" 
                    variant="secondary"
                    size="sm"
                    onClick={addEvent}
                    className="rounded-l-none h-8 bg-blue-800 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div>
              <Label className="text-white">Preparation Settings</Label>
              <div className="bg-[#081020] border border-blue-800/50 p-3 rounded-lg space-y-3 mt-2">
                <div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="warmup-time" className="text-xs text-blue-300">When to start warm-up</Label>
                    <span className="text-sm font-medium text-amber-500">{warmupTime} min</span>
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
                    <Label htmlFor="arrival-time" className="text-xs text-blue-300">Arrival time before event</Label>
                    <span className="text-sm font-medium text-amber-500">{arrivalTime} min</span>
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
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-blue-700 text-blue-300 hover:bg-blue-900/30 hover:text-blue-100"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-amber-500 hover:bg-amber-600 text-white"
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