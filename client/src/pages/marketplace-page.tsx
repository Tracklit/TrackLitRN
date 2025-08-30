import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LinkedListingCard, ListingCardSkeleton } from "@/components/ui/listing-card";
import { Search, Filter, Grid, List, Plus, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface SearchFilters {
  query: string;
  type: 'all' | 'program' | 'consulting';
  category: string;
  sort: string;
}

export default function MarketplacePage() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    type: 'all',
    category: '',
    sort: 'relevance'
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: listings, isLoading, error } = useQuery({
    queryKey: ['/api/marketplace/listings', filters, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters.query) params.append('query', filters.query);
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      if (filters.sort) params.append('sort', filters.sort);
      params.append('page', currentPage.toString());
      params.append('limit', '20');

      const response = await fetch(`/api/marketplace/listings?${params}`);
      if (!response.ok) throw new Error('Failed to fetch listings');
      return response.json();
    }
  });

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const categories = [
    'Sprint', 'Distance', 'Jumping', 'Throwing', 'Combined Events', 'Strength & Conditioning'
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">TrackLit Marketplace</h1>
              <p className="text-gray-300">Discover training programs and coaching from world-class athletes</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/marketplace/cart">
                <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cart
                </Button>
              </Link>
              <Link href="/marketplace/create">
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Listing
                </Button>
              </Link>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search programs, coaches, or keywords..."
                value={filters.query}
                onChange={(e) => updateFilter('query', e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20"
              />
            </div>

            {/* Type Filter */}
            <Tabs 
              value={filters.type} 
              onValueChange={(value) => updateFilter('type', value as SearchFilters['type'])}
              className="w-auto"
            >
              <TabsList className="bg-white/10 border-white/20">
                <TabsTrigger value="all" className="data-[state=active]:bg-white/20 text-white">All</TabsTrigger>
                <TabsTrigger value="program" className="data-[state=active]:bg-white/20 text-white">Programs</TabsTrigger>
                <TabsTrigger value="consulting" className="data-[state=active]:bg-white/20 text-white">Consulting</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Sort */}
            <Select value={filters.sort} onValueChange={(value) => updateFilter('sort', value)}>
              <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-white/20 rounded-md bg-white/10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={cn(
                  "text-white hover:bg-white/20",
                  viewMode === 'grid' && "bg-white/20"
                )}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={cn(
                  "text-white hover:bg-white/20",
                  viewMode === 'list' && "bg-white/20"
                )}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.category === '' ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter('category', '')}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              All Categories
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={filters.category === category ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilter('category', category)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Results Header */}
        {listings && (
          <div className="flex items-center justify-between mb-6">
            <div className="text-white">
              <span className="text-lg font-semibold">{listings.total}</span>
              <span className="text-gray-300 ml-2">results found</span>
              {filters.query && (
                <span className="text-gray-300 ml-1">for "{filters.query}"</span>
              )}
            </div>
            {listings.nextPage && (
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Load More
              </Button>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">Failed to load listings</div>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className={cn(
            "grid gap-6",
            viewMode === 'grid' 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1 max-w-4xl mx-auto"
          )}>
            {Array.from({ length: 8 }).map((_, i) => (
              <ListingCardSkeleton key={i} size={viewMode === 'list' ? 'lg' : 'md'} />
            ))}
          </div>
        )}

        {/* Listings Grid */}
        {listings && listings.items.length > 0 && (
          <div className={cn(
            "grid gap-6",
            viewMode === 'grid' 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "grid-cols-1 max-w-4xl mx-auto"
          )}>
            {listings.items.map((listing: any) => (
              <LinkedListingCard
                key={listing.id}
                listing={listing}
                href={`/marketplace/listings/${listing.id}`}
                size={viewMode === 'list' ? 'lg' : 'md'}
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {listings && listings.items.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4 text-lg">No listings found</div>
            <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
            <Button 
              variant="outline" 
              onClick={() => setFilters({ query: '', type: 'all', category: '', sort: 'relevance' })}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}