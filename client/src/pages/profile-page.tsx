import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';


import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Crown, Plus, X } from 'lucide-react';
import { PremiumPromotion } from '@/components/premium-promotion';
import { Separator } from '@/components/ui/separator';
import { insertUserSchema } from '@shared/schema';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// Profile form schema (for updating user info)
const profileFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  defaultClubId: z.number().nullable().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clubs, setClubs] = useState<any[]>([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(false);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      defaultClubId: user?.defaultClubId || null,
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

  return (
    <div className="flex flex-col h-screen bg-[#010a18] text-white">
      <main className="flex-1 overflow-auto pt-16 pb-6">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1">Your Profile</h2>
            <p className="text-darkGray">Manage your personal information and settings</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="bg-[#010a18] border border-blue-800/60 rounded-xl shadow-sm p-6">
                <div className="flex items-center mb-6">
                  <Avatar className="h-16 w-16 mr-4">
                    <AvatarFallback name={user?.name || ''} className="text-lg" />
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-medium">{user?.name}</h3>
                    <p className="text-darkGray">{user?.username}</p>
                  </div>
                  {user?.isPremium && (
                    <Badge variant="accent" className="ml-auto">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
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
        </div>
      </main>
      

    </div>
  );
}
