import { Weather } from "@shared/schema";
import { Loader2, Clock, HelpCircle, Wind, Thermometer } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";
import { Fragment } from "react";

interface WeatherDisplayProps {
  weather: Weather | null;
  isLoading: boolean;
  error: Error | null;
  meetDate?: Date | string | number;
}

export function WeatherDisplay({ weather, isLoading, error, meetDate }: WeatherDisplayProps) {
  if (isLoading) {
    return (
      <div className="bg-secondary/5 rounded-lg p-3 flex items-center justify-center mb-4 h-20">
        <Loader2 className="h-5 w-5 text-secondary animate-spin" />
        <span className="ml-2 text-sm text-darkGray">Loading weather...</span>
      </div>
    );
  }

  // Calculate days until the meet date
  const daysUntilMeet = meetDate 
    ? Math.ceil((new Date(meetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  // Handle forecast unavailable state (for dates too far in the future)
  if (weather?.isForecastUnavailable) {
    return (
      <div className="bg-secondary/5 rounded-lg p-3 flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <HelpCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Weather forecast unavailable</p>
            <p className="text-xs text-darkGray">
              {daysUntilMeet > 0 ? (
                <Fragment>
                  <Clock className="h-3 w-3 inline mr-1" />
                  {formatDistanceToNow(new Date(meetDate!))} until meet
                </Fragment>
              ) : (
                "Check back closer to meet date"
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="h-5 mb-1 flex items-center">
            <Wind className="h-4 w-4 text-darkGray" />
          </div>
          <p className="text-xs text-darkGray">TBD</p>
        </div>
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

  // Get the time context for the forecast
  const isForecast = meetDate && new Date(meetDate).getTime() > Date.now();
  const forecastTimeText = isForecast 
    ? `Forecast for ${new Date(meetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
    : "Current weather";

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
          <div className="flex items-center">
            <Thermometer className="h-3 w-3 mr-1 text-darkGray" />
            <p className="text-xs text-darkGray">{Math.round(weather.temperature * 9/5 + 32)}°F / {Math.round(weather.temperature)}°C</p>
          </div>
          {isForecast && (
            <p className="text-[10px] text-darkGray mt-0.5">{forecastTimeText}</p>
          )}
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
