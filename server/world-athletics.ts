import fetch from 'node-fetch';
import { z } from 'zod';

// World Athletics API Types based on the repository analysis
const LocationSchema = z.object({
  country: z.string(),
  city: z.string().optional(),
});

const CompetitionSchema = z.object({
  id: z.number(),
  name: z.string(),
  location: LocationSchema,
  rankingCategory: z.string(),
  disciplines: z.array(z.string()),
  start: z.string().transform(str => new Date(str)),
  end: z.string().transform(str => new Date(str)),
  competitionGroup: z.string().nullable().optional(),
  competitionSubgroup: z.string().nullable().optional(),
  hasResults: z.boolean(),
  hasStartlist: z.boolean(),
  hasCompetitionInformation: z.boolean(),
});

const AthleteSchema = z.object({
  id: z.number(),
  name: z.string(),
  country: z.string(),
});

const PerformanceSchema = z.object({
  mark: z.string(),
  wind: z.string().nullable().optional(),
});

const CompetitionResultSchema = z.object({
  athletes: z.array(AthleteSchema),
  country: z.string(),
  place: z.number(),
  performance: PerformanceSchema,
});

const CompetitionEventSchema = z.object({
  eventId: z.number(),
  eventName: z.string().nullable().optional(),
  disciplineName: z.string(),
  disciplineCode: z.string(),
  category: z.string(),
  sex: z.enum(['M', 'W', 'X']),
  races: z.array(z.object({
    date: z.string().transform(str => new Date(str)).nullable().optional(),
    day: z.number().nullable().optional(),
    race: z.string(),
    raceId: z.number(),
    raceNumber: z.number(),
    results: z.array(CompetitionResultSchema),
  })),
});

export type WorldAthleticsCompetition = z.infer<typeof CompetitionSchema>;
export type WorldAthleticsEvent = z.infer<typeof CompetitionEventSchema>;
export type WorldAthleticsResult = z.infer<typeof CompetitionResultSchema>;

class WorldAthleticsService {
  private baseUrl = 'https://worldathletics.nimarion.de';

  async searchCompetitions(name?: string): Promise<WorldAthleticsCompetition[]> {
    try {
      const url = new URL(`${this.baseUrl}/competitions`);
      if (name) {
        url.searchParams.append('name', name);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`World Athletics API error: ${response.status}`);
      }

      const data = await response.json();
      return z.array(CompetitionSchema).parse(data);
    } catch (error) {
      console.error('Error fetching competitions from World Athletics:', error);
      return [];
    }
  }

  async getCompetitionResults(competitionId: number, eventId?: number, day?: number): Promise<WorldAthleticsEvent[]> {
    try {
      const url = new URL(`${this.baseUrl}/competitions/${competitionId}/results`);
      if (eventId) {
        url.searchParams.append('eventId', eventId.toString());
      }
      if (day) {
        url.searchParams.append('day', day.toString());
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`World Athletics API error: ${response.status}`);
      }

      const data = await response.json();
      // The API returns a structure with events array
      if (data.events) {
        return z.array(CompetitionEventSchema).parse(data.events);
      }
      return [];
    } catch (error) {
      console.error('Error fetching competition results from World Athletics:', error);
      return [];
    }
  }

  async getCompetitionInfo(competitionId: number) {
    try {
      const url = `${this.baseUrl}/competitions/${competitionId}/organiser`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`World Athletics API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching competition info from World Athletics:', error);
      return null;
    }
  }

  // Convert performance string to milliseconds (for track) or centimeters (for field)
  convertPerformanceToValue(performance: string, disciplineCode: string): number | null {
    try {
      // Track events (time-based) - convert to milliseconds
      if (['100', '200', '400', '800', '1500', '5000', '10000', '110H', '100H', '400H', '3000SC'].includes(disciplineCode)) {
        // Parse time format like "9.58" or "1:43.25"
        const parts = performance.split(':');
        if (parts.length === 1) {
          // Seconds only
          return Math.round(parseFloat(parts[0]) * 1000);
        } else if (parts.length === 2) {
          // Minutes:seconds
          const minutes = parseInt(parts[0]);
          const seconds = parseFloat(parts[1]);
          return Math.round((minutes * 60 + seconds) * 1000);
        }
      }
      
      // Field events (distance-based) - convert to centimeters
      if (['LJ', 'TJ', 'PV', 'HJ', 'SP', 'DT', 'HT', 'JT'].includes(disciplineCode)) {
        // Parse distance format like "8.95" (meters)
        const meters = parseFloat(performance);
        return Math.round(meters * 100);
      }

      return null;
    } catch (error) {
      console.error('Error converting performance value:', error);
      return null;
    }
  }

  // Get upcoming competitions (next 30 days)
  async getUpcomingCompetitions(): Promise<WorldAthleticsCompetition[]> {
    const competitions = await this.searchCompetitions();
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    return competitions.filter(comp => {
      const startDate = new Date(comp.start);
      return startDate >= now && startDate <= thirtyDaysFromNow;
    });
  }

  // Get major competitions (Diamond League, World Championships, etc.)
  async getMajorCompetitions(): Promise<WorldAthleticsCompetition[]> {
    const competitions = await this.searchCompetitions();
    const majorKeywords = [
      'diamond league',
      'world championships',
      'world athletics',
      'continental tour',
      'olympics',
      'european championships',
      'commonwealth games'
    ];

    return competitions.filter(comp => {
      const name = comp.name.toLowerCase();
      return majorKeywords.some(keyword => name.includes(keyword));
    });
  }
}

export const worldAthleticsService = new WorldAthleticsService();