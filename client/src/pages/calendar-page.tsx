import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { SidebarNavigation } from '@/components/layout/sidebar-navigation';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { CreateMeetModal } from '@/components/create-meet-modal';
import { CalendarMeetShareModal } from '@/components/calendar-meet-share-modal';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Meet } from '@shared/schema';
import { Calendar as CalendarIcon, Trophy, Clock, MapPin, Loader2, Share2 } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';

export default function CalendarPage() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isCreateMeetOpen, setIsCreateMeetOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedShareMeet, setSelectedShareMeet] = useState<Meet | null>(null);
  
  // Fetch meets
  const { data: meets, isLoading } = useQuery<Meet[]>({
    queryKey: ['/api/meets'],
  });
  
  // Filter meets for selected date
  const meetsOnSelectedDate = meets?.filter(meet => {
    const meetDate = new Date(meet.date);
    return date && 
      meetDate.getDate() === date.getDate() &&
      meetDate.getMonth() === date.getMonth() &&
      meetDate.getFullYear() === date.getFullYear();
  }) || [];
  
  // Get dates with meets for highlighting in calendar
  const datesWithMeets = meets?.map(meet => new Date(meet.date)) || [];
  
  // Handle opening share modal
  const handleShareMeet = (meet: Meet) => {
    setSelectedShareMeet(meet);
    setIsShareModalOpen(true);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header title="Meet Calendar" />
      
      <main className="flex-1 overflow-auto pt-16 pb-16 md:pb-0 md:pt-16 md:pl-64">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Calendar</h2>
            <Button
              onClick={() => setIsCreateMeetOpen(true)}
              className="bg-primary text-white"
            >
              Create Meet
            </Button>
          </div>
          
          {!user?.isPremium && (
            <div className="bg-secondary/10 rounded-lg p-4 mb-6">
              <div className="flex items-start md:items-center flex-col md:flex-row md:justify-between">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-secondary mr-2" />
                  <p className="text-darkGray text-sm">
                    <span className="font-medium">Calendar sharing is a premium feature. </span>
                    Upgrade to share your meets with coaches and teammates.
                  </p>
                </div>
                <Button 
                  className="bg-secondary text-white mt-3 md:mt-0"
                  size="sm"
                >
                  Upgrade
                </Button>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
            <div className="md:col-span-5">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md"
                    modifiers={{
                      meetDay: datesWithMeets,
                    }}
                    modifiersStyles={{
                      meetDay: {
                        fontWeight: 'bold',
                        backgroundColor: 'rgba(255, 90, 95, 0.1)',
                        color: '#FF5A5F',
                      },
                    }}
                  />
                </div>
              )}
            </div>
            
            <div className="md:col-span-2">
              <div className="bg-white rounded-xl shadow-sm p-4 h-full">
                <h3 className="font-semibold mb-4 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {date ? (
                    <span>
                      {date.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  ) : (
                    <span>Select a date</span>
                  )}
                </h3>
                
                {meetsOnSelectedDate.length > 0 ? (
                  <div className="space-y-4">
                    {meetsOnSelectedDate.map(meet => (
                      <div 
                        key={meet.id} 
                        className="border-l-4 border-primary p-3 rounded-r-lg bg-primary/5"
                      >
                        <h4 className="font-medium flex items-center">
                          <Trophy className="h-4 w-4 text-primary mr-2" />
                          {meet.name}
                        </h4>
                        <div className="mt-2 space-y-1.5 text-sm">
                          <div className="flex items-center text-darkGray">
                            <Clock className="h-4 w-4 mr-2" />
                            {formatTime(meet.date)}
                          </div>
                          <div className="flex items-center text-darkGray">
                            <MapPin className="h-4 w-4 mr-2" />
                            {meet.location}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {meet.events?.map(event => (
                            <Badge key={event} variant="event" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-darkGray">
                    <p>No meets scheduled for this day</p>
                    <Button 
                      variant="link" 
                      className="text-primary mt-2"
                      onClick={() => setIsCreateMeetOpen(true)}
                    >
                      Add a meet
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
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
