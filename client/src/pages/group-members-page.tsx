import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function GroupMembersPage() {
  const { user: currentUser } = useAuth();
  const { groupId } = useParams<{ groupId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLeaving, setIsLeaving] = useState(false);

  // Fetch group data
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: [`/api/chat/groups/${groupId}`],
    enabled: !!groupId,
  });

  // Fetch group members
  const { data: groupMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: [`/api/chat/groups/${groupId}/members`],
    enabled: !!groupId,
  });

  // Leave group mutation
  const leaveMutation = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error("Not authenticated");
      
      const response = await apiRequest(`/api/chat/groups/${groupId}/leave`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        throw new Error("Failed to leave group");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Left Chat",
        description: "You have successfully left the chat channel.",
      });
      
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ["/api/chat/groups"] });
      queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${groupId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/chat/groups/${groupId}/members`] });
      
      // Navigate back to chat list
      setLocation("/chat");
    },
    onError: (error) => {
      console.error("Error leaving group:", error);
      toast({
        title: "Error",
        description: "Failed to leave chat channel. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLeaveChat = () => {
    if (!currentUser) return;
    
    setIsLeaving(true);
    leaveMutation.mutate();
  };

  if (groupLoading || membersLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading members...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Chat channel not found</p>
          <Button onClick={() => setLocation("/chat")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Chats
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/chats/groups/${groupId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">
              {group.name} Members
            </h1>
            <p className="text-sm text-gray-500">
              {groupMembers.length} member{groupMembers.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {groupMembers.map((member: any, index: number) => (
              <div key={member.id || index}>
                <div className="flex items-center gap-3 py-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={member.user?.profileImageUrl || member.profileImageUrl} 
                      alt={member.user?.name || member.name || 'User'} 
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                      {(member.user?.name || member.name || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">
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
                      {member.userId === currentUser?.id && (
                        <Badge variant="outline" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      @{member.user?.username || member.username || 'unknown'}
                    </p>
                  </div>
                  
                  {member.isOnline && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </div>
                
                {index < groupMembers.length - 1 && (
                  <Separator className="mt-2" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Leave Chat Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-gray-900">Leave Chat</h3>
                <p className="text-sm text-gray-500">
                  You will no longer receive messages from this chat channel. You can rejoin if invited again.
                </p>
              </div>
              
              <Button
                variant="destructive"
                onClick={handleLeaveChat}
                disabled={isLeaving || leaveMutation.isPending}
                className="w-full"
              >
                {isLeaving || leaveMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Leaving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <UserMinus className="h-4 w-4" />
                    Leave Chat
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}