import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useKeyboard } from "@/contexts/keyboard-context";

export default function CreateGroupPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { setKeyboardVisible } = useKeyboard();
  const [, setLocation] = useLocation();

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupPrivacy, setNewGroupPrivacy] = useState<"public" | "private">("private");

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: { name: string; description: string; isPrivate: boolean }) => {
      const response = await apiRequest("POST", "/api/groups", groupData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Group created",
        description: "Your new group has been created successfully",
      });
      setLocation("/groups");
    },
    onError: (error) => {
      console.error('Failed to create group:', error);
      toast({
        title: "Failed to create group",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    
    createGroupMutation.mutate({
      name: newGroupName.trim(),
      description: newGroupDescription.trim(),
      isPrivate: newGroupPrivacy === "private",
    });
  };

  const handleBack = () => {
    setLocation("/groups");
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="px-4 py-6 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold text-white">Create New Group</h1>
        </div>
      </div>

      {/* Form */}
      <div className="p-6 max-w-md mx-auto">
        <div className="space-y-6">
          <div>
            <Label htmlFor="groupName" className="text-white text-sm font-medium">
              Group Name *
            </Label>
            <Input
              id="groupName"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onFocus={() => setKeyboardVisible(true)}
              onBlur={() => setKeyboardVisible(false)}
              placeholder="Enter group name"
              className="mt-2 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              maxLength={50}
            />
            <p className="text-xs text-gray-400 mt-1">
              {newGroupName.length}/50 characters
            </p>
          </div>

          <div>
            <Label htmlFor="groupDescription" className="text-white text-sm font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="groupDescription"
              value={newGroupDescription}
              onChange={(e) => setNewGroupDescription(e.target.value)}
              onFocus={() => setKeyboardVisible(true)}
              onBlur={() => setKeyboardVisible(false)}
              placeholder="What's this group about?"
              className="mt-2 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              rows={4}
              maxLength={200}
            />
            <p className="text-xs text-gray-400 mt-1">
              {newGroupDescription.length}/200 characters
            </p>
          </div>

          <div>
            <Label htmlFor="groupPrivacy" className="text-white text-sm font-medium">
              Privacy
            </Label>
            <Select 
              value={newGroupPrivacy} 
              onValueChange={(value: "public" | "private") => setNewGroupPrivacy(value)}
            >
              <SelectTrigger className="mt-2 bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="private" className="text-white">
                  <div>
                    <div className="font-medium">Private</div>
                    <div className="text-xs text-gray-400">Only invited members can join</div>
                  </div>
                </SelectItem>
                <SelectItem value="public" className="text-white">
                  <div>
                    <div className="font-medium">Public</div>
                    <div className="text-xs text-gray-400">Anyone can find and join</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || createGroupMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              size="lg"
            >
              {createGroupMutation.isPending ? "Creating..." : "Create Group"}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleBack}
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}