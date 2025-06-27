import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, ArrowLeft, Upload, UserPlus, X, Users } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import flameLogoPath from "@assets/IMG_4720_1751015409604.png";

const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  isPrivate: z.boolean().default(false),
});

type CreateGroupForm = z.infer<typeof createGroupSchema>;

export default function CreateGroupPage() {
  const [, setLocation] = useLocation();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [inviteUsername, setInviteUsername] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Array<{id: number; name: string; username: string; profileImageUrl?: string}>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch coach's athletes for invitation
  const { data: athletes = [] } = useQuery({
    queryKey: ['/api/coach/athletes'],
    queryFn: async () => {
      const response = await fetch('/api/coach/athletes', {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    }
  });

  const form = useForm<CreateGroupForm>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      isPrivate: false,
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: CreateGroupForm & { image?: File; members?: Array<{id: number; name: string; username: string; profileImageUrl?: string}> }) => {
      const formData = new FormData();
      formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      formData.append('isPrivate', data.isPrivate.toString());
      if (data.image) formData.append('image', data.image);
      if (data.members && data.members.length > 0) {
        formData.append('members', JSON.stringify(data.members));
      }

      const response = await fetch('/api/chat/groups', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to create group');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups'] });
      toast({
        title: "Success",
        description: "Group created successfully!",
      });
      setLocation('/chats');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create group",
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

  const handleAddMemberByUsername = () => {
    if (!inviteUsername.trim()) {
      toast({
        title: "Error",
        description: "Please enter a username",
        variant: "destructive",
      });
      return;
    }

    // Check if already selected
    if (selectedMembers.some(m => m.username === inviteUsername.trim())) {
      toast({
        title: "Error",
        description: "This user is already selected",
        variant: "destructive",
      });
      return;
    }

    // Add placeholder member (will be resolved on server)
    setSelectedMembers(prev => [...prev, {
      id: Date.now(), // Temporary ID
      name: inviteUsername.trim(),
      username: inviteUsername.trim(),
    }]);
    setInviteUsername("");
  };

  const handleAddAthlete = (athlete: any) => {
    if (selectedMembers.some(m => m.id === athlete.id)) {
      toast({
        title: "Error",
        description: "This athlete is already selected",
        variant: "destructive",
      });
      return;
    }

    setSelectedMembers(prev => [...prev, {
      id: athlete.id,
      name: athlete.name,
      username: athlete.username,
      profileImageUrl: athlete.profileImageUrl,
    }]);
  };

  const handleRemoveMember = (memberId: number) => {
    setSelectedMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const onSubmit = (data: CreateGroupForm) => {
    createGroupMutation.mutate({
      ...data,
      image: selectedImage || undefined,
      members: selectedMembers,
    } as any);
  };

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
            <h1 className="text-xl font-bold text-white">Create Group</h1>
            <p className="text-sm text-gray-400">Set up your new chat group</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-24">
        <div className="max-w-md mx-auto space-y-6">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-white/20">
                <AvatarImage src={imagePreview || undefined} />
                <AvatarFallback className="bg-gray-700 text-white text-2xl">
                  {form.watch('name')?.charAt(0)?.toUpperCase() || '?'}
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
              {selectedImage ? 'Change Photo' : 'Add Photo'}
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
                    <FormLabel className="text-white">Description (Optional)</FormLabel>
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

              {/* Member Invitation Section */}
              <Card className="bg-white/5 border-white/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Invite Members
                  </CardTitle>
                  <p className="text-sm text-gray-400">Add members to your group (optional)</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add by Username */}
                  <div className="space-y-2">
                    <label className="text-sm text-white font-medium">Add by Username</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter username"
                        value={inviteUsername}
                        onChange={(e) => setInviteUsername(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddMemberByUsername();
                          }
                        }}
                        className="bg-white/10 border-white/30 text-white placeholder:text-gray-400 focus:border-blue-400"
                      />
                      <Button
                        type="button"
                        onClick={handleAddMemberByUsername}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Athletes List (for coaches) */}
                  {athletes.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm text-white font-medium">Your Athletes</label>
                      <div className="grid gap-2 max-h-40 overflow-y-auto">
                        {athletes.map((athlete: any) => (
                          <div
                            key={athlete.id}
                            className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={athlete.profileImageUrl} />
                                <AvatarFallback className="bg-gray-600 text-white text-xs">
                                  {athlete.name?.charAt(0)?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm text-white font-medium">{athlete.name}</p>
                                <p className="text-xs text-gray-400">@{athlete.username}</p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              onClick={() => handleAddAthlete(athlete)}
                              size="sm"
                              variant="outline"
                              disabled={selectedMembers.some(m => m.id === athlete.id)}
                              className="bg-transparent border-white/30 text-white hover:bg-white/10"
                            >
                              {selectedMembers.some(m => m.id === athlete.id) ? 'Added' : 'Add'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selected Members */}
                  {selectedMembers.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm text-white font-medium">
                        Selected Members ({selectedMembers.length})
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedMembers.map((member) => (
                          <Badge
                            key={member.id}
                            variant="secondary"
                            className="bg-blue-600/20 text-blue-100 border-blue-400/30 px-3 py-1 flex items-center gap-2"
                          >
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={member.profileImageUrl} />
                              <AvatarFallback className="bg-blue-500 text-white text-xs">
                                {member.name?.charAt(0)?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{member.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.id)}
                              className="ml-1 hover:text-red-300 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={createGroupMutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
                >
                  {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}