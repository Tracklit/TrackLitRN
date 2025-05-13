import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow as formatDistanceToNowFn, addHours, addMinutes, isBefore } from "date-fns";

/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date in a readable format
 * @param date Date string or Date object
 * @param includeYear Whether to include the year in the formatted date
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | number, includeYear = true): string {
  if (!date) return '';
  const dateObj = new Date(date);
  
  return includeYear
    ? format(dateObj, 'MMM d, yyyy')
    : format(dateObj, 'MMM d');
}

/**
 * Formats a performance result based on the event type
 * @param result The numeric result (time in seconds or distance in meters)
 * @param event The track and field event
 * @returns Formatted result string
 */
export function formatResult(result: number, event: string): string {
  if (!result) return '';
  
  // Running events (format as time)
  if (['100m', '200m', '400m', '800m', '1500m', '3000m', '5000m', '10000m', '110mh', '400mh', '3000sc'].includes(event)) {
    // Convert seconds to minutes and seconds
    if (result >= 60) {
      const minutes = Math.floor(result / 60);
      const seconds = result % 60;
      return `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`;
    }
    // Just seconds for sprint events
    return result.toFixed(2) + 's';
  }
  
  // Distance events (format with appropriate units)
  if (['long_jump', 'triple_jump', 'high_jump', 'pole_vault', 'shot_put', 'discus', 'javelin', 'hammer'].includes(event)) {
    return result.toFixed(2) + 'm';
  }
  
  // Fallback
  return result.toString();
}

/**
 * Calculates the time remaining until a specified date
 * @param targetDate The target date
 * @returns Object with days, hours, minutes remaining, and whether it's in the past
 */
export function getTimeRemaining(targetDate: Date | string | number) {
  const targetTime = new Date(targetDate).getTime();
  const now = new Date().getTime();
  const difference = targetTime - now;
  
  // If the date is in the past
  if (difference <= 0) {
    return { 
      days: 0,
      hours: 0,
      minutes: 0,
      isPast: true 
    };
  }
  
  // Calculate remaining time
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    days,
    hours,
    minutes,
    isPast: false
  };
}

/**
 * Formats a count as a human-readable time description
 * @param count The number to format
 * @param unit The time unit (day, hour, minute)
 * @returns Formatted string
 */
export function formatTimeUnit(count: number, unit: string): string {
  if (count === 0) return '';
  
  const unitText = count === 1 ? unit : `${unit}s`;
  return `${count} ${unitText}`;
}

/**
 * Formats a time remaining object into a human-readable string
 * @param timeRemaining Object with days, hours, minutes
 * @returns Formatted string (e.g. "2 days 3 hours")
 */
export function formatTimeRemaining(timeRemaining: { days: number, hours: number, minutes: number, isPast: boolean }): string {
  if (timeRemaining.isPast) {
    return 'Past';
  }
  
  const parts = [];
  
  if (timeRemaining.days > 0) {
    parts.push(formatTimeUnit(timeRemaining.days, 'day'));
  }
  
  if (timeRemaining.hours > 0 && timeRemaining.days < 7) { // Only show hours if less than a week away
    parts.push(formatTimeUnit(timeRemaining.hours, 'hour'));
  }
  
  if (timeRemaining.minutes > 0 && timeRemaining.days === 0 && timeRemaining.hours < 10) { // Only show minutes if very close
    parts.push(formatTimeUnit(timeRemaining.minutes, 'minute'));
  }
  
  return parts.join(' ');
}

/**
 * Format date and time
 * @param date Date to format
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date | string | number): string {
  if (!date) return '';
  const dateObj = new Date(date);
  return format(dateObj, 'MMM d, yyyy h:mm a');
}

/**
 * Format a date as a relative time (e.g., "2 days ago")
 * @param date Date to format
 * @returns Formatted relative time string
 */
export function formatDistanceToNow(date: Date | string | number): string {
  if (!date) return '';
  return formatDistanceToNowFn(new Date(date), { addSuffix: true });
}

/**
 * Format a date as relative time from now
 * @param date Date to format
 * @returns Formatted string
 */
export function formatRelativeTime(date: Date | string | number): string {
  if (!date) return '';
  const now = new Date();
  const targetDate = new Date(date);
  
  if (isBefore(targetDate, now)) {
    return formatDistanceToNowFn(targetDate, { addSuffix: true });
  }
  
  const timeRemaining = getTimeRemaining(targetDate);
  return formatTimeRemaining(timeRemaining);
}

/**
 * Convert Kelvin to Celsius
 * @param kelvin Temperature in Kelvin
 * @returns Temperature in Celsius
 */
export function kelvinToCelsius(kelvin: number): number {
  return kelvin - 273.15;
}

/**
 * Convert Kelvin to Fahrenheit
 * @param kelvin Temperature in Kelvin
 * @returns Temperature in Fahrenheit
 */
export function kelvinToFahrenheit(kelvin: number): number {
  return (kelvin - 273.15) * 9/5 + 32;
}

/**
 * Convert meters per second to miles per hour
 * @param mps Speed in meters per second
 * @returns Speed in miles per hour
 */
export function mpsToMph(mps: number): number {
  return mps * 2.23694;
}

/**
 * Get cardinal direction from wind degree
 * @param degree Wind direction in degrees
 * @returns Cardinal direction (N, NE, E, etc.)
 */
export function getWindDirection(degree: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degree / 45) % 8;
  return directions[index];
}

/**
 * Generate initials from name
 * @param name Full name
 * @returns Initials (1-2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Format a time value (hours or minutes) or Date object to display time
 * @param time Hours, minutes, or Date object to format
 * @returns Formatted time string (HH:MM AM/PM or HH:MM)
 */
export function formatTime(time: number | string | Date | undefined | null): string {
  if (time === undefined || time === null) return '';
  
  // If it's a Date object, format it to display just the time
  if (time instanceof Date) {
    return format(time, 'h:mm a');
  }
  
  // If it's a string that might be a date
  if (typeof time === 'string' && time.includes('-')) {
    try {
      const date = new Date(time);
      if (!isNaN(date.getTime())) {
        return format(date, 'h:mm a');
      }
    } catch (e) {
      // Ignore parsing errors and proceed with numeric parsing
    }
  }
  
  // For numeric values (e.g., warmup time, arrival time in minutes)
  const timeNum = typeof time === 'string' ? parseInt(time, 10) : time;
  if (isNaN(timeNum)) return '';
  
  const hours = Math.floor(timeNum / 60);
  const minutes = timeNum % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}