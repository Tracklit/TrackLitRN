import { useState, useEffect, useCallback } from 'react';
import { useLocationSearch, LocationSearchResult } from '@/hooks/use-location-search';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, X, Search } from 'lucide-react';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

interface LocationSearchProps {
  onLocationSelect: (location: LocationSearchResult) => void;
  defaultValue?: string;
}

export function LocationSearch({ onLocationSelect, defaultValue = '' }: LocationSearchProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const { searchTerm, setSearchTerm, results, isLoading, error } = useLocationSearch();
  const { toast } = useToast();
  
  const handleLocationSelect = useCallback((selectedLocation: LocationSearchResult) => {
    console.log('Location selected:', selectedLocation);
    setValue(selectedLocation.formatted);
    setOpen(false);
    
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
  }, [onLocationSelect, setValue, setOpen, toast]);

  const handleClear = useCallback(() => {
    setValue('');
    setSearchTerm('');
    
    // Create a blank location to clear the parent component
    const emptyLocation: LocationSearchResult = {
      name: '',
      country: '',
      formatted: '',
      latitude: 0,
      longitude: 0
    };
    
    onLocationSelect(emptyLocation);
    
    // Focus the input after clearing
    setTimeout(() => {
      const input = document.querySelector('[data-location-search-input]') as HTMLInputElement;
      if (input) input.focus();
    }, 0);
  }, [onLocationSelect, setValue, setSearchTerm]);
  
  // Initialize component with default values
  useEffect(() => {
    // Set initial display value
    if (defaultValue) {
      setValue(defaultValue);
    }
  }, [defaultValue]);

  return (
    <div className="space-y-2">
      <Label>Location</Label>
      <div className="relative">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="flex w-full">
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between relative"
                onClick={() => {
                  setOpen(true);
                  setSearchTerm('');
                }}
              >
                <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <span className="truncate">
                    {value || "Search for a location..."}
                  </span>
                </div>
                {value ? (
                  <X 
                    className="ml-2 h-4 w-4 shrink-0 opacity-70 hover:opacity-100 cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear();
                    }}
                  />
                ) : (
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                )}
              </Button>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start" sideOffset={5}>
            <Command shouldFilter={false} className="rounded-lg border shadow-md">
              <CommandInput 
                placeholder="Type to search locations..." 
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="h-9"
                data-location-search-input
                autoFocus
              />
              <CommandList className="max-h-[300px] overflow-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <CommandEmpty>Error: {error.message}</CommandEmpty>
                ) : results.length === 0 ? (
                  <CommandEmpty>No locations found</CommandEmpty>
                ) : (
                  <>
                    <CommandGroup heading="Search Results">
                      {results.map((location, index) => {
                        // Create a display name and location info
                        const displayName = location.name || "Location";
                        const locationString = [
                          location.city,
                          location.state,
                          location.country
                        ].filter(Boolean).join(", ");
                        
                        return (
                          <CommandItem
                            key={`${location.name}-${location.latitude}-${location.longitude}-${index}`}
                            onSelect={() => handleLocationSelect(location)}
                            className="cursor-pointer py-3 px-2"
                            value={`${location.name} ${locationString}`}
                          >
                            <div className="flex items-start">
                              <MapPin className="mr-2 h-4 w-4 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium">{displayName}</div>
                                {locationString && (
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {locationString}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                    
                    <CommandSeparator />
                    
                    <div className="p-2 text-xs text-center text-muted-foreground">
                      {searchTerm ? (
                        <span>
                          {results.length} results for "{searchTerm}"
                        </span>
                      ) : (
                        <span>
                          Search for track venues, stadiums, or schools
                        </span>
                      )}
                    </div>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}