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
  Shield,
  Palette,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { MessagePanel } from '@/components/message-panel';
import SubscriptionButton from '@/components/SubscriptionButton';

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
  const [isMessagePanelOpen, setIsMessagePanelOpen] = useState(false);
  const [isEditingBackground, setIsEditingBackground] = useState(false);
  const [backgroundType, setBackgroundType] = useState<'color' | 'image'>('color');
  const [backgroundColor, setBackgroundColor] = useState('#1e293b');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isEditingProfileImage, setIsEditingProfileImage] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1);
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

  const handleOpenMessage = () => {
    setIsMessagePanelOpen(true);
  };

  const handleCloseMessagePanel = () => {
    setIsMessagePanelOpen(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundImage(e.target?.result as string);
        setBackgroundType('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const getCardBackgroundStyle = () => {
    if (backgroundType === 'image' && backgroundImage) {
      return {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: 0.2
      };
    }
    return {
      background: backgroundColor
    };
  };

  const handleProfileImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setTempImageUrl(e.target?.result as string);
      setImagePosition({ x: 0, y: 0 });
      setImageScale(1);
      setIsEditingProfileImage(true);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileImageSave = async () => {
    if (!tempImageUrl) return;

    setIsUploadingImage(true);
    
    try {
      // Create a canvas to crop the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = tempImageUrl;
      });

      // Set canvas size to desired output size (square)
      const outputSize = 400;
      canvas.width = outputSize;
      canvas.height = outputSize;

      // Calculate the source rectangle based on position and scale
      const containerSize = 300; // Approximate size of the cropper container
      const cropSize = containerSize * 0.8; // 80% of container (matching the circle)
      const scaledImageWidth = img.width * imageScale;
      const scaledImageHeight = img.height * imageScale;
      
      // Calculate source coordinates
      const sourceX = Math.max(0, -imagePosition.x * (img.width / scaledImageWidth));
      const sourceY = Math.max(0, -imagePosition.y * (img.height / scaledImageHeight));
      const sourceSize = Math.min(img.width, img.height) / imageScale;

      // Draw the cropped image
      ctx?.drawImage(
        img,
        sourceX, sourceY, sourceSize, sourceSize,
        0, 0, outputSize, outputSize
      );

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9);
      });
      
      const formData = new FormData();
      formData.append('profileImage', blob, 'profile.jpg');

      const uploadResponse = await fetch('/api/user/public-profile', {
        method: 'POST',
        body: formData,
      });

      if (uploadResponse.ok) {
        // Refresh user data to get new profile image
        queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        toast({ title: 'Profile image updated successfully' });
        setIsEditingProfileImage(false);
        setTempImageUrl(null);
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast({ 
        title: 'Failed to update profile image', 
        description: 'Please try again with a different image.',
        variant: 'destructive' 
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const getSubscriptionTier = (tier: string | null) => {
    if (!tier || tier === 'free') return 'FREE';
    return tier.toUpperCase();
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
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="flex-1 overflow-auto">
        <main className="pt-16 pb-6">
          <div className="max-w-md mx-auto px-4">
            
            {/* Action Buttons - Moved Above Card */}
            {!isOwnProfile && (
              <div className="flex gap-3 mb-6 justify-center flex-wrap">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 px-8"
                  onClick={handleOpenMessage}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Message
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-black px-8"
                >
                  <UserPlus className="h-5 w-5 mr-2" />
                  Add Friend
                </Button>
                {profileUser && (
                  <SubscriptionButton
                    coachId={profileUser.id}
                    coachName={profileUser.name}
                    coachUsername={profileUser.username}
                    variant="crown"
                    className="size-lg px-8"
                  />
                )}
              </div>
            )}

            {/* Trading Card - Main Profile */}
            <div className="relative">
              {/* Card with Gold Border */}
              <div 
                className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl p-1"
                style={{ 
                  height: '67vh',
                  background: 'linear-gradient(145deg, #d4af37, #ffd700, #b8860b, #daa520)'
                }}
              >
                <div className="bg-gradient-to-b from-slate-800 via-slate-900 to-slate-800 rounded-3xl p-8 h-full flex flex-col items-center justify-between relative overflow-hidden">
                  
                  {/* Custom Background Layer */}
                  <div 
                    className="absolute inset-0 rounded-3xl"
                    style={getCardBackgroundStyle()}
                  />
                  
                  {/* Background Pattern Overlay */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-amber-400/20 to-transparent" />
                  </div>

                  {/* Background Edit Button */}
                  {isOwnProfile && (
                    <Button
                      size="sm"
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-amber-500/80 hover:bg-amber-600 text-black z-20"
                      onClick={() => setIsEditingBackground(true)}
                    >
                      <Palette className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Profile Section */}
                  <div className="flex flex-col items-center z-10 flex-1 justify-center">
                    
                    {/* Profile Image with Gold Ring */}
                    <div className="relative mb-6">
                      <div className="p-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500">
                        <Avatar className="w-32 h-32 border-4 border-slate-800">
                          <AvatarImage src={profileUser.profileImageUrl || undefined} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-3xl">
                            {profileUser.name?.charAt(0) || profileUser.username.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      
                      {isOwnProfile && (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfileImageSelect}
                            className="hidden"
                            id="profile-image-upload"
                          />
                          <label htmlFor="profile-image-upload">
                            <Button
                              size="sm"
                              className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-600 text-black cursor-pointer"
                              disabled={isUploadingImage}
                              asChild
                            >
                              <span>
                                {isUploadingImage ? (
                                  <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
                                ) : (
                                  <Camera className="h-5 w-5" />
                                )}
                              </span>
                            </Button>
                          </label>
                        </>
                      )}
                    </div>

                    {/* Name and Username */}
                    <div className="text-center mb-4">
                      <h1 className="text-3xl font-bold text-white mb-2">
                        {profileUser.name || profileUser.username}
                      </h1>
                      <p className="text-amber-400 text-lg">@{profileUser.username}</p>
                    </div>

                    {/* Subscription Tier Badge */}
                    <div className="mb-6">
                      <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-6 py-2 rounded-full font-bold text-lg tracking-wider">
                        {getSubscriptionTier(profileUser.subscriptionTier)}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-amber-400 mb-1">
                          <Trophy className="h-5 w-5" />
                          <span className="font-medium">PB</span>
                        </div>
                        <p className="text-xl font-bold text-white">10.12</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-amber-400 mb-1">
                          <MapPin className="h-5 w-5" />
                          <span className="font-medium">Nation</span>
                        </div>
                        <p className="text-xl font-bold text-white">SWE</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-amber-400 mb-1">
                          <Dumbbell className="h-5 w-5" />
                          <span className="font-medium">Workouts</span>
                        </div>
                        <p className="text-xl font-bold text-white">124</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-amber-400 mb-1">
                          <Users className="h-5 w-5" />
                          <span className="font-medium">Friends</span>
                        </div>
                        <p className="text-xl font-bold text-white">{connections.length}</p>
                      </div>
                    </div>

                    {/* Member Since */}
                    {profileUser.createdAt && (
                      <p className="text-gray-300 text-sm mb-4">
                        Member since {format(new Date(profileUser.createdAt), 'yyyy')}
                      </p>
                    )}

                    {/* Bio */}
                    {profileUser.bio && (
                      <p className="text-gray-300 text-sm text-center leading-relaxed max-w-xs">
                        {profileUser.bio}
                      </p>
                    )}
                  </div>

                  {/* Card Number at Bottom */}
                  <div className="text-amber-400 text-xl font-bold z-10">
                    #{profileUser.id.toString().padStart(4, '0')}
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Profile Button for Own Profile */}
            {isOwnProfile && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsEditingProfile(true)}
                  className="border-2 border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-black px-8"
                >
                  <Edit2 className="h-5 w-5 mr-2" />
                  Edit Profile
                </Button>
              </div>
            )}

            {/* Background Customization Dialog */}
            <Dialog open={isEditingBackground} onOpenChange={setIsEditingBackground}>
              <DialogContent className="bg-slate-900 border-slate-700 text-white">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                    <Palette className="h-5 w-5 text-amber-400" />
                    Customize Card Background
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 p-4">
                  {/* Background Type Selection */}
                  <div className="space-y-3">
                    <Label className="text-lg font-medium text-gray-300">Background Type</Label>
                    <div className="flex gap-4">
                      <Button
                        variant={backgroundType === 'color' ? 'default' : 'outline'}
                        onClick={() => setBackgroundType('color')}
                        className={backgroundType === 'color' 
                          ? 'bg-amber-500 text-black hover:bg-amber-600' 
                          : 'border-gray-600 text-gray-400 hover:bg-gray-700'
                        }
                      >
                        <Palette className="h-4 w-4 mr-2" />
                        Solid Color
                      </Button>
                      <Button
                        variant={backgroundType === 'image' ? 'default' : 'outline'}
                        onClick={() => setBackgroundType('image')}
                        className={backgroundType === 'image' 
                          ? 'bg-amber-500 text-black hover:bg-amber-600' 
                          : 'border-gray-600 text-gray-400 hover:bg-gray-700'
                        }
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Custom Image
                      </Button>
                    </div>
                  </div>

                  {/* Color Picker */}
                  {backgroundType === 'color' && (
                    <div className="space-y-3">
                      <Label className="text-md font-medium text-gray-300">Choose Color</Label>
                      <div className="space-y-3">
                        <Input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-full h-12 rounded-lg border-gray-600 bg-slate-800"
                        />
                        <div className="grid grid-cols-6 gap-2">
                          {[
                            '#1e293b', '#334155', '#475569', '#64748b',
                            '#dc2626', '#ea580c', '#d97706', '#65a30d',
                            '#059669', '#0891b2', '#2563eb', '#7c3aed',
                            '#c2410c', '#be123c', '#a21caf', '#7c2d12'
                          ].map((color) => (
                            <button
                              key={color}
                              className="w-8 h-8 rounded-lg border-2 border-gray-600 hover:border-amber-400 transition-colors"
                              style={{ backgroundColor: color }}
                              onClick={() => setBackgroundColor(color)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Image Upload */}
                  {backgroundType === 'image' && (
                    <div className="space-y-3">
                      <Label className="text-md font-medium text-gray-300">Upload Image</Label>
                      <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-amber-400 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="background-upload"
                        />
                        <label htmlFor="background-upload" className="cursor-pointer">
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="h-8 w-8 text-gray-400" />
                            <p className="text-gray-400">Click to upload an image</p>
                            <p className="text-xs text-gray-500">Image will be shown at 20% opacity</p>
                          </div>
                        </label>
                      </div>
                      {backgroundImage && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-400 mb-2">Preview:</p>
                          <div className="w-full h-20 rounded-lg border border-gray-600 bg-cover bg-center opacity-20"
                               style={{ backgroundImage: `url(${backgroundImage})` }} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => setIsEditingBackground(false)}
                      className="flex-1 bg-amber-500 text-black hover:bg-amber-600"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Apply Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditingBackground(false);
                        setBackgroundType('color');
                        setBackgroundColor('#1e293b');
                        setBackgroundImage(null);
                      }}
                      className="border-gray-600 text-gray-400 hover:bg-gray-700"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Profile Image Cropping Dialog */}
            <Dialog open={isEditingProfileImage} onOpenChange={setIsEditingProfileImage}>
              <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                    <Camera className="h-5 w-5 text-amber-400" />
                    Adjust Profile Image
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 p-4">
                  {/* Image Cropper Container */}
                  <div className="relative w-full aspect-square bg-slate-800 rounded-xl overflow-hidden border-2 border-amber-400/20">
                    {tempImageUrl && (
                      <div 
                        className="absolute inset-0 cursor-move"
                        style={{
                          backgroundImage: `url(${tempImageUrl})`,
                          backgroundSize: `${imageScale * 100}%`,
                          backgroundPosition: `${imagePosition.x}px ${imagePosition.y}px`,
                          backgroundRepeat: 'no-repeat'
                        }}
                        onMouseDown={(e) => {
                          const startX = e.clientX - imagePosition.x;
                          const startY = e.clientY - imagePosition.y;
                          
                          const handleMouseMove = (moveE: MouseEvent) => {
                            setImagePosition({
                              x: moveE.clientX - startX,
                              y: moveE.clientY - startY
                            });
                          };
                          
                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };
                          
                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      />
                    )}
                    
                    {/* Circle overlay to show crop area */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div 
                        className="absolute border-4 border-amber-400 rounded-full"
                        style={{
                          top: '10%',
                          left: '10%',
                          right: '10%',
                          bottom: '10%'
                        }}
                      />
                    </div>
                  </div>

                  {/* Scale Control */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-300">Zoom</Label>
                    <div className="relative">
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={imageScale}
                        onChange={(e) => setImageScale(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer 
                                 [&::-webkit-slider-thumb]:appearance-none 
                                 [&::-webkit-slider-thumb]:w-4 
                                 [&::-webkit-slider-thumb]:h-4 
                                 [&::-webkit-slider-thumb]:rounded-full 
                                 [&::-webkit-slider-thumb]:bg-amber-500 
                                 [&::-webkit-slider-thumb]:cursor-pointer
                                 [&::-moz-range-thumb]:w-4 
                                 [&::-moz-range-thumb]:h-4 
                                 [&::-moz-range-thumb]:rounded-full 
                                 [&::-moz-range-thumb]:bg-amber-500 
                                 [&::-moz-range-thumb]:cursor-pointer
                                 [&::-moz-range-thumb]:border-none"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>50%</span>
                      <span>300%</span>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-slate-800 rounded-lg p-3">
                    <p className="text-xs text-gray-400 text-center">
                      Drag the image to position it within the circle. Use the zoom slider to resize.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleProfileImageSave}
                      disabled={isUploadingImage}
                      className="flex-1 bg-amber-500 text-black hover:bg-amber-600"
                    >
                      {isUploadingImage ? (
                        <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      {isUploadingImage ? 'Saving...' : 'Save Image'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditingProfileImage(false);
                        setTempImageUrl(null);
                        setImagePosition({ x: 0, y: 0 });
                        setImageScale(1);
                      }}
                      className="border-gray-600 text-gray-400 hover:bg-gray-700"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Legacy sections - moved below card */}
            <div className="mt-8 space-y-6">
              
              {/* Bio Editing Section */}
              {isOwnProfile && (
                <Card className="bg-blue-900/20 border-blue-800/60">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-lg font-medium text-gray-300">Bio</Label>
                      {!isEditingBio && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingBio(true)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {isEditingBio ? (
                      <div className="space-y-3">
                        <Textarea
                          value={bioText}
                          onChange={(e) => setBioText(e.target.value)}
                          placeholder="Tell others about yourself..."
                          className="bg-blue-900/30 border-blue-700/50 min-h-[100px]"
                          maxLength={500}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" onClick={handleBioSave}>
                            <Check className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setIsEditingBio(false)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-300 leading-relaxed">
                        {profileUser.bio || 'No bio available. Click edit to add one.'}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Profile editing for own profile */}
              {isEditingProfile && isOwnProfile && (
                <Card className="bg-blue-900/20 border-blue-800/60">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Edit Profile</h3>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-300">Display Name</Label>
                          <Input
                            value={profileData.name}
                            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Display Name"
                            className="bg-blue-900/30 border-blue-700/50 mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-300">Username</Label>
                          <Input
                            value={profileData.username}
                            onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                            placeholder="Username"
                            className="bg-blue-900/30 border-blue-700/50 mt-1"
                          />
                        </div>
                        <div className="flex gap-3 pt-2">
                          <Button onClick={handleProfileSave} className="bg-blue-600 hover:bg-blue-700">
                            <Check className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsEditingProfile(false)}
                            className="border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-white"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Additional sections */}
              <div className="grid grid-cols-1 gap-6">
                
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

      {/* Message Panel */}
      <MessagePanel 
        isOpen={isMessagePanelOpen}
        onClose={handleCloseMessagePanel}
        targetUserId={userId}
      />
    </div>
  );
}