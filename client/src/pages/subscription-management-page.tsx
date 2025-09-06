import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Crown, DollarSign, Clock, Calendar, Users, TrendingUp, ArrowLeft, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";

const subscriptionSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description too long"),
  priceAmount: z.number().min(1, "Minimum price is $1.00").max(1000, "Maximum price is $1,000"),
  priceCurrency: z.enum(["USD", "EUR"]),
  priceInterval: z.enum(["week", "month", "year"]),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

export default function SubscriptionManagementPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Fetch existing subscription offering
  const { data: existingSubscription, isLoading } = useQuery({
    queryKey: [`/api/users/${user?.id}/subscription`],
    enabled: !!user,
  });

  // Fetch my subscribers for stats
  const { data: subscribers } = useQuery({
    queryKey: ["/api/my-subscribers"],
    enabled: !!user,
  });

  const form = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      title: existingSubscription?.title || "Coaching Subscription",
      description: existingSubscription?.description || "Get personalized coaching and training programs",
      priceAmount: existingSubscription?.priceAmount ? existingSubscription.priceAmount / 100 : 25.00, // Convert cents to dollars
      priceCurrency: existingSubscription?.priceCurrency || "USD",
      priceInterval: existingSubscription?.priceInterval || "month",
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (existingSubscription) {
      form.reset({
        title: existingSubscription.title,
        description: existingSubscription.description,
        priceAmount: existingSubscription.priceAmount / 100, // Convert cents to dollars
        priceCurrency: existingSubscription.priceCurrency,
        priceInterval: existingSubscription.priceInterval,
      });
    }
  }, [existingSubscription, form]);

  const createOrUpdateSubscription = useMutation({
    mutationFn: async (data: SubscriptionFormData) => {
      // Convert dollars to cents for backend
      const dataWithCents = {
        ...data,
        priceAmount: Math.round(data.priceAmount * 100)
      };
      const response = await apiRequest("POST", "/api/subscriptions", dataWithCents);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Updated! 🎉",
        description: "Your coaching subscription offering has been saved.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/subscription`] });
      setLocation("/my-subscriptions");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save subscription",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SubscriptionFormData) => {
    createOrUpdateSubscription.mutate(data);
  };

  const formatPrice = (amount: number, currency: string, isInCents = false) => {
    const value = isInCents ? amount / 100 : amount;
    return `${currency === "USD" ? "$" : "€"}${value.toFixed(2)}`;
  };

  const getIntervalText = (interval: string) => {
    switch (interval) {
      case 'week': return 'per week';
      case 'month': return 'per month';
      case 'year': return 'per year';
      default: return `per ${interval}`;
    }
  };

  const getPlatformFeePercentage = () => {
    if (!user) return 22;
    switch (user.subscriptionTier) {
      case "pro": return 18;
      case "star": return 16;
      default: return 22;
    }
  };

  const calculateCoachEarnings = (amount: number, isInCents = false) => {
    const value = isInCents ? amount : amount * 100; // Convert to cents for calculation
    const feePercentage = getPlatformFeePercentage();
    const platformFee = Math.round((value * feePercentage) / 100);
    return value - platformFee;
  };

  const currentPrice = form.watch("priceAmount");
  const currentCurrency = form.watch("priceCurrency");
  const currentInterval = form.watch("priceInterval");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/profile">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Profile
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Crown className="h-8 w-8 text-yellow-500" />
                Manage Your Coaching Subscription
              </h1>
              <p className="text-muted-foreground">
                Set up your subscription offering to earn recurring income from coaching
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
                <CardDescription>
                  Configure your coaching subscription offering
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subscription Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Elite Sprint Coaching" {...field} />
                          </FormControl>
                          <FormDescription>
                            A catchy title for your coaching subscription
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe what athletes will get with your coaching subscription..."
                              className="resize-none"
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Explain the value and benefits of subscribing to your coaching
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="priceAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pricing</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                min="1"
                                max="1000"
                                step="0.01"
                                placeholder="25.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription>
                              {formatPrice(currentPrice, currentCurrency)}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="priceCurrency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="USD">USD ($)</SelectItem>
                                <SelectItem value="EUR">EUR (€)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="priceInterval"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Billing Interval</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select interval" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="week">Weekly</SelectItem>
                                <SelectItem value="month">Monthly</SelectItem>
                                <SelectItem value="year">Yearly</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" asChild>
                        <Link href="/my-subscriptions">Cancel</Link>
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createOrUpdateSubscription.isPending}
                        className="min-w-[120px]"
                      >
                        {createOrUpdateSubscription.isPending ? (
                          <div className="flex items-center">
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                            Saving...
                          </div>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {existingSubscription ? "Update Subscription" : "Create Subscription"}
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview Card */}
            <Card className="border-2 border-dashed border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Subscription Preview
                </CardTitle>
                <CardDescription>How your subscription will appear to athletes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{form.watch("title")}</h3>
                    <Badge variant="secondary" className="flex items-center">
                      {currentInterval === 'week' ? <Clock className="h-3 w-3 mr-1" /> : <Calendar className="h-3 w-3 mr-1" />}
                      {currentInterval}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{form.watch("description")}</p>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm">Athletes pay:</span>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {formatPrice(currentPrice, currentCurrency)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getIntervalText(currentInterval)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm">You earn:</span>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        {formatPrice(calculateCoachEarnings(currentPrice), currentCurrency, true)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getIntervalText(currentInterval)} ({getPlatformFeePercentage()}% platform fee)
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            {subscribers && subscribers.length > 0 && (
              <div className="grid grid-cols-1 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-blue-500" />
                      <div className="ml-4">
                        <p className="text-2xl font-bold">{subscribers.length}</p>
                        <p className="text-xs text-muted-foreground">Active Subscribers</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-green-500" />
                      <div className="ml-4">
                        <p className="text-2xl font-bold">
                          {formatPrice(
                            subscribers.reduce((sum: number, sub: any) => sum + (sub.coachAmount || 0), 0),
                            "USD",
                            true
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">Monthly Earnings</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Platform Fee Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start">
                  <Crown className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="ml-3">
                    <h4 className="font-medium text-blue-900">Platform Fee: {getPlatformFeePercentage()}%</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Platform fees are what allows us to keep TrackLit alive, change your membership to lower this rate. Thank you!
                    </p>
                    <p className="text-sm text-blue-700 mt-2">
                      {user?.subscriptionTier === "free" && "Upgrade to Pro (18%) or Star (16%) to reduce fees!"}
                      {user?.subscriptionTier === "pro" && "Star members get just 16% fees - upgrade to save more!"}
                      {user?.subscriptionTier === "star" && "You have the lowest platform fee as a Star member!"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}