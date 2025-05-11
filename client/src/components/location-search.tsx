import { useState, useEffect } from 'react';
import { useLocationSearch, LocationSearchResult } from '@/hooks/use-location-search';
import { MapPin, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LocationSearchProps {
  onLocationSelect: (location: LocationSearchResult) => void;
  defaultValue?: string;
}

export function LocationSearch({ onLocationSelect, defaultValue = '' }: LocationSearchProps) {
  const { searchTerm, setSearchTerm, results } = useLocationSearch();
  const [searchInput, setSearchInput] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(defaultValue || undefined);
  const { toast } = useToast();

  // Update search results when input changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchInput, setSearchTerm]);

  const handleLocationSelect = (locationId: string) => {
    const location = results.find(loc => loc.formatted === locationId);
    
    if (!location) {
      console.error('Location not found:', locationId);
      return;
    }
    
    setSelectedLocation(location.formatted);
    console.log('Location selected:', location);
    
    try {
      onLocationSelect(location);
      
      toast({
        title: "Location Selected",
        description: `Selected ${location.formatted}`,
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
    <div className="space-y-2">
      <Input
        placeholder="Search for venues, cities, or countries..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="mb-2"
      />
      
      <Select onValueChange={handleLocationSelect} value={selectedLocation}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a location" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Available Locations</SelectLabel>
            {results.length === 0 ? (
              <SelectItem value="no-results" disabled>
                No locations found
              </SelectItem>
            ) : (
              results.map((location) => (
                <SelectItem 
                  key={`${location.latitude}-${location.longitude}`} 
                  value={location.formatted}
                  className="cursor-pointer py-2"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{location.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {[location.city, location.state, location.country].filter(Boolean).join(", ")}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}