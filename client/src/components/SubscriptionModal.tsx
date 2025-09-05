import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Crown, Calendar, CreditCard, Check, X } from "lucide-react";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { apiRequest } from "@/lib/queryClient";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any; // The coach offering the subscription
  subscription?: any; // The subscription offer
  currentUser?: any; // The current logged-in user (potential subscriber)
}

// Payment form component
function PaymentForm({ 
  subscription, 
  coachName, 
  billingType, 
  onSuccess, 
  onCancel 
}: { 
  subscription: any; 
  coachName: string; 
  billingType: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/subscription-success`,
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message || "Unable to process payment",
          variant: "destructive",
        });
      } else {
        onSuccess();
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getAmount = () => {
    switch (billingType) {
      case 'monthly': return subscription.monthlyRate;
      case 'weekly': return subscription.weeklyRate;
      case 'session': return subscription.sessionRate;
      default: return subscription.monthlyRate;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Subscription Summary */}
      <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-lg p-4 border border-purple-500/20">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-white">Subscription Summary</h4>
          <Badge className="bg-purple-600 text-white">
            <Crown className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        </div>
        <p className="text-sm text-gray-300 mb-3">{subscription.title}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Coach: {coachName}</span>
          <span className="text-lg font-bold text-white">
            ${getAmount()}/{billingType === 'session' ? 'session' : billingType.replace('ly', '')}
          </span>
        </div>
      </div>

      {/* Payment Element */}
      <div className="space-y-4">
        <Label className="text-white">Payment Information</Label>
        <PaymentElement className="p-3 bg-white rounded-md" />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Processing...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Subscribe ${getAmount()}
            </div>
          )}
        </Button>
      </div>
    </form>
  );
}

export function SubscriptionModal({
  isOpen,
  onClose,
  user,
  subscription,
  currentUser,
}: SubscriptionModalProps) {
  const { toast } = useToast();
  const [selectedBillingType, setSelectedBillingType] = useState<string>('monthly');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setShowPaymentForm(false);
      setClientSecret('');
      setSelectedBillingType('monthly');
    }
  }, [isOpen]);

  const handleSubscribe = async () => {
    if (!subscription || !user) return;

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/create-subscription', {
        coachId: user.id,
        subscriptionId: subscription.id,
        billingType: selectedBillingType,
      });

      const data = await response.json();
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowPaymentForm(true);
      } else {
        throw new Error('Failed to create payment intent');
      }
    } catch (error: any) {
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Subscription Successful!",
      description: `You're now subscribed to ${user?.name || user?.username}'s coaching`,
    });
    onClose();
  };

  const getAvailableOptions = () => {
    const options = [];
    if (subscription?.monthlyRate > 0) {
      options.push({ value: 'monthly', label: 'Monthly', price: subscription.monthlyRate });
    }
    if (subscription?.weeklyRate > 0) {
      options.push({ value: 'weekly', label: 'Weekly', price: subscription.weeklyRate });
    }
    if (subscription?.sessionRate > 0) {
      options.push({ value: 'session', label: 'Per Session', price: subscription.sessionRate });
    }
    return options;
  };

  const availableOptions = getAvailableOptions();

  // Auto-select the first available option
  useEffect(() => {
    if (availableOptions.length > 0 && !selectedBillingType) {
      setSelectedBillingType(availableOptions[0].value);
    }
  }, [availableOptions]);

  if (!user || !subscription) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Crown className="h-5 w-5 text-purple-400" />
            Subscribe to Coach
          </DialogTitle>
        </DialogHeader>

        {!showPaymentForm ? (
          <div className="space-y-6">
            {/* Coach Info */}
            <div className="flex items-center gap-3 p-4 bg-slate-800 rounded-lg">
              <img
                src={user.profileImageUrl || "/default-avatar.png"}
                alt={user.name || user.username}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <h4 className="font-semibold">{user.name || user.username}</h4>
                <p className="text-sm text-gray-400">@{user.username}</p>
              </div>
              {user.subscriptionTier && user.subscriptionTier !== 'free' && (
                <Badge className="bg-blue-600 text-white text-xs">
                  {user.subscriptionTier.toUpperCase()}
                </Badge>
              )}
            </div>

            {/* Subscription Details */}
            <div className="space-y-4">
              <div>
                <h5 className="font-semibold mb-2">{subscription.title}</h5>
                <p className="text-sm text-gray-300">{subscription.description}</p>
              </div>

              {/* Billing Options */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Choose Billing Option</Label>
                <div className="space-y-2">
                  {availableOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedBillingType === option.value
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                      }`}
                      onClick={() => setSelectedBillingType(option.value)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedBillingType === option.value 
                              ? 'border-purple-500 bg-purple-500' 
                              : 'border-gray-400'
                          }`}>
                            {selectedBillingType === option.value && (
                              <Check className="w-2 h-2 text-white ml-0.5 mt-0.5" />
                            )}
                          </div>
                          <span className="font-medium">{option.label}</span>
                        </div>
                        <span className="font-bold text-purple-400">
                          ${option.price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubscribe}
                disabled={isLoading || !selectedBillingType}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Loading...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Continue to Payment
                  </div>
                )}
              </Button>
            </div>
          </div>
        ) : clientSecret ? (
          <Elements 
            stripe={stripePromise} 
            options={{ 
              clientSecret,
              appearance: {
                theme: 'night',
                variables: {
                  colorPrimary: '#8b5cf6',
                }
              }
            }}
          >
            <PaymentForm
              subscription={subscription}
              coachName={user.name || user.username}
              billingType={selectedBillingType}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPaymentForm(false)}
            />
          </Elements>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}