import { useQuery } from "@tanstack/react-query";

interface GymDataResponse {
  gymData: string[];
}

export function useGymData(sessionId: number | null) {
  return useQuery<GymDataResponse>({
    queryKey: ['/api/sessions', sessionId, 'gym-data'],
    queryFn: async () => {
      if (!sessionId) return { gymData: [] };
      
      const response = await fetch(`/api/sessions/${sessionId}/gym-data`);
      if (!response.ok) {
        throw new Error('Failed to fetch gym data');
      }
      return response.json();
    },
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}