import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, RefreshCcw, Star, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface MarketplaceListing {
  id: number;
  type: 'program' | 'consulting';
  title: string;
  subtitle?: string;
  heroUrl?: string;
  priceCents: number;
  currency: string;
  tags: string[];
  badges: string[];
  rating: any;
  visibility: string;
  coach: {
    id: number;
    name: string;
    profileImageUrl?: string;
  };
  typeSpecific?: {
    durationWeeks?: number;
    category?: string;
    level?: string;
    sessionDurationMinutes?: number;
    maxParticipants?: number;
  };
}

interface SearchFilters {
  query: string;
  category: string;
}

export default function MarketplacePage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: ''
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const { data: listings, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/marketplace/listings', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.query) params.append('query', filters.query);
      if (filters.category) params.append('category', filters.category);
      params.append('sort', 'newest');
      params.append('limit', '20');

      const response = await fetch(`/api/marketplace/listings?${params}`);
      if (!response.ok) throw new Error('Failed to fetch listings');
      return response.json();
    }
  });

  const categories = ["Sprint", "Distance", "Jumping", "Throwing", "Combined", "Strength"];

  const formatPrice = (priceCents: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(priceCents / 100);
  };

  const handleCategoryFilter = (category: string) => {
    const newCategory = selectedCategory === category ? '' : category;
    setSelectedCategory(newCategory);
    setFilters(prev => ({ ...prev, category: newCategory }));
  };

  const handleRetry = () => {
    refetch();
  };

  const isActiveTab = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 p-4 flex items-center justify-between border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm">
        <h1 className="text-xl font-bold tracking-wide">TrackLit</h1>
        <Search className="w-6 h-6" />
      </header>

      {/* Search + Filters */}
      <div className="p-4 space-y-3">
        <input
          type="text"
          placeholder="Search programs, coaches, or keywords..."
          value={filters.query}
          onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
          className="w-full p-3 rounded-2xl bg-slate-800 border border-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-white"
        />

        {/* Create button for coaches and admins */}
        {(user?.role === 'coach' || user?.role === 'admin') && (
          <Button 
            asChild
            className="rounded-full bg-indigo-600 hover:bg-indigo-500 text-white mb-3"
          >
            <Link href="/marketplace/create">
              Create New Listing
            </Link>
          </Button>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant="outline"
              onClick={() => handleCategoryFilter(category)}
              className={`rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-indigo-500 text-white border-indigo-500'
                  : 'bg-slate-700/40 text-slate-200 border-slate-600 hover:bg-indigo-500 hover:text-white'
              }`}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Content Area with bottom padding for navigation */}
      <div className="flex-1 p-4 pb-20">
        {isLoading && (
          <div className="grid gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-slate-700 animate-pulse"
              ></div>
            ))}
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center text-center gap-4 mt-20">
            <div className="w-40 h-40 bg-slate-700 rounded-2xl flex items-center justify-center">
              <RefreshCcw className="w-12 h-12 text-slate-400" />
            </div>
            <p className="text-lg font-medium">Failed to load listings</p>
            <Button 
              onClick={handleRetry} 
              className="gap-2 rounded-full bg-indigo-600 hover:bg-indigo-500"
            >
              <RefreshCcw className="w-4 h-4" /> Try Again
            </Button>
          </div>
        )}

        {!isLoading && !error && listings && (
          <>
            {listings.items && listings.items.length > 0 ? (
              <div className="grid gap-4">
                {listings.items.map((listing: MarketplaceListing) => (
                  <Card
                    key={listing.id}
                    className="rounded-2xl bg-slate-800 border-slate-700 hover:border-indigo-500 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/20"
                  >
                    <CardContent className="p-4 flex flex-col gap-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold line-clamp-1">{listing.title}</h3>
                          {listing.subtitle && (
                            <p className="text-sm text-slate-400 line-clamp-1">{listing.subtitle}</p>
                          )}
                        </div>
                        <Star className="w-5 h-5 text-yellow-400 flex-shrink-0 ml-2" />
                      </div>
                      
                      <p className="text-slate-400 text-sm">By {listing.coach.name}</p>
                      
                      {/* Tags and Badges */}
                      {(listing.tags.length > 0 || listing.badges.length > 0) && (
                        <div className="flex gap-1 flex-wrap">
                          {listing.badges.map((badge, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-orange-500/20 text-orange-300 border-orange-500/30">
                              {badge}
                            </Badge>
                          ))}
                          {listing.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs border-slate-600 text-slate-300">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-lg text-indigo-400">
                          {formatPrice(listing.priceCents, listing.currency)}
                        </span>
                        <Button 
                          asChild
                          className="rounded-full bg-indigo-600 hover:bg-indigo-500 transition-colors"
                        >
                          <Link href={`/marketplace/listing/${listing.id}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center gap-4 mt-20">
                <div className="w-40 h-40 bg-slate-700 rounded-2xl flex items-center justify-center">
                  <Search className="w-12 h-12 text-slate-400" />
                </div>
                <p className="text-lg font-medium">No listings found</p>
                <p className="text-slate-400">Try adjusting your search or filters</p>
                <Button 
                  onClick={() => {
                    setFilters({ query: '', category: '' });
                    setSelectedCategory('');
                  }}
                  className="rounded-full bg-slate-700 hover:bg-slate-600"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}