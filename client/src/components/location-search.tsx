import React, { useState, useEffect, useRef } from 'react';
import { LocationSearchResult } from '@/hooks/use-location-search';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MapPin, X, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

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
  const [inputValue, setInputValue] = useState(defaultValue);
  const [isSearching, setIsSearching] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<LocationSearchResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationSearchResult | null>(null);
  const [resultsVisible, setResultsVisible] = useState(false);
  const { toast } = useToast();
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  // Find location by formatted name
  const findLocationByFormatted = (formatted: string) => {
    return LOCATIONS.find(loc => loc.formatted === formatted) || null;
  };

  // Set default value if provided
  useEffect(() => {
    if (defaultValue) {
      setInputValue(defaultValue);
      const location = findLocationByFormatted(defaultValue);
      if (location) {
        setSelectedLocation(location);
      }
    }
  }, [defaultValue]);

  // Filter locations based on input value
  const filterLocations = (value: string) => {
    setIsSearching(true);
    
    if (!value.trim()) {
      setFilteredLocations(LOCATIONS.slice(0, 5)); // Show top 5 locations when empty
      setIsSearching(false);
      return;
    }
    
    const term = value.toLowerCase();
    const filtered = LOCATIONS.filter(loc => 
      loc.name.toLowerCase().includes(term) || 
      (loc.city && loc.city.toLowerCase().includes(term)) ||
      (loc.state && loc.state.toLowerCase().includes(term)) ||
      loc.country.toLowerCase().includes(term)
    );
    
    setFilteredLocations(filtered);
    setIsSearching(false);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setResultsVisible(true);
    filterLocations(value);
  };

  // Handle location selection
  const handleLocationSelect = (location: LocationSearchResult) => {
    setSelectedLocation(location);
    setInputValue(location.formatted);
    setResultsVisible(false);
    
    console.log('Location selected:', location);
    
    try {
      onLocationSelect(location);
    } catch (err) {
      console.error('Error selecting location:', err);
      toast({
        title: "Error",
        description: "Failed to set location",
        variant: "destructive"
      });
    }
  };

  // Handle clear button click
  const handleClear = () => {
    setInputValue('');
    setSelectedLocation(null);
    setResultsVisible(false);
    
    // Create a blank location to clear the parent component
    const emptyLocation: LocationSearchResult = {
      name: '',
      country: '',
      formatted: '',
      latitude: 0,
      longitude: 0
    };
    
    onLocationSelect(emptyLocation);
  };

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setResultsVisible(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  // Immediately show some results when input is focused
  const handleInputFocus = () => {
    if (!inputValue) {
      setFilteredLocations(LOCATIONS.slice(0, 5)); // Show top 5 locations
    } else {
      filterLocations(inputValue);
    }
    setResultsVisible(true);
  };

  return (
    <div className="space-y-2">
      <Label>Location</Label>
      
      <div className="relative" ref={wrapperRef}>
        <div className="relative">
          <Input
            type="text"
            placeholder="Search track venues, stadiums, or cities..."
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            className="pr-8"
          />
          
          {inputValue ? (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full w-9"
              onClick={handleClear}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
        </div>
        
        {/* Results dropdown */}
        {resultsVisible && (
          <div className="absolute z-10 mt-1 w-full bg-white rounded-md border shadow-lg max-h-56 overflow-auto">
            {isSearching ? (
              <div className="px-3 py-2 text-sm text-center text-muted-foreground">
                Searching...
              </div>
            ) : filteredLocations.length === 0 ? (
              <div className="px-3 py-2 text-sm text-center text-muted-foreground">
                No locations found
              </div>
            ) : (
              <>
                {filteredLocations.map((location, index) => {
                  const locationString = [
                    location.city,
                    location.state,
                    location.country
                  ].filter(Boolean).join(", ");
                  
                  return (
                    <div
                      key={`${location.name}-${index}`}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleLocationSelect(location)}
                    >
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground mr-2 flex-shrink-0" />
                        <div>
                          <div className="font-medium">{location.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {locationString}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
        
        {/* Selected location indicator */}
        {selectedLocation && (
          <div className="mt-1.5 text-xs text-muted-foreground flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            <span>
              {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}