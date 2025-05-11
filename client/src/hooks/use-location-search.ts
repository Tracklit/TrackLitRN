import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

// API key for geoapify
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

// Popular track and field stadiums for default results
const DEFAULT_LOCATIONS: LocationSearchResult[] = [
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
  }
];

// A curated list of additional stadiums in different countries
const EXTENDED_LOCATIONS: Record<string, LocationSearchResult[]> = {
  "USA": [
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
    }
  ],
  "Europe": [
    {
      name: "Stadio Olimpico",
      city: "Rome",
      country: "Italy",
      formatted: "Stadio Olimpico, Rome, Italy",
      latitude: 41.9341,
      longitude: 12.4547
    },
    {
      name: "Letzigrund Stadium",
      city: "Zurich",
      country: "Switzerland",
      formatted: "Letzigrund Stadium, Zurich, Switzerland",
      latitude: 47.3825,
      longitude: 8.5033
    },
    {
      name: "Olympic Stadium",
      city: "Helsinki",
      country: "Finland",
      formatted: "Olympic Stadium, Helsinki, Finland",
      latitude: 60.1864,
      longitude: 24.9275
    }
  ],
  "Asia": [
    {
      name: "National Stadium",
      city: "Beijing",
      country: "China",
      formatted: "National Stadium, Beijing, China",
      latitude: 39.9932,
      longitude: 116.3968
    },
    {
      name: "Khalifa International Stadium",
      city: "Doha",
      country: "Qatar",
      formatted: "Khalifa International Stadium, Doha, Qatar",
      latitude: 25.2639,
      longitude: 51.4481
    }
  ],
  "Australia": [
    {
      name: "Sydney Olympic Park Athletic Centre",
      city: "Sydney",
      country: "Australia",
      formatted: "Sydney Olympic Park Athletic Centre, Sydney, Australia",
      latitude: -33.8473,
      longitude: 151.0640
    }
  ]
};

export function useLocationSearch() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [results, setResults] = useState<LocationSearchResult[]>(DEFAULT_LOCATIONS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  
  // Always ensure we have default locations loaded
  useEffect(() => {
    if (results.length === 0) {
      setResults(DEFAULT_LOCATIONS);
    }
  }, []);

  // Search function combining local search and API if available
  const searchLocations = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setResults(DEFAULT_LOCATIONS);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First, do a local search in our predefined locations
      const termLower = term.toLowerCase();
      
      // Search in default locations
      const defaultMatches = DEFAULT_LOCATIONS.filter(loc => 
        loc.name.toLowerCase().includes(termLower) || 
        loc.city?.toLowerCase().includes(termLower) ||
        loc.state?.toLowerCase().includes(termLower) ||
        loc.country.toLowerCase().includes(termLower)
      );
      
      // Search in extended locations
      const extendedMatches = Object.values(EXTENDED_LOCATIONS)
        .flat()
        .filter(loc => 
          loc.name.toLowerCase().includes(termLower) || 
          loc.city?.toLowerCase().includes(termLower) ||
          loc.state?.toLowerCase().includes(termLower) ||
          loc.country.toLowerCase().includes(termLower)
        );
      
      // Combine results
      const localResults = [...defaultMatches, ...extendedMatches];
      
      // If we have API key, try to get additional results
      if (API_KEY && term.length >= 3) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(term)}&limit=5&apiKey=${API_KEY}`;
          const response = await fetch(url, { signal: controller.signal });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
              const apiResults: LocationSearchResult[] = data.features.map((feature: any) => {
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
              
              // Combine local and API results, removing duplicates by formatted name
              const combinedResults = [...localResults];
              
              for (const apiResult of apiResults) {
                if (!combinedResults.some(loc => loc.formatted === apiResult.formatted)) {
                  combinedResults.push(apiResult);
                }
              }
              
              setResults(combinedResults);
              return;
            }
          }
        } catch (apiError) {
          console.warn('API search failed, falling back to local results', apiError);
          // Fall back to local results - don't set an error
        }
      }
      
      // Return local results if API search failed or wasn't attempted
      setResults(localResults.length > 0 ? localResults : []);
      
    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error : new Error('Unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Effect to run search when search term changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchLocations(searchTerm);
    }, 300);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchTerm, searchLocations]);

  return { 
    searchTerm, 
    setSearchTerm, 
    results, 
    isLoading, 
    error 
  };
}