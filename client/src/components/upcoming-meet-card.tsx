import { useMemo } from 'react';
import { Calendar, MapPin, Share2 } from 'lucide-react';
import { Meet, Weather } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WeatherDisplay } from '@/components/weather-display';
import { useMeetForecast } from '@/hooks/use-meet-forecast';
import { formatDateTime, formatRelativeTime } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface UpcomingMeetCardProps {
  meet: Meet;
  onViewPreparation?: () => void;
}

export function UpcomingMeetCard({ meet, onViewPreparation }: UpcomingMeetCardProps) {
  const { toast } = useToast();
  
  // Parse coordinates from meet object
  const coordinates = useMemo(() => {
    if (!meet.coordinates) return null;
    
    try {
      const coords = typeof meet.coordinates === 'string' 
        ? JSON.parse(meet.coordinates) 
        : meet.coordinates;
        
      if (coords && typeof coords === 'object' && 
          'latitude' in coords && typeof coords.latitude === 'number' &&
          'longitude' in coords && typeof coords.longitude === 'number') {
        return coords;
      }
    } catch (e) {
      console.error('Failed to parse coordinates', e);
    }
    return null;
  }, [meet.coordinates]);
  
  // Use our forecast hook with both coordinates and meet date
  const { weather, isLoading, error } = useMeetForecast({
    coordinates,
    meetDate: meet.date
  });

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `TrackLit: ${meet.name}`,
          text: `Join me at ${meet.name} on ${formatDateTime(meet.date)} at ${meet.location}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      toast({
        title: "Link Copied",
        description: "Meet details copied to clipboard",
      });
      navigator.clipboard.writeText(
        `Check out my upcoming track meet: ${meet.name} on ${formatDateTime(meet.date)} at ${meet.location}`
      );
    }
  };

  const trackImage = "https://images.unsplash.com/photo-1531415074968-036ba1b575da?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=500";

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="relative">
        <img 
          src={trackImage}
          alt="Track and field stadium" 
          className="w-full h-32 object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-3 left-4 text-white">
          <h4 className="font-bold text-lg">{meet.name}</h4>
          <p className="text-sm opacity-90">{meet.events?.join(', ')}</p>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-darkGray" />
            <span className="text-sm">{formatDateTime(meet.date)}</span>
          </div>
          <Badge variant="secondary">
            {formatRelativeTime(meet.date)}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-darkGray" />
            <span className="text-sm">{meet.location}</span>
          </div>
        </div>
        
        <WeatherDisplay 
          weather={weather} 
          isLoading={isLoading} 
          error={error} 
          meetDate={meet.date} 
        />
        
        <div className="flex space-x-3">
          <Button 
            className="flex-1 bg-primary hover:bg-primary/90 text-white"
            onClick={onViewPreparation}
          >
            Preparation Plan
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleShare}
            className="w-10"
          >
            <Share2 className="h-4 w-4 text-darkGray" />
          </Button>
        </div>
      </div>
    </div>
  );
}
