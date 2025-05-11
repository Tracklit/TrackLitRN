import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { SidebarNavigation } from '@/components/layout/sidebar-navigation';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { UpcomingMeetCard } from '@/components/upcoming-meet-card';
import { PreparationTimeline } from '@/components/preparation-timeline';
import { PerformanceChart } from '@/components/performance-chart';
import { RecentResults } from '@/components/recent-results';
import { MotivationalQuote } from '@/components/motivational-quote';
import { PremiumPromotion } from '@/components/premium-promotion';
import { CreateMeetModal } from '@/components/create-meet-modal';
import { useAuth } from '@/hooks/use-auth';
import { Meet, Result } from '@shared/schema';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const [isCreateMeetOpen, setIsCreateMeetOpen] = useState(false);
  
  // Fetch upcoming meets
  const { data: meets, isLoading: isLoadingMeets } = useQuery<Meet[]>({
    queryKey: ['/api/meets'],
  });
  
  // Fetch results for analytics
  const { data: results, isLoading: isLoadingResults } = useQuery<Result[]>({
    queryKey: ['/api/results'],
  });
  
  // Find the next upcoming meet
  const upcomingMeet = meets?.find(meet => 
    new Date(meet.date) > new Date() && meet.status === 'upcoming'
  );
  
  // Group results by meet for the recent results section
  const recentResultsByMeet = results?.reduce((acc, result) => {
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
  recentResultsByMeet.sort((a, b) => 
    new Date(b.meet.date).getTime() - new Date(a.meet.date).getTime()
  );
  
  // Filter sprint results for analytics
  const sprintResults = results?.filter(r => r.event.includes('100m Sprint')) || [];
  
  // Filter long jump results for analytics
  const jumpResults = results?.filter(r => r.event.includes('Long Jump')) || [];
  
  // Motivational quote (would normally come from a database or API)
  const quote = {
    text: "The difference between the impossible and the possible lies in a person's determination.",
    author: "Tommy Lasorda"
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <main className="flex-1 overflow-auto pt-16 pb-16 md:pb-0 md:pt-16 md:pl-64">
        <div className="container mx-auto px-4 py-6">
          {/* Greeting Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-1">Hello, {user?.name?.split(' ')[0]}</h2>
            <p className="text-darkGray">Ready for your upcoming meets?</p>
          </section>
          
          {/* Upcoming Meet */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upcoming Meet</h3>
              <Link href="/meets" className="text-secondary text-sm font-medium">View All</Link>
            </div>
            
            {isLoadingMeets ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : upcomingMeet ? (
              <UpcomingMeetCard 
                meet={upcomingMeet} 
                onViewPreparation={() => {
                  // Scroll to preparation section
                  document.getElementById('preparation-section')?.scrollIntoView({ 
                    behavior: 'smooth' 
                  });
                }}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <p className="text-darkGray mb-4">No upcoming meets found</p>
                <Button 
                  onClick={() => setIsCreateMeetOpen(true)}
                  className="bg-primary text-white"
                >
                  Create Your First Meet
                </Button>
              </div>
            )}
          </section>
          
          {/* Meet Preparation */}
          {upcomingMeet && (
            <section className="mb-8" id="preparation-section">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Meet Preparation</h3>
              </div>
              
              <PreparationTimeline 
                meet={upcomingMeet} 
                onCustomize={() => {
                  // This would open a customization modal in a real app
                }}
              />
            </section>
          )}
          
          {/* Performance Analytics */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Performance Analytics</h3>
              <Link href="/results" className="text-secondary text-sm font-medium">View Details</Link>
            </div>
            
            {isLoadingResults ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : sprintResults.length > 0 || jumpResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sprintResults.length > 0 && (
                  <PerformanceChart
                    title="100m Sprint"
                    event="100m Sprint"
                    results={sprintResults}
                    improving={true}
                  />
                )}
                
                {jumpResults.length > 0 && (
                  <PerformanceChart
                    title="Long Jump"
                    event="Long Jump"
                    results={jumpResults}
                    stable={true}
                  />
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <p className="text-darkGray mb-4">No performance data yet</p>
                <p className="text-sm text-darkGray">
                  Complete a meet and log your results to see analytics
                </p>
              </div>
            )}
          </section>
          
          {/* Recent Results */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Results</h3>
              <Link href="/results" className="text-secondary text-sm font-medium">View All</Link>
            </div>
            
            <RecentResults results={recentResultsByMeet.slice(0, 3)} />
          </section>
          
          {/* Motivational Quote */}
          <section className="mb-8">
            <MotivationalQuote quote={quote.text} author={quote.author} />
          </section>
          
          {/* Premium Feature Promotion */}
          {!user?.isPremium && (
            <section className="mb-8">
              <PremiumPromotion 
                onUpgrade={() => {
                  // Premium upgrade logic would go here
                }}
              />
            </section>
          )}
        </div>
      </main>
      
      <SidebarNavigation />
      <BottomNavigation />
      
      {/* Create Meet Modal */}
      <CreateMeetModal
        isOpen={isCreateMeetOpen}
        onClose={() => setIsCreateMeetOpen(false)}
      />
    </div>
  );
}
