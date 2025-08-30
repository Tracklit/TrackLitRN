import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Star, ShoppingCart, Calendar, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface Coach {
  id: number;
  name: string;
  username: string;
  avatarUrl?: string;
  verified: boolean;
}

interface MarketplaceListing {
  id: number;
  type: 'program' | 'consulting';
  title: string;
  subtitle?: string;
  heroUrl?: string;
  priceCents: number;
  currency: string;
  tags?: string[];
  badges?: string[];
  rating?: number;
  createdAt: string;
  coach: Coach;
  // Program-specific
  durationWeeks?: number;
  level?: string;
  category?: string;
  compareAtPriceCents?: number;
  // Consulting-specific
  slotLengthMin?: number;
  pricePerSlotCents?: number;
}

interface ListingCardProps {
  listing: MarketplaceListing;
  showCoach?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export function ListingCard({ 
  listing, 
  showCoach = true, 
  size = 'md',
  onClick,
  className 
}: ListingCardProps) {
  const formatPrice = (cents: number, currency: string) => {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const renderTypeSpecificInfo = () => {
    if (listing.type === 'program') {
      return (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>{listing.durationWeeks || 4} weeks</span>
          {listing.level && (
            <>
              <span>•</span>
              <span className="capitalize">{listing.level}</span>
            </>
          )}
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>{listing.slotLengthMin || 60} min sessions</span>
          <span>•</span>
          <span>{formatPrice(listing.pricePerSlotCents || listing.priceCents, listing.currency)}/session</span>
        </div>
      );
    }
  };

  const isProgramCard = listing.type === 'program';
  const isConsultingCard = listing.type === 'consulting';

  const cardSizes = {
    sm: 'w-64',
    md: 'w-80',
    lg: 'w-96'
  };

  return (
    <Card 
      className={cn(
        "group hover:shadow-lg transition-all duration-200 cursor-pointer",
        cardSizes[size],
        className
      )}
      onClick={onClick}
    >
      {/* Hero Image */}
      {listing.heroUrl && (
        <div className="relative overflow-hidden rounded-t-lg">
          <img 
            src={listing.heroUrl} 
            alt={listing.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
          />
          {/* Type Badge */}
          <Badge 
            variant={isProgramCard ? "default" : "secondary"}
            className="absolute top-3 left-3"
          >
            {isProgramCard ? "Program" : "Consulting"}
          </Badge>
          {/* Price Badge */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-md px-2 py-1">
            <div className="text-sm font-semibold text-gray-900">
              {formatPrice(listing.priceCents, listing.currency)}
            </div>
            {listing.compareAtPriceCents && listing.compareAtPriceCents > listing.priceCents && (
              <div className="text-xs text-gray-500 line-through">
                {formatPrice(listing.compareAtPriceCents, listing.currency)}
              </div>
            )}
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight truncate">
              {listing.title}
            </CardTitle>
            {listing.subtitle && (
              <CardDescription className="mt-1 line-clamp-2">
                {listing.subtitle}
              </CardDescription>
            )}
          </div>
          {listing.rating && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{listing.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-3">
        {/* Type-specific Info */}
        {renderTypeSpecificInfo()}

        {/* Tags */}
        {listing.tags && listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {listing.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {listing.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{listing.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Badges */}
        {listing.badges && listing.badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {listing.badges.map((badge, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                {badge}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      {showCoach && (
        <CardFooter className="pt-3 border-t">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={listing.coach.avatarUrl} />
                <AvatarFallback className="text-xs">
                  {listing.coach.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">{listing.coach.name}</span>
                {listing.coach.verified && (
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                )}
              </div>
            </div>
            <Button size="sm" variant="ghost" className="text-xs">
              <ShoppingCart className="h-4 w-4 mr-1" />
              Add to Cart
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

// Wrapper for linking
export function LinkedListingCard(props: ListingCardProps & { href?: string }) {
  const { href, ...cardProps } = props;
  
  if (href) {
    return (
      <Link href={href}>
        <ListingCard {...cardProps} />
      </Link>
    );
  }
  
  return <ListingCard {...cardProps} />;
}

// Loading skeleton
export function ListingCardSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const cardSizes = {
    sm: 'w-64',
    md: 'w-80', 
    lg: 'w-96'
  };

  return (
    <Card className={cn("animate-pulse", cardSizes[size])}>
      <div className="h-48 bg-gray-200 rounded-t-lg" />
      <CardHeader>
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="flex gap-2 mt-3">
          <div className="h-6 bg-gray-200 rounded-full w-16" />
          <div className="h-6 bg-gray-200 rounded-full w-20" />
        </div>
      </CardContent>
      <CardFooter className="border-t">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-gray-200 rounded-full" />
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
          <div className="h-8 bg-gray-200 rounded w-24" />
        </div>
      </CardFooter>
    </Card>
  );
}