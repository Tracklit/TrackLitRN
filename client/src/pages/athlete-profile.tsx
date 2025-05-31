import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { User, Users, Crown, Target, Eye, EyeOff } from 'lucide-react';

export default function AthleteProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for coach limits
  const { data: coachLimits } = useQuery({
    queryKey: ['/api/coach/limits'],
    enabled: !!user?.isCoach,
  });

  // Query for coach's athletes
  const { data: athletes = [] } = useQuery({
    queryKey: ['/api/coach/athletes'],
    enabled: !!user?.isCoach,
  });

  // Query for athlete's coaches
  const { data: coaches = [] } = useQuery({
    queryKey: ['/api/athlete/coaches'],
  });

  // Mutation to update coach status
  const updateCoachStatusMutation = useMutation({
    mutationFn: async (isCoach: boolean) => {
      const response = await apiRequest('PATCH', '/api/user/coach-status', { isCoach });
      return response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coach/limits'] });
      toast({
        title: updatedUser.isCoach ? "Coach Status Activated" : "Coach Status Deactivated",
        description: updatedUser.isCoach 
          ? "You can now assign programs to athletes!" 
          : "Coach features have been disabled.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update coach status",
        variant: "destructive",
      });
    },
  });

  // Mutation to update privacy status
  const updatePrivacyStatusMutation = useMutation({
    mutationFn: async (isPrivate: boolean) => {
      const response = await apiRequest('PATCH', '/api/user/privacy-status', { isPrivate });
      return response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: updatedUser.isPrivate ? "Account Made Private" : "Account Made Public",
        description: updatedUser.isPrivate 
          ? "Other users cannot find you unless you connect with them first." 
          : "Other users can now find and connect with you.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update privacy status",
        variant: "destructive",
      });
    },
  });

  const handleCoachToggle = (checked: boolean) => {
    updateCoachStatusMutation.mutate(checked);
  };

  const handlePrivacyToggle = (checked: boolean) => {
    updatePrivacyStatusMutation.mutate(checked);
  };

  const getSubscriptionBadgeColor = (tier: string) => {
    switch (tier) {
      case 'star': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'pro': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getCoachLimitInfo = () => {
    if (!user?.isCoach || !coachLimits) return null;
    
    const { currentAthletes, maxAthletes, tier } = coachLimits;
    const isUnlimited = maxAthletes === 'unlimited';
    
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">
          Athletes: {currentAthletes} / {isUnlimited ? '∞' : maxAthletes}
        </span>
        <Badge className={getSubscriptionBadgeColor(tier)}>
          {tier.toUpperCase()}
        </Badge>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#010a18] text-white p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="bg-[#1a2332] border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">Username</Label>
              <div className="text-lg font-semibold">{user?.username}</div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">Name</Label>
              <div className="text-lg">{user?.name}</div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">Email</Label>
              <div className="text-lg">{user?.email}</div>
            </div>

            {/* Subscription Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">Subscription</Label>
              <div className="flex items-center gap-2">
                <Badge className={getSubscriptionBadgeColor(user?.subscriptionTier || 'free')}>
                  {(user?.subscriptionTier || 'free').toUpperCase()}
                </Badge>
                {user?.isPremium && (
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                    PREMIUM
                  </Badge>
                )}
              </div>
            </div>

            {/* Coach Toggle */}
            <div className="space-y-4 border-t border-gray-700 pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="coach-toggle" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    Coach Status
                  </Label>
                  <p className="text-xs text-gray-400">
                    Enable coach features to assign programs to athletes
                  </p>
                </div>
                <Switch
                  id="coach-toggle"
                  checked={user?.isCoach || false}
                  onCheckedChange={handleCoachToggle}
                  disabled={updateCoachStatusMutation.isPending}
                />
              </div>
              
              {user?.isCoach && coachLimits && (
                <div className="bg-[#0f1419] p-3 rounded-lg border border-gray-700">
                  {getCoachLimitInfo()}
                </div>
              )}
            </div>

            {/* Privacy Toggle */}
            <div className="space-y-4 border-t border-gray-700 pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="privacy-toggle" className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    {user?.isPrivate ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    Private Account
                  </Label>
                  <p className="text-xs text-gray-400">
                    When enabled, other users cannot find you unless you connect with them first
                  </p>
                </div>
                <Switch
                  id="privacy-toggle"
                  checked={user?.isPrivate || false}
                  onCheckedChange={handlePrivacyToggle}
                  disabled={updatePrivacyStatusMutation.isPending}
                />
              </div>
              
              {user?.isPrivate && (
                <div className="bg-[#0f1419] p-3 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <EyeOff className="w-4 h-4 text-orange-400" />
                    Your account is private. Only admins and users you request connections to can see your profile.
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Coach Dashboard */}
        {user?.isCoach && (
          <Card className="bg-[#1a2332] border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Coach Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0f1419] p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-medium text-gray-300">Your Athletes</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{athletes.length}</div>
                  {coachLimits && (
                    <p className="text-xs text-gray-400 mt-1">
                      {coachLimits.maxAthletes === 'unlimited' 
                        ? 'Unlimited capacity' 
                        : `${coachLimits.maxAthletes - coachLimits.currentAthletes} slots remaining`
                      }
                    </p>
                  )}
                </div>

                <div className="bg-[#0f1419] p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-300">Subscription Tier</span>
                  </div>
                  <div className="text-2xl font-bold text-white capitalize">
                    {user?.subscriptionTier || 'free'}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {user?.subscriptionTier === 'free' && 'Upgrade for more athletes'}
                    {user?.subscriptionTier === 'pro' && 'Up to 20 athletes'}
                    {user?.subscriptionTier === 'star' && 'Unlimited athletes'}
                  </p>
                </div>
              </div>

              {athletes.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-300">Current Athletes</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {athletes.map((athlete: any) => (
                      <div key={athlete.id} className="flex items-center justify-between bg-[#0f1419] p-3 rounded border border-gray-700">
                        <div>
                          <div className="font-medium text-white">{athlete.name}</div>
                          <div className="text-sm text-gray-400">@{athlete.username}</div>
                        </div>
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                          Active
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Athlete Dashboard */}
        {coaches.length > 0 && (
          <Card className="bg-[#1a2332] border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Your Coaches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {coaches.map((coach: any) => (
                  <div key={coach.id} className="flex items-center justify-between bg-[#0f1419] p-3 rounded border border-gray-700">
                    <div>
                      <div className="font-medium text-white flex items-center gap-2">
                        {coach.name}
                        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                          COACH
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-400">@{coach.username}</div>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      Training
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}