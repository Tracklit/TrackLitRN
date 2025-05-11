import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getWindDirection, kelvinToCelsius, kelvinToFahrenheit, mpsToMph } from '@/lib/utils';
import { Weather } from '@shared/schema';

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || '';

type Coordinates = {
  lat: number;
  lon: number;
};

export function useWeather(coordinates?: Coordinates | null) {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchWeather() {
      if (!coordinates) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }
        
        const data = await response.json();
        
        // Process weather data
        const weatherData: Weather = {
          description: data.weather[0].description,
          icon: data.weather[0].icon,
          temperature: kelvinToCelsius(data.main.temp),
          windSpeed: mpsToMph(data.wind.speed),
          windDirection: getWindDirection(data.wind.deg),
          humidity: data.main.humidity,
        };
        
        setWeather(weatherData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        toast({
          title: "Weather data error",
          description: "Could not load weather information",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchWeather();
  }, [coordinates, toast]);
  
  return { weather, isLoading, error };
}
