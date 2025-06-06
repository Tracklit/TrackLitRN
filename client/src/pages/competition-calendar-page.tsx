import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  MapPin, 
  Search, 
  Star, 
  Trophy, 
  Clock, 
  Users,
  ExternalLink,
  Heart,
  HeartOff,
  Filter,
  ArrowUpDown
} from "lucide-react";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface Competition {
  id: number;
  name: string;
  location: {
    country: string;
    city?: string;
  };
  rankingCategory: string;
  disciplines: string[];
  start: string;
  end: string;
  competitionGroup?: string;
  competitionSubgroup?: string;
  hasResults: boolean;
  hasStartlist: boolean;
  hasCompetitionInformation: boolean;
}

interface CompetitionResult {
  athletes: Array<{
    id: number;
    name: string;
    country: string;
  }>;
  country: string;
  place: number;
  performance: {
    mark: string;
    wind?: string;
  };
}

interface CompetitionEvent {
  eventId: number;
  eventName?: string;
  disciplineName: string;
  disciplineCode: string;
  category: string;
  sex: 'M' | 'W' | 'X';
  races: Array<{
    date?: string;
    day?: number;
    race: string;
    raceId: number;
    raceNumber: number;
    results: CompetitionResult[];
  }>;
}

export default function CompetitionCalendarPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  // Set default date range: current date to 6 months from now (upcoming only)
  const getDefaultDateRange = () => {
    const today = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(today.getMonth() + 6);
    
    return {
      start: today.toISOString().split('T')[0],
      end: sixMonthsLater.toISOString().split('T')[0]
    };
  };

  const [dateFilter, setDateFilter] = useState<{ start?: string; end?: string }>(getDefaultDateRange());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const queryClient = useQueryClient();

  // Fetch competitions based on active tab
  const { data: competitionsResponse, isLoading } = useQuery({
    queryKey: ['/api/competitions', { 
      name: searchTerm || undefined,
      upcoming: activeTab === 'upcoming' ? 'true' : undefined,
      major: activeTab === 'major' ? 'true' : undefined,
      startDate: dateFilter.start,
      endDate: dateFilter.end,
      page: currentPage,
      limit: pageSize,
      sort: sortOrder
    }],
    enabled: activeTab !== 'favorites'
  });

  const competitions = Array.isArray(competitionsResponse) ? competitionsResponse : (competitionsResponse as any)?.competitions || [];
  const totalCompetitions = (competitionsResponse as any)?.total || competitions.length;
  const totalPages = Math.ceil(totalCompetitions / pageSize);

  // Fetch favorite competitions
  const { data: favoriteCompetitions = [] } = useQuery({
    queryKey: ['/api/competitions/favorites'],
    enabled: activeTab === 'favorites'
  });

  // Fetch competition results when a competition is selected
  const { data: competitionResults = [] } = useQuery({
    queryKey: ['/api/competitions', selectedCompetition?.id, 'results'],
    enabled: !!selectedCompetition && selectedCompetition.hasResults
  });

  // Mutation for adding/removing favorites
  const favoriteMutation = useMutation({
    mutationFn: async ({ competitionId, action }: { competitionId: number; action: 'add' | 'remove' }) => {
      if (action === 'add') {
        return await fetch(`/api/competitions/${competitionId}/favorite`, { method: 'POST' });
      } else {
        return await fetch(`/api/competitions/${competitionId}/favorite`, { method: 'DELETE' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/competitions/favorites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/competitions'] });
    }
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  const isUpcoming = (dateString: string) => {
    try {
      return isAfter(new Date(dateString), new Date());
    } catch {
      return false;
    }
  };

  const getCompetitionStatus = (comp: Competition) => {
    const startDate = new Date(comp.start);
    const endDate = new Date(comp.end);
    const now = new Date();

    if (isBefore(now, startDate)) {
      return { status: "upcoming", color: "bg-blue-500" };
    } else if (isAfter(now, endDate)) {
      return { status: "completed", color: "bg-gray-500" };
    } else {
      return { status: "ongoing", color: "bg-green-500" };
    }
  };

  const handleFavoriteToggle = (competition: Competition) => {
    const favs = Array.isArray(favoriteCompetitions) ? favoriteCompetitions : [];
    const isFavorited = favs.some((fav: any) => fav.id === competition.id);
    favoriteMutation.mutate({
      competitionId: competition.id,
      action: isFavorited ? 'remove' : 'add'
    });
  };

  const getDisplayCompetitions = () => {
    if (activeTab === 'favorites') {
      return Array.isArray(favoriteCompetitions) ? favoriteCompetitions : [];
    }
    return Array.isArray(competitions) ? competitions : [];
  };

  const CompetitionCard = ({ competition }: { competition: Competition }) => {
    const { status, color } = getCompetitionStatus(competition);
    const isFavorited = favoriteCompetitions.some((fav: any) => fav.id === competition.id);

    return (
      <Card className="mb-4 hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">{competition.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                {competition.location.city && `${competition.location.city}, `}
                {competition.location.country}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${color}`} title={status} />
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFavoriteToggle(competition);
                }}
                disabled={favoriteMutation.isPending}
              >
                {isFavorited ? (
                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                ) : (
                  <HeartOff className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent 
          className="pt-0"
          onClick={() => setSelectedCompetition(competition)}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(competition.start)}
                {competition.start !== competition.end && ` - ${formatDate(competition.end)}`}
              </div>
              <Badge variant="secondary" className="text-xs">
                {competition.rankingCategory}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-1">
              {competition.disciplines.slice(0, 4).map((discipline, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {discipline}
                </Badge>
              ))}
              {competition.disciplines.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{competition.disciplines.length - 4} more
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500">
              {competition.hasResults && (
                <div className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  Results Available
                </div>
              )}
              {competition.hasStartlist && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Start List
                </div>
              )}
              {competition.hasCompetitionInformation && (
                <div className="flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Competition Info
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const CompetitionDetails = ({ competition }: { competition: Competition }) => {
    const { status, color } = getCompetitionStatus(competition);

    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">{competition.name}</h2>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {competition.location.city && `${competition.location.city}, `}
                {competition.location.country}
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="capitalize text-sm">{status}</span>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setSelectedCompetition(null)}
          >
            Back to List
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Competition Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <strong>Dates:</strong> {formatDate(competition.start)}
                {competition.start !== competition.end && ` - ${formatDate(competition.end)}`}
              </div>
              <div>
                <strong>Category:</strong> {competition.rankingCategory}
              </div>
              {competition.competitionGroup && (
                <div>
                  <strong>Group:</strong> {competition.competitionGroup}
                </div>
              )}
              {competition.competitionSubgroup && (
                <div>
                  <strong>Subgroup:</strong> {competition.competitionSubgroup}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Disciplines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {competition.disciplines.map((discipline, index) => (
                  <Badge key={index} variant="outline">
                    {discipline}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {competition.hasResults && competitionResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {competitionResults.map((event: CompetitionEvent, eventIndex: number) => (
                  <div key={eventIndex} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">
                      {event.eventName || event.disciplineName} - {event.sex} {event.category}
                    </h4>
                    {event.races.map((race, raceIndex) => (
                      <div key={raceIndex} className="mb-4">
                        <h5 className="font-medium text-sm mb-2">{race.race}</h5>
                        <div className="space-y-1">
                          {race.results.slice(0, 8).map((result, resultIndex) => (
                            <div key={resultIndex} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-3">
                                <span className="font-medium w-6">{result.place}</span>
                                <span>{result.athletes[0]?.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {result.country}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono">{result.performance.mark}</span>
                                {result.performance.wind && (
                                  <span className="text-xs text-gray-500">
                                    {result.performance.wind}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  if (selectedCompetition) {
    return (
      <div className="container mx-auto px-4 py-6">
        <CompetitionDetails competition={selectedCompetition} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Competition Calendar</h1>
        <p className="text-gray-600">
          Discover upcoming track and field competitions worldwide powered by World Athletics data
        </p>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search competitions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap items-center">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">From</label>
              <Input
                type="date"
                value={dateFilter.start || ''}
                onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                className="w-36 text-sm"
                title="Filter competitions starting from this date"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">To</label>
              <Input
                type="date"
                value={dateFilter.end || ''}
                onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                className="w-36 text-sm"
                title="Filter competitions ending before this date"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setDateFilter(getDefaultDateRange());
                setCurrentPage(1);
              }}
              className="mt-5"
            >
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="mt-5 flex items-center gap-1"
              title={`Sort by date ${sortOrder === 'asc' ? 'newest first' : 'oldest first'}`}
            >
              <ArrowUpDown className="h-3 w-3" />
              {sortOrder === 'asc' ? 'Oldest' : 'Newest'}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upcoming" className="text-xs px-2">Upcoming</TabsTrigger>
            <TabsTrigger value="major" className="text-xs px-2">Major</TabsTrigger>
            <TabsTrigger value="all" className="text-xs px-2">All</TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs px-2">Favorites</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header skeleton */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                    </div>
                    
                    {/* Date skeleton */}
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                    
                    {/* Location skeleton */}
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>
                    
                    {/* Badges skeleton */}
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                      <div className="h-6 bg-gray-200 rounded w-24"></div>
                    </div>
                    
                    {/* Disciplines skeleton */}
                    <div className="flex flex-wrap gap-1">
                      {[...Array(4)].map((_, j) => (
                        <div key={j} className="h-5 bg-gray-200 rounded w-12"></div>
                      ))}
                    </div>
                    
                    {/* Features skeleton */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <div className="h-3 w-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-3 w-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : getDisplayCompetitions().length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {activeTab === 'favorites' ? 'No favorite competitions yet' : 'No competitions found'}
            </h3>
            <p className="text-gray-500">
              {activeTab === 'favorites' 
                ? 'Start adding competitions to your favorites to see them here.'
                : 'Try adjusting your search or check back later for new competitions.'
              }
            </p>
          </div>
        ) : (
          <>
            {getDisplayCompetitions().map((competition: Competition) => (
              <CompetitionCard key={competition.id} competition={competition} />
            ))}
            
            {/* Pagination Controls */}
            {activeTab !== 'favorites' && totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0 text-xs"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
            
            {/* Results count */}
            <div className="text-center text-sm text-gray-500 mt-4">
              Showing {getDisplayCompetitions().length} of {totalCompetitions} competitions
            </div>
          </>
        )}
      </div>
    </div>
  );
}