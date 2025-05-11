import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label
} from 'recharts';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, Wind, TrendingUp, ArrowRight } from 'lucide-react';
import { Meet, Result } from '@shared/schema';
import { formatDate, formatResult } from '@/lib/utils';

interface PerformanceAnalyticsProps {
  results: Result[];
  meets: Meet[];
}

// Wind assistance calculation constants
const WIND_FACTOR = {
  '100m': 0.1,   // ~0.1s per 2m/s of wind
  '200m': 0.16,  // ~0.16s per 2m/s of wind for 200m
  'long_jump': 0.12, // ~12cm per 2m/s for long jump and triple jump
  'triple_jump': 0.12
};

// Events that can be wind-affected
const WIND_AFFECTED_EVENTS = ['100m', '200m', 'long_jump', 'triple_jump'];

// Calculate wind-adjusted performance
const getWindAdjustedPerformance = (result: Result) => {
  // Only adjust for certain events and if wind data is available
  if (!result.wind || !WIND_AFFECTED_EVENTS.includes(result.event) || !WIND_FACTOR[result.event as keyof typeof WIND_FACTOR]) {
    return result.performance;
  }

  const windFactor = WIND_FACTOR[result.event as keyof typeof WIND_FACTOR];
  
  // For sprints (lower is better)
  if (['100m', '200m'].includes(result.event)) {
    // If wind is positive (tailwind), adjust performance to be worse (add time)
    // If wind is negative (headwind), adjust performance to be better (subtract time)
    return result.performance + (result.wind * windFactor / 2);
  } 
  // For jumps (higher is better)
  else if (['long_jump', 'triple_jump'].includes(result.event)) {
    // If wind is positive (tailwind), adjust performance to be worse (reduce distance)
    // If wind is negative (headwind), adjust performance to be better (increase distance)
    return result.performance - (result.wind * windFactor / 2);
  }
  
  return result.performance;
};

// Calculate improvement percentage
const calculateImprovement = (results: Result[], event: string) => {
  // Filter by event and sort by date (oldest first)
  const eventResults = results
    .filter(r => r.event === event)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
  if (eventResults.length < 2) return { percentage: 0, isImproving: false };
  
  const firstResult = eventResults[0].performance;
  const lastResult = eventResults[eventResults.length - 1].performance;
  
  // For sprint events (lower is better)
  if (['100m', '200m', '400m', '800m', '1500m', '3000m', '5000m', '10000m', '110mh', '400mh'].includes(event)) {
    const improvement = ((firstResult - lastResult) / firstResult) * 100;
    return {
      percentage: Math.abs(improvement).toFixed(1),
      isImproving: improvement > 0
    };
  } 
  // For field events (higher is better)
  else {
    const improvement = ((lastResult - firstResult) / firstResult) * 100;
    return {
      percentage: Math.abs(improvement).toFixed(1),
      isImproving: improvement > 0
    };
  }
};

// Determine if performance is consistent
const isPerformanceConsistent = (results: Result[], event: string) => {
  const eventResults = results.filter(r => r.event === event);
  if (eventResults.length < 3) return false;
  
  // Calculate standard deviation
  const performances = eventResults.map(r => r.performance);
  const mean = performances.reduce((sum, val) => sum + val, 0) / performances.length;
  
  const squareDiffs = performances.map(value => {
    const diff = value - mean;
    return diff * diff;
  });
  
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
  const stdDev = Math.sqrt(avgSquareDiff);
  
  // Calculate coefficient of variation (CV)
  const cv = (stdDev / mean) * 100;
  
  // For running events, lower CV means more consistent
  // For field events, depending on event type
  // Generally CV < 3% is excellent, < 5% is good
  return cv < 5;
};

// Get distinct events from results
const getDistinctEvents = (results: Result[]) => {
  return [...new Set(results.map(r => r.event))];
};

