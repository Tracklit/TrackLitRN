import { useQuery } from "@tanstack/react-query";

export function useAssignedPrograms() {
  const { 
    data: assignedPrograms = [], 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/assigned-programs'],
    queryFn: async () => {
      const response = await fetch('/api/assigned-programs');
      if (!response.ok) {
        throw new Error('Failed to fetch assigned programs');
      }
      return response.json();
    },
  });

  return { 
    assignedPrograms, 
    isLoading, 
    error,
    refetch
  };
}