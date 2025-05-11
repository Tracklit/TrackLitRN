import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { LocationSearchResult } from './use-location-search';

// Google Maps API key from environment
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

// Default track and field venues for quick selections
const DEFAULT_VENUES: LocationSearchResult[] = [
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

export function useGooglePlaces() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Initialize with default venues
  useEffect(() => {
    // Start with default venues
    setResults(DEFAULT_VENUES);
  }, []);

  // Function to search Google Places API
  const searchPlaces = useCallback(async (query: string) => {
    // If search term is empty, show default venues
    if (!query.trim()) {
      setResults(DEFAULT_VENUES);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First try to find matches in default venues
      const term = query.toLowerCase();
      const defaultMatches = DEFAULT_VENUES.filter(venue => 
        venue.name.toLowerCase().includes(term) || 
        venue.city?.toLowerCase()?.includes(term) || 
        venue.country.toLowerCase().includes(term)
      );

      // If search term is very short, only search local venues
      if (query.length < 3) {
        setResults(defaultMatches.length > 0 ? defaultMatches : []);
        setIsLoading(false);
        return;
      }

      // Call Google Maps API for places
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${API_KEY}`;
      
      // Use a server proxy to call the API
      const response = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch from Google Places API');
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        // Map Google Places results to our format
        const googleResults = data.results.map((place: any) => {
          const addressParts = place.formatted_address.split(', ');
          let city = '';
          let country = '';
          
          // Simple parsing of address components
          if (addressParts.length >= 2) {
            country = addressParts[addressParts.length - 1];
            city = addressParts[0];
          }
          
          return {
            name: place.name,
            city: city,
            country: country,
            formatted: place.formatted_address,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng
          };
        });
        
        // Combine results with default matches at the top
        const combinedResults = [...defaultMatches];
        
        // Add Google results that don't duplicate defaults
        for (const result of googleResults) {
          if (!combinedResults.some(v => v.formatted === result.formatted)) {
            combinedResults.push(result);
          }
        }
        
        setResults(combinedResults);
      } else {
        // If no API results, just use default matches
        setResults(defaultMatches);
      }
    } catch (err) {
      console.error('Error searching places:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      
      // Fall back to default matches on error
      const defaultMatches = DEFAULT_VENUES.filter(venue => 
        venue.name.toLowerCase().includes(query.toLowerCase()) || 
        venue.city?.toLowerCase()?.includes(query.toLowerCase()) || 
        venue.country.toLowerCase().includes(query.toLowerCase())
      );
      setResults(defaultMatches);
      
      // Only show toast for non-empty searches
      if (query.trim().length > 0) {
        toast({
          title: "Search Error",
          description: "Failed to search locations. Using local results only.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPlaces(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm, searchPlaces]);

  return {
    searchTerm,
    setSearchTerm,
    results,
    isLoading,
    error
  };
}