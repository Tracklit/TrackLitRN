import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { SidebarNavigation } from '@/components/layout/sidebar-navigation';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { Meet, Result } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerformanceChart } from '@/components/performance-chart';
import { RecentResults } from '@/components/recent-results';
import { Loader2 } from 'lucide-react';

export default function ResultsPage() {
  // Fetch results
  const { data: results, isLoading: isLoadingResults } = useQuery<Result[]>({
    queryKey: ['/api/results'],
  });
  
  // Fetch meets
  const { data: meets, isLoading: isLoadingMeets } = useQuery<Meet[]>({
    queryKey: ['/api/meets'],
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
  
  const isLoading = isLoadingResults || isLoadingMeets;

  return (
    <div className="flex flex-col h-screen">
      <Header title="Results & Analytics" />
      
      <main className="flex-1 overflow-auto pt-16 pb-16 md:pb-0 md:pt-16 md:pl-64">
        <div className="container mx-auto px-4 py-6">
          <h2 className="text-2xl font-bold mb-6">Performance Analytics</h2>
          
          <Tabs defaultValue="charts">
            <TabsList className="mb-6">
              <TabsTrigger value="charts">Event Charts</TabsTrigger>
              <TabsTrigger value="history">Meet History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="charts">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : eventNames.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {eventNames.map(event => (
                    <PerformanceChart
                      key={event}
                      title={event}
                      event={event}
                      results={resultsByEvent[event]}
                      improving={event.includes('Sprint')}
                      stable={event.includes('Jump')}
                    />
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
