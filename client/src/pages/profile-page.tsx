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
import { Crown, LogOut, Edit, Camera } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter } from '@/components/ui/drawer';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
          // If clubs can't be fetched, just set empty array - don't show error
          setClubs([]);
          return;
        }
        
        const data = await response.json();
        setClubs(data);
      } catch (err: any) {
        console.error('Error fetching clubs:', err);
        // Set empty array instead of showing error toast
        setClubs([]);
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
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
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
                            <SelectValue placeholder={
                              isLoadingClubs 
                                ? "Loading clubs..." 
                                : clubs.length === 0 
                                  ? "No Club Association" 
                                  : "Select a club"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clubs.length === 0 ? (
                            <SelectItem value="" disabled>
                              No Club Association
                            </SelectItem>
                          ) : (
                            clubs.map((club) => (
                              <SelectItem key={club.id} value={club.id.toString()}>
                                {club.name}
                              </SelectItem>
                            ))
                          )}
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
            
            {/* Athletes and Coaches Lists */}
            {user?.isCoach && (athletes as any[]).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h4 className="text-sm font-medium mb-2">Your Athletes ({(athletes as any[]).length})</h4>
                <div className="space-y-2">
                  {(athletes as any[]).slice(0, 3).map((athlete: any) => (
                    <div key={athlete.id} className="flex items-center text-sm text-gray-400">
                      • {athlete.name || athlete.username}
                    </div>
                  ))}
                  {(athletes as any[]).length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{(athletes as any[]).length - 3} more athletes
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {(coaches as any[]).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h4 className="text-sm font-medium mb-2">Your Coaches ({(coaches as any[]).length})</h4>
                <div className="space-y-2">
                  {(coaches as any[]).map((coach: any) => (
                    <div key={coach.id} className="flex items-center text-sm text-gray-400">
                      • {coach.name || coach.username}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
    </div>
  );
}