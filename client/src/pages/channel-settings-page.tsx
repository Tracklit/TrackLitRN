import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Trash2, UserPlus, Users, Crown, Shield, User, LogOut } from "lucide-react";

interface ChannelMember {
  id: number;
  name: string;
  username: string;
  profile_image_url?: string;
  role: 'admin' | 'member';
}

interface ChannelData {
  id: number;
  name: string;
  description?: string;
  avatar_url?: string;
  is_private: boolean;
  created_by: number;
  admin_ids: number[];
  channel_type: 'group' | 'direct';
}

export default function ChannelSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [channelName, setChannelName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const channelId = parseInt(id || "0");

  // Fetch channel data
  const { data: channel, isLoading: channelLoading } = useQuery({
    queryKey: [`/api/chat/groups/${channelId}`],
    enabled: !!channelId,
  });

  // Fetch channel members
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: [`/api/chat/groups/${channelId}/members`],
    enabled: !!channelId,
  });

  // Fetch connected users for inviting
  const { data: connectedUsers } = useQuery({
    queryKey: ['/api/users/connected'],
  });

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['/api/user'],
  });

  const isCurrentUserAdmin = channel && currentUser && 
    (channel.created_by === currentUser.id || channel.admin_ids?.includes(currentUser.id));
  
  console.log('Debug admin status:', {
    channel: channel ? { id: channel.id, created_by: channel.created_by, admin_ids: channel.admin_ids } : null,
    currentUser: currentUser ? { id: currentUser.id } : null,
    isCurrentUserAdmin,
    created_by_match: channel && currentUser ? channel.created_by === currentUser.id : false,
    admin_ids_includes: channel && currentUser && channel.admin_ids ? channel.admin_ids.includes(currentUser.id) : false
  });

  // Initialize form data when channel loads
  useEffect(() => {
    if (channel) {
      setChannelName(channel.name || "");
      setChannelDescription(channel.description || "");
      setIsPrivate(channel.is_private || false);
    }
  }, [channel]);

  // Update channel mutation
  const updateChannelMutation = useMutation({
    mutationFn: async (data: { name?: string; description?: string; is_private?: boolean; image?: File }) => {
      console.log('Updating channel with data:', data);
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      if (data.is_private !== undefined) formData.append('is_private', data.is_private.toString());
      if (data.image) formData.append('image', data.image);

      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, ':', value);
      }

      const response = await fetch(`/api/chat/groups/${channelId}`, {
        method: 'PATCH',
        body: formData,
        credentials: 'include',
      });
      
      console.log('Raw response:', response);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }
      
      const result = await response.json();
      console.log('Channel update response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Channel update success:', data);
      toast({ title: "Channel updated successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${channelId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups'] });
    },
    onError: (error) => {
      console.error('Channel update error:', error);
      toast({ title: "Failed to update channel", variant: "destructive" });
    },
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest(`/api/chat/groups/${channelId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId }),
      });
    },
    onSuccess: () => {
      toast({ title: "Member added successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${channelId}/members`] });
    },
    onError: (error) => {
      console.error('Add member error:', error);
      toast({ title: "Failed to add member", variant: "destructive" });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      console.log('Removing member:', userId, 'from channel:', channelId);
      const response = await apiRequest(`/api/chat/groups/${channelId}/members/${userId}`, {
        method: 'DELETE',
      });
      console.log('Remove member response:', response);
      return response;
    },
    onSuccess: (data) => {
      console.log('Member removal success:', data);
      toast({ title: "Member removed successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${channelId}/members`] });
      queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${channelId}`] });
    },
    onError: (error) => {
      console.error('Member removal error:', error);
      toast({ title: "Failed to remove member", variant: "destructive" });
    },
  });

  // Update member role mutation
  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: 'admin' | 'member' }) => {
      return apiRequest(`/api/chat/groups/${channelId}/members/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
    },
    onSuccess: () => {
      toast({ title: "Member role updated successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${channelId}/members`] });
      queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${channelId}`] });
    },
    onError: () => {
      toast({ title: "Failed to update member role", variant: "destructive" });
    },
  });

  // Delete channel mutation
  const deleteChannelMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/chat/groups/${channelId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({ title: "Channel deleted successfully" });
      setLocation('/chats');
    },
    onError: () => {
      toast({ title: "Failed to delete channel", variant: "destructive" });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Image file selected:', e.target.files);
    const file = e.target.files?.[0];
    if (file) {
      console.log('Setting selected file:', file.name, file.size, file.type);
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        console.log('Image preview set, data URL length:', result?.length);
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = () => {
    console.log('Saving channel changes:', {
      name: channelName,
      description: channelDescription,
      is_private: isPrivate,
      hasImage: !!selectedFile,
      selectedFile,
      isCurrentUserAdmin
    });
    updateChannelMutation.mutate({
      name: channelName,
      description: channelDescription,
      is_private: isPrivate,
      image: selectedFile || undefined,
    });
  };

  // Handle immediate privacy toggle save
  const handlePrivacyToggle = (checked: boolean) => {
    console.log('Privacy toggle changed:', checked);
    setIsPrivate(checked);
    // Auto-save privacy changes immediately
    updateChannelMutation.mutate({
      name: channelName,
      description: channelDescription,
      is_private: checked,
    });
  };

  if (!channelId) {
    return <div>Channel not found</div>;
  }

  if (channelLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div>Loading channel settings...</div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div>Channel not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-600/30 flex-shrink-0 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation(`/chats/channels/${channelId}`)}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Channel Settings</h1>
        </div>
      </div>

      <ScrollArea className="flex-1 h-[calc(100vh-73px)]">
        <div className="p-6 space-y-8 max-w-2xl mx-auto">
          {/* Channel Profile */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Channel Profile</h2>
            
            <div className="p-4 bg-slate-800 rounded-lg space-y-4">
              {/* Centered Profile Image */}
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={imagePreview || channel.avatar_url} />
                    <AvatarFallback className="bg-blue-600 text-white text-2xl">
                      {channel.name?.charAt(0)?.toUpperCase() || "C"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-blue-600 hover:bg-blue-700 text-white border-2 border-white"
                    onClick={() => {
                      console.log('Camera button clicked, isAdmin:', isCurrentUserAdmin);
                      fileInputRef.current?.click();
                    }}
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
              </div>
              
              {/* Name and Description Fields */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="channelName">Channel Name</Label>
                  <Input
                    id="channelName"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    disabled={false}
                  />
                </div>
                
                <div>
                  <Label htmlFor="channelDescription">Description</Label>
                  <Input
                    id="channelDescription"
                    value={channelDescription}
                    onChange={(e) => setChannelDescription(e.target.value)}
                    placeholder="Optional description"
                    className="bg-slate-700 border-slate-600 text-white"
                    disabled={false}
                  />
                </div>
              </div>
            </div>

            {/* Privacy Settings - Always show for debugging */}
            <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
              <div>
                <Label htmlFor="private-channel" className="text-white">Private Channel</Label>
                <p className="text-sm text-gray-400">Only invited members can join</p>
                <p className="text-xs text-yellow-400">Debug: Admin={isCurrentUserAdmin ? 'Yes' : 'No'}</p>
              </div>
              <Switch
                id="private-channel"
                checked={isPrivate}
                onCheckedChange={handlePrivacyToggle}
                disabled={false}
                className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-600"
              />
            </div>

            <Button 
              onClick={handleSaveChanges}
              disabled={updateChannelMutation.isPending}
              className="w-full"
            >
              {updateChannelMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          {/* Members Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Members</h2>
              {isCurrentUserAdmin && (
                <Select onValueChange={(value) => addMemberMutation.mutate(parseInt(value))}>
                  <SelectTrigger className="w-40 bg-slate-800 border-slate-600">
                    <SelectValue placeholder="Add member" />
                  </SelectTrigger>
                  <SelectContent>
                    {connectedUsers?.filter(user => 
                      !members?.some((member: any) => member.user_id === user.id)
                    ).map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {membersLoading ? (
              <div className="text-center py-8">Loading members...</div>
            ) : (
              <div className="space-y-2">
                {members?.map((member: any) => (
                  <div key={member.user_id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.profile_image_url} />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {member.name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-400">@{member.username}</p>
                      </div>
                      {channel.created_by === member.user_id && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                      {channel.admin_ids?.includes(member.user_id) && channel.created_by !== member.user_id && (
                        <Shield className="h-4 w-4 text-blue-500" />
                      )}
                    </div>

                    {isCurrentUserAdmin && member.user_id !== channel.created_by && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={channel.admin_ids?.includes(member.user_id) ? 'admin' : 'member'}
                          onValueChange={(role) => updateMemberRoleMutation.mutate({ 
                            userId: member.user_id, 
                            role: role as 'admin' | 'member' 
                          })}
                        >
                          <SelectTrigger className="w-24 bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            <SelectItem value="member" className="text-white hover:bg-slate-600">Member</SelectItem>
                            <SelectItem value="admin" className="text-white hover:bg-slate-600">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            console.log('Removing member:', member.user_id, 'from channel:', channelId);
                            removeMemberMutation.mutate(member.user_id);
                          }}
                          disabled={removeMemberMutation.isPending}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Show remove button for current user if they're not the owner */}
                    {!isCurrentUserAdmin && member.user_id === currentUser?.id && member.user_id !== channel.created_by && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          console.log('Leaving channel');
                          removeMemberMutation.mutate(member.user_id);
                        }}
                        disabled={removeMemberMutation.isPending}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
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
                  if (confirm('Are you sure you want to delete this channel? This action cannot be undone.')) {
                    deleteChannelMutation.mutate();
                  }
                }}
                disabled={deleteChannelMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteChannelMutation.isPending ? 'Deleting...' : 'Delete Channel'}
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}