import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
if (!stripePublicKey) {
  console.warn('Stripe public key not configured - checkout functionality disabled');
}
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

const CheckoutForm = ({ programId, program }: { programId: number, program: any }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
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
          return_url: `${window.location.origin}/programs/${programId}`,
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
        await apiRequest("POST", `/api/programs/${programId}/confirm-payment`, {
          paymentIntentId: paymentIntent.id
        });

        toast({
          title: "Payment Successful",
          description: "Thank you for your purchase! You now have access to this program.",
        });
        
        // Redirect to program page
        setLocation(`/programs/${programId}`);
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Order Summary</h3>
        <div className="flex justify-between items-center">
          <span>{program?.title}</span>
          <span className="font-medium">${program?.price}</span>
        </div>
      </div>
      
      <PaymentElement />
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
      >
        <CreditCard className="h-4 w-4 mr-2" />
        {isProcessing ? "Processing..." : `Pay $${program?.price}`}
      </Button>
    </form>
  );
};

export default function CheckoutPage() {
  const params = useParams();
  const programId = parseInt(params.id as string);
  const [clientSecret, setClientSecret] = useState("");
  const [program, setProgram] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!programId) return;

    // Fetch program details and create payment intent
    Promise.all([
      apiRequest("GET", `/api/programs/${programId}`).then(res => res.json()),
      apiRequest("POST", `/api/programs/${programId}/create-payment-intent`).then(res => res.json())
    ])
    .then(([programData, paymentData]) => {
      setProgram(programData);
      setClientSecret(paymentData.clientSecret);
    })
    .catch((error) => {
      console.error("Error loading checkout:", error);
      setError("Failed to load checkout. Please try again.");
    });
  }, [programId]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button asChild>
                <Link href={`/programs/${programId}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Program
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret || !program) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p>Loading checkout...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/programs/${programId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Program
            </Link>
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Purchase</CardTitle>
              <CardDescription>
                You're purchasing "{program.title}"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm programId={programId} program={program} />
              </Elements>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}