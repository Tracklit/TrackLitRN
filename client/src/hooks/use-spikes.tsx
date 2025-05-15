import { useQuery, useMutation } from "@tanstack/react-query";
import { Achievement, SpikeTransaction, LoginStreak } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Types for the achievement data with user progress
export interface UserAchievement extends Achievement {
  progress: number;
  isCompleted: boolean;
  timesEarned: number;
  completionDate: string | null;
  lastEarnedAt: string | null;
}

export function useAchievements() {
  return useQuery<UserAchievement[]>({
    queryKey: ["/api/achievements"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLoginStreak() {
  return useQuery<LoginStreak>({
    queryKey: ["/api/login-streak"],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useSpikeTransactions() {
  return useQuery<SpikeTransaction[]>({
    queryKey: ["/api/spike-transactions"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCheckDailyLogin() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/check-daily-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to check daily login");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/login-streak"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Daily Login",
        description: "Your login streak has been updated!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useClaimAchievement() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (achievementId: number) => {
      const response = await fetch(`/api/claim-achievement/${achievementId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to claim achievement");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spike-transactions"] });
      toast({
        title: "Achievement Claimed",
        description: `You earned ${data.spikeReward} Spikes!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}