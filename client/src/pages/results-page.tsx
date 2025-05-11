import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { SidebarNavigation } from '@/components/layout/sidebar-navigation';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { Meet, Result } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Wind, PlusCircle, Medal, TrendingUp } from 'lucide-react';
import { RecentResults } from '@/components/recent-results';
import { PerformanceAnalytics } from '@/components/performance-analytics';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDate, formatResult } from '@/lib/utils';

export default function ResultsPage() {
  const [isAddResultOpen, setIsAddResultOpen] = useState(false);
  
  // Fetch results
  const { data: results, isLoading: isLoadingResults } = useQuery<Result[]>({
    queryKey: ['/api/results'],
    queryFn: async () => {
      const response = await fetch('/api/results');
      if (!response.ok) throw new Error('Failed to fetch results');
      return await response.json();
    }
  });
  
  // Fetch meets
  const { data: meets, isLoading: isLoadingMeets } = useQuery<Meet[]>({
    queryKey: ['/api/meets'],
    queryFn: async () => {
      const response = await fetch('/api/meets');
      if (!response.ok) throw new Error('Failed to fetch meets');
      return await response.json();
    }
  });
  
  // Group results by event
  const resultsByEvent = results?.reduce((acc, result) => {
    const event = result.event;
    
    if (!acc[event]) {
      acc[event] = [];
    }
    
    acc[event].push(result);
    return acc;
  }, {} as Record<string, Result[]>) || {};
  
  // Group results by meet
  const resultsByMeet = results?.reduce((acc, result) => {
    const meetId = result.meetId;
    const meet = meets?.find(m => m.id === meetId);
    
    if (meet) {
      const existingGroup = acc.find(group => group.meet.id === meetId);
      
      if (existingGroup) {
        existingGroup.results.push(result);
      } else {
        acc.push({ meet, results: [result] });
      }
    }
    
    return acc;
  }, [] as { meet: Meet; results: Result[] }[]) || [];
  
  // Sort by most recent
  resultsByMeet.sort((a, b) => 
    new Date(b.meet.date).getTime() - new Date(a.meet.date).getTime()
  );
  
  // Get unique event names
  const eventNames = Object.keys(resultsByEvent);
  
  // Create entries for the results table
  const resultEntries = results && meets ? 
    results
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(result => {
        const meet = meets.find(m => m.id === result.meetId);
        return {
          ...result,
          meetName: meet?.name || 'Unknown Meet',
          formattedPerformance: formatResult(result.performance, result.event)
        };
      }) : [];
  
  const isLoading = isLoadingResults || isLoadingMeets;

  return (
    <div className="flex flex-col h-screen">
      <Header title="Results & Analytics" />
      
      <main className="flex-1 overflow-auto pt-16 pb-16 md:pb-0 md:pt-16 md:pl-64">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Performance Analytics</h2>
            <Button 
              className="bg-primary text-white hover:bg-primary/90"
              onClick={() => setIsAddResultOpen(true)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Result
            </Button>
          </div>
          
          <Tabs defaultValue="analytics">
            <TabsList className="mb-6">
              <TabsTrigger value="analytics" className="px-6">
                <TrendingUp className="h-4 w-4 mr-2" />
                Advanced Analytics
              </TabsTrigger>
              <TabsTrigger value="charts" className="px-6">
                <Wind className="h-4 w-4 mr-2" />
                Wind Analysis
              </TabsTrigger>
              <TabsTrigger value="history" className="px-6">
                <Medal className="h-4 w-4 mr-2" />
                Meet History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="analytics">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : results && results.length > 0 ? (
                <PerformanceAnalytics results={results} meets={meets || []} />
              ) : (
                <Card className="p-8 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <TrendingUp className="h-12 w-12 text-muted-foreground/80" />
                    <h3 className="text-xl font-medium mt-4">No Results Yet</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Add your first competition result to start tracking your progress and see detailed performance analytics.
                    </p>
                    <Button 
                      className="mt-4"
                      onClick={() => setIsAddResultOpen(true)}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Your First Result
                    </Button>
                  </div>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="charts">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : eventNames.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {eventNames.map(event => (
                    <div key={event} className="bg-white rounded-xl shadow-sm overflow-hidden">
                      <div className="p-4 border-b">
                        <h3 className="font-bold text-lg">{event}</h3>
                        {WIND_AFFECTED_EVENTS.includes(event) && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Wind className="h-3 w-3 mr-1" />
                            <span>Wind-affected event</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4">
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={resultsByEvent[event]
                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                .map(r => ({
                                  date: formatDate(r.date),
                                  performance: r.performance,
                                  wind: r.wind || 0
                                }))}
                              margin={{ top: 5, right: 20, left: 20, bottom: 25 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip formatter={(value, name) => {
                                if (name === 'performance') {
                                  return formatResult(Number(value), event);
                                }
                                if (name === 'wind') {
                                  return `${value} m/s`;
                                }
                                return value;
                              }} />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="performance"
                                name="Performance"
                                stroke="#5f60ff"
                                activeDot={{ r: 8 }}
                                dot={{ r: 4 }}
                              />
                              {WIND_AFFECTED_EVENTS.includes(event) && (
                                <Line
                                  type="monotone"
                                  dataKey="wind"
                                  name="Wind (m/s)"
                                  stroke="#32a852"
                                  strokeDasharray="3 3"
                                  dot={{ r: 3 }}
                                />
                              )}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <p className="text-darkGray mb-4">No performance data yet</p>
                  <p className="text-sm text-darkGray">
                    Complete a meet and log your results to see analytics
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="history">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : resultsByMeet.length > 0 ? (
                <RecentResults results={resultsByMeet} />
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <p className="text-darkGray">No meet results logged yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <SidebarNavigation />
      <BottomNavigation />
    </div>
  );
}

// Wind-affected events
const WIND_AFFECTED_EVENTS = ['100m', '200m', 'long_jump', 'triple_jump'];

// Import from recharts for the charts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
