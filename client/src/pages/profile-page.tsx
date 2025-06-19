import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';


import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Crown, Plus, X, Users, Target, Edit, Camera, Check, LogOut } from 'lucide-react';
import { PremiumPromotion } from '@/components/premium-promotion';
import { Separator } from '@/components/ui/separator';
import { insertUserSchema } from '@shared/schema';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter } from '@/components/ui/drawer';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Profile form schema (for updating user info)
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
    
    const { currentAthletes, maxAthletes, tier } = coachLimits;
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
    <div className="min-h-screen bg-[#010a18] text-white pt-16 pb-20">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1">Your Profile</h2>
            <p className="text-darkGray">Manage your personal information and settings</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="bg-[#010a18] border border-blue-800/60 rounded-xl shadow-sm p-6">
                <div className="flex items-center mb-6">
                  <Avatar className="h-16 w-16 mr-4">
                    <AvatarImage src={user?.profileImageUrl || "/default-avatar.png"} />
                    <AvatarFallback name={user?.name || ''} className="text-lg" />
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-medium">{user?.name}</h3>
                    <p className="text-darkGray">{user?.username}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Drawer open={isPublicProfileDialogOpen} onOpenChange={setIsPublicProfileDialogOpen}>
                      <DrawerTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Public Profile
                        </Button>
                      </DrawerTrigger>
                      <DrawerContent className="bg-slate-900 border-slate-700 max-h-[85vh]">
                        <DrawerHeader className="text-left">
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
                                    <AvatarFallback name={user?.name || ''} className="text-lg" />
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
                                <p className="text-xs text-gray-400 text-center">
                                  Click the camera icon to upload a new profile image
                                </p>
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
                      <Badge variant="accent">
                        <Crown className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Separator className="my-6" />
                
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
                            <Input {...field} />
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
                          <FormDescription>
                            Set your default club to automatically open it when visiting the clubs page
                          </FormDescription>
                          <Select 
                            value={field.value?.toString() || "none"}
                            onValueChange={(value) => {
                              field.onChange(value && value !== "none" ? parseInt(value) : null);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a default club" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No default club</SelectItem>
                              {isLoadingClubs ? (
                                <SelectItem value="loading" disabled>Loading clubs...</SelectItem>
                              ) : clubs.length === 0 ? (
                                <SelectItem value="empty" disabled>You haven't joined any clubs yet</SelectItem>
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
                    
                    <Button type="submit" className="bg-primary text-white">
                      Save Changes
                    </Button>
                  </form>
                </Form>
                
                {/* Coach Section */}
                <Separator className="my-6" />
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <Crown className="w-5 h-5" />
                        Coach Status
                      </h3>
                      <p className="text-sm text-gray-400">
                        Enable coach features to assign programs to athletes
                      </p>
                    </div>
                    <Switch
                      checked={user?.isCoach || false}
                      onCheckedChange={handleCoachToggle}
                      disabled={updateCoachStatusMutation.isPending}
                    />
                  </div>
                  
                  {user?.isCoach && coachLimits && (
                    <div className="bg-[#0f1419] p-4 rounded-lg border border-gray-700">
                      {getCoachLimitInfo()}
                    </div>
                  )}
                </div>

                {/* Coach Dashboard */}
                {user?.isCoach && (
                  <div className="space-y-4 mt-6">
                    <h4 className="text-md font-medium text-white flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Coach Dashboard
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#0f1419] p-4 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-gray-300">Your Athletes</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{athletes.length}</div>
                        {coachLimits && (
                          <p className="text-xs text-gray-400 mt-1">
                            {coachLimits.maxAthletes === 'unlimited' 
                              ? 'Unlimited capacity' 
                              : `${coachLimits.maxAthletes - coachLimits.currentAthletes} slots remaining`
                            }
                          </p>
                        )}
                      </div>

                      <div className="bg-[#0f1419] p-4 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm font-medium text-gray-300">Subscription Tier</span>
                        </div>
                        <div className="text-2xl font-bold text-white capitalize">
                          {user?.subscriptionTier || 'free'}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {user?.subscriptionTier === 'free' && 'Upgrade for more athletes'}
                          {user?.subscriptionTier === 'pro' && 'Up to 20 athletes'}
                          {user?.subscriptionTier === 'star' && 'Unlimited athletes'}
                        </p>
                      </div>
                    </div>

                    {athletes.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-300">Current Athletes</h5>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {athletes.map((athlete: any) => (
                            <div key={athlete.id} className="flex items-center justify-between bg-[#0f1419] p-3 rounded border border-gray-700">
                              <div>
                                <div className="font-medium text-white">{athlete.name}</div>
                                <div className="text-sm text-gray-400">@{athlete.username}</div>
                              </div>
                              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                                Active
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Athlete Dashboard */}
                {coaches.length > 0 && (
                  <div className="space-y-4 mt-6">
                    <h4 className="text-md font-medium text-white flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      Your Coaches
                    </h4>
                    <div className="space-y-2">
                      {coaches.map((coach: any) => (
                        <div key={coach.id} className="flex items-center justify-between bg-[#0f1419] p-3 rounded border border-gray-700">
                          <div>
                            <div className="font-medium text-white flex items-center gap-2">
                              {coach.name}
                              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                                COACH
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-400">@{coach.username}</div>
                          </div>
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                            Training
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-6">
              {!user?.isPremium && (
                <PremiumPromotion 
                  variant="sidebar"
                  onUpgrade={() => {
                    // Premium upgrade logic would go here
                  }}
                />
              )}
              
              <div className="bg-[#010a18] border border-blue-800/60 rounded-xl shadow-sm p-6">
                <h3 className="font-semibold mb-4 text-white">Account Settings</h3>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Notification Preferences
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Privacy Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-500">
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sign Out Section - Always Visible at Bottom */}
          <div className="mt-8 mb-8">
            <div className="bg-[#010a18] border border-blue-800/60 rounded-xl shadow-sm p-6">
              <Button 
                onClick={handleSignOut}
                disabled={logoutMutation.isPending}
                variant="destructive" 
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {logoutMutation.isPending ? 'Signing Out...' : 'Sign Out'}
              </Button>
            </div>
          </div>
        </div>
    </div>
  );
}
