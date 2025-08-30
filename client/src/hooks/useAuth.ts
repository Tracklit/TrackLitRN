import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/user'],
    retry: false,
  });

  const isSubscriber = user?.subscriptionTier !== 'free' || user?.isPremium;
  const isPremium = user?.isPremium;
  const subscriptionTier = user?.subscriptionTier || 'free';

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    isSubscriber,
    isPremium,
    subscriptionTier,
  };
}