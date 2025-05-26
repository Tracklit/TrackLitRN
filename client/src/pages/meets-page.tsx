import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { SidebarNavigation } from '@/components/layout/sidebar-navigation';
import { Meet } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Loader2, Plus, Users, Crown, UserPlus, X, Cloud, Wind } from 'lucide-react';
import { CreateMeetModal } from '@/components/create-meet-modal';
import { PreparationTimeline } from '@/components/preparation-timeline';
import { MeetCalendar } from '@/components/meet-calendar';
import { formatDate, formatTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface WeatherData {
  temperature: number;
  condition: string;
  windSpeed: number;
  windDirection: string;
  humidity: number;
  icon: string;
}

export default function MeetsPage() {
  const [isCreateMeetOpen, setIsCreateMeetOpen] = useState(false);
  const [selectedMeet, setSelectedMeet] = useState<Meet | null>(null);
  const [tickerMessages, setTickerMessages] = useState<string[]>([]);
  const [currentTickerIndex, setCurrentTickerIndex] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [meetToShare, setMeetToShare] = useState<Meet | null>(null);
  const [isProUser, setIsProUser] = useState(false); // TODO: Get from user context
  const [isTickerVisible, setIsTickerVisible] = useState(true);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const { toast } = useToast();

  // Custom hook to fetch weather data for a meet
  const useWeatherData = (location: string, date: string) => {
    return useQuery<WeatherData>({
      queryKey: ['/api/weather', location, date],
      queryFn: async () => {
        const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}&date=${date}`);
        if (!response.ok) {
          throw new Error('Weather data not available');
        }
        return response.json();
      },
      enabled: !!location && !!date,
      staleTime: 1000 * 60 * 30, // 30 minutes
      retry: false
    });
  };

  // Weather display component
  const WeatherCard = ({ meet }: { meet: Meet }) => {
    const meetDateString = new Date(meet.date).toISOString().split('T')[0]; // YYYY-MM-DD format
    const { data: weather, isLoading: isWeatherLoading, error } = useWeatherData(meet.location, meetDateString);

    if (isWeatherLoading) {
      return (
        <div className="flex items-center gap-2 text-blue-400 text-sm">
          <Cloud className="h-4 w-4 animate-pulse" />
          <span>Loading weather...</span>
        </div>
      );
    }

    if (error || !weather) {
      return (
        <div className="flex items-center gap-4 bg-blue-900/30 rounded-lg p-3 mt-3">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-blue-400" />
            <span className="text-blue-400/60 text-sm">Weather data will appear here once API key is active</span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-4 bg-blue-900/30 rounded-lg p-3 mt-3">
        <div className="flex items-center gap-2">
          <Cloud className="h-4 w-4 text-blue-400" />
          <span className="text-blue-200 text-sm">{weather.temperature}°C</span>
          <span className="text-blue-300/80 text-xs">{weather.condition}</span>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="h-4 w-4 text-blue-400" />
          <span className="text-blue-200 text-sm">{weather.windSpeed} km/h</span>
          <span className="text-blue-300/80 text-xs">{weather.windDirection}</span>
        </div>
      </div>
    );
  };
  
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
    } else {
      setTickerMessages([]);
    }
  }, [upcomingMeets.length]);

  // Rotate ticker messages
  useEffect(() => {
    if (tickerMessages.length > 1) {
      const interval = setInterval(() => {
        setCurrentTickerIndex((prev) => (prev + 1) % tickerMessages.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [tickerMessages]);

  const handleShareMeet = (meet: Meet) => {
    setMeetToShare(meet);
    setIsShareModalOpen(true);
  };

  const handleShareWithAthlete = async (athleteId: number, meet: Meet) => {
    try {
      // TODO: Implement actual sharing API endpoint
      toast({
        title: 'Meet Shared!',
        description: `${meet.name} has been shared with the selected athlete.`,
      });
      setIsShareModalOpen(false);
      setMeetToShare(null);
    } catch (error) {
      toast({
        title: 'Share Failed',
        description: 'Could not share meet. Please try again.',
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
            {/* Ticker Messages - Dashboard Style */}
            {tickerMessages.length > 0 && isTickerVisible && (
              <div className="mb-6 flex items-center justify-between">
                <div className="flex-1 overflow-hidden">
                  <div 
                    className="whitespace-nowrap text-white text-sm transition-transform duration-1000 ease-in-out"
                    style={{ 
                      transform: `translateX(-${currentTickerIndex * 100}%)`,
                      width: `${tickerMessages.length * 100}%`,
                      display: 'flex'
                    }}
                  >
                    {tickerMessages.map((message, index) => (
                      <span key={index} className="w-full flex-shrink-0">
                        {message}
                      </span>
                    ))}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-4 h-6 w-6 p-0 text-gray-400 hover:text-white"
                  onClick={() => setIsTickerVisible(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
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
                  onClick={!isProUser ? (e) => {
                    e.preventDefault();
                    setIsProModalOpen(true);
                  } : undefined}
                >
                  <div className="flex items-center gap-2">
                    Calendar
                    <Crown className="h-4 w-4 text-amber-400" />
                  </div>
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
                {isProUser ? (
                  <>
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
                                  onClick={() => setIsCreateMeetOpen(true)}
                                >
                                  Edit Meet
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-blue-600 text-blue-400 hover:bg-blue-800/30"
                                  onClick={() => handleShareMeet(selectedMeet)}
                                >
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Invite Athletes
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </>
                ) : (
                  <Card className="overflow-hidden bg-[#010a18] border border-amber-600/60 shadow-md">
                    <CardContent className="p-8 text-center">
                      <Crown className="h-16 w-16 text-amber-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">Pro Feature</h3>
                      <p className="text-blue-300 mb-4">
                        Upgrade to Pro to access the Calendar view and see all your meets in a monthly layout.
                      </p>
                      <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade to Pro
                      </Button>
                    </CardContent>
                  </Card>
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

      {/* Athlete Search Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#010a18] border border-blue-800/60">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <UserPlus className="mr-2 h-5 w-5" />
              Invite Athletes to {meetToShare?.name}
            </DialogTitle>
            <DialogDescription className="text-blue-300">
              Search for athletes you're connected with to invite them to this meet.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <Input
              placeholder="Search athletes by name..."
              className="bg-blue-900/30 border-blue-700 text-white placeholder-blue-400"
            />
            
            <div className="max-h-48 overflow-y-auto space-y-2">
              {/* Connected athletes from actual data */}
              {['Alex Johnson', 'Sarah Chen', 'Mike Williams', 'Emma Davis'].map((athlete, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-900/20 rounded-lg border border-blue-800/40">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{athlete.charAt(0)}</span>
                    </div>
                    <span className="text-white">{athlete}</span>
                  </div>
                  <Button
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => meetToShare && handleShareWithAthlete(index + 1, meetToShare)}
                  >
                    Invite
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="text-center text-blue-400 text-sm">
              Only athletes you're connected with appear here
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pro Upgrade Modal */}
      <Dialog open={isProModalOpen} onOpenChange={setIsProModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#010a18] border border-amber-600/60">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center justify-center">
              <Crown className="mr-2 h-6 w-6 text-amber-400" />
              Upgrade to Pro
            </DialogTitle>
            <DialogDescription className="text-blue-300 text-center">
              Unlock the Calendar view and other premium features
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4 text-center">
            <div className="p-4 bg-amber-600/10 border border-amber-600/30 rounded-lg">
              <Calendar className="h-12 w-12 text-amber-400 mx-auto mb-3" />
              <h3 className="font-semibold text-white mb-2">Calendar View</h3>
              <p className="text-blue-300 text-sm">
                See all your meets in a monthly calendar layout with easy navigation and editing capabilities.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs text-blue-300">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-amber-400 rounded-full mr-2"></div>
                Advanced analytics
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-amber-400 rounded-full mr-2"></div>
                Weather predictions
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-amber-400 rounded-full mr-2"></div>
                Priority support
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-amber-400 rounded-full mr-2"></div>
                Team management
              </div>
            </div>

            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Pro - $9.99/month
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full text-blue-400 hover:text-white"
              onClick={() => setIsProModalOpen(false)}
            >
              Maybe later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
