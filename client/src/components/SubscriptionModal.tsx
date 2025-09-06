import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Crown, Heart, Clock, Calendar, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

interface SubscriptionModalProps {
  subscription: any;
  coachName: string;
  coachUsername: string;
  onClose: () => void;
}

interface CheckoutFormProps {
  subscription: any;
  coachName: string;
  onSuccess: () => void;
}

function CheckoutForm({ subscription, coachName, onSuccess }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment on the backend
        await apiRequest("POST", `/api/subscriptions/${subscription.id}/confirm-payment`, {
          paymentIntentId: paymentIntent.id
        });

        toast({
          title: "Subscription Successful! 🎉",
          description: `You are now subscribed to ${coachName}'s coaching!`,
        });

        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Payment Error",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
      >
        {isProcessing ? (
          <div className="flex items-center">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            Processing...
          </div>
        ) : (
          `Subscribe to ${coachName}`
        )}
      </Button>
    </form>
  );
}

export default function SubscriptionModal({ subscription, coachName, coachUsername, onClose }: SubscriptionModalProps) {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const formatPrice = (amount: number, currency: string) => {
    return `$${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
  };

  const getIntervalText = (interval: string) => {
    switch (interval) {
      case 'week': return 'per week';
      case 'month': return 'per month';
      case 'year': return 'per year';
      default: return `per ${interval}`;
    }
  };

  const getIntervalIcon = (interval: string) => {
    switch (interval) {
      case 'week': return <Clock className="h-4 w-4" />;
      case 'year': return <Calendar className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const createPaymentIntent = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/subscriptions/${subscription.id}/create-payment-intent`);
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setShowPayment(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = () => {
    setIsLoading(true);
    createPaymentIntent.mutate();
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/my-subscriptions"] });
    onClose();
  };

  if (!stripePromise) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Setup Required</DialogTitle>
            <DialogDescription>
              Payment processing is not available at the moment. Please try again later.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Crown className="h-5 w-5 mr-2 text-yellow-500" />
            Subscribe to {coachName}
          </DialogTitle>
          <DialogDescription>
            Get personalized coaching and exclusive access to training programs
          </DialogDescription>
        </DialogHeader>

        {!showPayment ? (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{subscription.title}</span>
                  <Badge variant="secondary" className="flex items-center">
                    {getIntervalIcon(subscription.priceInterval)}
                    <span className="ml-1">{subscription.priceInterval}</span>
                  </Badge>
                </CardTitle>
                <CardDescription>{subscription.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Price:</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {formatPrice(subscription.priceAmount, subscription.priceCurrency)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getIntervalText(subscription.priceInterval)}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">What's included:</h4>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Personalized coaching from @{coachUsername}
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Access to exclusive training programs
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Direct communication and feedback
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Progress tracking and analysis
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={handleSubscribe} 
              disabled={isLoading || createPaymentIntent.isPending}
              className="w-full"
            >
              {isLoading || createPaymentIntent.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Setting up payment...
                </div>
              ) : (
                <>
                  <Heart className="h-4 w-4 mr-2" />
                  Subscribe for {formatPrice(subscription.priceAmount, subscription.priceCurrency)}
                </>
              )}
            </Button>
          </div>
        ) : (
          clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <div className="space-y-4">
                <div className="text-center py-2">
                  <h3 className="font-medium">Complete your subscription</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(subscription.priceAmount, subscription.priceCurrency)} {getIntervalText(subscription.priceInterval)}
                  </p>
                </div>
                <CheckoutForm 
                  subscription={subscription} 
                  coachName={coachName}
                  onSuccess={handleSuccess}
                />
              </div>
            </Elements>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}