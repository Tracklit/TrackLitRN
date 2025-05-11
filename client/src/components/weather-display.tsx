import { Weather } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface WeatherDisplayProps {
  weather: Weather | null;
  isLoading: boolean;
  error: Error | null;
}

export function WeatherDisplay({ weather, isLoading, error }: WeatherDisplayProps) {
  if (isLoading) {
    return (
      <div className="bg-secondary/5 rounded-lg p-3 flex items-center justify-center mb-4 h-20">
        <Loader2 className="h-5 w-5 text-secondary animate-spin" />
        <span className="ml-2 text-sm text-darkGray">Loading weather...</span>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-secondary/5 rounded-lg p-3 flex items-center justify-between mb-4">
        <div className="text-sm text-darkGray">
          Weather data unavailable
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary/5 rounded-lg p-3 flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <img 
          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} 
          alt={weather.description} 
          className="w-10 h-10 weather-icon" 
        />
        <div>
          <p className="text-sm font-medium capitalize">{weather.description}</p>
          <p className="text-xs text-darkGray">{Math.round(weather.temperature * 9/5 + 32)}°F / {Math.round(weather.temperature)}°C</p>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div className="relative mb-1">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-darkGray transform wind-arrow" 
            style={{ transform: `rotate(${45}deg)` }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="19" x2="12" y2="5"></line>
            <polyline points="5 12 12 5 19 12"></polyline>
          </svg>
        </div>
        <p className="text-xs text-darkGray">{Math.round(weather.windSpeed)} mph {weather.windDirection}</p>
      </div>
    </div>
  );
}