// Format data for charts
const formatChartData = (results: Result[], meets: Meet[], event: string, useWindAdjusted: boolean = false) => {
  // Filter by event and sort by date
  const eventResults = results
    .filter(r => r.event === event)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
  return eventResults.map(result => {
    // Find the meet for this result
    const meet = meets.find(m => m.id === result.meetId);
    
    // Calculate standard and wind-adjusted performances
    const standardPerformance = result.performance;
    const windAdjustedPerformance = getWindAdjustedPerformance(result);
    
    return {
      date: formatDate(result.date),
      meetName: meet?.name || 'Unknown Meet',
      performance: standardPerformance,
      windAdjusted: windAdjustedPerformance,
      wind: result.wind || 0,
      rawDate: new Date(result.date)
    };
  });
};

export function PerformanceAnalytics({ results, meets }: PerformanceAnalyticsProps) {
  const events = useMemo(() => getDistinctEvents(results), [results]);
  const [selectedEvent, setSelectedEvent] = useState(events.length > 0 ? events[0] : '');
  const [useWindAdjusted, setUseWindAdjusted] = useState(false);
  
  // Only show wind adjustment toggle for events that can be wind-affected
  const isWindAffectedEvent = WIND_AFFECTED_EVENTS.includes(selectedEvent);
  
  // Format chart data based on selected event
  const chartData = useMemo(() => {
    if (!selectedEvent) return [];
    return formatChartData(results, meets, selectedEvent, useWindAdjusted);
  }, [results, meets, selectedEvent, useWindAdjusted]);
  
  // Calculate improvement percentage
  const improvement = useMemo(() => {
    if (!selectedEvent) return { percentage: 0, isImproving: false };
    return calculateImprovement(results, selectedEvent);
  }, [results, selectedEvent]);
  
  // Check if performance is consistent
  const isConsistent = useMemo(() => {
    if (!selectedEvent) return false;
    return isPerformanceConsistent(results, selectedEvent);
  }, [results, selectedEvent]);
  
  // Get season best performance
  const seasonBest = useMemo(() => {
    if (!selectedEvent) return null;
    
    const eventResults = results.filter(r => r.event === selectedEvent);
    if (eventResults.length === 0) return null;
    
    // For running events (lower is better)
    if (['100m', '200m', '400m', '800m', '1500m', '3000m', '5000m', '10000m', '110mh', '400mh'].includes(selectedEvent)) {
      return eventResults.reduce((best, current) => 
        best.performance < current.performance ? best : current
      );
    } 
    // For field events (higher is better)
    else {
      return eventResults.reduce((best, current) => 
        best.performance > current.performance ? best : current
      );
    }
  }, [results, selectedEvent]);
  
  // Determine Y-axis domain based on event and results
  const getYAxisDomain = () => {
    if (!selectedEvent || chartData.length === 0) return [0, 0];
    
    const performanceKey = useWindAdjusted && isWindAffectedEvent ? 'windAdjusted' : 'performance';
    const values = chartData.map(d => d[performanceKey]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const buffer = (max - min) * 0.1; // 10% buffer
    
    // For running events (lower is better), the lower values should be at the top
    if (['100m', '200m', '400m', '800m', '1500m', '3000m', '5000m', '10000m', '110mh', '400mh'].includes(selectedEvent)) {
      return [Math.min(min - buffer, max * 0.95), Math.max(max + buffer, min * 1.05)];
    } 
    // For field events (higher is better)
    else {
      return [Math.max(min - buffer, 0), max + buffer];
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Performance Analytics</CardTitle>
            <CardDescription>Track your progress over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
              {events.map(event => (
                <Button
                  key={event}
                  variant={selectedEvent === event ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedEvent(event)}
                  className="text-xs"
                >
                  {event}
                </Button>
              ))}
            </div>
            
            {isWindAffectedEvent && (
              <div className="flex items-center justify-end mb-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={useWindAdjusted ? "bg-primary/10" : ""}
                  onClick={() => setUseWindAdjusted(!useWindAdjusted)}
                >
                  <Wind className="h-3.5 w-3.5 mr-1" />
                  {useWindAdjusted ? "Wind-Adjusted" : "Standard"}
                </Button>
              </div>
            )}
            
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No results recorded yet. Add your first result to see performance analytics.
              </div>
            ) : selectedEvent ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 20, left: 20, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="date" 
                      dy={10}
                    />
                    <YAxis domain={getYAxisDomain()} />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'performance' || name === 'windAdjusted') {
                          return formatResult(Number(value), selectedEvent);
                        }
                        if (name === 'wind') {
                          return `${value} m/s`;
                        }
                        return value;
                      }}
                      labelFormatter={(label, items) => {
                        const dataPoint = chartData.find(d => d.date === label);
                        return `${dataPoint?.meetName} - ${label}`;
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey={useWindAdjusted && isWindAffectedEvent ? "windAdjusted" : "performance"} 
                      name={useWindAdjusted && isWindAffectedEvent ? "Wind-Adjusted" : "Performance"} 
                      stroke="#5f60ff" 
                      activeDot={{ r: 8 }} 
                      dot={{ r: 4 }}
                      connectNulls
                    />
                    {isWindAffectedEvent && !useWindAdjusted && (
                      <Line 
                        type="monotone" 
                        dataKey="wind" 
                        name="Wind (m/s)" 
                        stroke="#32a852" 
                        strokeDasharray="3 3"
                        dot={{ r: 3 }}
                        connectNulls
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Select an event to see performance analytics.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {selectedEvent && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                Season Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-2xl font-semibold">
                  {improvement.percentage}%
                </div>
                <div className="ml-2">
                  {improvement.isImproving ? (
                    <Badge className="bg-green-500">
                      <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                      Improving
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <ArrowDownRight className="h-3.5 w-3.5 mr-1" />
                      Declining
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {improvement.isImproving ? 
                  "Great job! You're making consistent progress." :
                  "Don't worry, progress isn't always linear. Keep working!"
                }
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Wind className="h-4 w-4 mr-2 text-primary" />
                Wind Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isWindAffectedEvent ? (
                <div>
                  <div className="flex items-center">
                    <div className="text-2xl font-semibold">
                      {WIND_AFFECTED_EVENTS.includes(selectedEvent) ? 
                        `${WIND_FACTOR[selectedEvent as keyof typeof WIND_FACTOR]} ${['100m', '200m'].includes(selectedEvent) ? 's' : 'm'}` : 
                        'N/A'
                      }
                    </div>
                    <div className="ml-2">
                      <Badge variant="secondary">
                        Per 2 m/s Wind
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {['100m', '200m'].includes(selectedEvent) ? 
                      "Wind impact shows seconds gained/lost due to wind conditions." :
                      "Wind impact shows meters gained/lost in jumps due to wind conditions."
                    }
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  <div className="text-lg font-medium">Not Applicable</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    This event is not significantly affected by wind conditions.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <ArrowRight className="h-4 w-4 mr-2 text-primary" />
                Season Best
              </CardTitle>
            </CardHeader>
            <CardContent>
              {seasonBest ? (
                <div>
                  <div className="text-2xl font-semibold">
                    {formatResult(seasonBest.performance, selectedEvent)}
                  </div>
                  <div className="flex items-center mt-1">
                    <Badge variant="outline" className="mr-2">
                      {formatDate(seasonBest.date)}
                    </Badge>
                    {seasonBest.wind !== null && isWindAffectedEvent && (
                      <Badge variant={seasonBest.wind > 2 ? "destructive" : "outline"}>
                        Wind: {seasonBest.wind} m/s
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isConsistent ? 
                      "Your performances are consistent across meets." :
                      "Your performances have high variability. Focus on consistency."
                    }
                  </p>
                </div>
              ) : (
                <div className="py-2 text-muted-foreground">
                  No records available for this event.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}