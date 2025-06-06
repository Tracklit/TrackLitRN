import { useState, useEffect } from 'react';
import { useLocation, useRoute, Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Edit2, 
  Calendar, 
  MapPin, 
  Trophy, 
  Users, 
  Dumbbell,
  BookOpen,
  Activity,
  Clock,
  Star,
  Crown,
  MessageCircle,
  UserPlus,
  Check,
  X,
  Camera,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { MessagePanel } from '@/components/message-panel';

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  bio: string | null;
  profileImageUrl: string | null;
  isCoach: boolean | null;
  subscriptionTier: string | null;
  createdAt: Date | null;
}

interface Meet {
  id: number;
  name: string;
  date: string;
  location: string;
  status: string;
}

interface Workout {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  isPublic: boolean;
}

interface Program {
  id: number;
  title: string;
  description: string;
  price: number;
  priceType: string;
  category: string;
  level: string;
  coverImageUrl: string | null;
}

interface Friend {
  id: number;
  username: string;
  name: string;
  profileImageUrl: string | null;
  isCoach: boolean | null;
}

export default function PublicProfilePage() {
  const [, params] = useRoute('/user/:userId');
  const userId = params?.userId ? parseInt(params.userId) : null;

  console.log('PublicProfilePage - userId from params:', userId, 'params:', params);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', username: '' });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user to check if this is their own profile
  const { data: currentUser } = useQuery({
    queryKey: ['/api/user'],
    enabled: true
  });

  // Get profile user data
  const { data: profileUser, isLoading: userLoading } = useQuery({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId
  });

  // Get user's meets
  const { data: userMeets = [] } = useQuery({
    queryKey: [`/api/users/${userId}/meets`],
    enabled: !!userId
  });

  // Get user's latest workout (if public or own profile)
  const { data: latestWorkout } = useQuery({
    queryKey: [`/api/users/${userId}/latest-workout`],
    enabled: !!userId
  });

  // Get user's programs (if coach)
  const { data: userPrograms = [] } = useQuery({
    queryKey: [`/api/users/${userId}/programs`],
    enabled: !!userId && profileUser?.isCoach
  });

  // Get user's friends/athletes/coaches
  const { data: connections = [] } = useQuery({
    queryKey: [`/api/users/${userId}/connections`],
    enabled: !!userId
  });

  const isOwnProfile = currentUser?.id === userId;
  const upcomingMeets = userMeets.filter((meet: Meet) => new Date(meet.date) > new Date());
  const pastMeets = userMeets.filter((meet: Meet) => new Date(meet.date) <= new Date()).slice(0, 3);

  // Update bio mutation
  const updateBioMutation = useMutation({
    mutationFn: (bio: string) => apiRequest('PATCH', `/api/users/${userId}`, { bio }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId] });
      setIsEditingBio(false);
      toast({ title: 'Bio updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update bio', variant: 'destructive' });
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: { name: string; username: string }) => 
      apiRequest('PATCH', `/api/users/${userId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setIsEditingProfile(false);
      toast({ title: 'Profile updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    }
  });

  useEffect(() => {
    if (profileUser) {
      setBioText(profileUser.bio || '');
      setProfileData({ name: profileUser.name || '', username: profileUser.username || '' });
    }
  }, [profileUser]);

  const handleBioSave = () => {
    updateBioMutation.mutate(bioText);
  };

  const handleProfileSave = () => {
    updateProfileMutation.mutate(profileData);
  };

  const getSubscriptionBadge = (tier: string | null) => {
    if (!tier || tier === 'free') return null;
    
    const badgeProps = {
      pro: { className: "bg-blue-600 text-white", text: "PRO" },
      star: { className: "bg-gradient-to-r from-yellow-400 to-orange-500 text-black", text: "STAR" }
    };
    
    const props = badgeProps[tier as keyof typeof badgeProps];
    if (!props) return null;
    
    return <Badge className={props.className}>{props.text}</Badge>;
  };

  if (userLoading) {
    return (
      <div className="flex h-screen bg-[#010a18] text-white">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex h-screen bg-[#010a18] text-white">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
            <p className="text-gray-400">The profile you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#010a18] text-white">
      <div className="flex-1 overflow-auto">
        <main className="pt-16 pb-6">
          <div className="max-w-4xl mx-auto px-4">
            
            {/* Profile Header */}
            <Card className="bg-blue-900/20 border-blue-800/60 mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  
                  {/* Profile Image */}
                  <div className="relative">
                    <Avatar className="w-24 h-24 border-2 border-blue-500">
                      <AvatarImage src={profileUser.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl">
                        {profileUser.name?.charAt(0) || profileUser.username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    {isOwnProfile && (
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          {isEditingProfile && isOwnProfile ? (
                            <div className="space-y-2">
                              <Input
                                value={profileData.name}
                                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Display Name"
                                className="bg-blue-900/30 border-blue-700/50"
                              />
                              <Input
                                value={profileData.username}
                                onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                                placeholder="Username"
                                className="bg-blue-900/30 border-blue-700/50"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleProfileSave}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => setIsEditingProfile(false)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <h1 className="text-2xl font-bold">{profileUser.name || profileUser.username}</h1>
                              {profileUser.isCoach && (
                                <Badge className="bg-amber-600 hover:bg-amber-700">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Coach
                                </Badge>
                              )}
                              {getSubscriptionBadge(profileUser.subscriptionTier)}
                            </>
                          )}
                        </div>
                        
                        <p className="text-gray-400 mb-2">@{profileUser.username}</p>
                        
                        {profileUser.createdAt && (
                          <p className="text-sm text-gray-500">
                            Member since {format(new Date(profileUser.createdAt), 'MMMM yyyy')}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {isOwnProfile ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingProfile(true)}
                            className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Message
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add Friend
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Bio Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium text-gray-300">Bio</Label>
                        {isOwnProfile && !isEditingBio && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingBio(true)}
                            className="h-6 px-2 text-gray-400 hover:text-white"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      
                      {isEditingBio && isOwnProfile ? (
                        <div className="space-y-2">
                          <Textarea
                            value={bioText}
                            onChange={(e) => setBioText(e.target.value)}
                            placeholder="Tell others about yourself..."
                            className="bg-blue-900/30 border-blue-700/50 min-h-[80px]"
                            maxLength={500}
                          />
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" onClick={handleBioSave}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setIsEditingBio(false)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {profileUser.bio || 'No bio available.'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Latest Workout */}
                <Card className="bg-blue-900/20 border-blue-800/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Dumbbell className="h-5 w-5" />
                      Latest Workout
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {latestWorkout ? (
                      <div className="space-y-2">
                        <h3 className="font-semibold">{latestWorkout.title}</h3>
                        <p className="text-gray-400 text-sm">{latestWorkout.description}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(latestWorkout.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No recent workouts available.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Upcoming Meets */}
                <Card className="bg-blue-900/20 border-blue-800/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="h-5 w-5" />
                      Upcoming Meets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {upcomingMeets && upcomingMeets.length > 0 ? (
                      <div className="space-y-3">
                        {upcomingMeets.slice(0, 3).map((meet: Meet) => (
                          <div key={meet.id} className="p-3 bg-blue-800/30 rounded-lg border border-blue-700/30">
                            <h4 className="font-medium text-white">{meet.name}</h4>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-300">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(meet.date), 'MMM dd, yyyy')}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {meet.location}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No upcoming meets.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Past Meets */}
                <Card className="bg-blue-900/20 border-blue-800/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Trophy className="h-5 w-5" />
                      Recent Meets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pastMeets && pastMeets.length > 0 ? (
                      <div className="space-y-3">
                        {pastMeets.map((meet: Meet) => (
                          <div key={meet.id} className="p-3 bg-blue-800/30 rounded-lg border border-blue-700/30">
                            <h4 className="font-medium text-white">{meet.name}</h4>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-300">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(meet.date), 'MMM dd, yyyy')}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {meet.location}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No recent meets available.</p>
                    )}
                  </CardContent>
                </Card>

              </div>

              {/* Right Column */}
              <div className="space-y-6">
                
                {/* Programs (for coaches) */}
                {profileUser?.isCoach && (
                  <Card className="bg-blue-900/20 border-blue-800/60">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <BookOpen className="h-5 w-5" />
                        Programs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userPrograms && userPrograms.length > 0 ? (
                        <div className="space-y-3">
                          {userPrograms.slice(0, 4).map((program: Program) => (
                            <div key={program.id} className="p-3 bg-blue-800/30 rounded-lg border border-blue-700/30">
                              <h4 className="font-medium text-white text-sm">{program.title}</h4>
                              <p className="text-gray-400 text-xs mt-1 line-clamp-2">{program.description}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500">{program.level}</span>
                                <span className="text-xs font-medium text-green-400">
                                  {program.priceType === 'free' ? 'Free' : `$${program.price}`}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">No programs available.</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Connections */}
                <Card className="bg-blue-900/20 border-blue-800/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-5 w-5" />
                      {profileUser?.isCoach ? 'Athletes & Friends' : 'Connections'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {connections && connections.length > 0 ? (
                      <div className="space-y-3">
                        {connections.slice(0, 6).map((connection: Friend) => (
                          <div key={connection.id} className="flex items-center gap-3">
                            <img
                              src={connection.profileImageUrl || "/api/placeholder/32/32"}
                              alt={connection.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <Link
                                href={`/user/${connection.id}`}
                                className="text-sm font-medium text-white hover:text-blue-400 transition-colors"
                              >
                                {connection.name}
                              </Link>
                              {connection.isCoach && (
                                <span className="text-xs text-gold-500 ml-2">Coach</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">No connections yet.</p>
                    )}
                  </CardContent>
                </Card>

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}