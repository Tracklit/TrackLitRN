import React, { useState, useEffect } from 'react';
import { LocationSearchResult } from '@/hooks/use-location-search';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Predefined locations
const LOCATIONS: LocationSearchResult[] = [
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
    name: "Tokyo National Stadium",
    city: "Tokyo",
    country: "Japan",
    formatted: "Tokyo National Stadium, Tokyo, Japan",
    latitude: 35.6778,
    longitude: 139.7142
  },
  {
    name: "Hayward Field",
    city: "Eugene",
    state: "Oregon",
    country: "USA",
    formatted: "Hayward Field, Eugene, Oregon, USA",
    latitude: 44.0423,
    longitude: -123.0694
  },
  {
    name: "Stade de France",
    city: "Paris",
    country: "France",
    formatted: "Stade de France, Paris, France",
    latitude: 48.9245,
    longitude: 2.3601
  },
  {
    name: "Franklin Field",
    city: "Philadelphia",
    state: "Pennsylvania",
    country: "USA",
    formatted: "Franklin Field, Philadelphia, Pennsylvania, USA",
    latitude: 39.9526, 
    longitude: -75.1892
  },
  {
    name: "Drake Stadium",
    city: "Des Moines",
    state: "Iowa",
    country: "USA",
    formatted: "Drake Stadium, Des Moines, Iowa, USA",
    latitude: 41.6022,
    longitude: -93.6575
  },
  {
    name: "SPIRE Institute",
    city: "Geneva",
    state: "Ohio",
    country: "USA",
    formatted: "SPIRE Institute, Geneva, Ohio, USA",
    latitude: 41.8009,
    longitude: -80.9387
  },
  {
    name: "Letzigrund Stadium",
    city: "Zurich",
    country: "Switzerland",
    formatted: "Letzigrund Stadium, Zurich, Switzerland",
    latitude: 47.3825,
    longitude: 8.5033
  }
];

interface LocationSearchProps {
  onLocationSelect: (location: LocationSearchResult) => void;
  defaultValue?: string;
}

export function LocationSearch({ onLocationSelect, defaultValue = '' }: LocationSearchProps) {
  const [selectedLocationValue, setSelectedLocationValue] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredLocations, setFilteredLocations] = useState(LOCATIONS);
  const { toast } = useToast();

  // Update selected value if defaultValue is provided
  useEffect(() => {
    if (defaultValue) {
      setSelectedLocationValue(defaultValue);
    }
  }, [defaultValue]);

  // Filter locations when search term changes
  useEffect(() => {
    if (!searchTerm) {
      setFilteredLocations(LOCATIONS);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = LOCATIONS.filter(loc => 
      loc.name.toLowerCase().includes(term) || 
      (loc.city && loc.city.toLowerCase().includes(term)) ||
      (loc.state && loc.state.toLowerCase().includes(term)) ||
      loc.country.toLowerCase().includes(term)
    );
    
    setFilteredLocations(filtered);
  }, [searchTerm]);

  const handleSelectLocation = (value: string) => {
    const selectedLocation = LOCATIONS.find(loc => loc.formatted === value);
    
    if (!selectedLocation) return;
    
    setSelectedLocationValue(value);
    console.log('Location selected:', selectedLocation);
    
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
    <div className="space-y-2">
      <Label>Location</Label>
      
      <div>
        <Input
          type="text"
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-2"
        />
        
        <Select value={selectedLocationValue} onValueChange={handleSelectLocation}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a location" />
          </SelectTrigger>
          <SelectContent>
            {filteredLocations.length === 0 ? (
              <div className="px-2 py-2 text-sm text-center text-muted-foreground">
                No locations found
              </div>
            ) : (
              filteredLocations.map((location, index) => {
                const locationString = [
                  location.city,
                  location.state,
                  location.country
                ].filter(Boolean).join(", ");
                
                return (
                  <SelectItem 
                    key={`${location.name}-${index}`}
                    value={location.formatted}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{location.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {locationString}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                );
              })
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}