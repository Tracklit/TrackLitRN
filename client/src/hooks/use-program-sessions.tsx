import { useQuery } from "@tanstack/react-query";

export function useProgramSessions(programId: number | null) {
  const { 
    data: programSessions = [], 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/programs', programId, 'sessions'],
    queryFn: async () => {
      if (!programId) return [];
      
      const response = await fetch(`/api/programs/${programId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch program sessions');
      }
      const data = await response.json();
      return data.sessions || [];
    },
    enabled: !!programId, // Only fetch when we have a programId
  });

  return { 
    programSessions, 
    isLoading, 
    error,
    refetch
  };
}