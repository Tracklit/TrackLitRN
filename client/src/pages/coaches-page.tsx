import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Coach, User } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/layout/header';
import { SidebarNavigation } from '@/components/layout/sidebar-navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, Clock, UserPlus, Users, Award, MoreHorizontal, Trash, Check, X, UsersRound } from 'lucide-react';
import { AthleteGroupManagement } from '@/components/athlete-group-management';

export default function CoachesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('myCoaches');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingCoach, setIsAddingCoach] = useState(false);
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null);

  // Fetch coach relationships
  const { data: coachRelationships, isLoading: isLoadingCoaches } = useQuery<Coach[]>({
    queryKey: ['/api/coaches'],
  });

  // Fetch athletes (for coaches)
  const { data: athletes, isLoading: isLoadingAthletes } = useQuery<User[]>({
    queryKey: ['/api/athletes'],
    enabled: user?.role === 'coach' || user?.role === 'both',
  });

  // Add coach relationship mutation
  const addCoachMutation = useMutation({
    mutationFn: async (data: { userId: number; athleteId: number }) => {
      const res = await apiRequest('POST', '/api/coaches', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coaches'] });
      toast({
        title: 'Coach request sent',
        description: 'The athlete will need to accept your request',
      });
      setIsAddingCoach(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add coach',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update coach relationship status mutation
  const updateCoachStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest('PATCH', `/api/coaches/${id}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coaches'] });
      toast({
        title: 'Status updated',
        description: 'Coach relationship status has been updated',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete coach relationship mutation
  const deleteCoachMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/coaches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coaches'] });
      toast({
        title: 'Relationship removed',
        description: 'Coach relationship has been removed',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove relationship',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Filter coach relationships based on active tab
  const filteredCoaches = coachRelationships?.filter((coach) => {
    if (activeTab === 'myCoaches') {
      return coach.athleteId === user?.id;
    } else {
      return coach.userId === user?.id;
    }
  }) ?? [];

  // Handle adding a new coach
  const handleAddCoach = () => {
    if (!selectedAthleteId) {
      toast({
        title: 'Error',
        description: 'Please select an athlete',
        variant: 'destructive',
      });
      return;
    }

    addCoachMutation.mutate({
      userId: user!.id,
      athleteId: selectedAthleteId,
    });
  };

  // Handle updating coach status
  const handleUpdateStatus = (id: number, status: string) => {
    updateCoachStatusMutation.mutate({ id, status });
  };

  // Handle deleting coach relationship
  const handleDeleteCoach = (id: number) => {
    deleteCoachMutation.mutate(id);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'accepted':
        return <Badge className="flex items-center gap-1 bg-green-500 text-white"><CheckCircle className="h-3 w-3" /> Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      default:
        return null;
    }
  };

  // Format date safely
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header title="Coaches" />
      
      <main className="flex-1 overflow-auto pt-16 pb-16 md:pb-0 md:pt-16 md:pl-64">
        <div className="container mx-auto px-4 py-6">
          {/* Page Heading */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Coach Relationships</h1>
            
            {(user?.role === 'coach' || user?.role === 'both') && (
              <Dialog open={isAddingCoach} onOpenChange={setIsAddingCoach}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Athlete
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Athlete</DialogTitle>
                    <DialogDescription>
                      Add an athlete to your coaching roster. They will need to accept your request.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="my-4">
                    <Input
                      placeholder="Search for athlete..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="mb-2"
                    />
                    
                    <ScrollArea className="h-64 border rounded-md">
                      {isLoadingAthletes ? (
                        <div className="flex justify-center p-4">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : athletes && athletes.length > 0 ? (
                        <div className="p-2">
                          {athletes
                            .filter(athlete => athlete.id !== user?.id)
                            .filter(athlete => 
                              athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              athlete.username.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map(athlete => (
                              <div 
                                key={athlete.id}
                                onClick={() => setSelectedAthleteId(athlete.id)}
                                className={`p-2 flex items-center gap-3 rounded-md cursor-pointer transition-colors ${
                                  selectedAthleteId === athlete.id ? 'bg-primary/10' : 'hover:bg-muted'
                                }`}
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{athlete.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="font-medium">{athlete.name}</p>
                                  <p className="text-xs text-darkGray">@{athlete.username}</p>
                                </div>
                                {selectedAthleteId === athlete.id && (
                                  <Check className="h-5 w-5 text-primary" />
                                )}
                              </div>
                            ))
                          }
                        </div>
                      ) : (
                        <div className="p-4 text-center text-darkGray">
                          No athletes found
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddingCoach(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddCoach}
                      disabled={!selectedAthleteId || addCoachMutation.isPending}
                    >
                      {addCoachMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>Add Athlete</>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {/* Tabs */}
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="w-full"
          >
            <TabsList className="grid w-full md:w-[600px] grid-cols-3 mb-6">
              <TabsTrigger value="myCoaches" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                My Coaches
              </TabsTrigger>
              <TabsTrigger value="myAthletes" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                My Athletes
              </TabsTrigger>
              <TabsTrigger value="groups" className="flex items-center gap-2">
                <UsersRound className="h-4 w-4" />
                Groups
              </TabsTrigger>
            </TabsList>
            
            {/* My Coaches Tab */}
            <TabsContent value="myCoaches">
              {isLoadingCoaches ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredCoaches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCoaches.map((coach) => (
                    <Card key={coach.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">Coach Relationship</CardTitle>
                          {getStatusBadge(coach.status)}
                        </div>
                        <CardDescription>Coach ID: {coach.userId}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>C</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">Coach Name</p>
                            <p className="text-xs text-darkGray">Added on {formatDate(coach.createdAt)}</p>
                          </div>
                        </div>
                        
                        {coach.notes && (
                          <div className="p-2 bg-muted rounded-md text-sm mb-3">
                            <p>{coach.notes}</p>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-between pt-0">
                        {coach.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => handleUpdateStatus(coach.id, 'accepted')}
                              disabled={updateCoachStatusMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleUpdateStatus(coach.id, 'rejected')}
                              disabled={updateCoachStatusMutation.isPending}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                        
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-40 p-0">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  className="w-full justify-start text-red-500 rounded-none hover:bg-red-50"
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Remove
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Coach</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove this coach relationship? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteCoach(coach.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </PopoverContent>
                        </Popover>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-muted/50 rounded-lg p-8 text-center">
                  <h3 className="font-medium text-xl mb-2">No Coaches Yet</h3>
                  <p className="text-darkGray mb-6">You don't have any coach relationships yet.</p>
                </div>
              )}
            </TabsContent>
            
            {/* My Athletes Tab */}
            <TabsContent value="myAthletes">
              {isLoadingCoaches ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredCoaches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCoaches.map((coach) => (
                    <Card key={coach.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">Athlete</CardTitle>
                          {getStatusBadge(coach.status)}
                        </div>
                        <CardDescription>Athlete ID: {coach.athleteId}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>A</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">Athlete Name</p>
                            <p className="text-xs text-darkGray">Added on {formatDate(coach.createdAt)}</p>
                          </div>
                        </div>
                        
                        {coach.notes && (
                          <div className="p-2 bg-muted rounded-md text-sm mb-3">
                            <p>{coach.notes}</p>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-end pt-0">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-40 p-0">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  className="w-full justify-start text-red-500 rounded-none hover:bg-red-50"
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Remove
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Athlete</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove this athlete relationship? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteCoach(coach.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </PopoverContent>
                        </Popover>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-muted/50 rounded-lg p-8 text-center">
                  <h3 className="font-medium text-xl mb-2">No Athletes Yet</h3>
                  <p className="text-darkGray mb-6">You don't have any athletes in your roster yet.</p>
                  
                  {(user?.role === 'coach' || user?.role === 'both') && (
                    <Button 
                      onClick={() => setIsAddingCoach(true)} 
                      variant="secondary"
                      className="gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Add Athlete
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
            
            {/* Groups Tab */}
            <TabsContent value="groups">
              {user?.role === 'coach' || user?.role === 'both' ? (
                <AthleteGroupManagement coachId={user.id} />
              ) : (
                <div className="bg-muted/50 rounded-lg p-8 text-center">
                  <h3 className="font-medium text-xl mb-2">Coach Access Only</h3>
                  <p className="text-darkGray mb-6">
                    Only coaches can create and manage athlete groups.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <SidebarNavigation />
    </div>
  );
}