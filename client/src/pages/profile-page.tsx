import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/layout/header';
import { SidebarNavigation } from '@/components/layout/sidebar-navigation';
import { BottomNavigation } from '@/components/layout/bottom-navigation';
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

// Profile form schema (for updating user info)
const profileFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  newEvent: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<string[]>(user?.events || []);
  const [newEvent, setNewEvent] = useState('');
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      newEvent: '',
    },
  });

  function onSubmit(data: ProfileFormValues) {
    // In a real app, this would update the user profile
    console.log(data);
  }
  
  const addEvent = () => {
    if (newEvent.trim() && !events.includes(newEvent.trim())) {
      setEvents([...events, newEvent.trim()]);
      setNewEvent('');
    }
  };
  
  const removeEvent = (eventToRemove: string) => {
    setEvents(events.filter(event => event !== eventToRemove));
  };

  return (
    <div className="flex flex-col h-screen">
      <Header title="Profile" />
      
      <main className="flex-1 overflow-auto pt-16 pb-16 md:pb-0 md:pt-16 md:pl-64">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1">Your Profile</h2>
            <p className="text-darkGray">Manage your personal information and settings</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="bg-white rounded-xl shadow-sm p-6">
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
                    
                    <div>
                      <FormLabel htmlFor="events">Your Events</FormLabel>
                      <FormDescription>
                        Add the track and field events you compete in
                      </FormDescription>
                      
                      <div className="flex flex-wrap gap-2 mt-3 mb-3">
                        {events.map((event) => (
                          <Badge 
                            key={event} 
                            variant="event"
                            className="flex items-center gap-1"
                          >
                            {event}
                            <button 
                              type="button" 
                              onClick={() => removeEvent(event)}
                              className="ml-1 focus:outline-none"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex">
                        <Input 
                          placeholder="Add event (e.g. 100m Sprint)"
                          value={newEvent}
                          onChange={(e) => setNewEvent(e.target.value)}
                          className="rounded-r-none border-r-0"
                        />
                        <Button 
                          type="button" 
                          variant="secondary"
                          onClick={addEvent}
                          className="rounded-l-none"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
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
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold mb-4">Account Settings</h3>
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
      
      <SidebarNavigation />
      <BottomNavigation />
    </div>
  );
}
