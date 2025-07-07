import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Camera, Upload, Search, UserPlus, Crown, Shield, User, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import flameLogoPath from "@assets/IMG_4720_1751015409604.png";

const updateGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  isPrivate: z.boolean().default(false),
});

type UpdateGroupForm = z.infer<typeof updateGroupSchema>;

interface GroupSettingsModalProps {
  groupId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function GroupSettingsModal({ groupId, isOpen, onClose }: GroupSettingsModalProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['/api/user'],
    enabled: isOpen,
  });

  // Fetch group data
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['/api/chat/groups', groupId],
    enabled: isOpen && !!groupId,
  });

  // Fetch group members
  const { data: groupMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['/api/chat/groups', groupId, 'members'],
    enabled: isOpen && !!groupId,
  });

  // Fetch all users for adding members
  const { data: allUsers = [] } = useQuery({
    queryKey: ['/api/coach/athletes'],
    enabled: isOpen,
  });

  const form = useForm<UpdateGroupForm>({
    resolver: zodResolver(updateGroupSchema),
    defaultValues: {
      name: group?.name || "",
      description: group?.description || "",
      isPrivate: group?.is_private || false,
    },
  });

  // Update form when group data loads
  useEffect(() => {
    if (group) {
      form.reset({
        name: group.name,
        description: group.description || "",
        isPrivate: group.is_private || false,
      });
    }
  }, [group, form]);

  // Check if current user is admin
  const isAdmin = currentUser && group && (
    group.creatorId === currentUser.id || 
    group.adminIds?.includes(currentUser.id)
  );

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async (data: UpdateGroupForm & { image?: File }) => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description || '');
      formData.append('isPrivate', data.isPrivate.toString());
      
      if (data.image) {
        formData.append('image', data.image);
      }

      const response = await fetch(`/api/chat/groups/${groupId}`, {
        method: 'PATCH',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to update group');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Group updated successfully",
      });
      queryClient.removeQueries({ queryKey: ['/api/chat/groups'] });
      queryClient.refetchQueries({ queryKey: ['/api/chat/groups', groupId] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to update group",
        variant: "destructive",
      });
    },
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest(`/api/chat/groups/${groupId}/members`, {
        method: 'POST',
        body: { userId },
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Member added successfully",
      });
      queryClient.refetchQueries({ queryKey: ['/api/chat/groups', groupId, 'members'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add member",
        variant: "destructive",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest(`/api/chat/groups/${groupId}/members/${userId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Member removed successfully",
      });
      queryClient.refetchQueries({ queryKey: ['/api/chat/groups', groupId, 'members'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: UpdateGroupForm) => {
    updateGroupMutation.mutate({
      ...data,
      image: selectedImage || undefined,
    });
  };

  const handleAddMember = (userId: number) => {
    addMemberMutation.mutate(userId);
  };

  const handleRemoveMember = (userId: number) => {
    removeMemberMutation.mutate(userId);
  };

  const availableUsers = allUsers.filter(user => 
    !groupMembers.some((member: any) => member.userId === user.id) &&
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (groupLoading || membersLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!group) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <div className="flex items-center justify-center p-8">
            <p className="text-gray-600">Group not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isAdmin) {
    // Show members view for non-admins
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{group.name} Members</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-6">
            <div className="space-y-4">
              {groupMembers.map((member: any, index: number) => (
                <div key={member.id || index} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={member.user?.profileImageUrl || member.profileImageUrl} 
                      alt={member.user?.name || member.name || 'User'} 
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                      {(member.user?.name || member.name || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {member.user?.name || member.name || 'Unknown User'}
                      </p>
                      {member.role === 'creator' && (
                        <Badge variant="secondary" className="text-xs">
                          Creator
                        </Badge>
                      )}
                      {member.role === 'admin' && (
                        <Badge variant="outline" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      @{member.user?.username || member.username || 'unknown'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Group Settings</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
          <div className="space-y-6">
            {/* Group Profile */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="relative">
                <img 
                  src={imagePreview || group.avatar_url || flameLogoPath} 
                  alt={group.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                <p className="text-sm text-gray-500">
                  {groupMembers.length} member{groupMembers.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Group Settings Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter group name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Enter group description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPrivate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Private Group
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Only invited members can join this group
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={updateGroupMutation.isPending}
                >
                  {updateGroupMutation.isPending ? "Updating..." : "Update Group"}
                </Button>
              </form>
            </Form>

            <Separator />

            {/* Members Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Members</h3>
              
              {/* Add Member */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users to add..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                {searchQuery && availableUsers.length > 0 && (
                  <div className="border rounded-lg p-2 max-h-48 overflow-y-auto">
                    {availableUsers.slice(0, 5).map(user => (
                      <div key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.profileImageUrl} alt={user.name} />
                            <AvatarFallback className="text-xs">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{user.name}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddMember(user.id)}
                          disabled={addMemberMutation.isPending}
                        >
                          <UserPlus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Members */}
              <div className="space-y-2">
                {groupMembers.map((member: any, index: number) => (
                  <div key={member.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={member.user?.profileImageUrl || member.profileImageUrl} 
                          alt={member.user?.name || member.name || 'User'} 
                        />
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-medium text-xs">
                          {(member.user?.name || member.name || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {member.user?.name || member.name || 'Unknown User'}
                          </p>
                          {member.role === 'creator' && (
                            <Badge variant="secondary" className="text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              Creator
                            </Badge>
                          )}
                          {member.role === 'admin' && (
                            <Badge variant="outline" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          @{member.user?.username || member.username || 'unknown'}
                        </p>
                      </div>
                    </div>
                    
                    {member.role !== 'creator' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveMember(member.userId)}
                        disabled={removeMemberMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}