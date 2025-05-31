import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose 
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
} from "@/components/ui/alert-dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  UserX, 
  Ban, 
  Shield, 
  Gift, 
  RotateCcw, 
  CreditCard,
  Bell,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Crown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

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

export default function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [spikeAmount, setSpikeAmount] = useState('');
  const [newSubscription, setNewSubscription] = useState('');

  // Check if current user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access the admin panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch users based on search
  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/users', searchTerm],
    queryFn: () => apiRequest('GET', `/api/admin/users?search=${encodeURIComponent(searchTerm)}`).then(res => res.json()),
    enabled: searchTerm.length >= 2
  });

  // Block/Unblock user mutation
  const blockUserMutation = useMutation({
    mutationFn: (userId: number) => 
      apiRequest('POST', `/api/admin/users/${userId}/block`, {}),
    onSuccess: () => {
      toast({
        title: "User status updated",
        description: "User access has been modified successfully",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => 
      apiRequest('POST', `/api/admin/users/${userId}/delete`, {}),
    onSuccess: () => {
      toast({
        title: "User deleted",
        description: "User account has been permanently deleted",
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: (userId: number) => 
      apiRequest('POST', `/api/admin/users/${userId}/reset`, {}),
    onSuccess: () => {
      toast({
        title: "Password reset",
        description: "A password reset email has been sent to the user",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  // Add spikes mutation
  const addSpikesMutation = useMutation({
    mutationFn: ({ userId, amount }: { userId: number; amount: number }) => 
      apiRequest('POST', `/api/admin/users/${userId}/spikes`, { amount }),
    onSuccess: () => {
      toast({
        title: "Spikes added",
        description: "Spike reward has been sent to the user",
      });
      setSpikeAmount('');
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add spikes",
        variant: "destructive",
      });
    },
  });

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: ({ userId, tier }: { userId: number; tier: string }) => 
      apiRequest('POST', `/api/admin/users/${userId}/subscription`, { tier }),
    onSuccess: () => {
      toast({
        title: "Subscription updated",
        description: "User subscription tier has been changed",
      });
      setNewSubscription('');
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription",
        variant: "destructive",
      });
    },
  });

  // Broadcast notification mutation
  const broadcastNotificationMutation = useMutation({
    mutationFn: ({ title, message }: { title: string; message: string }) => 
      apiRequest('POST', '/api/admin/broadcast-notification', { title, message }),
    onSuccess: () => {
      toast({
        title: "Notification sent",
        description: "Broadcast notification has been sent to all users",
      });
      setNotificationTitle('');
      setNotificationMessage('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send notification",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.length >= 2) {
      refetch();
    }
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
    <div className="container max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-2">
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </div>

      {/* Search Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>User Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex space-x-2">
            <Input
              placeholder="Search by username, name, or email (min 2 characters)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={searchTerm.length < 2}>
              Search
            </Button>
          </form>

          {isLoading && (
            <div className="flex justify-center mt-4">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}

          {users.length > 0 && (
            <div className="mt-4 space-y-2">
              {users.map((user: User) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center space-x-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-sm text-muted-foreground">@{user.username}</span>
                        {user.subscriptionTier === 'star' && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                        {user.isCoach && (
                          <Badge variant="secondary">Coach</Badge>
                        )}
                        {user.isBlocked && (
                          <Badge variant="destructive">Blocked</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{user.email}</span>
                        <span>Tier: {user.subscriptionTier}</span>
                        <span>{user.spikes} spikes</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          Manage
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Manage User: {user.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {/* Block/Unblock */}
                          <div className="flex items-center justify-between">
                            <span>User Access</span>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant={user.isBlocked ? "default" : "destructive"}
                                  size="sm"
                                >
                                  <Ban className="w-4 h-4 mr-2" />
                                  {user.isBlocked ? 'Unblock' : 'Block'}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {user.isBlocked ? 'Unblock' : 'Block'} User
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to {user.isBlocked ? 'unblock' : 'block'} {user.name}?
                                    {!user.isBlocked && ' This will prevent them from accessing the application.'}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => blockUserMutation.mutate(user.id)}
                                    className={user.isBlocked ? undefined : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
                                  >
                                    {user.isBlocked ? 'Unblock' : 'Block'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>

                          <Separator />

                          {/* Reset Password */}
                          <div className="flex items-center justify-between">
                            <span>Password Reset</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => resetPasswordMutation.mutate(user.id)}
                              disabled={resetPasswordMutation.isPending}
                            >
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Reset
                            </Button>
                          </div>

                          <Separator />

                          {/* Add Spikes */}
                          <div className="space-y-2">
                            <Label>Add Spikes</Label>
                            <div className="flex space-x-2">
                              <Input
                                type="number"
                                placeholder="Amount"
                                value={spikeAmount}
                                onChange={(e) => setSpikeAmount(e.target.value)}
                                min="1"
                              />
                              <Button
                                size="sm"
                                onClick={handleAddSpikes}
                                disabled={addSpikesMutation.isPending}
                              >
                                <Gift className="w-4 h-4 mr-2" />
                                Add
                              </Button>
                            </div>
                          </div>

                          <Separator />

                          {/* Update Subscription */}
                          <div className="space-y-2">
                            <Label>Subscription Tier</Label>
                            <div className="flex space-x-2">
                              <Select value={newSubscription} onValueChange={setNewSubscription}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select tier" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free">Free</SelectItem>
                                  <SelectItem value="pro">Pro</SelectItem>
                                  <SelectItem value="star">Star</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                onClick={handleUpdateSubscription}
                                disabled={updateSubscriptionMutation.isPending}
                              >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Update
                              </Button>
                            </div>
                          </div>

                          <Separator />

                          {/* Delete User */}
                          <div className="flex items-center justify-between">
                            <span className="text-destructive">Delete User</span>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <UserX className="w-4 h-4 mr-2" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to permanently delete {user.name}? 
                                    This action cannot be undone and will remove all their data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteUserMutation.mutate(user.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete Permanently
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchTerm.length >= 2 && !isLoading && users.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              No users found matching "{searchTerm}"
            </div>
          )}
        </CardContent>
      </Card>

      {/* Broadcast Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <span>Broadcast Notification</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notification-title">Title</Label>
              <Input
                id="notification-title"
                placeholder="Notification title"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="notification-message">Message</Label>
              <Textarea
                id="notification-message"
                placeholder="Notification message"
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                rows={4}
              />
            </div>
            <Button
              onClick={handleBroadcastNotification}
              disabled={broadcastNotificationMutation.isPending}
              className="w-full"
            >
              {broadcastNotificationMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Bell className="w-4 h-4 mr-2" />
              )}
              Send to All Users
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}