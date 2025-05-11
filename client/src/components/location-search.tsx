import { useState, useCallback } from 'react';
import { useLocationSearch, LocationSearchResult } from '@/hooks/use-location-search';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Search } from 'lucide-react';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

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

  return (
    <div className="flex flex-col space-y-2 w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex w-full">
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <span className="truncate">
                  {value || "Search for a location..."}
                </span>
              </div>
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search for a location..." 
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="h-9"
            />
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <CommandEmpty>Error: {error.message}</CommandEmpty>
              ) : results.length === 0 && searchTerm.length >= 3 ? (
                <CommandEmpty>No locations found</CommandEmpty>
              ) : (
                <CommandGroup>
                  {results.map((location, index) => (
                    <CommandItem
                      key={`${location.latitude}-${location.longitude}-${index}`}
                      value={location.formatted}
                      onSelect={() => {
                        console.log('CommandItem selected for location:', location);
                        handleLocationSelect(location);
                      }}
                      className="cursor-pointer hover:bg-accent"
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{location.formatted}</span>
                        <span className="text-xs text-muted-foreground">
                          {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {searchTerm.length > 0 && searchTerm.length < 3 && (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  Type at least 3 characters to search
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}