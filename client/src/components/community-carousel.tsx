import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCircle, Trophy, Users, Calendar, BookOpen, Medal, MapPin, Clock, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
}

export function CommunityCarousel({ isPaused = false, onPauseToggle }: CommunityCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<CommunityActivity | null>(null);
  const [dialogType, setDialogType] = useState<'meet' | 'group' | 'journal' | null>(null);
  
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
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        user: { id: 3, username: 'coach_jones', name: 'Coach Jones', profileImageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' }
      },
      {
        id: 4,
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

  // Auto-advance to next item every 7 seconds
  useEffect(() => {
    if (!activities?.length || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activities.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [activities?.length, isPaused]);

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'workout':
        return <UserCircle className="h-4 w-4 text-blue-400" />;
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
            key={activity.id} 
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
                      onClick={() => handleActivityClick(activity)}
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
      
      {/* Activity Dialog */}
      <ActivityDialog 
        activity={selectedActivity}
        type={dialogType}
        onClose={() => {
          setSelectedActivity(null);
          setDialogType(null);
        }}
      />
    </div>
  );

  function handleActivityClick(activity: CommunityActivity) {
    setSelectedActivity(activity);
    
    // Determine dialog type based on activity type
    if (activity.activityType === 'meet_created' || activity.activityType === 'meet_joined') {
      setDialogType('meet');
    } else if (activity.activityType === 'group_joined') {
      setDialogType('group');
    } else if (activity.activityType === 'journal_entry') {
      setDialogType('journal');
    } else {
      // Default to journal for other activity types
      setDialogType('journal');
    }
  }
}

// Activity Dialog Component
interface ActivityDialogProps {
  activity: CommunityActivity | null;
  type: 'meet' | 'group' | 'journal' | null;
  onClose: () => void;
}

function ActivityDialog({ activity, type, onClose }: ActivityDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const saveMeetMutation = useMutation({
    mutationFn: async (meetData: any) => {
      return apiRequest('/api/meets', {
        method: 'POST',
        body: JSON.stringify(meetData)
      });
    },
    onSuccess: () => {
      toast({
        title: "Meet Saved",
        description: "The meet has been added to your calendar."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/meets'] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save meet. Please try again.",
        variant: "destructive"
      });
    }
  });

  if (!activity || !type) return null;

  const handleSaveMeet = () => {
    if (activity.metadata && activity.metadata.meetData) {
      saveMeetMutation.mutate(activity.metadata.meetData);
    }
  };

  const handleViewGroup = () => {
    if (activity.metadata && activity.metadata.groupId) {
      window.open(`/groups/${activity.metadata.groupId}`, '_blank');
    }
  };

  return (
    <Dialog open={!!activity} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'meet' && <Calendar className="text-green-500 h-5 w-5" />}
            {type === 'group' && <Users className="text-blue-500 h-5 w-5" />}
            {type === 'journal' && <BookOpen className="text-green-500 h-5 w-5" />}
            {type === 'journal' ? 'Training Session' : activity.title}
          </DialogTitle>
          <DialogDescription>
            {type === 'journal' 
              ? 'View details from this completed training session.'
              : activity.description
            }
          </DialogDescription>
        </DialogHeader>

        {type === 'journal' && (
          <div className="bg-muted/30 p-4 rounded-md mb-4">
            <h3 className="font-medium mb-2">Training Session</h3>
            
            {/* Display user info */}
            <div className="flex items-center gap-2 mb-3">
              <img 
                src={activity.user?.profileImageUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face'} 
                alt={activity.user?.username || 'User'}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="text-sm font-medium">{activity.user.name || activity.user.username}</span>
            </div>
            
            {/* Display the mood rating if available */}
            {activity.metadata?.workoutData?.moodRating && (
              <div className="flex items-center gap-2 mb-3">
                <p className="text-sm font-medium">How they felt:</p>
                <div className="flex items-center">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white"
                    style={{ 
                      background: activity.metadata.workoutData.moodRating <= 3 ? '#ef4444' : 
                                activity.metadata.workoutData.moodRating <= 5 ? '#f59e0b' : 
                                '#22c55e'
                    }}
                  >
                    {activity.metadata.workoutData.moodRating}
                  </div>
                  <span className="text-xs ml-1">/10</span>
                </div>
              </div>
            )}
            
            {/* Program and session info */}
            {activity.metadata?.workoutData && (
              <div className="space-y-1 mb-3">
                <div className="text-sm">
                  <span className="font-medium">Program: </span>
                  <span>{activity.metadata.workoutData.program}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Session: </span>
                  <span>{activity.metadata.workoutData.session}</span>
                </div>
              </div>
            )}
            
            <p className="text-sm font-medium mb-1">Notes:</p>
            <p className="text-sm text-muted-foreground">
              {activity.metadata?.workoutData?.notes || activity.description || "No notes added for this session."}
            </p>
          </div>
        )}

        {type === 'meet' && activity.metadata?.meetData && (
          <div className="bg-muted/30 p-4 rounded-md mb-4">
            <h3 className="font-medium mb-2">Meet Details</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span>{activity.metadata.meetData.location || 'Location TBD'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-blue-400" />
                <span>{new Date(activity.metadata.meetData.date).toLocaleDateString()}</span>
              </div>
              {activity.metadata.meetData.events && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Events:</span>
                  <div className="flex flex-wrap gap-1">
                    {activity.metadata.meetData.events.map((event: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {type === 'group' && activity.metadata?.groupData && (
          <div className="bg-muted/30 p-4 rounded-md mb-4">
            <h3 className="font-medium mb-2">Group Information</h3>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Group: </span>
                <span>{activity.metadata.groupData.name}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {activity.metadata.groupData.description}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-green-400" />
                <span>{activity.metadata.groupData.memberCount || 0} members</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          {type === 'meet' && (
            <Button 
              type="button"
              className="bg-primary text-white"
              onClick={handleSaveMeet}
              disabled={saveMeetMutation.isPending}
            >
              {saveMeetMutation.isPending ? (
                <>
                  <Save className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Meet
                </>
              )}
            </Button>
          )}
          {type === 'group' && (
            <Button 
              type="button"
              className="bg-primary text-white"
              onClick={handleViewGroup}
            >
              <Users className="mr-2 h-4 w-4" />
              View Group
            </Button>
          )}
          {type === 'journal' && (
            <Button 
              type="button"
              className="bg-primary text-white"
              onClick={() => window.location.href = '/tools/journal'}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Go to Journal
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}