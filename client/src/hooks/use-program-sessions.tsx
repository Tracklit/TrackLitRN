import { useQuery } from "@tanstack/react-query";

// Helper to parse spreadsheet data according to column structure
function parseSpreadsheetData(sessions: any[]) {
  return sessions.map((session: any, index: number) => {
    // Map the spreadsheet columns to our data structure
    // Column A: date, B: pre-activation 1, C: pre-activation 2
    // D: 60/100m, E: 200m, F: 400m, G: extra session
    return {
      dayNumber: index + 1, // Assign sequential day numbers
      date: session.date || session.columnA || null,
      preActivation1: session.preActivation1 || session.columnB || null,
      preActivation2: session.preActivation2 || session.columnC || null,
      shortDistanceWorkout: session.shortDistanceWorkout || session.columnD || null,
      mediumDistanceWorkout: session.mediumDistanceWorkout || session.columnE || null,
      longDistanceWorkout: session.longDistanceWorkout || session.columnF || null,
      extraSession: session.extraSession || session.columnG || null,
      
      // If the original data already has these fields, keep them
      title: session.title || null,
      description: session.description || null,
      notes: session.notes || null,
      completed: !!session.completed_at,
      completed_at: session.completed_at || null
    };
  });
}

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
      
      // If we have sessions, parse them according to spreadsheet structure
      if (data.sessions && Array.isArray(data.sessions)) {
        return parseSpreadsheetData(data.sessions);
      }
      
      return [];
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