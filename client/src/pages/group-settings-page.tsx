import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Camera, ArrowLeft, Upload, Search, UserPlus, Crown, Shield, User, Trash2 } from "lucide-react";
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

export default function GroupSettingsPage() {
  const params = useParams();
  const groupId = parseInt(params.id || '0');
  const [, setLocation] = useLocation();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user');
      return response.json();
    }
  });

  // Fetch group details
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['/api/chat/groups', groupId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/chat/groups/${groupId}`);
      return response.json();
    },
    enabled: !!groupId
  });

  // Fetch coach's athletes for adding to group
  const { data: athletes = [], isLoading: athletesLoading } = useQuery({
    queryKey: ['/api/coach/athletes'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/coach/athletes');
      return response.json();
    },
    enabled: !!currentUser?.isCoach
  });

  // Fetch group members with details
  const { data: groupMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['/api/chat/groups', groupId, 'members'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/chat/groups/${groupId}/members`);
      return response.json();
    },
    enabled: !!groupId
  });

  const form = useForm<UpdateGroupForm>({
    resolver: zodResolver(updateGroupSchema),
    defaultValues: {
      name: group?.name || "",
      description: group?.description || "",
      isPrivate: group?.is_private || false,
    },
    values: group ? {
      name: group.name,
      description: group.description || "",
      isPrivate: group.is_private,
    } : undefined
  });

  const updateGroupMutation = useMutation({
    mutationFn: async (data: UpdateGroupForm & { image?: File }) => {
      const formData = new FormData();
      formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      formData.append('isPrivate', data.isPrivate.toString());
      if (data.image) formData.append('image', data.image);

      const response = await fetch(`/api/chat/groups/${groupId}`, {
        method: 'PATCH',
        body: formData,
        credentials: 'include',  // Include session cookies for authentication
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update group: ${response.status} ${errorText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      console.log('Group update successful, invalidating cache...');
      
      // Force complete cache reset and refetch
      queryClient.resetQueries({ queryKey: ['/api/chat/groups'] });
      queryClient.resetQueries({ queryKey: ['/api/chat/groups', groupId] });
      queryClient.resetQueries({ queryKey: ['/api/chat/groups', groupId, 'members'] });
      queryClient.resetQueries({ queryKey: ['/api/chat/groups', groupId, 'messages'] });
      queryClient.resetQueries({ queryKey: ['/api/conversations'] });
      
      toast({
        title: "Success",
        description: "Group updated successfully!",
      });
      
      // Navigate back to main chat page after cache reset
      setTimeout(() => {
        setLocation('/chat');
      }, 300);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update group",
        variant: "destructive",
      });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('POST', `/api/chat/groups/${groupId}/members`, {
        userId
      });
      
      if (!response.ok) {
        throw new Error('Failed to add member');
      }
      
      return response.json();
    },
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups', groupId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups'] });
      
      // Create notification for added user
      createNotificationMutation.mutate({
        userId,
        type: 'group_added',
        title: 'Added to Group',
        message: `You've been added to the group "${group?.name}"`,
        actionUrl: `/chats`,
        relatedId: groupId,
        relatedType: 'group'
      });
      
      toast({
        title: "Success",
        description: "Member added successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add member",
        variant: "destructive",
      });
    },
  });

  const createNotificationMutation = useMutation({
    mutationFn: async (notificationData: {
      userId: number;
      type: string;
      title: string;
      message: string;
      actionUrl: string;
      relatedId: number;
      relatedType: string;
    }) => {
      const response = await apiRequest('POST', '/api/notifications', notificationData);
      return response.json();
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('DELETE', `/api/chat/groups/${groupId}/members/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to remove member');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups', groupId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups'] });
      toast({
        title: "Success",
        description: "Member removed successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
    },
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Image must be smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: UpdateGroupForm) => {
    updateGroupMutation.mutate({
      ...data,
      image: selectedImage || undefined,
    });
  };

  // Filter athletes not already in group
  const availableAthletes = athletes.filter((athlete: any) => 
    !groupMembers.some((member: any) => member.user_id === athlete.id) &&
    athlete.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if current user is admin
  const isAdmin = currentUser && group && 
    (group.creatorId === currentUser.id || 
     (Array.isArray(group.adminIds) && group.adminIds.includes(currentUser.id)));

  // Show loading while data is being fetched
  if (groupLoading || !currentUser || !group) {
    return (
      <div className="fixed inset-0 flex flex-col w-screen h-screen" style={{
        background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 70%, #4a148c 90%, #7b1fa2 100%)'
      }}>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 flex flex-col w-screen h-screen" style={{
        background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 70%, #4a148c 90%, #7b1fa2 100%)'
      }}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-gray-300 mb-6">You don't have permission to manage this group.</p>
            <Link href="/chats">
              <Button className="bg-blue-600 hover:bg-blue-700">Back to Chats</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (groupLoading) {
    return (
      <div className="fixed inset-0 flex flex-col w-screen h-screen" style={{
        background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 70%, #4a148c 90%, #7b1fa2 100%)'
      }}>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col w-screen h-screen" style={{
      background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 50%, #16213e 70%, #4a148c 90%, #7b1fa2 100%)'
    }}>
      {/* Header */}
      <div className="p-4 border-b border-gray-600/30 flex-shrink-0 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/chats" className="text-white hover:text-gray-300 transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          
          <div className="flex-shrink-0">
            <img 
              src={flameLogoPath} 
              alt="TrackLit Logo" 
              className="h-10 w-10"
            />
          </div>
          
          <div>
            <h1 className="text-xl font-bold text-white">Group Settings</h1>
            <p className="text-sm text-gray-400">Manage {group?.name}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="max-w-2xl mx-auto space-y-8">
          
          {/* Group Profile Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h2 className="text-lg font-semibold text-white mb-6">Group Profile</h2>
            
            {/* Profile Image Section */}
            <div className="flex flex-col items-center space-y-4 mb-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-white/20">
                  <AvatarImage src={imagePreview || (group as any)?.image || group?.avatar_url} />
                  <AvatarFallback className="bg-gray-700 text-white text-2xl">
                    {group?.name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="bg-transparent border-white/30 text-white hover:bg-white/10"
              >
                <Upload className="h-4 w-4 mr-2" />
                {selectedImage ? 'Change Photo' : 'Update Photo'}
              </Button>
            </div>

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Group Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter group name"
                          className="bg-white/10 border-white/30 text-white placeholder:text-gray-400 focus:border-blue-400"
                        />
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
                      <FormLabel className="text-white">Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="What's this group about?"
                          rows={3}
                          className="bg-white/10 border-white/30 text-white placeholder:text-gray-400 focus:border-blue-400 resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPrivate"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0 p-4 border border-white/20 rounded-lg bg-white/5">
                      <div className="space-y-0.5">
                        <FormLabel className="text-white font-medium">Private Group</FormLabel>
                        <p className="text-sm text-gray-400">
                          Only invited members can join
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

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={updateGroupMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
                  >
                    {updateGroupMutation.isPending ? 'Updating...' : 'Update Group'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          {/* Members Management Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h2 className="text-lg font-semibold text-white mb-6">Members ({groupMembers.length})</h2>
            
            {/* Current Members */}
            <div className="space-y-3 mb-6">
              {groupMembers.map((member: any) => (
                <div key={member.user_id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.profile_image_url} />
                      <AvatarFallback className="bg-blue-500 text-white text-sm">
                        {member.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white font-medium">{member.name}</p>
                      <p className="text-gray-400 text-sm">@{member.username}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {member.role === 'creator' && (
                      <Badge variant="secondary" className="bg-yellow-600 text-white">
                        <Crown className="h-3 w-3 mr-1" />
                        Creator
                      </Badge>
                    )}
                    {member.role === 'admin' && (
                      <Badge variant="secondary" className="bg-purple-600 text-white">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {member.role === 'member' && member.user_id !== currentUser?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMemberMutation.mutate(member.user_id)}
                        disabled={removeMemberMutation.isPending}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Separator className="bg-white/20 my-6" />

            {/* Add Members Section - Only for coaches */}
            {currentUser?.isCoach && (
              <div>
                <h3 className="text-white font-medium mb-4">Add Athletes</h3>
                
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search your athletes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/10 border-white/30 text-white placeholder:text-gray-400 focus:border-blue-400"
                  />
                </div>

                {/* Available Athletes */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableAthletes.map((athlete: any) => (
                    <div key={athlete.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={athlete.profile_image_url} />
                          <AvatarFallback className="bg-green-500 text-white text-sm">
                            {athlete.name?.charAt(0)?.toUpperCase() || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white font-medium">{athlete.name}</p>
                          <p className="text-gray-400 text-sm">@{athlete.username}</p>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addMemberMutation.mutate(athlete.id)}
                        disabled={addMemberMutation.isPending}
                        className="bg-transparent border-white/30 text-white hover:bg-white/10"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  ))}
                  
                  {availableAthletes.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      {searchQuery ? 'No athletes found matching your search.' : 'All your athletes are already in this group.'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}