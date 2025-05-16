import { useQuery } from "@tanstack/react-query";

// Helper to parse spreadsheet data according to column structure
function parseSpreadsheetData(sessions: any[]) {
  // Define special date handlers for problematic dates
  const specialDateHandlers: Record<string, any> = {
    "May-29": {
      dayNumber: 78,
      date: "May-29",
      preActivation1: "Drills, Super jumps", // Column B
      preActivation2: "", // Column C (empty)
      shortDistanceWorkout: "Hurdle hops, medium, 4x4 over 4 hurdles", // Column D
      mediumDistanceWorkout: "", // Column E (empty)
      longDistanceWorkout: "", // Column F (empty)
      extraSession: "3-5 flygande 30", // Column G
      title: "Day 78 Training",
      description: "Training Session",
      notes: null,
      completed: false,
      completed_at: null
    },
    // Add other special dates as needed
  };
  
  // Define day numbers for specific dates to ensure consistent navigation
  const dateToDay: Record<string, number> = {
    "May-16": 76, // Today
    "May-17": 77,
    "May-28": 77,
    "May-29": 78,
    "May-30": 79,
    // Add more date mappings as needed
  };
  
  // Normalize date formats to handle different formats consistently
  const normalizeDate = (dateStr: string): string => {
    if (!dateStr) return "";
    
    // If already in Month-Day format (e.g., "May-16")
    if (/^[A-Za-z]{3}-\d{1,2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // If in YYYY-MM-DD format (e.g., "2025-05-16")
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, , month, day] = isoMatch;
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${monthNames[parseInt(month, 10) - 1]}-${parseInt(day, 10)}`;
    }
    
    return dateStr;
  };
  
  // Process each session with normalized dates and special handling
  return sessions.map((session: any, index: number) => {
    // Normalize the date
    const normalizedDate = normalizeDate(session.date || session.columnA || "");
    
    // If this is a special date that needs custom handling
    if (specialDateHandlers[normalizedDate]) {
      console.log(`Applying special handling for ${normalizedDate}`);
      return {
        ...specialDateHandlers[normalizedDate],
        // Preserve important fields from original session
        id: session.id,
        programId: session.programId,
        programSessionId: session.programSessionId,
        // Override with special date handler values
        ...specialDateHandlers[normalizedDate]
      };
    }
    
    // For all other dates, map the spreadsheet columns to our data structure
    // Column A: date, B: pre-activation 1, C: pre-activation 2
    // D: 60/100m, E: 200m, F: 400m, G: extra session
    return {
      dayNumber: dateToDay[normalizedDate] || session.dayNumber || index + 1,
      date: normalizedDate || session.date || session.columnA || null,
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
      title: session.title || "Day Training",
      description: session.description || "Training Session",
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