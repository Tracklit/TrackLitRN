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
import { Crown, Edit, Camera, Check, X, Eye, EyeOff } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Profile form schemas
const profileFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  defaultClubId: z.number().nullable().optional(),
});

const publicProfileFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  bio: z.string().max(500, { message: "Bio must be 500 characters or less" }).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PublicProfileFormValues = z.infer<typeof publicProfileFormSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [clubs, setClubs] = useState<any[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(false);
  const [isPublicProfileDialogOpen, setIsPublicProfileDialogOpen] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(user?.bio || '');

  // Coach functionality queries
  const { data: coachLimits } = useQuery({
    queryKey: ['/api/coach/limits'],
    enabled: !!user?.isCoach,
  });

  const { data: athletes = [] } = useQuery({
    queryKey: ['/api/coach/athletes'],
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['/api/athlete/coaches'],
  });

  // Forms
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      defaultClubId: user?.defaultClubId || null,
    },
  });

  const publicProfileForm = useForm<PublicProfileFormValues>({
    resolver: zodResolver(publicProfileFormSchema),
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
    },
  });

  // Fetch user's clubs
  useEffect(() => {
    if (!user) return;
    
    const fetchClubs = async () => {
      setIsLoadingClubs(true);
      try {
        const response = await fetch('/api/clubs/my', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const clubsData = await response.json();
          setClubs(clubsData);
        }
      } catch (err: any) {
        toast({
          title: "Error fetching clubs",
          description: err?.message || 'An error occurred while fetching clubs',
          variant: "destructive"
        });
      } finally {
        setIsLoadingClubs(false);
      }
    };
    
    fetchClubs();
  }, [user, toast]);

  // Handle bio save
  const handleBioSave = async () => {
    try {
      const response = await fetch('/api/user/public-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user?.name, bio: bioText }),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to update bio');

      setIsEditingBio(false);
      toast({
        title: "Bio Updated",
        description: "Your bio has been updated successfully!",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update bio",
        variant: "destructive",
      });
    }
  };

  // Handle profile image change
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

      if (!response.ok) throw new Error('Failed to update public profile');

      setIsPublicProfileDialogOpen(false);
      setProfileImageFile(null);
      setProfileImagePreview('');
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err?.message || "Failed to update profile",
        variant: "destructive",
      });
    }
  }

  // Account settings form submission
  async function onSubmit(data: ProfileFormValues) {
    try {
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to update profile');
      
      toast({
        title: "Profile updated",
        description: "Your changes have been saved",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    } catch (err: any) {
      toast({
        title: "Error updating profile",
        description: err?.message || 'An error occurred',
        variant: "destructive"
      });
    }
  }

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

  // Mutation to update privacy status
  const updatePrivacyStatusMutation = useMutation({
    mutationFn: async (isPrivate: boolean) => {
      const response = await apiRequest('PATCH', '/api/user/privacy-status', { isPrivate });
      return response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: updatedUser.isPrivate ? "Account Made Private" : "Account Made Public",
        description: updatedUser.isPrivate 
          ? "Other users cannot find you unless you connect with them first." 
          : "Other users can now find and connect with you.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update privacy status",
        variant: "destructive",
      });
    },
  });

  const handleCoachToggle = (checked: boolean) => {
    updateCoachStatusMutation.mutate(checked);
  };

  const handlePrivacyToggle = (checked: boolean) => {
    updatePrivacyStatusMutation.mutate(checked);
  };

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
                      <AvatarImage src={user?.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl">
                        {user?.name?.charAt(0) || user?.username?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <Dialog open={isPublicProfileDialogOpen} onOpenChange={setIsPublicProfileDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#010a18] border border-blue-800/60 text-white max-w-md">
                        <DialogHeader>
                          <DialogTitle>Edit Profile Image</DialogTitle>
                        </DialogHeader>
                        
                        <Form {...publicProfileForm}>
                          <form onSubmit={publicProfileForm.handleSubmit(onPublicProfileSubmit)} className="space-y-4">
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

                            <div className="flex justify-end space-x-2 pt-4">
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsPublicProfileDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button type="submit">Save Changes</Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h1 className="text-2xl font-bold">{user?.name || user?.username}</h1>
                          {user?.isCoach && (
                            <Badge className="bg-amber-600 hover:bg-amber-700">Coach</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>@{user?.username}</span>
                          <span>•</span>
                          <span>Member since {new Date(user?.createdAt || '').toLocaleDateString('en-US', { 
                            month: 'long', 
                            year: 'numeric' 
                          })}</span>
                        </div>
                        
                        {user?.subscriptionTier && user.subscriptionTier !== 'free' && (
                          <Badge 
                            className={`mt-2 ${
                              user.subscriptionTier === 'star' 
                                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' 
                                : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            }`}
                          >
                            <Crown className="h-3 w-3 mr-1" />
                            {user.subscriptionTier.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Bio Section */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold flex items-center justify-between">
                        About
                        {!isEditingBio && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={() => setIsEditingBio(true)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </h3>
                      
                      {isEditingBio ? (
                        <div className="space-y-2">
                          <Textarea
                            value={bioText}
                            onChange={(e) => setBioText(e.target.value)}
                            placeholder="Tell others about yourself..."
                            rows={3}
                            maxLength={500}
                            className="bg-blue-900/30 border-blue-700/50"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleBioSave}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                setIsEditingBio(false);
                                setBioText(user?.bio || '');
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-300 leading-relaxed">
                          {user?.bio || "No bio added yet."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Latest Workout */}
            <Card className="bg-blue-900/20 border-blue-800/60 mb-6">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg">Latest Workout</CardTitle>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Edit className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm">No recent workouts found.</p>
              </CardContent>
            </Card>

            {/* Upcoming Meets */}
            <Card className="bg-blue-900/20 border-blue-800/60 mb-6">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg">Upcoming Meets</CardTitle>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Edit className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm">No upcoming meets.</p>
              </CardContent>
            </Card>

            {/* Recent Meets */}
            <Card className="bg-blue-900/20 border-blue-800/60 mb-6">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg">Recent Meets</CardTitle>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Edit className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm">No recent meets.</p>
              </CardContent>
            </Card>

            {/* Coach Features */}
            {user?.isCoach && (
              <Card className="bg-blue-900/20 border-blue-800/60 mb-6">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg">My Programs</CardTitle>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Edit className="h-3 w-3" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">No programs created yet.</p>
                </CardContent>
              </Card>
            )}

            {/* Connections */}
            <Card className="bg-blue-900/20 border-blue-800/60 mb-6">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg">Connections</CardTitle>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Edit className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-blue-800/30 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">0</div>
                    <div className="text-sm text-gray-400">Friends</div>
                  </div>
                  <div className="p-3 bg-blue-800/30 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">0</div>
                    <div className="text-sm text-gray-400">Coaches</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card className="bg-blue-900/20 border-blue-800/60 mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Account Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-blue-900/30 border-blue-700/50" />
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
                              <Input {...field} className="bg-blue-900/30 border-blue-700/50" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="defaultClubId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Club</FormLabel>
                          <Select
                            value={field.value ? field.value.toString() : ""}
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-blue-900/30 border-blue-700/50">
                                <SelectValue placeholder="Select a club" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[#010a18] border-blue-800/60">
                              <SelectItem value="null">No Default Club</SelectItem>
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

                    {/* Coach Toggle */}
                    <div className="flex items-center justify-between p-4 bg-blue-800/30 rounded-lg">
                      <div>
                        <p className="font-medium">Coach Mode</p>
                        <p className="text-sm text-gray-400">Enable coaching features</p>
                      </div>
                      <Switch
                        checked={user?.isCoach || false}
                        onCheckedChange={handleCoachToggle}
                        disabled={updateCoachStatusMutation.isPending}
                      />
                    </div>

                    {/* Private Account Toggle */}
                    <div className="flex items-center justify-between p-4 bg-blue-800/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        {user?.isPrivate ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <div>
                          <p className="font-medium">Private Account</p>
                          <p className="text-sm text-gray-400">Hide your profile from other users</p>
                        </div>
                      </div>
                      <Switch
                        checked={user?.isPrivate || false}
                        onCheckedChange={handlePrivacyToggle}
                        disabled={updatePrivacyStatusMutation.isPending}
                      />
                    </div>
                    
                    <Button type="submit" className="w-full">
                      Save Changes
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

          </div>
        </main>
      </div>
    </div>
  );
}