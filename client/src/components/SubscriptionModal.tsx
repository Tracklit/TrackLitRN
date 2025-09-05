import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Crown, Star, Users } from "lucide-react";
import type { UserSubscription } from "@shared/schema";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOwnProfile: boolean;
  userId: number;
  userRole: "athlete" | "coach" | "admin" | "both";
  subscription?: UserSubscription | null;
  onSubscriptionUpdate?: () => void;
}

export function SubscriptionModal({
  isOpen,
  onClose,
  isOwnProfile,
  userId,
  userRole,
  subscription,
  onSubscriptionUpdate,
}: SubscriptionModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priceAmount: 0,
    priceCurrency: "USD" as "USD" | "EUR",
    priceFrequency: "month" as "session" | "week" | "month" | "year",
    includedPrograms: [] as number[],
    isActive: true,
  });

  // Load existing subscription data
  useEffect(() => {
    if (subscription) {
      setFormData({
        title: subscription.title,
        description: subscription.description,
        priceAmount: subscription.priceAmount / 100, // Convert cents to dollars
        priceCurrency: subscription.priceCurrency as "USD" | "EUR",
        priceFrequency: subscription.priceFrequency as "session" | "week" | "month" | "year",
        includedPrograms: subscription.includedPrograms || [],
        isActive: subscription.isActive,
      });
    }
  }, [subscription]);

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and description are required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        priceAmount: Math.round(formData.priceAmount * 100), // Convert to cents
        userId,
      };

      const response = subscription
        ? await fetch(`/api/subscriptions/${subscription.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/subscriptions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (response.ok) {
        toast({
          title: "Success",
          description: subscription ? "Subscription updated!" : "Subscription created!",
        });
        onSubscriptionUpdate?.();
        onClose();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to save subscription");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save subscription",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!subscription) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const { paymentUrl } = await response.json();
        window.location.href = paymentUrl; // Redirect to Stripe payment
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to start subscription");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start subscription",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (amount: number, currency: string, frequency: string) => {
    const price = amount === 0 ? "Free" : `${currency === "EUR" ? "€" : "$"}${amount}`;
    return frequency === "session" ? `${price} per session` : `${price}/${frequency}`;
  };

  const getButtonText = () => {
    if (isOwnProfile) {
      return userRole === "coach" || userRole === "both" ? "Start Coaching" : "Create Subscription";
    }
    return userRole === "coach" || userRole === "both" ? "Request Coaching" : "Subscribe";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            {isOwnProfile ? (
              <>
                <Crown className="w-5 h-5 text-yellow-400" />
                {subscription ? "Edit" : "Create"} Your Subscription Offer
              </>
            ) : (
              <>
                <Users className="w-5 h-5 text-blue-400" />
                {getButtonText()}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {isOwnProfile ? (
            // Edit mode for own profile
            <>
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">
                  Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="e.g., Personal Training Sessions"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-white/10 border-white/20 text-white min-h-[100px]"
                  placeholder="Describe what you offer, your experience, and what subscribers will get..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-white">
                    Price
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.priceAmount}
                    onChange={(e) => setFormData({ ...formData, priceAmount: parseFloat(e.target.value) || 0 })}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-white">
                    Currency
                  </Label>
                  <Select
                    value={formData.priceCurrency}
                    onValueChange={(value) => setFormData({ ...formData, priceCurrency: value as "USD" | "EUR" })}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency" className="text-white">
                    Frequency
                  </Label>
                  <Select
                    value={formData.priceFrequency}
                    onValueChange={(value) => setFormData({ ...formData, priceFrequency: value as any })}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="session">Per Session</SelectItem>
                      <SelectItem value="week">Per Week</SelectItem>
                      <SelectItem value="month">Per Month</SelectItem>
                      <SelectItem value="year">Per Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="active" className="text-white">
                  Active (visible to others)
                </Label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300">
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isLoading ? "Saving..." : subscription ? "Update" : "Create"}
                </Button>
              </div>
            </>
          ) : (
            // View mode for other users' profiles
            subscription && (
              <>
                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 rounded-lg border border-blue-500/20">
                  <h3 className="text-xl font-semibold text-white mb-2">{subscription.title}</h3>
                  <p className="text-gray-300 mb-4">{subscription.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <span className="text-lg font-semibold text-white">
                        {formatPrice(subscription.priceAmount / 100, subscription.priceCurrency, subscription.priceFrequency)}
                      </span>
                    </div>
                    
                    {subscription.priceAmount === 0 && (
                      <Badge variant="success" className="bg-green-600 text-white">
                        Free
                      </Badge>
                    )}
                  </div>
                </div>

                {subscription.includedPrograms && subscription.includedPrograms.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-white">Included Programs</Label>
                    <div className="flex flex-wrap gap-2">
                      {subscription.includedPrograms.map((programId) => (
                        <Badge key={programId} variant="secondary" className="bg-gray-700 text-gray-200">
                          Program #{programId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                  <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubscribe}
                    disabled={isLoading || !subscription.isActive}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    {isLoading ? "Processing..." : subscription.priceAmount === 0 ? "Subscribe for Free" : `Subscribe for ${formatPrice(subscription.priceAmount / 100, subscription.priceCurrency, subscription.priceFrequency)}`}
                  </Button>
                </div>
              </>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}