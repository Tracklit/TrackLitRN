import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { SidebarNavigation } from '@/components/layout/sidebar-navigation';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { Meet } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Loader2 } from 'lucide-react';
import { UpcomingMeetCard } from '@/components/upcoming-meet-card';
import { CreateMeetModal } from '@/components/create-meet-modal';
import { PreparationTimeline } from '@/components/preparation-timeline';
import { formatDate, formatTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function MeetsPage() {
  const [isCreateMeetOpen, setIsCreateMeetOpen] = useState(false);
  const [selectedMeet, setSelectedMeet] = useState<Meet | null>(null);
  
  // Fetch meets
  const { data: meets, isLoading } = useQuery<Meet[]>({
    queryKey: ['/api/meets'],
  });
  
  const upcomingMeets = meets?.filter(meet => 
    new Date(meet.date) > new Date() && meet.status === 'upcoming'
  ) || [];
  
  const pastMeets = meets?.filter(meet => 
    new Date(meet.date) < new Date() || meet.status === 'completed'
  ) || [];

  return (
    <div className="flex flex-col h-screen">
      <Header title="Track Meets" />
      
      <main className="flex-1 overflow-auto pt-16 pb-16 md:pb-0 md:pt-16 md:pl-64">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Your Track Meets</h2>
            <Button
              onClick={() => setIsCreateMeetOpen(true)}
              className="bg-primary text-white"
            >
              Create Meet
            </Button>
          </div>
          
          <Tabs defaultValue="upcoming">
            <TabsList className="mb-6">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : upcomingMeets.length > 0 ? (
                <div className="space-y-6">
                  {upcomingMeets.map(meet => (
                    <div key={meet.id} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <UpcomingMeetCard 
                        meet={meet} 
                        onViewPreparation={() => setSelectedMeet(meet)}
                      />
                      
                      {selectedMeet?.id === meet.id && (
                        <PreparationTimeline 
                          meet={meet}
                          onCustomize={() => {
                            // This would open a customization modal in a real app
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <p className="text-darkGray mb-4">No upcoming meets</p>
                  <Button
                    onClick={() => setIsCreateMeetOpen(true)}
                    className="bg-primary text-white"
                  >
                    Create Your First Meet
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="past">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : pastMeets.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="divide-y divide-lightGray">
                    {pastMeets.map(meet => (
                      <div key={meet.id} className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div>
                            <h3 className="font-medium text-lg">{meet.name}</h3>
                            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 mt-2 text-sm text-darkGray">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>{formatDate(meet.date)} • {formatTime(meet.date)}</span>
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2" />
                                <span>{meet.location}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center mt-3 md:mt-0">
                            <Badge variant="success">Completed</Badge>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="ml-2 text-primary"
                            >
                              View Results
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          {meet.events?.map(event => (
                            <Badge key={event} variant="event">{event}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                  <p className="text-darkGray">No past meets</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <SidebarNavigation />
      <BottomNavigation />
      
      <CreateMeetModal
        isOpen={isCreateMeetOpen}
        onClose={() => setIsCreateMeetOpen(false)}
      />
    </div>
  );
}
