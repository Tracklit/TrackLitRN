import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY || '';

export interface LocationSearchResult {
  name: string;
  city?: string;
  state?: string;
  country: string;
  formatted: string;
  latitude: number;
  longitude: number;
}

export function useLocationSearch() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!searchTerm || searchTerm.length < 3 || !API_KEY) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchLocations = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(searchTerm)}&limit=5&apiKey=${API_KEY}`;
        const response = await fetch(url, { signal });

        if (!response.ok) {
          throw new Error(`Failed to fetch location data: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const formattedResults: LocationSearchResult[] = data.features.map((feature: any) => {
            const props = feature.properties;
            return {
              name: props.name || props.formatted,
              city: props.city,
              state: props.state,
              country: props.country,
              formatted: props.formatted,
              latitude: props.lat,
              longitude: props.lon
            };
          });
          
          setResults(formattedResults);
        } else {
          setResults([]);
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          if (error.name !== 'AbortError') {
            setError(error);
            setResults([]);
            
            if (!API_KEY) {
              toast({
                title: "API Key Missing",
                description: "Location search requires a Geoapify API key",
                variant: "destructive",
              });
            }
          }
        } else {
          setError(new Error('Unknown error occurred'));
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchLocations, 300);
    
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [searchTerm, toast]);

  return { 
    searchTerm, 
    setSearchTerm, 
    results, 
    isLoading, 
    error 
  };
}