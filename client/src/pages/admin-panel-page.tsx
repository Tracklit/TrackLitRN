import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Search, Shield, Bell, UserPlus, Ban, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  subscriptionTier: string;
  isCoach: boolean;
  spikes: number;
  createdAt: string;
  isBlocked?: boolean;
}

export default function AdminPanelPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [spikeAmount, setSpikeAmount] = useState('');
  const [newSubscription, setNewSubscription] = useState('');

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <Card className="bg-gray-900 border-gray-700 max-w-md w-full">
          <CardContent className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-400">You don't have permission to access the admin panel.</p>
            <Button 
              onClick={() => setLocation('/')} 
              className="mt-4 bg-purple-600 hover:bg-purple-700"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/admin/users', searchTerm],
    queryFn: () => apiRequest('GET', `/api/admin/users?search=${encodeURIComponent(searchTerm)}`).then(res => res.json()),
    enabled: searchTerm.length >= 2
  });

  const addSpikesMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: number; amount: number }) => {
      const response = await apiRequest('POST', `/api/admin/users/${userId}/spikes`, { amount });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setSpikeAmount('');
      toast({
        title: 'Spikes Added',
        description: 'Spikes have been successfully added to the user account.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add spikes',
        variant: 'destructive',
      });
    },
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, tier }: { userId: number; tier: string }) => {
      const response = await apiRequest('POST', `/api/admin/users/${userId}/subscription`, { tier });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setNewSubscription('');
      toast({
        title: 'Subscription Updated',
        description: 'User subscription has been successfully updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update subscription',
        variant: 'destructive',
      });
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: async ({ userId, block }: { userId: number; block: boolean }) => {
      const response = await apiRequest('POST', `/api/admin/users/${userId}/${block ? 'block' : 'unblock'}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'User Updated',
        description: 'User access has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user access',
        variant: 'destructive',
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('DELETE', `/api/admin/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'User Deleted',
        description: 'User has been permanently deleted.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    },
  });

  const broadcastNotificationMutation = useMutation({
    mutationFn: async ({ title, message }: { title: string; message: string }) => {
      const response = await apiRequest('POST', '/api/admin/broadcast', { title, message });
      return response.json();
    },
    onSuccess: () => {
      setNotificationTitle('');
      setNotificationMessage('');
      toast({
        title: 'Notification Sent',
        description: 'Broadcast notification has been sent to all users.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send notification',
        variant: 'destructive',
      });
    },
  });

  const getSubscriptionBadge = (subscription: string = 'free') => {
    const colors = {
      free: 'bg-gray-500',
      pro: 'bg-blue-500',
      star: 'bg-amber-500',
    };
    return (
      <Badge className={`${colors[subscription as keyof typeof colors]} text-white`}>
        {subscription.toUpperCase()}
      </Badge>
    );
  };

  const handleAddSpikes = () => {
    if (!selectedUser || !spikeAmount) return;
    const amount = parseInt(spikeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }
    addSpikesMutation.mutate({ userId: selectedUser.id, amount });
  };

  const handleUpdateSubscription = () => {
    if (!selectedUser || !newSubscription) return;
    updateSubscriptionMutation.mutate({ userId: selectedUser.id, tier: newSubscription });
  };

  const handleBroadcastNotification = () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both title and message",
        variant: "destructive",
      });
      return;
    }
    broadcastNotificationMutation.mutate({ 
      title: notificationTitle.trim(), 
      message: notificationMessage.trim() 
    });
  };

  return (
    <div className="fixed inset-0 bg-black text-white overflow-auto z-50">
      <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation('/')}
            className="border-gray-600 text-white hover:bg-gray-800"
          >
            Back to Dashboard
          </Button>
        </div>

        {/* User Search */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>User Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Search by username, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
              <Button
                disabled={searchTerm.length < 2}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Search
              </Button>
            </div>

            {isLoading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
              </div>
            )}

            {users.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users.map((user: User) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{user.name || user.username}</span>
                        {getSubscriptionBadge(user.subscriptionTier)}
                        {user.isCoach && (
                          <Badge className="bg-green-600 text-white">COACH</Badge>
                        )}
                        {user.isBlocked && (
                          <Badge className="bg-red-600 text-white">BLOCKED</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        @{user.username} • {user.email} • {user.spikes} spikes
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUser(user)}
                      className="border-gray-600 text-white hover:bg-gray-700"
                    >
                      Manage
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Management */}
        {selectedUser && (
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle>Managing: {selectedUser.name || selectedUser.username}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Add Spikes */}
                <div className="space-y-3">
                  <h3 className="font-medium flex items-center space-x-2">
                    <UserPlus className="w-4 h-4" />
                    <span>Add Spikes</span>
                  </h3>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={spikeAmount}
                      onChange={(e) => setSpikeAmount(e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                    <Button
                      onClick={handleAddSpikes}
                      disabled={!spikeAmount || addSpikesMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {/* Update Subscription */}
                <div className="space-y-3">
                  <h3 className="font-medium">Update Subscription</h3>
                  <div className="flex space-x-2">
                    <Select value={newSubscription} onValueChange={setNewSubscription}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="star">Star</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleUpdateSubscription}
                      disabled={!newSubscription || updateSubscriptionMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Update
                    </Button>
                  </div>
                </div>
              </div>

              {/* User Actions */}
              <div className="flex space-x-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant={selectedUser.isBlocked ? "default" : "destructive"}
                      size="sm"
                      className={selectedUser.isBlocked ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      {selectedUser.isBlocked ? 'Unblock User' : 'Block User'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-gray-900 border-gray-700 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {selectedUser.isBlocked ? 'Unblock User' : 'Block User'}
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-400">
                        {selectedUser.isBlocked 
                          ? 'This will restore the user\'s access to the application.'
                          : 'This will prevent the user from accessing the application.'
                        }
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => blockUserMutation.mutate({ userId: selectedUser.id, block: !selectedUser.isBlocked })}
                        className={selectedUser.isBlocked ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                      >
                        {selectedUser.isBlocked ? 'Unblock' : 'Block'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete User
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-gray-900 border-gray-700 text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete User Permanently</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-400">
                        This action cannot be undone. The user and all their data will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteUserMutation.mutate(selectedUser.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Permanently
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Broadcast Notification */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Broadcast Notification</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Notification title"
              value={notificationTitle}
              onChange={(e) => setNotificationTitle(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
            />
            <Textarea
              placeholder="Notification message"
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              rows={3}
            />
            <Button
              onClick={handleBroadcastNotification}
              disabled={!notificationTitle.trim() || !notificationMessage.trim() || broadcastNotificationMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Send to All Users
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}