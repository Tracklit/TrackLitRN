import fetch from 'node-fetch';

interface WeatherData {
  temperature: number;
  condition: string;
  windSpeed: number;
  windDirection: string;
  humidity: number;
  icon: string;
}

export async function getWeatherForecast(location: string, date: string): Promise<WeatherData | null> {
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    console.log('Weather API request for:', location, date);
    if (!apiKey) {
      console.error('WEATHER_API_KEY not found');
      return null;
    }

    // Use WeatherAPI.com for forecast data
    const encodedLocation = encodeURIComponent(location);
    const targetDate = new Date(date);
    const today = new Date();
    
    // Calculate days from today
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // WeatherAPI supports up to 10 days forecast
    if (diffDays > 10) {
      return null;
    }
    
    const forecastDate = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodedLocation}&dt=${forecastDate}&aqi=no&alerts=no`
    );
    
    if (!response.ok) {
      console.error('Weather API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Weather API error response:', errorText);
      return null;
    }
    
    const data = await response.json() as any;
    console.log('Weather API response received successfully for', location);
    console.log('Response keys:', Object.keys(data));
    if (data.error) {
      console.error('Weather API error:', data.error);
      return null;
    }
    
    // Check if we have the expected data structure
    if (!data.forecast || !data.forecast.forecastday || !data.forecast.forecastday[0]) {
      console.error('Invalid weather data structure for', location);
      // Return a fallback with basic weather info if API structure is different
      if (data.current) {
        console.log('Using current weather data instead');
        return {
          temperature: Math.round(data.current.temp_c),
          condition: data.current.condition.text,
          windSpeed: Math.round(data.current.wind_kph),
          windDirection: data.current.wind_dir || 'Variable',
          humidity: data.current.humidity,
          icon: data.current.condition.icon
        };
      }
      return null;
    }
    
    const forecast = data.forecast.forecastday[0].day;
    console.log('Forecast data:', forecast);
    
    return {
      temperature: Math.round(forecast.avgtemp_c),
      condition: forecast.condition.text,
      windSpeed: Math.round(forecast.maxwind_kph),
      windDirection: getWindDirection(forecast.maxwind_kph),
      humidity: forecast.avghumidity,
      icon: forecast.condition.icon
    };
    
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

function getWindDirection(windSpeed: number): string {
  // Since we don't get direction from the day forecast, we'll provide general guidance
  if (windSpeed < 5) return 'Light';
  if (windSpeed < 15) return 'Moderate';
  if (windSpeed < 25) return 'Strong';
  return 'Very Strong';
}