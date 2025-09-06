import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Crown, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import SubscriptionModal from "./SubscriptionModal";

interface SubscriptionButtonProps {
  coachId: number;
  coachName: string;
  coachUsername: string;
  variant?: "default" | "heart" | "crown";
  className?: string;
}

export default function SubscriptionButton({ 
  coachId, 
  coachName, 
  coachUsername, 
  variant = "default",
  className = "" 
}: SubscriptionButtonProps) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  // Fetch coach's subscription offering
  const { data: subscription, isLoading } = useQuery({
    queryKey: [`/api/users/${coachId}/subscription`],
  });

  // Check if user is already subscribed
  const { data: mySubscriptions } = useQuery({
    queryKey: ["/api/my-subscriptions"],
    enabled: !!user,
  });

  const isAlreadySubscribed = mySubscriptions?.some(
    (sub: any) => sub.coachId === coachId && sub.status === "active"
  );

  // Show loading state
  if (isLoading) {
    return (
      <Button disabled className={`${className}`} size="lg">
        <Crown className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  // Show "Not Available" state if coach doesn't offer subscriptions
  if (!subscription) {
    return (
      <Button disabled className={`${className}`} size="lg" variant="outline">
        <Crown className="h-4 w-4 mr-2" />
        No Coaching Available
      </Button>
    );
  }

  // Don't show button if user is already subscribed
  if (isAlreadySubscribed) {
    return (
      <Button disabled className={`${className}`}>
        <Crown className="h-4 w-4 mr-2" />
        Subscribed
      </Button>
    );
  }

  // Don't show button if viewing own profile
  if (user?.id === coachId) {
    return null;
  }

  const formatPrice = (amount: number, currency: string, interval: string) => {
    const price = (amount / 100).toFixed(2);
    return `$${price}/${interval}`;
  };

  const getButtonContent = () => {
    switch (variant) {
      case "heart":
        return (
          <>
            <Heart className="h-4 w-4 mr-2" />
            Subscribe to {coachName}
          </>
        );
      case "crown":
        return (
          <>
            <Crown className="h-4 w-4 mr-2" />
            Join {coachName}'s Coaching
          </>
        );
      default:
        return (
          <>
            <DollarSign className="h-4 w-4 mr-2" />
            Subscribe - {formatPrice(subscription.priceAmount, subscription.priceCurrency, subscription.priceInterval)}
          </>
        );
    }
  };

  return (
    <>
      <Button 
        onClick={() => setShowModal(true)}
        className={`${className}`}
        disabled={!user}
      >
        {getButtonContent()}
      </Button>

      {showModal && (
        <SubscriptionModal
          subscription={subscription}
          coachName={coachName}
          coachUsername={coachUsername}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}