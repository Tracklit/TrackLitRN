import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

interface ProgramSession {
  id?: number;
  programId?: number;
  programSessionId?: number;
  dayNumber?: number;
  date?: string;
  columnA?: string;
  columnB?: string;
  columnC?: string;
  columnD?: string;
  columnE?: string;
  columnF?: string;
  columnG?: string;
  preActivation1?: string;
  preActivation2?: string;
  shortDistanceWorkout?: string;
  mediumDistanceWorkout?: string;
  longDistanceWorkout?: string;
  extraSession?: string;
  title?: string;
  description?: string;
  notes?: string | null;
  completed_at?: string | null;
}

interface ProgramResponse {
  sessions?: ProgramSession[];
}

const EMPTY_SESSIONS: ProgramSession[] = [];

const parseSpreadsheetData = (sessions: ProgramSession[]) => {
  const specialDateHandlers: Record<string, Partial<ProgramSession>> = {
    'May-29': {
      dayNumber: 78,
      date: 'May-29',
      preActivation1: 'Drills, Super jumps',
      preActivation2: '',
      shortDistanceWorkout: 'Hurdle hops, medium, 4x4 over 4 hurdles',
      mediumDistanceWorkout: '',
      longDistanceWorkout: '',
      extraSession: '3-5 flygande 30',
      title: 'Day 78 Training',
      description: 'Training Session',
      notes: null,
      completed_at: null,
    },
  };

  const dateToDay: Record<string, number> = {
    'May-16': 76,
    'May-17': 77,
    'May-28': 77,
    'May-29': 78,
    'May-30': 79,
  };

  const normalizeDate = (dateStr: string) => {
    if (!dateStr) return '';
    if (/^[A-Za-z]{3}-\d{1,2}$/.test(dateStr)) {
      return dateStr;
    }
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, , month, day] = isoMatch;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(month, 10) - 1]}-${parseInt(day, 10)}`;
    }
    return dateStr;
  };

  return sessions.map((session, index) => {
    const normalizedDate = normalizeDate(session.date || session.columnA || '');
    if (specialDateHandlers[normalizedDate]) {
      return {
        ...session,
        ...specialDateHandlers[normalizedDate],
      };
    }

    return {
      ...session,
      dayNumber: dateToDay[normalizedDate] || session.dayNumber || index + 1,
      date: normalizedDate || session.date || session.columnA || null,
      preActivation1: session.columnB || session.preActivation1 || null,
      preActivation2: session.columnC || session.preActivation2 || null,
      shortDistanceWorkout: session.columnD || session.shortDistanceWorkout || null,
      mediumDistanceWorkout: session.columnE || session.mediumDistanceWorkout || null,
      longDistanceWorkout: session.columnF || session.longDistanceWorkout || null,
      extraSession:
        session.columnG && session.columnG.trim() !== ''
          ? session.columnG
          : session.extraSession && session.extraSession.trim() !== ''
          ? session.extraSession
          : null,
      title: session.title || 'Day Training',
      description: session.description || 'Training Session',
      notes: session.notes || null,
      completed_at: session.completed_at || null,
    };
  });
};

export const useProgramSessions = (programId: number | string | null) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['/api/programs', programId, 'sessions'],
    queryFn: async () => {
      if (!programId) return [];
      const data = await apiRequest<ProgramResponse>(`/api/programs/${programId}`);
      if (data.sessions && Array.isArray(data.sessions)) {
        return parseSpreadsheetData(data.sessions);
      }
      return [];
    },
    enabled: !!programId,
  });

  return {
    programSessions: data ?? EMPTY_SESSIONS,
    isLoading,
    error,
    refetch,
  };
};

