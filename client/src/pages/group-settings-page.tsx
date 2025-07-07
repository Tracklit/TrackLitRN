import { useState, useRef, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Search, UserPlus, UserMinus, Crown, Shield, User, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import flameLogoPath from "@assets/IMG_3722.png";

const updateGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
  isPrivate: z.boolean().default(false),
});

type UpdateGroupForm = z.infer<typeof updateGroupSchema>;

export default function GroupSettingsPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/chats/groups/:id/settings");
  const groupId = params?.id ? parseInt(params.id) : null;
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['/api/user'],
    enabled: !!groupId,
  });

  // Fetch group data
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['/api/chat/groups', groupId],
    enabled: !!groupId,
  });

  // Fetch group members
  const { data: groupMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['/api/chat/groups', groupId, 'members'],
    enabled: !!groupId,
  });

  // Fetch all users for adding members
  const { data: allUsers = [] } = useQuery({
    queryKey: ['/api/coach/athletes'],
    enabled: !!groupId,
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

  // Filter available users (exclude current members)
  const availableUsers = allUsers.filter(user => 
    !groupMembers.some((member: any) => member.id === user.id) &&
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Image handling
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async (data: UpdateGroupForm) => {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description || '');
      formData.append('isPrivate', data.isPrivate.toString());
      
      if (selectedImage) {
        formData.append('image', selectedImage);
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
      toast({ title: "Group updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups', groupId] });
      setSelectedImage(null);
      setImagePreview(null);
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update group", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('POST', `/api/chat/groups/${groupId}/members`, {
        userId: userId
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Member added successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups', groupId, 'members'] });
      setSearchQuery("");
    },
    onError: () => {
      toast({ 
        title: "Failed to add member", 
        variant: "destructive" 
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('DELETE', `/api/chat/groups/${groupId}/members/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Member removed successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups', groupId, 'members'] });
    },
    onError: () => {
      toast({ 
        title: "Failed to remove member", 
        variant: "destructive" 
      });
    },
  });

  // Update member role mutation
  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: 'member' | 'admin' }) => {
      const response = await apiRequest('PATCH', `/api/chat/groups/${groupId}/members/${userId}/role`, {
        role: role
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Member role updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups', groupId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups', groupId] });
    },
    onError: () => {
      toast({ 
        title: "Failed to update member role", 
        variant: "destructive" 
      });
    },
  });

  // Check if current user is admin
  const isCurrentUserAdmin = group?.admin_ids?.includes(currentUser?.id) || group?.created_by === currentUser?.id;

  if (!match || !groupId) {
    return <div>Group not found</div>;
  }

  if (groupLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading group settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-600/30 flex-shrink-0 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/chats')}
            className="text-white hover:bg-gray-700/50"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Group Settings</h1>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="p-6 space-y-6">
          {/* Group Profile */}
          <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg">
            <div className="relative">
              <img 
                src={imagePreview || group?.avatar_url || flameLogoPath} 
                alt={group?.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              />
              {isCurrentUserAdmin && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">{group?.name}</h3>
              <p className="text-sm text-gray-400">
                {groupMembers.length} member{groupMembers.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Group Settings Form */}
          {isCurrentUserAdmin && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => updateGroupMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Group Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-gray-800/50 border-gray-600 text-white" />
                      </FormControl>
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
                        <Textarea {...field} className="bg-gray-800/50 border-gray-600 text-white" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPrivate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Private Group</FormLabel>
                        <div className="text-sm text-gray-400">
                          Only invited members can join
                        </div>
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
          )}

          {/* Add Members Section */}
          {isCurrentUserAdmin && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Add Members</h3>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800/50 border-gray-600 text-white"
                />
              </div>

              {searchQuery && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableUsers.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-2 bg-gray-800/30 rounded">
                      <span className="text-white">{user.username}</span>
                      <Button
                        size="sm"
                        onClick={() => addMemberMutation.mutate(user.id)}
                        disabled={addMemberMutation.isPending}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {availableUsers.length === 0 && (
                    <div className="text-center text-gray-400 py-4">
                      No users found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Members List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Members ({groupMembers.length})</h3>
            
            {membersLoading ? (
              <div className="text-center text-gray-400">Loading members...</div>
            ) : (
              <div className="space-y-2">
                {groupMembers.map((member: any) => {
                  const isOwner = group?.created_by === member.id;
                  const isAdmin = group?.admin_ids?.includes(member.id);
                  const isCurrentUser = currentUser?.id === member.id;
                  
                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-800/30 rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white font-medium">
                            {member.name?.slice(0, 2).toUpperCase() || member.username?.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {member.name || member.username}
                            {isCurrentUser && <span className="text-gray-400 ml-2">(You)</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            {isOwner && (
                              <Badge variant="secondary" className="bg-yellow-600 text-white">
                                <Crown className="h-3 w-3 mr-1" />
                                Owner
                              </Badge>
                            )}
                            {isAdmin && !isOwner && (
                              <Badge variant="secondary" className="bg-blue-600 text-white">
                                <Shield className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                            {!isAdmin && !isOwner && (
                              <Badge variant="outline" className="border-gray-500 text-gray-300">
                                <User className="h-3 w-3 mr-1" />
                                Member
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {isCurrentUserAdmin && !isCurrentUser && (
                        <div className="flex items-center gap-2">
                          {!isOwner && (
                            <>
                              <Button
                                size="sm"
                                variant={isAdmin ? "destructive" : "secondary"}
                                onClick={() => updateMemberRoleMutation.mutate({
                                  userId: member.id,
                                  role: isAdmin ? 'member' : 'admin'
                                })}
                                disabled={updateMemberRoleMutation.isPending}
                              >
                                {isAdmin ? (
                                  <>
                                    <User className="h-4 w-4 mr-1" />
                                    Remove Admin
                                  </>
                                ) : (
                                  <>
                                    <Shield className="h-4 w-4 mr-1" />
                                    Make Admin
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeMemberMutation.mutate(member.id)}
                                disabled={removeMemberMutation.isPending}
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Danger Zone */}
          {isCurrentUserAdmin && (
            <div className="space-y-4 border-t border-red-800/30 pt-6">
              <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
              
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
                    // TODO: Implement delete group
                    console.log('Delete group');
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Group
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}