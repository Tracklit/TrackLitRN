import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserCircle, Trophy, Users, Calendar, BookOpen, Medal, MapPin, Clock, Save, X, BookmarkPlus, Dumbbell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SimpleWorkoutLike } from "@/components/workout-reactions";

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}d`;
}

interface CommunityActivity {
  id: number;
  userId: number;
  activityType: string;
  title: string;
  description?: string;
  relatedEntityId?: number;
  relatedEntityType?: string;
  metadata?: any;
  createdAt: string;
  user: {
    id: number;
    username: string;
    name: string;
    profileImageUrl?: string;
  };
}

interface CommunityCarouselProps {
  isPaused?: boolean;
  onPauseToggle?: (paused: boolean) => void;
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
  onTotalChange?: (total: number) => void;
}

export function CommunityCarousel({ 
  isPaused = false, 
  onPauseToggle,
  currentIndex: externalIndex,
  onIndexChange,
  onTotalChange
}: CommunityCarouselProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const currentIndex = externalIndex !== undefined ? externalIndex : internalIndex;
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<CommunityActivity | null>(null);
  const [isSavingItem, setIsSavingItem] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch community activities with fallback data
  const { data: activities, isLoading } = useQuery<CommunityActivity[]>({
    queryKey: ['/api/community/activities'],
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: false,
    staleTime: 60000,
    initialData: [
      {
        id: 1,
        userId: 1,
        activityType: 'workout',
        title: 'Sprint Training Complete',
        description: 'Finished 6x100m sprint session with excellent form',
        createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        user: { id: 1, username: 'speedster_pro', name: 'Alex R.', profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' }
      },
      {
        id: 2,
        userId: 2,
        activityType: 'user_joined',
        title: 'New Athlete Joined',
        description: 'Welcome Sarah M. to the TrackLit community!',
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        user: { id: 2, username: 'sarah_m_runner', name: 'Sarah M.', profileImageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b002?w=150&h=150&fit=crop&crop=face' }
      },
      {
        id: 3,
        userId: 3,
        activityType: 'meet_created',
        title: 'Spring Championship Meet',
        description: 'New track meet scheduled for April 15th at Metro Stadium',
        relatedEntityId: 1,
        relatedEntityType: 'meet',
        metadata: {
          meetData: {
            name: 'Spring Championship Meet',
            date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Metro Stadium',
            events: ['100m', '200m', '400m', 'Long Jump'],
            warmupTime: 60,
            arrivalTime: 90,
            websiteUrl: null
          }
        },
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        user: { id: 3, username: 'coach_jones', name: 'Coach Jones', profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' }
      },
      {
        id: 4,
        userId: 1,
        activityType: 'journal_entry',
        title: 'Training Journal Entry',
        description: 'Completed Beast Mode Day 15 - felt strong during 6x100m intervals',
        relatedEntityId: 15,
        relatedEntityType: 'session',
        metadata: {
          workoutData: {
            program: 'Beast Mode 2025',
            session: 'Day 15 - Speed Development',
            moodRating: 8
          },
          workoutId: 15
        },
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        user: { id: 1, username: 'speedster_pro', name: 'Alex R.', profileImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' }
      },
      {
        id: 5,
        userId: 1,
        activityType: 'meet_results',
        title: 'Personal Best Achievement!',
        description: 'New 200m PB of 22.85s at Regional Qualifier meet',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        user: { id: 1, username: 'speedster_pro', name: 'Alex R.', profileImageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face' }
      },
      {
        id: 5,
        userId: 4,
        activityType: 'coach_status',
        title: 'Certified Coach',
        description: 'Marcus T. became a certified coach on TrackLit',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        user: { id: 4, username: 'coach_marcus', name: 'Marcus T.', profileImageUrl: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face' }
      },
      {
        id: 6,
        userId: 2,
        activityType: 'program_assigned',
        title: 'Speed Development Program',
        description: 'Started 8-week speed development training program',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        user: { id: 2, username: 'sarah_m_runner', name: 'Sarah M.', profileImageUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b002?w=150&h=150&fit=crop&crop=face' }
      },
      {
        id: 7,
        userId: 5,
        activityType: 'group_joined',
        title: 'Elite Sprinters Club',
        description: 'Joined the Elite Sprinters training group',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        user: { id: 5, username: 'elite_runner', name: 'Jordan K.', profileImageUrl: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=150&h=150&fit=crop&crop=face' }
      }
    ]
  });

  // Notify parent of total activities
  useEffect(() => {
    if (activities?.length && onTotalChange) {
      onTotalChange(activities.length);
    }
  }, [activities?.length, onTotalChange]);

  // Auto-advance to next item every 7 seconds
  useEffect(() => {
    if (!activities?.length || isPaused) return;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % activities.length;
      if (onIndexChange) {
        onIndexChange(nextIndex);
      } else {
        setInternalIndex(nextIndex);
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [activities?.length, isPaused, currentIndex, onIndexChange]);

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'workout':
      case 'journal_entry':
        return <BookOpen className="h-4 w-4 text-blue-400" />;
      case 'user_joined':
        return <Users className="h-4 w-4 text-green-400" />;
      case 'meet_created':
        return <Calendar className="h-4 w-4 text-purple-400" />;
      case 'meet_results':
        return <Medal className="h-4 w-4 text-yellow-400" />;
      case 'coach_status':
        return <Trophy className="h-4 w-4 text-orange-400" />;
      case 'program_assigned':
        return <BookOpen className="h-4 w-4 text-indigo-400" />;
      case 'group_joined':
        return <Users className="h-4 w-4 text-teal-400" />;
      default:
        return <UserCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const renderActivityCard = (activity: CommunityActivity, index: number) => (
    <div 
      key={activity.id} 
      className="absolute inset-0 p-4 flex items-center transition-transform duration-500 ease-in-out"
      style={{
        transform: `translateX(${(index - currentIndex) * 100}%)`,
      }}
    >
      <div className="flex items-center gap-2 pr-8 h-full w-full ml-10">
        <div className="rounded-full bg-gray-700/50 h-8 w-8 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-600">
          {activity.user?.profileImageUrl ? (
            <img 
              src={activity.user.profileImageUrl} 
              alt={activity.user?.username}
              className="w-full h-full object-cover"
            />
          ) : (
            getActivityIcon(activity.activityType)
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-xs font-medium text-yellow-400 truncate">{activity.title}</span>
            {activity.user?.username && (
              <span className="text-xs text-gray-300 truncate">· {activity.user.username}</span>
            )}
          </div>
          {activity.description && (
            <p className="text-xs text-gray-400 line-clamp-1 truncate">{activity.description}</p>
          )}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-4 h-20">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full bg-gray-700" />
          <div className="flex-1">
            <Skeleton className="h-3 w-32 mb-1 bg-gray-700" />
            <Skeleton className="h-3 w-48 bg-gray-700" />
          </div>
        </div>
      </div>
    );
  }

  if (!activities?.length) {
    return (
      <div className="p-4 h-20 flex items-center">
        <span className="text-xs text-gray-400">No community activity yet</span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden h-20 flex items-center">
      {activities.map((activity, index) => {
        let position;
        if (currentIndex === activities.length - 1 && index === 0) {
          // When on last item, show first item to the right for seamless transition
          position = activities.length;
        } else {
          position = index;
        }
        
        return (
          <div 
            key={`${activity.id}-${index}`} 
            className="absolute inset-0 flex items-center transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(${(position - currentIndex) * 100}%)`,
            }}
          >
            {/* Container with padding to avoid control overlap */}
            <div className="flex items-center gap-2 h-full w-full px-12">
              <a 
                href={`/profile/${activity.user?.username}`}
                className="rounded-full bg-gray-200 h-8 w-8 flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/20 hover:border-white/40 transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                <img 
                  src={activity.user?.profileImageUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'} 
                  alt={activity.user?.username || 'User'}
                  className="w-full h-full object-cover"
                />
              </a>
              <div className="flex-1 overflow-hidden">
                <div className="flex flex-col justify-center h-full">
                  {/* Row 1: Username, title, and timestamp */}
                  <div className="flex items-center gap-1 mb-0.5">
                    <a 
                      href={`/profile/${activity.user?.username}`}
                      className="text-sm font-medium text-white hover:text-white/80 truncate transition-colors"
                      onClick={(e) => e.preventDefault()}
                    >
                      {activity.user?.name || activity.user?.username}
                    </a>
                    <span className="text-sm text-white/80 truncate">• {activity.title}</span>
                    <span className="text-xs text-white/60 flex-shrink-0">{formatTimeAgo(activity.createdAt)}</span>
                  </div>
                  {/* Row 2: Message body/description */}
                  {activity.description && (
                    <div 
                      className="text-xs text-white/70 truncate cursor-pointer hover:text-white/90 transition-colors"
                      onClick={() => handleTickerClick(activity)}
                    >
                      {activity.description}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Activity Modal - Based on session modal design */}
      {isActivityModalOpen && currentActivity && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            paddingTop: '10vh',
            paddingBottom: '10vh',
          }}
          onClick={() => setIsActivityModalOpen(false)}
        >
          <div 
            className="bg-slate-800 rounded-lg shadow-2xl border border-slate-600 p-6 w-full max-w-md"
            style={{
              maxHeight: '80vh',
              overflow: 'auto',
              marginTop: 'auto',
              marginBottom: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                {currentActivity.title}
              </h2>
              <button
                onClick={() => setIsActivityModalOpen(false)}
                className="text-gray-300 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-blue-600/20 h-8 w-8 flex items-center justify-center flex-shrink-0">
                  <UserCircle className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{currentActivity.user?.name || currentActivity.user?.username}</p>
                  <p className="text-xs text-gray-300">@{currentActivity.user?.username}</p>
                </div>
              </div>
              
              <div className="border-t border-slate-600 pt-4">
                <h3 className="text-sm font-medium mb-2 text-white">Activity Details</h3>
                <p className="text-sm text-gray-300">{currentActivity.description}</p>
              </div>
              
              {/* Activity-specific content */}
              {(currentActivity.activityType === 'meet_created' || currentActivity.activityType === 'meet_joined') && currentActivity.metadata?.meetData && (
                <div className="bg-slate-700 p-3 rounded-md">
                  <h4 className="text-xs font-medium mb-2 text-white">Meet Information</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-blue-400" />
                      <span>{currentActivity.metadata.meetData.location || 'Location TBD'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-blue-400" />
                      <span>{new Date(currentActivity.metadata.meetData.date).toLocaleDateString()}</span>
                    </li>
                    {currentActivity.metadata.meetData.events && (
                      <li className="flex items-start gap-2">
                        <Calendar className="h-3 w-3 text-blue-400 mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                          {currentActivity.metadata.meetData.events.map((event: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              )}
              
              {currentActivity.activityType === 'group_joined' && currentActivity.metadata?.groupData && (
                <div className="bg-slate-700 p-3 rounded-md">
                  <h4 className="text-xs font-medium mb-2 text-white">Group Information</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-green-400" />
                      <span>{currentActivity.metadata.groupData.name}</span>
                    </li>
                    <li className="text-sm text-gray-400">
                      {currentActivity.metadata.groupData.description}
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-green-400" />
                      <span>{currentActivity.metadata.groupData.memberCount || 0} members</span>
                    </li>
                  </ul>
                </div>
              )}
              
              {currentActivity.activityType === 'journal_entry' && currentActivity.metadata?.workoutData && (
                <div className="bg-slate-700 p-3 rounded-md">
                  <h4 className="text-xs font-medium mb-2 text-white">Workout Details</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center gap-2">
                      <Dumbbell className="h-3 w-3 text-blue-400" />
                      <span>{currentActivity.metadata.workoutData.program}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <BookOpen className="h-3 w-3 text-blue-400" />
                      <span>{currentActivity.metadata.workoutData.session}</span>
                    </li>
                    {currentActivity.metadata.workoutData.moodRating && (
                      <li className="flex items-center gap-2">
                        <span className="text-xs font-medium">Mood:</span>
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ 
                            background: currentActivity.metadata.workoutData.moodRating <= 3 ? '#ef4444' : 
                                      currentActivity.metadata.workoutData.moodRating <= 5 ? '#f59e0b' : 
                                      '#22c55e'
                          }}
                        >
                          {currentActivity.metadata.workoutData.moodRating}
                        </div>
                        <span className="text-xs">/10</span>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-600">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsActivityModalOpen(false)}
                >
                  Close
                </Button>
                
                {/* Thumbs up like button for workouts */}
                {currentActivity.activityType === 'journal_entry' && (
                  <SimpleWorkoutLike 
                    sessionId={currentActivity.relatedEntityId || currentActivity.id} 
                    className="ml-2"
                  />
                )}
              </div>
              
              {/* Action button based on activity type */}
              {(currentActivity.activityType === 'meet_created' || currentActivity.activityType === 'meet_joined') && (
                <Button 
                  type="button"
                  onClick={saveMeetToCalendar}
                  disabled={isSavingItem}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSavingItem ? (
                    <>
                      <Save className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save to Meets
                    </>
                  )}
                </Button>
              )}
              
              {currentActivity.activityType === 'group_joined' && (
                <Button 
                  type="button"
                  onClick={viewGroupInfo}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Users className="mr-2 h-4 w-4" />
                  View Group
                </Button>
              )}
              
              {currentActivity.activityType === 'journal_entry' && (
                <Button 
                  type="button"
                  onClick={saveWorkoutToLibrary}
                  disabled={isSavingItem}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSavingItem ? (
                    <>
                      <BookmarkPlus className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="mr-2 h-4 w-4" />
                      Save to Library
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Function to handle ticker click
  function handleTickerClick(activity: CommunityActivity) {
    setCurrentActivity(activity);
    setIsActivityModalOpen(true);
  }

  // Function to save meet to calendar
  async function saveMeetToCalendar() {
    if (!currentActivity?.metadata?.meetData) return;
    
    setIsSavingItem(true);
    
    try {
      // Create proper meet data structure
      const meetData = {
        name: currentActivity.metadata.meetData.name || currentActivity.title,
        date: currentActivity.metadata.meetData.date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: currentActivity.metadata.meetData.location || 'Location TBD',
        events: currentActivity.metadata.meetData.events || [],
        warmupTime: currentActivity.metadata.meetData.warmupTime || 60,
        arrivalTime: currentActivity.metadata.meetData.arrivalTime || 90,
        websiteUrl: currentActivity.metadata.meetData.websiteUrl || null
      };

      const response = await fetch('/api/meets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetData)
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to save meet: ${errorData}`);
      }
      
      toast({
        title: "Meet Saved",
        description: "The meet has been added to your calendar."
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/meets'] });
      setIsActivityModalOpen(false);
    } catch (error) {
      console.error('Error saving meet:', error);
      toast({
        title: "Error",
        description: "Failed to save meet. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSavingItem(false);
    }
  }

  // Function to view group info
  function viewGroupInfo() {
    if (currentActivity?.metadata?.groupId) {
      window.open(`/groups/${currentActivity.metadata.groupId}`, '_blank');
    }
  }

  // Function to save workout to library
  async function saveWorkoutToLibrary() {
    if (!currentActivity?.metadata?.workoutData) return;
    
    setIsSavingItem(true);
    
    try {
      // Create workout library entry
      const workoutData = {
        title: `${currentActivity.metadata.workoutData.session}`,
        description: currentActivity.description || 'Saved from community activity',
        category: 'saved',
        content: {
          program: currentActivity.metadata.workoutData.program,
          session: currentActivity.metadata.workoutData.session,
          moodRating: currentActivity.metadata.workoutData.moodRating,
          originalUser: currentActivity.user?.username,
          originalUserId: currentActivity.userId,
          savedFrom: 'community_ticker'
        },
        isPublic: false,
        originalUserId: currentActivity.userId
      };

      const response = await fetch('/api/workout-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutData)
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to save workout: ${errorData}`);
      }
      
      toast({
        title: "Workout Saved",
        description: "The workout has been saved to your library."
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/workout-library'] });
      setIsActivityModalOpen(false);
    } catch (error) {
      console.error('Error saving workout:', error);
      toast({
        title: "Error",
        description: "Failed to save workout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSavingItem(false);
    }
  }
}

