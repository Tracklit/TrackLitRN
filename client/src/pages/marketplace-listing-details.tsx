import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Star, 
  Clock, 
  Calendar, 
  CheckCircle, 
  ShoppingCart, 
  ArrowLeft,
  Users,
  Award,
  Target
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function MarketplaceListingDetails() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['/api/marketplace/listings', id],
    queryFn: async () => {
      const response = await fetch(`/api/marketplace/listings/${id}`);
      if (!response.ok) throw new Error('Failed to fetch listing');
      return response.json();
    },
    enabled: !!id
  });

  const { data: reviews } = useQuery({
    queryKey: ['/api/marketplace/listings', id, 'reviews'],
    queryFn: async () => {
      const response = await fetch(`/api/marketplace/listings/${id}/reviews`);
      if (!response.ok) throw new Error('Failed to fetch reviews');
      return response.json();
    },
    enabled: !!id
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/marketplace/cart', {
        method: 'POST',
        body: {
          listingId: parseInt(id!),
          type: listing.type,
          quantity: selectedQuantity
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Added to cart",
        description: `${listing.title} has been added to your cart.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/cart'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add to cart",
        variant: "destructive"
      });
    }
  });

  const formatPrice = (cents: number, currency: string) => {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-32 mb-8" />
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-700 rounded-lg" />
              <div className="space-y-4">
                <div className="h-8 bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-700 rounded w-1/2" />
                <div className="h-20 bg-gray-700 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">Failed to load listing</div>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isProgramListing = listing.type === 'program';
  const isConsultingListing = listing.type === 'consulting';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/marketplace">
          <Button variant="ghost" className="mb-6 text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
        </Link>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Hero Image */}
          <div className="relative">
            {listing.heroUrl ? (
              <img 
                src={listing.heroUrl} 
                alt={listing.title}
                className="w-full h-96 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-96 bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">No image available</span>
              </div>
            )}
            <Badge 
              variant={isProgramListing ? "default" : "secondary"}
              className="absolute top-4 left-4"
            >
              {isProgramListing ? "Training Program" : "Consulting"}
            </Badge>
          </div>

          {/* Listing Info */}
          <div className="text-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
                {listing.subtitle && (
                  <p className="text-gray-300 text-lg mb-4">{listing.subtitle}</p>
                )}
              </div>
              {listing.rating && (
                <div className="flex items-center gap-2 ml-4">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{listing.rating.toFixed(1)}</span>
                  <span className="text-gray-400">({reviews?.length || 0} reviews)</span>
                </div>
              )}
            </div>

            {/* Coach Info */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={listing.coach.avatarUrl} />
                    <AvatarFallback>
                      {listing.coach.name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{listing.coach.name}</h3>
                      {listing.coach.verified && (
                        <CheckCircle className="h-4 w-4 text-blue-400" />
                      )}
                    </div>
                    <p className="text-gray-300 text-sm">@{listing.coach.username}</p>
                  </div>
                  <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white">
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Type-specific Info */}
            {isProgramListing && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock className="h-5 w-5" />
                  <div>
                    <div className="font-medium">{listing.durationWeeks || 4} Weeks</div>
                    <div className="text-sm text-gray-400">Duration</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Target className="h-5 w-5" />
                  <div>
                    <div className="font-medium capitalize">{listing.level || 'Intermediate'}</div>
                    <div className="text-sm text-gray-400">Level</div>
                  </div>
                </div>
              </div>
            )}

            {isConsultingListing && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="h-5 w-5" />
                  <div>
                    <div className="font-medium">{listing.slotLengthMin || 60} Min</div>
                    <div className="text-sm text-gray-400">Session Length</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Users className="h-5 w-5" />
                  <div>
                    <div className="font-medium">{listing.groupMax || 1} Person</div>
                    <div className="text-sm text-gray-400">Max Group Size</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tags and Badges */}
            {(listing.tags?.length > 0 || listing.badges?.length > 0) && (
              <div className="mb-6">
                {listing.tags && listing.tags.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {listing.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="border-gray-600 text-gray-300">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {listing.badges && listing.badges.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {listing.badges.map((badge: string, index: number) => (
                        <Badge key={index} className="bg-green-600 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Price and Purchase */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-3xl font-bold text-white">
                      {formatPrice(listing.priceCents, listing.currency)}
                    </div>
                    {listing.compareAtPriceCents && listing.compareAtPriceCents > listing.priceCents && (
                      <div className="text-gray-400 line-through">
                        {formatPrice(listing.compareAtPriceCents, listing.currency)}
                      </div>
                    )}
                    {isConsultingListing && (
                      <div className="text-gray-400 text-sm">per session</div>
                    )}
                  </div>
                </div>
                
                <Button 
                  onClick={() => addToCartMutation.mutate()}
                  disabled={addToCartMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs for Additional Info */}
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="description" className="data-[state=active]:bg-white/20 text-white">
              Description
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-white/20 text-white">
              Reviews ({reviews?.length || 0})
            </TabsTrigger>
            {isProgramListing && (
              <TabsTrigger value="curriculum" className="data-[state=active]:bg-white/20 text-white">
                Curriculum
              </TabsTrigger>
            )}
            {isConsultingListing && (
              <TabsTrigger value="availability" className="data-[state=active]:bg-white/20 text-white">
                Availability
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="description" className="mt-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-6">
                <div className="text-white">
                  {listing.description || "No description available."}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-4">
              {reviews && reviews.length > 0 ? (
                reviews.map((review: any) => (
                  <Card key={review.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {review.reviewerName?.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-white">{review.reviewerName}</div>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${
                                    i < review.rating 
                                      ? 'fill-yellow-400 text-yellow-400' 
                                      : 'text-gray-600'
                                  }`} 
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-gray-400 text-sm">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {review.title && (
                        <h4 className="font-medium text-white mb-2">{review.title}</h4>
                      )}
                      <p className="text-gray-300">{review.content}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="p-6 text-center">
                    <div className="text-gray-400">No reviews yet</div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {isProgramListing && (
            <TabsContent value="curriculum" className="mt-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6">
                  <div className="text-white">
                    <p className="text-gray-300">Curriculum details will be available after purchase.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isConsultingListing && (
            <TabsContent value="availability" className="mt-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6">
                  <div className="text-white">
                    <p className="text-gray-300">Book a session to see available time slots.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}