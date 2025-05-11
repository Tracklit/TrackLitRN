import { useState, useRef, useEffect, memo } from 'react';
import { MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LocationSearchResult } from '@/hooks/use-location-search';
import { LoadScript, Autocomplete } from '@react-google-maps/api';

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ['places'];
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// The form container for the autocomplete input that correctly handles controlled behavior
const AutocompleteField = memo(({ 
  value, 
  onPlaceSelect 
}: { 
  value: string;
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
}) => {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
    
    // Bias towards stadiums and sports venues
    autocomplete.setOptions({
      types: ['establishment'],
      fields: ['address_components', 'geometry', 'name', 'formatted_address']
    });
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      onPlaceSelect(place);
    }
  };

  // Reset the input value when external value changes
  useEffect(() => {
    if (inputRef.current && value !== inputRef.current.value) {
      inputRef.current.value = value;
    }
  }, [value]);

  return (
    <Autocomplete
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
      options={{
        componentRestrictions: { country: [] } // No restrictions
      }}
    >
      <Input
        ref={inputRef}
        defaultValue={value}
        placeholder="Search for track venues, stadiums, or schools..."
        className="w-full"
        autoComplete="off"
      />
    </Autocomplete>
  );
});

interface LocationSearchProps {
  onLocationSelect: (location: LocationSearchResult) => void;
  defaultValue?: string;
}

export function LocationSearch({ onLocationSelect, defaultValue = '' }: LocationSearchProps) {
  const [displayValue, setDisplayValue] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    if (!place.geometry || !place.geometry.location) {
      toast({
        title: "Location Error",
        description: "Failed to get location details. Please try a different search.",
        variant: "destructive"
      });
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    
    setLoading(true);

    try {
      // Extract address components
      let city = "";
      let state = "";
      let country = "";
      
      if (place.address_components) {
        for (const component of place.address_components) {
          const types = component.types;
          
          if (types.includes('locality')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            state = component.long_name;
          } else if (types.includes('country')) {
            country = component.long_name;
          }
        }
      }

      const locationResult: LocationSearchResult = {
        name: place.name || '',
        city: city,
        state: state,
        country: country,
        formatted: place.formatted_address || `${place.name}, ${city || state || country}`,
        latitude: lat,
        longitude: lng
      };

      // Update display value
      setDisplayValue(locationResult.formatted);
      
      console.log('Location selected:', locationResult);
      
      onLocationSelect(locationResult);
      
      toast({
        title: "Location Selected",
        description: `Selected ${locationResult.formatted}`,
      });
    } catch (err) {
      console.error('Error selecting location:', err);
      toast({
        title: "Error",
        description: "Failed to set location",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDisplayValue('');
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

  return (
    <LoadScript
      googleMapsApiKey={API_KEY}
      libraries={libraries}
      loadingElement={<div>Loading Google Maps...</div>}
    >
      <div className="space-y-2">
        <Label htmlFor="location-search">Location</Label>
        <div className="relative">
          <AutocompleteField
            value={displayValue}
            onPlaceSelect={handlePlaceSelect}
          />
          
          {displayValue && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={handleReset}
              title="Clear location"
            >
              ✕
            </Button>
          )}
          
          {!displayValue && (
            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
        </div>
        
        {loading && (
          <div className="text-sm text-muted-foreground">Loading location details...</div>
        )}
        
        <div className="text-xs text-muted-foreground mt-1">
          Search for track and field venues, stadiums, or schools
        </div>
      </div>
    </LoadScript>
  );
}