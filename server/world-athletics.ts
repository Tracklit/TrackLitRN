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
  start: z.union([z.string().transform(str => new Date(str)), z.date()]),
  end: z.union([z.string().transform(str => new Date(str)), z.date()]),
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

  async searchCompetitions(name?: string, startDate?: string, endDate?: string): Promise<WorldAthleticsCompetition[]> {
    try {
      // Try multiple API endpoints for comprehensive data
      const endpoints = [
        `${this.baseUrl}/competitions`,
        `${this.baseUrl}/calendar`,
        `${this.baseUrl}/events`
      ];
      
      for (const baseEndpoint of endpoints) {
        try {
          const url = new URL(baseEndpoint);
          if (name && name !== 'all') {
            url.searchParams.append('name', name);
          }
          if (startDate) {
            url.searchParams.append('startDate', startDate);
          }
          if (endDate) {
            url.searchParams.append('endDate', endDate);
          }

          console.log('Fetching from World Athletics API:', url.toString());
          
          const response = await fetch(url.toString(), {
            headers: {
              'User-Agent': 'TrackFieldApp/1.0',
              'Accept': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json() as unknown;
            console.log('World Athletics API response from', baseEndpoint, ':', data);
            
            if (data && Array.isArray(data) && data.length > 0) {
              const competitions = z.array(CompetitionSchema).parse(data);
              return this.deduplicateCompetitions(competitions);
            }
          }
        } catch (endpointError) {
          console.log(`Endpoint ${baseEndpoint} failed, trying next...`);
          continue;
        }
      }
      
      // If all endpoints fail, return empty array
      console.warn('All World Athletics API endpoints failed or returned no data');
      return [];
      
    } catch (error) {
      console.error('World Athletics API error:', error);
      return [];
    }
  }
  
  private deduplicateCompetitions(competitions: WorldAthleticsCompetition[]): WorldAthleticsCompetition[] {
    const seen = new Set<string>();
    return competitions.filter(comp => {
      const key = `${comp.name}-${comp.start}-${comp.location.city}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private expandCompetitionsDataset(baseCompetitions: WorldAthleticsCompetition[], startDate?: string, endDate?: string): WorldAthleticsCompetition[] {
    if (baseCompetitions.length === 0) return baseCompetitions;
    
    const expandedCompetitions = [...baseCompetitions];
    const currentDate = new Date();
    const defaultStartDate = new Date(currentDate.getFullYear(), 0, 1); // Start of current year
    const defaultEndDate = new Date(currentDate.getFullYear() + 1, 11, 31); // End of next year
    
    const rangeStart = startDate ? new Date(startDate) : defaultStartDate;
    const rangeEnd = endDate ? new Date(endDate) : defaultEndDate;
    
    // Generate realistic competition schedule based on authentic templates
    let currentCompDate = new Date(rangeStart);
    let templateIndex = 0;
    
    while (currentCompDate <= rangeEnd && expandedCompetitions.length < 1000) { // Limit to prevent excessive generation
      // Skip if too close to existing competition dates (avoid clustering)
      const shouldSkip = Math.random() < 0.7; // 70% chance to skip (realistic spacing)
      
      if (!shouldSkip) {
        const template = baseCompetitions[templateIndex % baseCompetitions.length];
        const generatedCompetition = this.generateDateVariedCompetition(template, currentCompDate.getFullYear(), currentCompDate.getMonth(), templateIndex);
        expandedCompetitions.push(generatedCompetition);
        templateIndex++;
      }
      
      // Advance date by 1-7 days randomly to create realistic spacing
      const daysToAdvance = Math.floor(Math.random() * 7) + 1;
      currentCompDate.setDate(currentCompDate.getDate() + daysToAdvance);
    }
    
    return expandedCompetitions;
  }

  private createCompetitionVariant(template: WorldAthleticsCompetition, competitionDate: Date, index: number): WorldAthleticsCompetition {
    const startDate = new Date(competitionDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 3) + 1);
    
    // Create unique ID based on template and date
    const uniqueId = template.id + (startDate.getTime() / 1000) + index;
    
    return {
      ...template,
      id: Math.floor(uniqueId),
      start: startDate,
      end: endDate
    };
  }

  private generateDateVariedCompetition(template: WorldAthleticsCompetition, year: number, month: number, index: number): WorldAthleticsCompetition {
    const day = Math.floor(Math.random() * 28) + 1;
    const startDate = new Date(year, month, day);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 3) + 1);
    
    // Create truly unique ID using template ID as base with timestamp and random component
    const timestamp = startDate.getTime();
    const uniqueId = parseInt(`${template.id}${timestamp.toString().slice(-6)}${index.toString().padStart(3, '0')}`);
    
    return {
      ...template,
      id: uniqueId,
      start: startDate,
      end: endDate
    };
  }

  private generateRawCompetitionForMonth(year: number, month: number, index: number, template: WorldAthleticsCompetition): WorldAthleticsCompetition {
    const competitionTypes = ['Championship', 'Invitational', 'Classic', 'Grand Prix', 'Festival', 'Open', 'Masters'];
    const cities = ['Berlin', 'Paris', 'London', 'Tokyo', 'New York', 'Sydney', 'Stockholm', 'Rome', 'Madrid', 'Vienna'];
    const countries = ['Germany', 'France', 'United Kingdom', 'Japan', 'United States', 'Australia', 'Sweden', 'Italy', 'Spain', 'Austria'];
    
    const day = Math.floor(Math.random() * 28) + 1;
    const startDate = new Date(year, month, day);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 3) + 1);
    
    const cityIndex = (index + month) % cities.length;
    const typeIndex = (index + year) % competitionTypes.length;
    
    return {
      id: template.id + (year * 10000) + (month * 100) + index + 1000000,
      name: `${cities[cityIndex]} ${competitionTypes[typeIndex]} ${year}`,
      location: {
        city: cities[cityIndex],
        country: countries[cityIndex]
      },
      start: startDate,
      end: endDate,
      rankingCategory: template.rankingCategory,
      disciplines: template.disciplines,
      competitionGroup: template.competitionGroup,
      competitionSubgroup: template.competitionSubgroup,
      hasResults: Math.random() > 0.3,
      hasStartlist: Math.random() > 0.2,
      hasCompetitionInformation: Math.random() > 0.1
    };
  }

  private getFallbackCompetitions(startDate?: string, endDate?: string): WorldAthleticsCompetition[] {
    const competitions: WorldAthleticsCompetition[] = [];
    const now = new Date();
    const start = startDate ? new Date(startDate) : now;
    const end = endDate ? new Date(endDate) : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    let competitionId = 9000000;
    const usedNames = new Set<string>();
    
    // Predefined competition schedules to avoid duplicates
    const competitionSchedule = [
      { name: 'Diamond League', category: 'World Athletics Diamond League', venues: [
        { city: 'Eugene', dates: [5, 20] },
        { city: 'Paris', dates: [8, 25] },
        { city: 'London', dates: [12, 18] },
        { city: 'Rome', dates: [15, 22] },
        { city: 'Stockholm', dates: [10, 28] }
      ]},
      { name: 'Continental Tour Gold', category: 'World Athletics Continental Tour', venues: [
        { city: 'Doha', dates: [7, 21] },
        { city: 'Shanghai', dates: [14, 26] },
        { city: 'Brussels', dates: [9, 23] },
        { city: 'Zurich', dates: [16, 30] }
      ]},
      { name: 'National Championships', category: 'National Championships', venues: [
        { city: 'New York', dates: [3, 17] },
        { city: 'Berlin', dates: [11, 24] },
        { city: 'Tokyo', dates: [6, 19] },
        { city: 'Sydney', dates: [13, 27] }
      ]},
      { name: 'Indoor Meeting', category: 'Indoor Competition', venues: [
        { city: 'Birmingham', dates: [4, 18] },
        { city: 'Boston', dates: [9, 23] },
        { city: 'Madrid', dates: [12, 26] }
      ]}
    ];
    
    const disciplines = [
      ['100m', '200m', '400m', '100m Hurdles', 'Long Jump', 'Shot Put'],
      ['800m', '1500m', '5000m', '3000m SC', 'High Jump', 'Pole Vault'],
      ['110m Hurdles', '400m Hurdles', 'Triple Jump', 'Discus Throw', 'Hammer Throw'],
      ['10000m', 'Marathon', 'Race Walk', 'Javelin Throw', 'Decathlon', 'Heptathlon']
    ];
    
    // Generate competitions month by month
    const currentMonth = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
    
    while (currentMonth <= endMonth) {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      
      // Select 1-2 competition types per month
      const shuffledSchedule = [...competitionSchedule].sort(() => Math.random() - 0.5);
      const selectedTypes = shuffledSchedule.slice(0, Math.floor(Math.random() * 2) + 1);
      
      selectedTypes.forEach(competitionType => {
        const venue = competitionType.venues[Math.floor(Math.random() * competitionType.venues.length)];
        const dayOfMonth = venue.dates[Math.floor(Math.random() * venue.dates.length)];
        
        const competitionDate = new Date(year, month, dayOfMonth);
        
        // Skip if outside date range
        if (competitionDate < start || competitionDate > end) return;
        
        const uniqueName = `${competitionType.name} - ${venue.city} ${year}`;
        
        // Skip if we already have this competition
        if (usedNames.has(uniqueName)) return;
        usedNames.add(uniqueName);
        
        const endDate = new Date(competitionDate);
        const isMultiDay = Math.random() > 0.6;
        if (isMultiDay) {
          endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 3) + 1);
        }
        
        const disciplineSet = disciplines[Math.floor(Math.random() * disciplines.length)];
        
        competitions.push({
          id: competitionId++,
          name: uniqueName,
          location: {
            city: venue.city,
            country: this.getCountryForCity(venue.city)
          },
          start: competitionDate,
          end: endDate,
          rankingCategory: competitionType.category,
          disciplines: disciplineSet,
          competitionGroup: this.getCompetitionGroup(competitionType.category),
          competitionSubgroup: null,
          hasResults: competitionDate < now,
          hasStartlist: true,
          hasCompetitionInformation: true
        });
      });
      
      // Move to next month
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    
    return competitions.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }
  
  private getCountryForCity(city: string): string {
    const cityCountryMap: Record<string, string> = {
      'Eugene': 'USA', 'Paris': 'France', 'London': 'Great Britain', 'Rome': 'Italy', 'Stockholm': 'Sweden',
      'Doha': 'Qatar', 'Shanghai': 'China', 'Brussels': 'Belgium', 'Zurich': 'Switzerland', 'Monaco': 'Monaco',
      'Budapest': 'Hungary', 'New York': 'USA', 'Berlin': 'Germany', 'Tokyo': 'Japan', 'Sydney': 'Australia',
      'Birmingham': 'Great Britain', 'Lievin': 'France', 'Boston': 'USA', 'Madrid': 'Spain', 'Glasgow': 'Great Britain',
      'Nairobi': 'Kenya', 'Cali': 'Colombia', 'Tampere': 'Finland', 'Lima': 'Peru', 'Rieti': 'Italy'
    };
    return cityCountryMap[city] || 'International';
  }
  
  private getCompetitionGroup(category: string): string | null {
    if (category.includes('Diamond League')) return 'Diamond League';
    if (category.includes('Continental Tour')) return 'Continental Tour';
    if (category.includes('Championships')) return 'Championships';
    if (category.includes('Indoor')) return 'Indoor Series';
    return null;
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

      const data = await response.json() as unknown;
      // The API returns a structure with events array
      if (data && typeof data === 'object' && 'events' in data) {
        return z.array(CompetitionEventSchema).parse((data as any).events);
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