import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Plus, MoreVertical, Pencil, Trash2, UserPlus, UserMinus, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ListSkeleton } from "@/components/list-skeleton";
import { Badge } from "@/components/ui/badge";

interface AthleteGroup {
  id: number;
  coachId: number;
  name: string;
  description: string | null;
  createdAt: string;
  athletes?: any[];
}

interface Athlete {
  id: number;
  name: string;
  username: string;
  profileImageUrl: string | null;
  specialties?: string[];
}

export default function AthleteGroupsPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<AthleteGroup | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDescription, setEditGroupDescription] = useState("");

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"],
  });

  // Fetch athlete groups
  const { data: groups = [], isLoading: loadingGroups } = useQuery<AthleteGroup[]>({
    queryKey: ["/api/athlete-groups"],
    enabled: !!currentUser?.isCoach,
  });

  // Fetch coach's athletes for adding to groups
  const { data: coachAthletes = [] } = useQuery<Athlete[]>({
    queryKey: ["/api/coach/athletes"],
    enabled: !!currentUser?.isCoach,
  });

  // Fetch group details when expanded
  const { data: expandedGroupDetails } = useQuery({
    queryKey: ["/api/athlete-groups", expandedGroupId],
    enabled: !!expandedGroupId,
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await apiRequest("POST", "/api/athlete-groups", {
        ...data,
        coachId: currentUser?.id,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create group");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/athlete-groups"] });
      toast({
        title: "Group created",
        description: "Your athlete group has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      setNewGroupName("");
      setNewGroupDescription("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create group",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async (data: { id: number; name: string; description: string }) => {
      const response = await apiRequest("PATCH", `/api/athlete-groups/${data.id}`, {
        name: data.name,
        description: data.description,
      });
      if (!response.ok) {
        throw new Error("Failed to update group");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/athlete-groups"] });
      toast({
        title: "Group updated",
        description: "Your athlete group has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      setSelectedGroup(null);
    },
    onError: () => {
      toast({
        title: "Failed to update group",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const response = await apiRequest("DELETE", `/api/athlete-groups/${groupId}`);
      if (!response.ok) {
        throw new Error("Failed to delete group");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/athlete-groups"] });
      toast({
        title: "Group deleted",
        description: "The athlete group has been deleted.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedGroup(null);
      if (expandedGroupId === selectedGroup?.id) {
        setExpandedGroupId(null);
      }
    },
    onError: () => {
      toast({
        title: "Failed to delete group",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  // Add member to group mutation
  const addMemberMutation = useMutation({
    mutationFn: async (data: { groupId: number; athleteId: number }) => {
      const response = await apiRequest("POST", `/api/athlete-groups/${data.groupId}/members`, {
        athleteId: data.athleteId,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to add athlete to group");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/athlete-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/athlete-groups", selectedGroup?.id] });
      toast({
        title: "Athlete added",
        description: "The athlete has been added to the group.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add athlete",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Remove member from group mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      const response = await apiRequest("DELETE", `/api/group-members/${memberId}`);
      if (!response.ok) {
        throw new Error("Failed to remove athlete from group");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/athlete-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/athlete-groups", expandedGroupId] });
      toast({
        title: "Athlete removed",
        description: "The athlete has been removed from the group.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to remove athlete",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a group name",
        variant: "destructive",
      });
      return;
    }
    createGroupMutation.mutate({
      name: newGroupName.trim(),
      description: newGroupDescription.trim(),
    });
  };

  const handleEditGroup = () => {
    if (!selectedGroup || !editGroupName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a group name",
        variant: "destructive",
      });
      return;
    }
    updateGroupMutation.mutate({
      id: selectedGroup.id,
      name: editGroupName.trim(),
      description: editGroupDescription.trim(),
    });
  };

  const handleDeleteGroup = () => {
    if (selectedGroup) {
      deleteGroupMutation.mutate(selectedGroup.id);
    }
  };

  const openEditDialog = (group: AthleteGroup) => {
    setSelectedGroup(group);
    setEditGroupName(group.name);
    setEditGroupDescription(group.description || "");
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (group: AthleteGroup) => {
    setSelectedGroup(group);
    setIsDeleteDialogOpen(true);
  };

  const openAddMemberDialog = (group: AthleteGroup) => {
    setSelectedGroup(group);
    setIsAddMemberDialogOpen(true);
  };

  const toggleGroupExpanded = (groupId: number) => {
    setExpandedGroupId(expandedGroupId === groupId ? null : groupId);
  };

  // Get athletes not in the selected group
  const getAvailableAthletes = () => {
    if (!selectedGroup || !expandedGroupDetails) return coachAthletes;
    const memberIds = expandedGroupDetails.athletes?.map((a: any) => a.id) || [];
    return coachAthletes.filter((athlete) => !memberIds.includes(athlete.id));
  };

  // Show message if user is not a coach
  if (!currentUser?.isCoach) {
    return (
      <div className="min-h-screen pt-20 bg-[#010a18] text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">Athlete Groups</h1>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Users className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">Coach Access Required</h3>
                <p className="text-gray-400 text-center">
                  You need to be a coach to manage athlete groups. Update your profile to become a coach.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-[#010a18] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Athlete Groups</h1>
              <p className="text-gray-400 mt-1">Organize your athletes into training groups</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  New Group
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700 text-white">
                <DialogHeader>
                  <DialogTitle>Create Athlete Group</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Create a new group to organize your athletes for training.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Group Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Sprint Squad, Distance Team"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the purpose of this group..."
                      value={newGroupDescription}
                      onChange={(e) => setNewGroupDescription(e.target.value)}
                      className="bg-gray-700 border-gray-600"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="border-gray-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateGroup}
                    disabled={createGroupMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Groups List */}
          {loadingGroups ? (
            <ListSkeleton count={3} />
          ) : groups.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-16 w-16 text-gray-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-white">No Groups Yet</h3>
                <p className="text-gray-400 text-center mb-6 max-w-md">
                  Create your first athlete group to organize your athletes by training focus, skill level, or any other criteria.
                </p>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Group
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <Card key={group.id} className="bg-gray-800 border-gray-700 overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-750"
                    onClick={() => toggleGroupExpanded(group.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{group.name}</h3>
                        {group.description && (
                          <p className="text-sm text-gray-400 line-clamp-1">{group.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              openAddMemberDialog(group);
                            }}
                            className="text-white hover:bg-gray-700"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Athlete
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(group);
                            }}
                            className="text-white hover:bg-gray-700"
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Group
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteDialog(group);
                            }}
                            className="text-red-400 hover:bg-gray-700 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Group
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <ChevronRight
                        className={`h-5 w-5 text-gray-400 transition-transform ${
                          expandedGroupId === group.id ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expanded Group Details */}
                  {expandedGroupId === group.id && (
                    <div className="border-t border-gray-700 p-4 bg-gray-850">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-300">
                          Athletes ({expandedGroupDetails?.athletes?.length || 0})
                        </h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAddMemberDialog(group)}
                          className="border-gray-600 text-xs"
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>

                      {!expandedGroupDetails?.athletes?.length ? (
                        <div className="text-center py-6 text-gray-400">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No athletes in this group yet</p>
                          <Button
                            size="sm"
                            variant="link"
                            onClick={() => openAddMemberDialog(group)}
                            className="text-primary mt-2"
                          >
                            Add your first athlete
                          </Button>
                        </div>
                      ) : (
                        <div className="grid gap-2">
                          {expandedGroupDetails.athletes.map((athlete: any) => (
                            <div
                              key={athlete.id}
                              className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={athlete.profileImageUrl || undefined} />
                                  <AvatarFallback className="bg-gray-600">
                                    {athlete.name?.charAt(0) || athlete.username?.charAt(0) || "A"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-white">{athlete.name}</p>
                                  <p className="text-xs text-gray-400">@{athlete.username}</p>
                                </div>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-gray-400 hover:text-red-400"
                                onClick={() => {
                                  // Find the membership ID for this athlete
                                  // For now, we'll use the athlete ID since we need to fetch member IDs
                                  const memberData = expandedGroupDetails.athletes.find(
                                    (a: any) => a.id === athlete.id
                                  );
                                  if (memberData?.memberId) {
                                    removeMemberMutation.mutate(memberData.memberId);
                                  }
                                }}
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Group Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update the group details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Group Name</Label>
              <Input
                id="edit-name"
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editGroupDescription}
                onChange={(e) => setEditGroupDescription(e.target.value)}
                className="bg-gray-700 border-gray-600"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditGroup}
              disabled={updateGroupMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {updateGroupMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-800 border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "{selectedGroup?.name}"? This action cannot be undone.
              All athletes will be removed from the group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 border-gray-600 hover:bg-gray-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteGroupMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Athlete to {selectedGroup?.name}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Select an athlete from your coaching roster to add to this group.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {getAvailableAthletes().length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No available athletes to add</p>
                <p className="text-xs mt-1">
                  All your athletes are already in this group, or you haven't added any athletes yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {getAvailableAthletes().map((athlete) => (
                  <div
                    key={athlete.id}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={athlete.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-gray-600">
                          {athlete.name?.charAt(0) || athlete.username?.charAt(0) || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">{athlete.name}</p>
                        <p className="text-xs text-gray-400">@{athlete.username}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (selectedGroup) {
                          addMemberMutation.mutate({
                            groupId: selectedGroup.id,
                            athleteId: athlete.id,
                          });
                        }
                      }}
                      disabled={addMemberMutation.isPending}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
