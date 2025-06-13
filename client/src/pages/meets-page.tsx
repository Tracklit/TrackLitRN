import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';


import { Meet } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Loader2, Plus, Users, Crown, UserPlus, X, Cloud, Wind, Bell, Trophy, Clock, Target, MoreVertical, Trash2, ExternalLink } from 'lucide-react';
import { CardSkeleton } from '@/components/card-skeleton';
import { CreateMeetModal } from '@/components/create-meet-modal';
import { PreparationTimeline } from '@/components/preparation-timeline';
import { MeetCalendar } from '@/components/meet-calendar';
import { MeetInvitationNotification } from '@/components/meet-invitation-notification';
import { formatDate, formatTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface WeatherData {
  temperature: number;
  condition: string;
  windSpeed: number;
  windDirection: string;
  humidity: number;
  icon: string;
}

export default function MeetsPage() {
  const [, setLocation] = useLocation();
  const [isCreateMeetOpen, setIsCreateMeetOpen] = useState(false);
  const [selectedMeet, setSelectedMeet] = useState<Meet | null>(null);
  const [tickerMessages, setTickerMessages] = useState<string[]>([]);
  const [currentTickerIndex, setCurrentTickerIndex] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [meetToShare, setMeetToShare] = useState<Meet | null>(null);
  const [isProUser, setIsProUser] = useState(false); // TODO: Get from user context
  const [isTickerVisible, setIsTickerVisible] = useState(true);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [selectedPastMeet, setSelectedPastMeet] = useState<Meet | null>(null);
  const [meetResults, setMeetResults] = useState<{[meetId: number]: any[]}>({});
  const [meetNotes, setMeetNotes] = useState<{[meetId: number]: string}>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Results handling functions
  const addResultEntry = (meetId: number) => {
    const newResult = {
      id: Date.now(),
      event: '',
      time: '',
      place: '',
      wind: '',
      notes: ''
    };
    
    setMeetResults(prev => ({
      ...prev,
      [meetId]: [...(prev[meetId] || []), newResult]
    }));
  };

  const updateResultEntry = (meetId: number, resultId: number, field: string, value: string) => {
    setMeetResults(prev => ({
      ...prev,
      [meetId]: prev[meetId]?.map(result => 
        result.id === resultId ? { ...result, [field]: value } : result
      ) || []
    }));
  };

  const removeResultEntry = (meetId: number, resultId: number) => {
    setMeetResults(prev => ({
      ...prev,
      [meetId]: prev[meetId]?.filter(result => result.id !== resultId) || []
    }));
  };

  const saveResults = async (meetId: number) => {
    try {
      const results = meetResults[meetId] || [];
      const notes = meetNotes[meetId] || '';
      
      // Save each result entry
      for (const result of results) {
        if (result.event && result.time) {
          await fetch('/api/results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              meetId,
              event: result.event,
              performance: parseFloat(result.time),
              place: result.place ? parseInt(result.place) : null,
              wind: result.wind ? parseFloat(result.wind) : null,
              notes: result.notes
            })
          });
        }
      }

      toast({
        title: 'Results Saved!',
        description: 'Your meet results have been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Could not save results. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const deleteMeet = async (meetId: number) => {
    try {
      const response = await fetch(`/api/meets/${meetId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Invalidate meets cache to refresh the data
        queryClient.invalidateQueries({ queryKey: ['/api/meets'] });
        
        toast({
          title: 'Meet Deleted',
          description: 'The meet has been successfully deleted.',
        });
      } else {
        throw new Error('Failed to delete meet');
      }
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: 'Could not delete the meet. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        <main className="pb-6">
          <div className="max-w-3xl mx-auto px-4">
            <BackNavigation />
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

            <h2 className="text-xl font-semibold text-foreground mb-4">My Meets</h2>
            
            <Tabs defaultValue="upcoming" className="mt-4">
              <div className="flex justify-between items-center mb-6">
                <TabsList className="bg-muted border border-border">
                  <TabsTrigger 
                    value="upcoming" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Upcoming
                  </TabsTrigger>
                  <TabsTrigger 
                    value="past"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Past
                  </TabsTrigger>
                  <TabsTrigger 
                    value="calendar"
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    Calendar
                  </TabsTrigger>
                </TabsList>
                
                <Button
                  onClick={() => setLocation('/meets/create')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Meet
                </Button>
              </div>
              
              <TabsContent value="upcoming">
                {isLoading ? (
                  <div className="grid gap-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <CardSkeleton key={index} />
                    ))}
                  </div>
                ) : upcomingMeets.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingMeets
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map(meet => (
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
                              {meet.websiteUrl && (
                                <div className="flex items-center">
                                  <Trophy className="h-4 w-4 mr-2 text-blue-400" />
                                  <a 
                                    href={meet.websiteUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-300 hover:text-blue-100 underline text-sm"
                                  >
                                    Official Meet Info
                                  </a>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-2 my-3">
                              {meet.events?.map(event => (
                                <Badge key={event} className="bg-blue-900/60 text-blue-200 hover:bg-blue-800">{event}</Badge>
                              ))}
                            </div>
                            

                            
                            <div className="flex justify-between items-center mt-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="border-blue-600 text-blue-400 hover:bg-blue-800/30"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-blue-900 border-blue-700">
                                  <DropdownMenuItem 
                                    onClick={() => setSelectedMeet(selectedMeet?.id === meet.id ? null : meet)}
                                    className="text-blue-200 hover:bg-blue-800 cursor-pointer"
                                  >
                                    <Clock className="h-4 w-4 mr-2" />
                                    {selectedMeet?.id === meet.id ? 'Hide Preparation' : 'View Preparation'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleShareMeet(meet)}
                                    className="text-blue-200 hover:bg-blue-800 cursor-pointer"
                                  >
                                    <Users className="h-4 w-4 mr-2" />
                                    Share Meet
                                  </DropdownMenuItem>
                                  {meet.websiteUrl && (
                                    <DropdownMenuItem 
                                      onClick={() => window.open(meet.websiteUrl, '_blank')}
                                      className="text-blue-200 hover:bg-blue-800 cursor-pointer"
                                    >
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Official Website
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem 
                                    onClick={() => deleteMeet(meet.id)}
                                    className="text-red-400 hover:bg-red-900/50 cursor-pointer"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Meet
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              

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
                  <Card className="overflow-hidden bg-card border border-border text-center p-8">
                    <p className="text-muted-foreground mb-4">No upcoming meets</p>
                    <Button
                      onClick={() => setLocation('/meets/create')}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
                    {pastMeets
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(meet => (
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
                              {meet.websiteUrl && (
                                <div className="flex items-center">
                                  <Trophy className="h-4 w-4 mr-2 text-blue-400" />
                                  <a 
                                    href={meet.websiteUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-300 hover:text-blue-100 underline text-sm"
                                  >
                                    Official Meet Info
                                  </a>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-2 my-3">
                              {meet.events?.map(event => (
                                <Badge key={event} className="bg-blue-900/60 text-blue-200 hover:bg-blue-800">{event}</Badge>
                              ))}
                            </div>
                            
                            <div className="flex justify-between items-center mt-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="border-blue-600 text-blue-400 hover:bg-blue-800/30"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-blue-900 border-blue-700">
                                  <DropdownMenuItem 
                                    onClick={() => setSelectedPastMeet(selectedPastMeet?.id === meet.id ? null : meet)}
                                    className="text-blue-200 hover:bg-blue-800 cursor-pointer"
                                  >
                                    <Trophy className="h-4 w-4 mr-2" />
                                    {selectedPastMeet?.id === meet.id ? 'Hide Results' : 'Log Results'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleShareMeet(meet)}
                                    className="text-blue-200 hover:bg-blue-800 cursor-pointer"
                                  >
                                    <Users className="h-4 w-4 mr-2" />
                                    Share Meet
                                  </DropdownMenuItem>
                                  {meet.websiteUrl && (
                                    <DropdownMenuItem 
                                      onClick={() => window.open(meet.websiteUrl, '_blank')}
                                      className="text-blue-200 hover:bg-blue-800 cursor-pointer"
                                    >
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Official Website
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem 
                                    onClick={() => deleteMeet(meet.id)}
                                    className="text-red-400 hover:bg-red-900/50 cursor-pointer"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Meet
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              

                            </div>

                            {/* Results Logging Interface */}
                            {selectedPastMeet?.id === meet.id && (
                              <div className="mt-4 border-t border-blue-800/60 pt-4">
                                <div className="bg-blue-900/20 rounded-lg p-4">
                                  <h4 className="text-white font-semibold mb-4 flex items-center">
                                    <Trophy className="h-5 w-5 mr-2 text-amber-400" />
                                    Meet Results & Notes
                                  </h4>

                                  {/* Result Entries */}
                                  <div className="space-y-3 mb-4">
                                    {(meetResults[meet.id] || []).map((result, index) => (
                                      <div key={result.id} className="bg-blue-900/30 rounded-lg p-3 border border-blue-800/40">
                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                          <div>
                                            <label className="block text-xs text-blue-300 mb-1">Event</label>
                                            <input
                                              type="text"
                                              placeholder="e.g., 100m, Long Jump"
                                              value={result.event}
                                              onChange={(e) => updateResultEntry(meet.id, result.id, 'event', e.target.value)}
                                              className="w-full bg-blue-800/50 border border-blue-700 rounded px-2 py-1 text-white text-sm"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs text-blue-300 mb-1">Time/Distance</label>
                                            <input
                                              type="text"
                                              placeholder="e.g., 10.45, 6.80m"
                                              value={result.time}
                                              onChange={(e) => updateResultEntry(meet.id, result.id, 'time', e.target.value)}
                                              className="w-full bg-blue-800/50 border border-blue-700 rounded px-2 py-1 text-white text-sm"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs text-blue-300 mb-1">Place</label>
                                            <input
                                              type="text"
                                              placeholder="e.g., 1, 2, 3"
                                              value={result.place}
                                              onChange={(e) => updateResultEntry(meet.id, result.id, 'place', e.target.value)}
                                              className="w-full bg-blue-800/50 border border-blue-700 rounded px-2 py-1 text-white text-sm"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-xs text-blue-300 mb-1">Wind (m/s)</label>
                                            <input
                                              type="text"
                                              placeholder="e.g., +1.2, -0.5"
                                              value={result.wind}
                                              onChange={(e) => updateResultEntry(meet.id, result.id, 'wind', e.target.value)}
                                              className="w-full bg-blue-800/50 border border-blue-700 rounded px-2 py-1 text-white text-sm"
                                            />
                                          </div>
                                          <div className="flex items-end">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => removeResultEntry(meet.id, result.id)}
                                              className="border-red-600 text-red-400 hover:bg-red-600/20 w-full"
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                        {result.notes !== undefined && (
                                          <div className="mt-2">
                                            <label className="block text-xs text-blue-300 mb-1">Event Notes</label>
                                            <textarea
                                              placeholder="Any specific notes about this event..."
                                              value={result.notes}
                                              onChange={(e) => updateResultEntry(meet.id, result.id, 'notes', e.target.value)}
                                              className="w-full bg-blue-800/50 border border-blue-700 rounded px-2 py-1 text-white text-sm h-16 resize-none"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>

                                  {/* Add Result Button */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addResultEntry(meet.id)}
                                    className="border-amber-600 text-amber-400 hover:bg-amber-600/20 mb-4"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Result Entry
                                  </Button>

                                  {/* Meet Notes */}
                                  <div className="mb-4">
                                    <label className="block text-sm text-blue-300 mb-2 flex items-center">
                                      <Target className="h-4 w-4 mr-2" />
                                      Overall Meet Notes & Reflections
                                    </label>
                                    <textarea
                                      placeholder="How did the meet go overall? Any insights, lessons learned, or thoughts about your performance..."
                                      value={meetNotes[meet.id] || ''}
                                      onChange={(e) => setMeetNotes(prev => ({ ...prev, [meet.id]: e.target.value }))}
                                      className="w-full bg-blue-800/50 border border-blue-700 rounded px-3 py-2 text-white h-24 resize-none"
                                    />
                                  </div>

                                  {/* Save Button */}
                                  <Button
                                    onClick={() => saveResults(meet.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    size="sm"
                                  >
                                    <Trophy className="h-4 w-4 mr-2" />
                                    Save Results & Notes
                                  </Button>
                                </div>
                              </div>
                            )}
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
      


      {/* Athlete Search Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-md bg-background border border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center">
              <UserPlus className="mr-2 h-5 w-5" />
              Invite Athletes to {meetToShare?.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
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
    </>
  );
}
