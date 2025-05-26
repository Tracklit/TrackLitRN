import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { SidebarNavigation } from '@/components/layout/sidebar-navigation';
import { Meet } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Loader2, Plus, Share2, Users } from 'lucide-react';
import { CreateMeetModal } from '@/components/create-meet-modal';
import { PreparationTimeline } from '@/components/preparation-timeline';
import { MeetCalendar } from '@/components/meet-calendar';
import { formatDate, formatTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function MeetsPage() {
  const [isCreateMeetOpen, setIsCreateMeetOpen] = useState(false);
  const [selectedMeet, setSelectedMeet] = useState<Meet | null>(null);
  const [tickerMessages, setTickerMessages] = useState<string[]>([]);
  const [currentTickerIndex, setCurrentTickerIndex] = useState(0);
  const { toast } = useToast();
  
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

  // Generate ticker messages for meet attendance
  useEffect(() => {
    if (upcomingMeets.length > 0) {
      const messages = upcomingMeets.map(meet => {
        const daysUntil = Math.ceil((new Date(meet.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil === 0) {
          return `🏃 You're competing in ${meet.name} today at ${meet.location}!`;
        } else if (daysUntil === 1) {
          return `📅 You're competing in ${meet.name} tomorrow at ${meet.location}`;
        } else if (daysUntil <= 7) {
          return `🎯 You're registered for ${meet.name} in ${daysUntil} days at ${meet.location}`;
        }
        return null;
      }).filter(Boolean) as string[];
      
      setTickerMessages(messages);
    }
  }, [upcomingMeets]);

  // Rotate ticker messages
  useEffect(() => {
    if (tickerMessages.length > 1) {
      const interval = setInterval(() => {
        setCurrentTickerIndex((prev) => (prev + 1) % tickerMessages.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [tickerMessages]);

  const handleShareMeet = async (meet: Meet) => {
    try {
      const shareUrl = `${window.location.origin}/meets/shared/${meet.id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: 'Meet Shared!',
        description: 'Share link copied to clipboard. Other athletes can save this meet to their calendar.',
      });
    } catch (error) {
      toast({
        title: 'Share Failed',
        description: 'Could not copy share link. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="flex h-screen bg-[#010a18] text-white">
      <SidebarNavigation />
      
      <div className="flex-1 overflow-auto">
        <Header title="Meets" />
        
        <main className="pt-16 pb-6">
          <div className="max-w-3xl mx-auto px-4">
            {/* Ticker Messages */}
            {tickerMessages.length > 0 && (
              <div className="mb-6 bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-lg p-3 overflow-hidden">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-amber-400 mr-3 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <div 
                      className="whitespace-nowrap text-amber-200 text-sm font-medium transition-transform duration-500 ease-in-out"
                      style={{ 
                        transform: `translateX(-${currentTickerIndex * 100}%)`,
                        width: `${tickerMessages.length * 100}%`,
                        display: 'flex'
                      }}
                    >
                      {tickerMessages.map((message, index) => (
                        <span key={index} className="w-full flex-shrink-0 px-2">
                          {message}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="fixed bottom-8 right-8 z-10">
              <Button
                onClick={() => setIsCreateMeetOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-full w-14 h-14 shadow-lg"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>
            
            <Tabs defaultValue="upcoming" className="mt-4">
              <TabsList className="mb-6 bg-blue-800/30 border border-blue-700/30">
                <TabsTrigger 
                  value="upcoming" 
                  className="data-[state=active]:bg-blue-700 data-[state=active]:text-white"
                >
                  Upcoming
                </TabsTrigger>
                <TabsTrigger 
                  value="past"
                  className="data-[state=active]:bg-blue-700 data-[state=active]:text-white"
                >
                  Past
                </TabsTrigger>
                <TabsTrigger 
                  value="calendar"
                  className="data-[state=active]:bg-blue-700 data-[state=active]:text-white"
                >
                  Calendar
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  </div>
                ) : upcomingMeets.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingMeets.map(meet => (
                      <Card key={meet.id} className="overflow-hidden bg-[#010a18] border border-blue-800/60 shadow-md">
                        <CardContent className="p-4">
                          <div className="flex flex-col">
                            <h3 className="font-medium text-xl text-white mb-2">{meet.name}</h3>
                            <div className="flex flex-col space-y-2 mb-3">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                                <span className="text-blue-300">{formatDate(meet.date)} • {formatTime(meet.date)}</span>
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2 text-blue-400" />
                                <span className="text-blue-300">{meet.location}</span>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 my-3">
                              {meet.events?.map(event => (
                                <Badge key={event} className="bg-blue-900/60 text-blue-200 hover:bg-blue-800">{event}</Badge>
                              ))}
                            </div>
                            
                            <div className="flex justify-between items-center mt-2">
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-blue-600 text-blue-400 hover:bg-blue-800/30"
                                  onClick={() => setSelectedMeet(selectedMeet?.id === meet.id ? null : meet)}
                                >
                                  {selectedMeet?.id === meet.id ? 'Hide Preparation' : 'View Preparation'}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-blue-600 text-blue-400 hover:bg-blue-800/30"
                                  onClick={() => handleShareMeet(meet)}
                                >
                                  <Share2 className="h-4 w-4 mr-1" />
                                  Share
                                </Button>
                              </div>
                              
                              <Badge className="bg-amber-600 hover:bg-amber-700">{meet.status}</Badge>
                            </div>
                            
                            {selectedMeet?.id === meet.id && (
                              <div className="mt-4 border-t border-blue-800/60 pt-4">
                                <PreparationTimeline 
                                  meet={meet}
                                  onCustomize={() => {
                                    // This would open a customization modal in a real app
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="overflow-hidden bg-[#010a18] border border-blue-800/60 text-center p-8">
                    <p className="text-blue-300 mb-4">No upcoming meets</p>
                    <Button
                      onClick={() => setIsCreateMeetOpen(true)}
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      Create Your First Meet
                    </Button>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="past">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  </div>
                ) : pastMeets.length > 0 ? (
                  <div className="space-y-4">
                    {pastMeets.map(meet => (
                      <Card key={meet.id} className="overflow-hidden bg-[#010a18] border border-blue-800/60 shadow-md">
                        <CardContent className="p-4">
                          <div className="flex flex-col">
                            <h3 className="font-medium text-xl text-white mb-2">{meet.name}</h3>
                            <div className="flex flex-col space-y-2 mb-3">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                                <span className="text-blue-300">{formatDate(meet.date)} • {formatTime(meet.date)}</span>
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2 text-blue-400" />
                                <span className="text-blue-300">{meet.location}</span>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 my-3">
                              {meet.events?.map(event => (
                                <Badge key={event} className="bg-blue-900/60 text-blue-200 hover:bg-blue-800">{event}</Badge>
                              ))}
                            </div>
                            
                            <div className="flex justify-between items-center mt-2">
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-blue-600 text-blue-400 hover:bg-blue-800/30"
                                >
                                  View Results
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-blue-600 text-blue-400 hover:bg-blue-800/30"
                                  onClick={() => handleShareMeet(meet)}
                                >
                                  <Share2 className="h-4 w-4 mr-1" />
                                  Share
                                </Button>
                              </div>
                              
                              <Badge className="bg-green-700 hover:bg-green-800">Completed</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="overflow-hidden bg-[#010a18] border border-blue-800/60 text-center p-8">
                    <p className="text-blue-300">No past meets</p>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="calendar">
                <MeetCalendar onMeetSelect={setSelectedMeet} />
                
                {selectedMeet && (
                  <div className="mt-6">
                    <Card className="overflow-hidden bg-[#010a18] border border-blue-800/60 shadow-md">
                      <CardContent className="p-4">
                        <div className="flex flex-col">
                          <h3 className="font-medium text-xl text-white mb-2">{selectedMeet.name}</h3>
                          <div className="flex flex-col space-y-2 mb-3">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                              <span className="text-blue-300">{formatDate(selectedMeet.date)} • {formatTime(selectedMeet.date)}</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-blue-400" />
                              <span className="text-blue-300">{selectedMeet.location}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 my-3">
                            {selectedMeet.events?.map(event => (
                              <Badge key={event} className="bg-blue-900/60 text-blue-200 hover:bg-blue-800">{event}</Badge>
                            ))}
                          </div>
                          
                          <div className="flex gap-2 mt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-blue-600 text-blue-400 hover:bg-blue-800/30"
                              onClick={() => handleShareMeet(selectedMeet)}
                            >
                              <Share2 className="h-4 w-4 mr-1" />
                              Share Meet
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      
      <CreateMeetModal
        isOpen={isCreateMeetOpen}
        onClose={() => setIsCreateMeetOpen(false)}
      />
    </div>
  );
}
