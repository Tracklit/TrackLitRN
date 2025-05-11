import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LocationSearchResult } from '@/hooks/use-location-search';

// Pre-defined locations to avoid API integration issues
const PREDEFINED_LOCATIONS: LocationSearchResult[] = [
  {
    name: "Stockholm Olympic Stadium",
    city: "Stockholm",
    country: "Sweden",
    formatted: "Stockholm Olympic Stadium, Stockholm, Sweden",
    latitude: 59.3435,
    longitude: 18.0825
  },
  {
    name: "Los Angeles Memorial Coliseum",
    city: "Los Angeles",
    country: "USA",
    formatted: "Los Angeles Memorial Coliseum, Los Angeles, USA",
    latitude: 34.0141,
    longitude: -118.2879
  },
  {
    name: "London Olympic Stadium",
    city: "London",
    country: "UK",
    formatted: "London Olympic Stadium, London, UK",
    latitude: 51.5387,
    longitude: -0.0166
  },
  {
    name: "Berlin Olympic Stadium",
    city: "Berlin",
    country: "Germany",
    formatted: "Berlin Olympic Stadium, Berlin, Germany",
    latitude: 52.5146,
    longitude: 13.2391
  },
  {
    name: "Tokyo Olympic Stadium",
    city: "Tokyo",
    country: "Japan",
    formatted: "Tokyo Olympic Stadium, Tokyo, Japan",
    latitude: 35.6778,
    longitude: 139.7142
  }
];

interface LocationSearchProps {
  onLocationSelect: (location: LocationSearchResult) => void;
  defaultValue?: string;
}

export function LocationSearch({ onLocationSelect, defaultValue = '' }: LocationSearchProps) {
  const [value, setValue] = useState(defaultValue);
  const { toast } = useToast();

  const handleLocationSelect = (locationId: string) => {
    const selectedLocation = PREDEFINED_LOCATIONS.find(
      loc => loc.formatted === locationId
    );
    
    if (!selectedLocation) return;
    
    console.log('Location selected:', selectedLocation);
    setValue(selectedLocation.formatted);
    
    try {
      onLocationSelect(selectedLocation);
      
      toast({
        title: "Location Selected",
        description: `Selected ${selectedLocation.formatted}`,
      });
    } catch (err) {
      console.error('Error selecting location:', err);
      toast({
        title: "Error",
        description: "Failed to set location",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col space-y-2 w-full">
      <Select 
        onValueChange={handleLocationSelect}
        defaultValue={value || undefined}
      >
        <SelectTrigger>
          <div className="flex items-center">
            <MapPin className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <SelectValue placeholder="Select a location..." />
          </div>
        </SelectTrigger>
        <SelectContent>
          {PREDEFINED_LOCATIONS.map((location) => (
            <SelectItem 
              key={`${location.latitude}-${location.longitude}`}
              value={location.formatted}
            >
              <div className="flex flex-col">
                <span>{location.name}</span>
                <span className="text-xs text-muted-foreground">
                  {location.city}, {location.country}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}