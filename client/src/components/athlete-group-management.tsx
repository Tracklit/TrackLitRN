import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AthleteGroup, User, InsertAthleteGroup } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Users, Edit, Trash, PlusCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AthleteGroupManagementProps {
  coachId: number;
}

export function AthleteGroupManagement({ coachId }: AthleteGroupManagementProps) {
  const { toast } = useToast();
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [isAddingAthlete, setIsAddingAthlete] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<AthleteGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null);
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
  });

  // Fetch athlete groups
  const { data: athleteGroups, isLoading: isLoadingGroups } = useQuery<AthleteGroup[]>({
    queryKey: ['/api/athlete-groups'],
    enabled: !!coachId,
  });

  // Fetch coach's athletes
  const { data: athletes, isLoading: isLoadingAthletes } = useQuery<User[]>({
    queryKey: ['/api/athletes'],
    enabled: !!coachId,
  });

  // Get group members
  const { data: groupMembers, isLoading: isLoadingMembers } = useQuery<{ memberId: number; athlete: User }[]>({
    queryKey: ['/api/athlete-groups', selectedGroup?.id, 'members'],
    enabled: !!selectedGroup?.id,
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: InsertAthleteGroup) => {
      const res = await apiRequest('POST', '/api/athlete-groups', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/athlete-groups'] });
      toast({
        title: 'Group created',
        description: 'Athlete group was created successfully',
      });
      setIsCreatingGroup(false);
      setGroupForm({ name: '', description: '' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create group',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AthleteGroup> }) => {
      const res = await apiRequest('PATCH', `/api/athlete-groups/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/athlete-groups'] });
      toast({
        title: 'Group updated',
        description: 'Athlete group was updated successfully',
      });
      setIsEditingGroup(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update group',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/athlete-groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/athlete-groups'] });
      toast({
        title: 'Group deleted',
        description: 'Athlete group was deleted successfully',
      });
      setSelectedGroup(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete group',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Add athlete to group mutation
  const addAthleteToGroupMutation = useMutation({
    mutationFn: async ({ groupId, athleteId }: { groupId: number; athleteId: number }) => {
      const res = await apiRequest('POST', `/api/athlete-groups/${groupId}/members`, { athleteId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/athlete-groups', selectedGroup?.id, 'members'] });
      toast({
        title: 'Athlete added',
        description: 'Athlete was added to the group successfully',
      });
      setIsAddingAthlete(false);
      setSelectedAthleteId(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to add athlete',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Remove athlete from group mutation
  const removeAthleteFromGroupMutation = useMutation({
    mutationFn: async (memberId: number) => {
      await apiRequest('DELETE', `/api/group-members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/athlete-groups', selectedGroup?.id, 'members'] });
      toast({
        title: 'Athlete removed',
        description: 'Athlete was removed from the group successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove athlete',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle create group
  const handleCreateGroup = () => {
    if (!groupForm.name.trim()) {
      toast({
        title: 'Group name required',
        description: 'Please enter a name for the group',
        variant: 'destructive',
      });
      return;
    }

    createGroupMutation.mutate({
      name: groupForm.name,
      description: groupForm.description,
      coachId,
    });
  };

  // Handle update group
  const handleUpdateGroup = () => {
    if (!selectedGroup) return;
    
    if (!groupForm.name.trim()) {
      toast({
        title: 'Group name required',
        description: 'Please enter a name for the group',
        variant: 'destructive',
      });
      return;
    }

    updateGroupMutation.mutate({
      id: selectedGroup.id,
      data: {
        name: groupForm.name,
        description: groupForm.description,
      },
    });
  };

  // Handle delete group
  const handleDeleteGroup = (id: number) => {
    deleteGroupMutation.mutate(id);
  };

  // Handle add athlete to group
  const handleAddAthleteToGroup = () => {
    if (!selectedGroup || !selectedAthleteId) {
      toast({
        title: 'Selection required',
        description: 'Please select an athlete to add to this group',
        variant: 'destructive',
      });
      return;
    }

    addAthleteToGroupMutation.mutate({
      groupId: selectedGroup.id,
      athleteId: selectedAthleteId,
    });
  };

  // Handle remove athlete from group
  const handleRemoveAthleteFromGroup = (memberId: number) => {
    removeAthleteFromGroupMutation.mutate(memberId);
  };

  // Handle edit group click
  const handleEditGroupClick = (group: AthleteGroup) => {
    setSelectedGroup(group);
    setGroupForm({
      name: group.name,
      description: group.description || '',
    });
    setIsEditingGroup(true);
  };

  // Handle view group details
  const handleViewGroupDetails = (group: AthleteGroup) => {
    setSelectedGroup(group);
  };

  // Filter athletes not already in group
  const getAvailableAthletes = () => {
    if (!athletes || !groupMembers) return [];
    
    const memberIds = groupMembers.map(m => m.athlete.id);
    return athletes.filter(athlete => !memberIds.includes(athlete.id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Athlete Groups</h2>
          <p className="text-muted-foreground">Organize your athletes into training groups</p>
        </div>
        
        <Dialog open={isCreatingGroup} onOpenChange={setIsCreatingGroup}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              New Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Create a new group to organize your athletes
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label htmlFor="groupName" className="text-sm font-medium">
                  Group Name
                </label>
                <Input
                  id="groupName"
                  placeholder="e.g., Sprinters, Distance Runners"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="groupDescription" className="text-sm font-medium">
                  Description (Optional)
                </label>
                <Textarea
                  id="groupDescription"
                  placeholder="Group description or notes"
                  rows={3}
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                />
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsCreatingGroup(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateGroup}
                disabled={createGroupMutation.isPending}
              >
                {createGroupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>Create Group</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column: List of groups */}
        <Card className="h-[500px] flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Your Groups</CardTitle>
            <CardDescription>
              {athleteGroups?.length || 0} group{athleteGroups?.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-auto">
            {isLoadingGroups ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : athleteGroups?.length ? (
              <div className="space-y-2">
                {athleteGroups.map((group) => (
                  <div 
                    key={group.id}
                    onClick={() => handleViewGroupDetails(group)}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedGroup?.id === group.id ? 'bg-primary/10' : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{group.name}</h3>
                        {group.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {group.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditGroupClick(group);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Group</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this group? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteGroup(group.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium mb-1">No groups yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a group to organize your athletes
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreatingGroup(true)}
                  className="gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Create Group
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Right column: Group details */}
        <Card className="h-[500px] flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedGroup ? selectedGroup.name : 'Group Details'}
            </CardTitle>
            <CardDescription>
              {selectedGroup ? 'Manage athletes in this group' : 'Select a group to view details'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-auto">
            {!selectedGroup ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Select a group from the list to see its details
                </p>
              </div>
            ) : isLoadingMembers ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Athletes in this group</h3>
                  
                  <Dialog open={isAddingAthlete} onOpenChange={setIsAddingAthlete}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-1">
                        <UserPlus className="h-3 w-3" />
                        Add Athlete
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Athlete to Group</DialogTitle>
                        <DialogDescription>
                          Add an athlete to the "{selectedGroup.name}" group
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
                          ) : getAvailableAthletes().length > 0 ? (
                            <div className="p-2">
                              {getAvailableAthletes()
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
                                      <p className="text-xs text-muted-foreground">@{athlete.username}</p>
                                    </div>
                                  </div>
                                ))
                              }
                            </div>
                          ) : (
                            <div className="p-4 text-center text-muted-foreground">
                              No available athletes
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                      
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsAddingAthlete(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAddAthleteToGroup}
                          disabled={!selectedAthleteId || addAthleteToGroupMutation.isPending}
                        >
                          {addAthleteToGroupMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>Add to Group</>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="space-y-2">
                  {groupMembers?.length ? (
                    groupMembers.map((member) => (
                      <div 
                        key={member.memberId}
                        className="p-2 flex items-center justify-between rounded-md border bg-background"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{member.athlete.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.athlete.name}</p>
                            <p className="text-xs text-muted-foreground">@{member.athlete.username}</p>
                          </div>
                        </div>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Athlete</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove this athlete from the group?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleRemoveAthleteFromGroup(member.memberId)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                      No athletes in this group yet
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Edit Group Dialog */}
      <Dialog open={isEditingGroup} onOpenChange={setIsEditingGroup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>
              Update group information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label htmlFor="editGroupName" className="text-sm font-medium">
                Group Name
              </label>
              <Input
                id="editGroupName"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="editGroupDescription" className="text-sm font-medium">
                Description (Optional)
              </label>
              <Textarea
                id="editGroupDescription"
                rows={3}
                value={groupForm.description}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsEditingGroup(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateGroup}
              disabled={updateGroupMutation.isPending}
            >
              {updateGroupMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>Save Changes</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}