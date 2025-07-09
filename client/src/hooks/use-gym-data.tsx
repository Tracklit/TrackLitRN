import { useQuery } from "@tanstack/react-query";

interface GymDataResponse {
  gymData: string[];
}

export function useGymData(programId: number | null, dayNumber: number | null) {
  return useQuery<GymDataResponse>({
    queryKey: ['/api/programs', programId, 'days', dayNumber, 'gym-data'],
    queryFn: async () => {
      if (!programId || !dayNumber) return { gymData: [] };
      
      const response = await fetch(`/api/programs/${programId}/days/${dayNumber}/gym-data`);
      if (!response.ok) {
        // If session not found (404), return empty gym data instead of throwing error
        if (response.status === 404) {
          return { gymData: [] };
        }
        throw new Error('Failed to fetch gym data');
      }
      return response.json();
    },
    enabled: !!(programId && dayNumber),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}