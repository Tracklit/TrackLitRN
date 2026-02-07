import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

interface ProgramSession {
  id?: number;
  programId?: number;
  programSessionId?: number;
  dayNumber?: number;
  date?: string | null;
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

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const firstNonEmpty = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return undefined;
};

const normalizeDateKey = (rawDate?: string | null) => {
  if (!rawDate) return undefined;

  const trimmed = rawDate.trim();
  if (!trimmed) return undefined;

  const shortDateMatch = trimmed.match(/^([A-Za-z]{3})-(\d{1,2})$/);
  if (shortDateMatch) {
    const [, month, day] = shortDateMatch;
    const normalizedMonth = month[0].toUpperCase() + month.slice(1).toLowerCase();
    return `${normalizedMonth}-${parseInt(day, 10)}`;
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
  if (isoMatch) {
    const [, , month, day] = isoMatch;
    return `${MONTH_NAMES[parseInt(month, 10) - 1]}-${parseInt(day, 10)}`;
  }

  const parsedDate = new Date(trimmed);
  if (!Number.isNaN(parsedDate.getTime())) {
    return `${MONTH_NAMES[parsedDate.getMonth()]}-${parsedDate.getDate()}`;
  }

  return trimmed;
};

const parseSpreadsheetData = (sessions: ProgramSession[]) => {
  return sessions.map((session, index) => {
    const dateSource = firstNonEmpty(session.date, session.columnA);
    const normalizedDate = normalizeDateKey(dateSource);
    const dayNumber = typeof session.dayNumber === 'number' ? session.dayNumber : index + 1;

    return {
      ...session,
      dayNumber,
      date: normalizedDate ?? dateSource ?? undefined,
      preActivation1: firstNonEmpty(session.preActivation1, session.columnB),
      preActivation2: firstNonEmpty(session.preActivation2, session.columnC),
      shortDistanceWorkout: firstNonEmpty(session.shortDistanceWorkout, session.columnD),
      mediumDistanceWorkout: firstNonEmpty(session.mediumDistanceWorkout, session.columnE),
      longDistanceWorkout: firstNonEmpty(session.longDistanceWorkout, session.columnF),
      extraSession: firstNonEmpty(session.columnG, session.extraSession),
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
      const programData = await apiRequest<ProgramResponse>(`/api/programs/${programId}`);
      if (programData.sessions && Array.isArray(programData.sessions)) {
        return parseSpreadsheetData(programData.sessions);
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
