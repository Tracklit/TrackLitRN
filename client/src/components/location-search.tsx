import React, { useState, useEffect, useRef } from 'react';
import { LocationSearchResult } from '@/hooks/use-location-search';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MapPin, X, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

// Google Maps API Key
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Track venues and popular locations
const POPULAR_VENUES: LocationSearchResult[] = [
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
  }
];

interface LocationSearchProps {
  onLocationSelect: (location: LocationSearchResult) => void;
  defaultValue?: string;
}

export function LocationSearch({ onLocationSelect, defaultValue = '' }: LocationSearchProps) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationSearchResult | null>(null);
  const [resultsVisible, setResultsVisible] = useState(false);
  const { toast } = useToast();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Find venue by formatted name
  const findVenueByFormatted = (formatted: string) => {
    return POPULAR_VENUES.find(loc => loc.formatted === formatted) || null;
  };

  // Set default value if provided
  useEffect(() => {
    if (defaultValue) {
      setInputValue(defaultValue);
      const location = findVenueByFormatted(defaultValue);
      if (location) {
        setSelectedLocation(location);
      }
    }
  }, [defaultValue]);

  // Search for locations using Google Places API
  const searchLocations = async (query: string) => {
    setIsSearching(true);
    
    if (!query.trim()) {
      setSearchResults(POPULAR_VENUES);
      setIsSearching(false);
      return;
    }
    
    // Always check local venues first for fast matches
    const term = query.toLowerCase();
    const localMatches = POPULAR_VENUES.filter(venue => 
      venue.name.toLowerCase().includes(term) || 
      venue.city?.toLowerCase().includes(term) || 
      venue.country.toLowerCase().includes(term)
    );
    
    // For very short queries, only show local matches
    if (query.length < 3) {
      setSearchResults(localMatches);
      setIsSearching(false);
      return;
    }
    
    try {
      // Use Google Maps Places API
      const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;
      
      // Call through our server proxy
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(placesUrl)}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        // Convert Google Places results to our format
        const apiResults = data.results.map((place: any) => {
          // Parse location components
          const addressComponents = place.formatted_address?.split(', ') || [];
          const country = addressComponents.length > 0 ? addressComponents[addressComponents.length - 1] : '';
          const city = addressComponents.length > 1 ? addressComponents[0] : '';
          
          return {
            name: place.name || '',
            city,
            country,
            formatted: place.formatted_address || place.name,
            latitude: place.geometry?.location?.lat || 0,
            longitude: place.geometry?.location?.lng || 0
          };
        });
        
        // Combine local matches and API results
        const combinedResults = [...localMatches];
        
        // Add API results if they don't duplicate local matches
        for (const result of apiResults) {
          if (!combinedResults.some(v => 
              v.latitude === result.latitude && 
              v.longitude === result.longitude)
          ) {
            combinedResults.push(result);
          }
        }
        
        setSearchResults(combinedResults);
      } else {
        // Fall back to local matches if API returns no results
        setSearchResults(localMatches);
      }
    } catch (error) {
      console.error('Search error:', error);
      
      // Fall back to local matches on error
      setSearchResults(localMatches);
      
      // Show error toast only for non-empty searches
      if (query.trim()) {
        toast({
          title: "Search Error",
          description: "Location search unavailable. Using local results only.",
          variant: "destructive"
        });
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setResultsVisible(true);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debouncing
    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 300);
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
    setSearchResults(POPULAR_VENUES);
    
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

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Immediately show popular venues when input is focused
  const handleInputFocus = () => {
    if (!inputValue) {
      setSearchResults(POPULAR_VENUES);
    } else {
      // Trigger search for current input value
      searchLocations(inputValue);
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
            placeholder="Search for any location in the world..."
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
          <div className="absolute z-10 mt-1 w-full bg-[#0c1525] border border-blue-800/50 rounded-md shadow-lg max-h-60 overflow-auto">
            {isSearching ? (
              <div className="px-3 py-4 text-sm text-center text-blue-300">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Searching locations...</span>
                </div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="px-3 py-3 text-sm text-center text-blue-300">
                No locations found
              </div>
            ) : (
              <>
                {/* Popular Venues section */}
                {!inputValue && (
                  <div className="px-3 py-2 text-xs font-medium text-blue-400">
                    Popular Track Venues
                  </div>
                )}
                
                {/* Results list */}
                {searchResults.map((location, index) => {
                  const locationString = [
                    location.city,
                    location.state,
                    location.country
                  ].filter(Boolean).join(", ");
                  
                  return (
                    <div
                      key={`${location.name}-${location.latitude}-${location.longitude}-${index}`}
                      className="px-3 py-2 hover:bg-blue-800/30 cursor-pointer"
                      onClick={() => handleLocationSelect(location)}
                    >
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 mt-0.5 text-blue-400 mr-2 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-white">{location.name}</div>
                          <div className="text-xs text-blue-300">
                            {locationString}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Search anywhere tip */}
                {inputValue && inputValue.length < 3 && (
                  <div className="px-3 py-2 text-xs text-center text-blue-400 border-t border-blue-800/50">
                    Type at least 3 characters to search anywhere in the world
                  </div>
                )}
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