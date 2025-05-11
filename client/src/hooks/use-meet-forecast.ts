import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getWindDirection, kelvinToCelsius, mpsToMph } from '@/lib/utils';
import { Weather } from '@shared/schema';

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || '';

// Maximum days into the future that OpenWeather API can forecast (5 days)
const MAX_FORECAST_DAYS = 5;

// Convert to milliseconds
const MAX_FORECAST_MS = MAX_FORECAST_DAYS * 24 * 60 * 60 * 1000;

type Coordinates = {
  lat: number;
  lon: number;
};

interface MeetForecastProps {
  coordinates?: { latitude: number; longitude: number } | null;
  meetDate?: Date | string | number | null;
}

export function useMeetForecast({ coordinates, meetDate }: MeetForecastProps) {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchWeatherData() {
      if (!coordinates || !meetDate) {
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const meetTimestamp = new Date(meetDate).getTime();
        const currentTime = Date.now();
        const timeOffset = meetTimestamp - currentTime;
        
        const coords: Coordinates = {
          lat: coordinates.latitude,
          lon: coordinates.longitude
        };
        
        // If meet is too far in the future (beyond forecast capability)
        if (timeOffset > MAX_FORECAST_MS) {
          // Return a placeholder weather object with forecast unavailable flag
          setWeather({
            description: "Forecast unavailable",
            icon: "50d", // Mist icon as placeholder
            temperature: 0,
            windSpeed: 0,
            windDirection: "N/A",
            humidity: 0,
            isForecastUnavailable: true,
            forecastTime: currentTime,
            targetTime: meetTimestamp
          });
          setIsLoading(false);
          return;
        }
        
        // Use current weather API for current day
        if (timeOffset <= 0 || isSameDay(new Date(meetDate), new Date())) {
          const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}`;
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error('Failed to fetch current weather data');
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
            forecastTime: currentTime,
            targetTime: meetTimestamp
          };
          
          setWeather(weatherData);
        } 
        // Use forecast API for future dates (within 5 days)
        else {
          const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}`;
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error('Failed to fetch forecast data');
          }
          
          const data = await response.json();
          
          // Find closest forecast time to the meet time
          const targetDate = new Date(meetDate);
          const meetHour = targetDate.getHours();
          
          // Get all forecasts for the meet day
          const meetDateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
          const dayForecasts = data.list.filter((item: any) => 
            item.dt_txt.startsWith(meetDateStr)
          );
          
          if (dayForecasts.length === 0) {
            throw new Error('No forecast data available for the selected date');
          }
          
          // Find forecast closest to the meet time
          let closestForecast = dayForecasts[0];
          let minTimeDiff = Infinity;
          
          for (const forecast of dayForecasts) {
            const forecastHour = new Date(forecast.dt * 1000).getHours();
            const timeDiff = Math.abs(forecastHour - meetHour);
            
            if (timeDiff < minTimeDiff) {
              minTimeDiff = timeDiff;
              closestForecast = forecast;
            }
          }
          
          // Process forecast data
          const weatherData: Weather = {
            description: closestForecast.weather[0].description,
            icon: closestForecast.weather[0].icon,
            temperature: kelvinToCelsius(closestForecast.main.temp),
            windSpeed: mpsToMph(closestForecast.wind.speed),
            windDirection: getWindDirection(closestForecast.wind.deg),
            humidity: closestForecast.main.humidity,
            forecastTime: currentTime,
            targetTime: meetTimestamp
          };
          
          setWeather(weatherData);
        }
      } catch (err) {
        console.error('Weather data error:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
        
        // Don't show toast for forecast unavailable - it's an expected state
        if (!(err instanceof Error && err.message.includes('forecast'))) {
          toast({
            title: "Weather data error",
            description: "Could not load weather information",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchWeatherData();
  }, [coordinates, meetDate, toast]);
  
  return { weather, isLoading, error };
}

// Helper function to check if two dates are on the same day
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}