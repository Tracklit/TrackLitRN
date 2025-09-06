import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Crown, LogOut, Edit, Camera, UserCheck, Plus, MessageCircle, Check, X, Palette, Upload, Settings } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter } from '@/components/ui/drawer';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Link } from 'wouter';

// Profile form schema
const profileFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  defaultClubId: z.number().nullable().optional(),
});

// Public profile form schema
const publicProfileFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  bio: z.string().max(500, { message: "Bio must be 500 characters or less" }).optional(),
  profileImageUrl: z.string().url().optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PublicProfileFormValues = z.infer<typeof publicProfileFormSchema>;

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [clubs, setClubs] = useState<any[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(false);
  const [isPublicProfileDialogOpen, setIsPublicProfileDialogOpen] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  
  // Public profile card states
  const [isEditingBackground, setIsEditingBackground] = useState(false);
  const [backgroundType, setBackgroundType] = useState<'color' | 'image'>('color');
  const [backgroundColor, setBackgroundColor] = useState('#1e293b');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isEditingProfileImage, setIsEditingProfileImage] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1);

  // Coach functionality queries
  const { data: coachLimits } = useQuery({
    queryKey: ['/api/coach/limits'],
    enabled: !!user?.isCoach,
  });

  const { data: athletes = [] } = useQuery({
    queryKey: ['/api/coach/athletes'],
    enabled: !!user?.isCoach,
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['/api/athlete/coaches'],
  });

  // Coach status toggle mutation
  const updateCoachStatusMutation = useMutation({
    mutationFn: async (isCoach: boolean) => {
      const response = await apiRequest('PATCH', '/api/user/coach-status', { isCoach });
      return response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coach/limits'] });
      toast({
        title: updatedUser.isCoach ? "Coach Status Activated" : "Coach Status Deactivated",
        description: updatedUser.isCoach 
          ? "You can now assign programs to athletes!" 
          : "Coach features have been disabled.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update coach status",
        variant: "destructive",
      });
    },
  });

  const handleCoachToggle = (checked: boolean) => {
    updateCoachStatusMutation.mutate(checked);
  };

  const handleSignOut = () => {
    logoutMutation.mutate();
  };

  // Background customization helpers
  const getBackgroundStyle = () => {
    if (backgroundType === 'image' && backgroundImage) {
      return {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
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

  const handleBackgroundImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setBackgroundImage(e.target?.result as string);
      setBackgroundType('image');
    };
    reader.readAsDataURL(file);
  };

  const getSubscriptionBadgeColor = (tier: string) => {
    switch (tier) {
      case 'star': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'pro': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getCoachLimitInfo = () => {
    if (!user?.isCoach || !coachLimits) return null;
    
    const { currentAthletes, maxAthletes, tier } = coachLimits as any;
    const isUnlimited = maxAthletes === 'unlimited';
    
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">
          Athletes: {currentAthletes} / {isUnlimited ? '∞' : maxAthletes}
        </span>
        <Badge className={getSubscriptionBadgeColor(tier)}>
          {tier.toUpperCase()}
        </Badge>
      </div>
    );
  };
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      defaultClubId: user?.defaultClubId || null,
    },
  });

  // Public profile form
  const publicProfileForm = useForm<PublicProfileFormValues>({
    resolver: zodResolver(publicProfileFormSchema),
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
      profileImageUrl: user?.profileImageUrl || '',
    },
  });

  // Fetch user's clubs
  useEffect(() => {
    if (!user) return;
    
    const fetchClubs = async () => {
      try {
        setIsLoadingClubs(true);
        const response = await fetch('/api/clubs/my', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch clubs: ${response.status}`);
        }
        
        const data = await response.json();
        setClubs(data);
      } catch (err: any) {
        console.error('Error fetching clubs:', err);
        toast({
          title: "Error loading clubs",
          description: err?.message || 'An error occurred while fetching clubs',
          variant: "destructive"
        });
      } finally {
        setIsLoadingClubs(false);
      }
    };
    
    fetchClubs();
  }, [user, toast]);

  async function onSubmit(data: ProfileFormValues) {
    try {
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      toast({
        title: "Profile updated",
        description: "Your changes have been saved",
      });
      
      // Reload the page to reflect the changes
      window.location.reload();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      toast({
        title: "Error updating profile",
        description: err?.message || 'An error occurred',
        variant: "destructive"
      });
    }
  }

  // Handle public profile image selection
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Public profile form submission
  async function onPublicProfileSubmit(data: PublicProfileFormValues) {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('bio', data.bio || '');
      
      if (profileImageFile) {
        formData.append('profileImage', profileImageFile);
      }

      const response = await fetch('/api/user/public-profile', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to update public profile');
      }

      setIsPublicProfileDialogOpen(false);
      setProfileImageFile(null);
      setProfileImagePreview('');
      toast({
        title: "Profile Updated",
        description: "Your public profile has been updated successfully!",
      });
      
      // Reload to reflect changes
      window.location.reload();
    } catch (err: any) {
      console.error('Error updating public profile:', err);
      toast({
        title: "Update Failed",
        description: err?.message || "Failed to update public profile",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#010a18] text-white">
      {/* Header */}
      <div className="pt-20 pb-6">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
          <p className="text-gray-400">Manage your personal information and settings</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-8 space-y-6">
        
        {/* Profile Header Card */}
        <Card className="bg-[#0a1529] border-blue-800/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.profileImageUrl || "/default-avatar.png"} />
                  <AvatarFallback className="text-lg bg-blue-600 text-white">
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{user?.name}</h2>
                  <p className="text-gray-400">@{user?.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  asChild
                >
                  <Link href="/manage-subscription">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Coaching
                  </Link>
                </Button>
                <Drawer open={isPublicProfileDialogOpen} onOpenChange={setIsPublicProfileDialogOpen}>
                  <DrawerTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="bg-slate-900 border-slate-700 max-h-[85vh]">
                    <DrawerHeader>
                      <DrawerTitle>Edit Public Profile</DrawerTitle>
                    </DrawerHeader>
                    <div className="px-4 pb-4 overflow-y-auto">
                      <Form {...publicProfileForm}>
                        <form onSubmit={publicProfileForm.handleSubmit(onPublicProfileSubmit)} className="space-y-4">
                          {/* Profile Image Upload */}
                          <div className="flex flex-col items-center space-y-4">
                            <div className="relative">
                              <Avatar className="h-20 w-20">
                                <AvatarImage 
                                  src={profileImagePreview || user?.profileImageUrl || "/default-avatar.png"} 
                                />
                                <AvatarFallback className="text-lg bg-blue-600 text-white">
                                  {user?.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <label 
                                htmlFor="profile-image-upload" 
                                className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors"
                              >
                                <Camera className="h-3 w-3" />
                              </label>
                              <input
                                id="profile-image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                              />
                            </div>
                          </div>

                          <FormField
                            control={publicProfileForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Display Name</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Your display name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={publicProfileForm.control}
                            name="bio"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bio</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    {...field} 
                                    placeholder="Tell others about yourself..." 
                                    rows={3}
                                    maxLength={500}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </form>
                      </Form>
                    </div>
                    <DrawerFooter>
                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsPublicProfileDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="button"
                          onClick={publicProfileForm.handleSubmit(onPublicProfileSubmit)}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
                {user?.isPremium && (
                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Public Profile Trading Card Preview */}
        <Card className="bg-[#0a1529] border-blue-800/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Your Public Profile
            </CardTitle>
            <p className="text-gray-400 text-sm">This is how others see your profile</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-6">
              {/* Trading Card Container */}
              <div className="relative w-full max-w-sm mx-auto">
                {/* Trading Card */}
                <div 
                  className="relative w-full aspect-[3/4] rounded-xl overflow-hidden border-4 border-amber-400/30 shadow-2xl"
                  style={getBackgroundStyle()}
                >
                  {/* Dark overlay for better text visibility */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
                  
                  {/* Card Content */}
                  <div className="relative h-full p-6 flex flex-col">
                    {/* Subscription Badge */}
                    <div className="flex justify-end mb-4">
                      <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        {user?.subscriptionTier?.toUpperCase() || 'FREE'}
                      </div>
                    </div>

                    {/* Profile Section */}
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                      {/* Profile Image */}
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 border-amber-400 overflow-hidden bg-slate-700 shadow-xl">
                          {user?.profileImageUrl ? (
                            <img 
                              src={user.profileImageUrl} 
                              alt={user.name || 'Profile'} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-amber-400">
                              {user?.name?.charAt(0) || 'U'}
                            </div>
                          )}
                        </div>
                        
                        {/* Edit Profile Image Button */}
                        <button
                          onClick={() => document.getElementById('trading-card-image-upload')?.click()}
                          className="absolute -bottom-1 -right-1 bg-amber-500 text-black rounded-full p-2 hover:bg-amber-600 transition-colors shadow-lg"
                          disabled={isUploadingImage}
                        >
                          {isUploadingImage ? (
                            <div className="animate-spin w-3 h-3 border-2 border-black border-t-transparent rounded-full" />
                          ) : (
                            <Camera className="h-3 w-3" />
                          )}
                        </button>
                        
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfileImageSelect}
                          className="hidden"
                          id="trading-card-image-upload"
                        />
                      </div>

                      {/* Name and Bio */}
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white drop-shadow-lg">
                          {user?.name || 'Your Name'}
                        </h3>
                        {user?.bio && (
                          <p className="text-sm text-gray-200 max-w-48 drop-shadow-lg">
                            {user.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="mt-auto">
                      <div className="text-center">
                        <p className="text-xs text-gray-300 drop-shadow-lg">
                          TrackLit Athlete
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customization Controls */}
                <div className="mt-4 flex justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingBackground(true)}
                    className="border-amber-400/30 text-amber-400 hover:bg-amber-400/10"
                  >
                    <Palette className="h-4 w-4 mr-2" />
                    Customize Background
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Settings Form */}
        <Card className="bg-[#0a1529] border-blue-800/30">
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defaultClubId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Club</FormLabel>
                      <Select
                        value={field.value?.toString() || ""}
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                        disabled={isLoadingClubs}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingClubs ? "Loading clubs..." : "Select a club"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clubs.map((club) => (
                            <SelectItem key={club.id} value={club.id.toString()}>
                              {club.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  Save Changes
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Coach Settings */}
        <Card className="bg-[#0a1529] border-blue-800/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Coach Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Enable coaching features</h3>
                <p className="text-sm text-gray-400">Access coaching tools and athlete management</p>
              </div>
              <Switch
                checked={user?.isCoach || false}
                onCheckedChange={handleCoachToggle}
                disabled={updateCoachStatusMutation.isPending}
              />
            </div>
            {getCoachLimitInfo()}
          </CardContent>
        </Card>

        {/* Sign Out Card */}
        <Card className="bg-[#0a1529] border-red-800/30">
          <CardContent className="p-6">
            <Button 
              onClick={handleSignOut}
              disabled={logoutMutation.isPending}
              variant="destructive" 
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {logoutMutation.isPending ? 'Signing Out...' : 'Sign Out'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Background Customization Dialog */}
      <Dialog open={isEditingBackground} onOpenChange={setIsEditingBackground}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Palette className="h-5 w-5 text-amber-400" />
              Customize Background
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 p-4">
            {/* Background Type Toggle */}
            <div className="flex gap-2">
              <Button
                variant={backgroundType === 'color' ? 'default' : 'outline'}
                onClick={() => setBackgroundType('color')}
                className="flex-1"
              >
                Color
              </Button>
              <Button
                variant={backgroundType === 'image' ? 'default' : 'outline'}
                onClick={() => setBackgroundType('image')}
                className="flex-1"
              >
                Image
              </Button>
            </div>

            {backgroundType === 'color' ? (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-300">Background Color</Label>
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-full h-12 rounded-lg border border-gray-600 bg-transparent cursor-pointer"
                />
                <div className="grid grid-cols-4 gap-2">
                  {['#1e293b', '#7c3aed', '#059669', '#dc2626', '#ea580c', '#0891b2'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setBackgroundColor(color)}
                      className="h-8 rounded border-2 border-transparent hover:border-white"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-300">Background Image</Label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-gray-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBackgroundImageSelect}
                    className="hidden"
                    id="background-image-upload"
                  />
                  <label
                    htmlFor="background-image-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-400">
                      Click to upload background image
                    </span>
                  </label>
                </div>
                {backgroundImage && (
                  <div className="relative">
                    <img
                      src={backgroundImage}
                      alt="Background preview"
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setBackgroundImage(null);
                        setBackgroundType('color');
                      }}
                      className="absolute top-1 right-1"
                    >
                      <X className="h-3 w-3" />
                    </Button>
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
                  setBackgroundColor('#1e293b');
                  setBackgroundImage(null);
                  setBackgroundType('color');
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
    </div>
  );
}