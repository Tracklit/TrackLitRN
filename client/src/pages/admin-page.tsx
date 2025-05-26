import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserX, Trash2, KeyRound, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface User {
  id: number;
  username: string;
  email?: string;
  isBlocked?: boolean;
  subscription?: 'free' | 'pro' | 'star';
  spikes?: number;
  createdAt?: string;
}

export default function AdminPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'block' | 'delete' | 'reset' | 'spikes' | 'subscription'>('block');
  const [spikesAmount, setSpikesAmount] = useState('');
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'star'>('free');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search users query
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/admin/users', searchTerm],
    queryFn: () => apiRequest('GET', `/api/admin/users?search=${encodeURIComponent(searchTerm)}`).then(res => res.json()),
    enabled: searchTerm.length >= 2,
  });

  // Admin actions mutation
  const adminActionMutation = useMutation({
    mutationFn: async ({ userId, action, data }: { userId: number; action: string; data?: any }) => {
      const response = await apiRequest('POST', `/api/admin/users/${userId}/${action}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsActionDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: 'Action Completed',
        description: 'User action completed successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Action Failed',
        description: error.message || 'Failed to complete action',
        variant: 'destructive',
      });
    },
  });

  const handleAction = (user: User, action: typeof actionType) => {
    setSelectedUser(user);
    setActionType(action);
    setIsActionDialogOpen(true);
  };

  const executeAction = () => {
    if (!selectedUser) return;

    let data: any = {};
    
    if (actionType === 'spikes') {
      data = { amount: parseInt(spikesAmount) };
    } else if (actionType === 'subscription') {
      data = { tier: subscriptionTier };
    }

    adminActionMutation.mutate({
      userId: selectedUser.id,
      action: actionType,
      data: Object.keys(data).length > 0 ? data : undefined,
    });
  };

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

  return (
    <div className="flex flex-col h-screen bg-[#010a18] text-white">
      <main className="flex-1 overflow-auto pt-16 pb-6">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1">Admin Panel</h2>
            <p className="text-gray-400">Manage users, subscriptions, and Spikes</p>
          </div>

          {/* Search Section */}
          <Card className="bg-[#0a1625] border-blue-800/30 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by username or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#010a18] border-blue-800/30 text-white"
                />
              </div>
              {searchTerm.length > 0 && searchTerm.length < 2 && (
                <p className="text-sm text-gray-400 mt-2">Enter at least 2 characters to search</p>
              )}
            </CardContent>
          </Card>

          {/* User Results */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <p className="mt-2 text-gray-400">Searching users...</p>
            </div>
          )}

          {users.length > 0 && (
            <div className="space-y-4">
              {users.map((user: User) => (
                <Card key={user.id} className="bg-[#0a1625] border-blue-800/30">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-white">{user.username}</h3>
                          {user.isBlocked && (
                            <Badge className="bg-red-500 text-white">BLOCKED</Badge>
                          )}
                          {getSubscriptionBadge(user.subscription)}
                        </div>
                        <div className="text-sm text-gray-400 space-y-1">
                          {user.email && <p>Email: {user.email}</p>}
                          <p>Spikes: {user.spikes || 0}</p>
                          <p>User ID: {user.id}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(user, 'block')}
                          className="border-red-600 text-red-400 hover:bg-red-600/10"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(user, 'reset')}
                          className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/10"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(user, 'spikes')}
                          className="border-amber-600 text-amber-400 hover:bg-amber-600/10"
                        >
                          <Zap className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(user, 'subscription')}
                          className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
                        >
                          <Crown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(user, 'delete')}
                          className="border-red-600 text-red-400 hover:bg-red-600/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {searchTerm.length >= 2 && !isLoading && users.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400">No users found matching your search</p>
            </div>
          )}
        </div>
      </main>

      {/* Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="bg-[#0a1625] border-blue-800/30 text-white">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'block' && 'Block User'}
              {actionType === 'delete' && 'Delete User'}
              {actionType === 'reset' && 'Reset Password'}
              {actionType === 'spikes' && 'Give Spikes'}
              {actionType === 'subscription' && 'Assign Subscription'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedUser && (
                <>
                  You are about to perform an action on user: <strong>{selectedUser.username}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {actionType === 'spikes' && (
              <div>
                <label className="block text-sm font-medium mb-2">Spikes Amount</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={spikesAmount}
                  onChange={(e) => setSpikesAmount(e.target.value)}
                  className="bg-[#010a18] border-blue-800/30 text-white"
                />
              </div>
            )}
            
            {actionType === 'subscription' && (
              <div>
                <label className="block text-sm font-medium mb-2">Subscription Tier</label>
                <Select value={subscriptionTier} onValueChange={(value: 'free' | 'pro' | 'star') => setSubscriptionTier(value)}>
                  <SelectTrigger className="bg-[#010a18] border-blue-800/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a1625] border-blue-800/30">
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="star">Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {actionType === 'delete' && (
              <div className="p-4 bg-red-900/20 border border-red-600/30 rounded">
                <p className="text-red-400 text-sm">
                  ⚠️ This action cannot be undone. The user and all their data will be permanently deleted.
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsActionDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={executeAction}
                disabled={adminActionMutation.isPending || (actionType === 'spikes' && !spikesAmount)}
                className={`flex-1 ${
                  actionType === 'delete' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {adminActionMutation.isPending ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}