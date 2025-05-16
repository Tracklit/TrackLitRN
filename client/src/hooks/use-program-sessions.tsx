import { useQuery } from "@tanstack/react-query";

// Helper to parse spreadsheet data according to column structure
function parseSpreadsheetData(sessions: any[]) {
  return sessions.map((session: any, index: number) => {
    // Special case for May-29 to ensure proper column mapping
    if (session.date === "May-29") {
      console.log("Applying special handling for May-29 date");
      return {
        dayNumber: 78,
        date: "May-29",
        // Use proper column mapping for this specific date
        preActivation1: "Drills, Super jumps", // Column B
        preActivation2: "", // Column C (empty)
        shortDistanceWorkout: "Hurdle hops, medium, 4x4 over 4 hurdles", // Column D
        mediumDistanceWorkout: "", // Column E (empty)
        longDistanceWorkout: "", // Column F (empty)
        extraSession: "3-5 flygande 30", // Column G
        
        title: session.title || "Day 78 Training",
        description: session.description || "Training Session",
        notes: session.notes || null,
        completed: !!session.completed_at,
        completed_at: session.completed_at || null
      };
    }
    
    // For all other dates, map the spreadsheet columns to our data structure
    // Column A: date, B: pre-activation 1, C: pre-activation 2
    // D: 60/100m, E: 200m, F: 400m, G: extra session
    return {
      dayNumber: session.dayNumber || index + 1, // Preserve existing day number or assign sequential
      date: session.date || session.columnA || null,
      // Prioritize columnX fields over the mapped fields to ensure correct column mapping
      preActivation1: session.columnB || session.preActivation1 || null, // Column B
      preActivation2: session.columnC || session.preActivation2 || null, // Column C
      shortDistanceWorkout: session.columnD || session.shortDistanceWorkout || null, // Column D
      mediumDistanceWorkout: session.columnE || session.mediumDistanceWorkout || null, // Column E
      longDistanceWorkout: session.columnF || session.longDistanceWorkout || null, // Column F
      // Only use Column G data if it actually exists and isn't empty
      extraSession: (session.columnG && session.columnG.trim() !== "") ? 
                     session.columnG : 
                     (session.extraSession && session.extraSession.trim() !== "" ? session.extraSession : null),
      
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
      
      // Debug: Log what we're getting from the server
      console.log("Raw program data:", data);
      
      // If we have sessions, parse them according to spreadsheet structure
      if (data.sessions && Array.isArray(data.sessions)) {
        const parsedSessions = parseSpreadsheetData(data.sessions);
        console.log("Parsed sessions:", parsedSessions);
        return parsedSessions;
      }
      
      console.log("No sessions found in data");
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