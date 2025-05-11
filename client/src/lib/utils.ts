import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistance } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  if (!name) return '';
  return name
    .split(' ')
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');
}

export function formatDate(date: Date | string | number): string {
  const dateObj = new Date(date);
  return format(dateObj, 'MMM d, yyyy');
}

export function formatTime(date: Date | string | number): string {
  const dateObj = new Date(date);
  return format(dateObj, 'h:mm a');
}

export function formatDateTime(date: Date | string | number): string {
  const dateObj = new Date(date);
  return format(dateObj, 'MMM d, yyyy • h:mm a');
}

export function formatDistanceToNow(date: Date | string | number): string {
  const dateObj = new Date(date);
  return formatDistance(dateObj, new Date(), { addSuffix: true });
}

export function formatRelativeTime(date: Date | string | number): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInDays = Math.floor((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Tomorrow';
  if (diffInDays === -1) return 'Yesterday';
  if (diffInDays > 1 && diffInDays < 7) return `${diffInDays} days away`;
  if (diffInDays < 0 && diffInDays > -7) return `${Math.abs(diffInDays)} days ago`;
  
  return formatDate(date);
}

export function formatResult(result: number, event: string): string {
  // Running events are typically measured in seconds
  if (event.includes('m') && !event.includes('Jump')) {
    // If it's less than 60 seconds, show as seconds
    if (result < 60) {
      return `${result.toFixed(2)}s`;
    }
    // Otherwise format as minutes:seconds
    const minutes = Math.floor(result / 60);
    const seconds = (result % 60).toFixed(2);
    return `${minutes}:${seconds.padStart(5, '0')}`;
  }
  
  // Field events (long jump, high jump, etc.)
  if (event.includes('Jump') || event.includes('Throw') || event.includes('Put')) {
    return `${result.toFixed(2)}m`;
  }
  
  // Default fallback
  return result.toString();
}

export function getWindDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(degrees / 45) % 8];
}

export function kelvinToCelsius(kelvin: number): number {
  return kelvin - 273.15;
}

export function kelvinToFahrenheit(kelvin: number): number {
  return (kelvin - 273.15) * 9/5 + 32;
}

export function mpsToMph(mps: number): number {
  return mps * 2.237;
}
