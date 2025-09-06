import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Users, Heart, DollarSign, Calendar, AlertTriangle, Plus, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

export default function MySubscriptionsPage() {
  const { user } = useAuth();

  // Fetch subscriptions as subscriber (coaches I'm paying)
  const { data: mySubscriptions, isLoading: isLoadingMine } = useQuery({
    queryKey: ["/api/my-subscriptions"],
  });

  // Fetch subscribers (athletes paying me)
  const { data: mySubscribers, isLoading: isLoadingSubscribers } = useQuery({
    queryKey: ["/api/my-subscribers"],
  });

  // Fetch my subscription offering
  const { data: myOffering } = useQuery({
    queryKey: [`/api/users/${user?.id}/subscription`],
    enabled: !!user,
  });

  const formatPrice = (amount: number, currency = "USD") => {
    return `${currency === "USD" ? "$" : "€"}${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "cancelled": return "bg-yellow-500";
      case "expired": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getTotalEarnings = () => {
    if (!mySubscribers) return 0;
    return mySubscribers
      .filter((sub: any) => sub.status === "active")
      .reduce((sum: number, sub: any) => sum + (sub.coachAmount || 0), 0);
  };

  const getTotalSpending = () => {
    if (!mySubscriptions) return 0;
    return mySubscriptions
      .filter((sub: any) => sub.status === "active")
      .reduce((sum: number, sub: any) => sum + (sub.totalAmount || 0), 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage your coaching subscriptions and subscriber relationships
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{mySubscriptions?.filter((s: any) => s.status === "active").length || 0}</p>
                  <p className="text-xs text-muted-foreground">Active Subscriptions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{mySubscribers?.filter((s: any) => s.status === "active").length || 0}</p>
                  <p className="text-xs text-muted-foreground">Active Subscribers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{formatPrice(getTotalEarnings() - getTotalSpending())}</p>
                  <p className="text-xs text-muted-foreground">Net Monthly Income</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="subscriptions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="subscriptions">My Subscriptions</TabsTrigger>
            <TabsTrigger value="subscribers">My Subscribers</TabsTrigger>
            <TabsTrigger value="offering">My Offering</TabsTrigger>
          </TabsList>

          {/* My Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Coaches I'm Subscribed To</h2>
              <Badge variant="secondary">{mySubscriptions?.length || 0} total</Badge>
            </div>

            {isLoadingMine ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-slate-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : mySubscriptions?.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Active Subscriptions</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Subscribe to coaches to get personalized training and guidance
                  </p>
                  <Button asChild>
                    <Link href="/explore">Find Coaches</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mySubscriptions?.map((subscription: any) => (
                  <Card key={subscription.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center text-lg">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>{subscription.coachName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {subscription.coachName}
                        </CardTitle>
                        <Badge className={getStatusColor(subscription.status)}>
                          {subscription.status}
                        </Badge>
                      </div>
                      <CardDescription>@{subscription.coachUsername}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium">{subscription.subscriptionTitle}</h4>
                        <p className="text-sm text-muted-foreground">
                          {subscription.subscriptionDescription}
                        </p>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Price:</span>
                          <span className="font-medium">
                            {formatPrice(subscription.totalAmount)} / {subscription.priceInterval}
                          </span>
                        </div>
                        {subscription.currentPeriodStart && (
                          <div className="flex justify-between text-sm">
                            <span>Current Period:</span>
                            <span>
                              {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button asChild size="sm" className="flex-1">
                          <Link href={`/profile/${subscription.coachUsername}`}>
                            View Profile
                          </Link>
                        </Button>
                        {subscription.status === "active" && (
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Subscribers Tab */}
          <TabsContent value="subscribers" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Athletes Subscribed to Me</h2>
              <Badge variant="secondary">{mySubscribers?.length || 0} total</Badge>
            </div>

            {isLoadingSubscribers ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : mySubscribers?.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Subscribers Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Set up your coaching subscription to start earning from athletes
                  </p>
                  <Button asChild>
                    <Link href="/manage-subscription">
                      <Plus className="h-4 w-4 mr-2" />
                      Set Up Subscription
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mySubscribers?.map((subscriber: any) => (
                  <Card key={subscriber.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center text-lg">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>{subscriber.subscriberName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {subscriber.subscriberName}
                        </CardTitle>
                        <Badge className={getStatusColor(subscriber.status)}>
                          {subscriber.status}
                        </Badge>
                      </div>
                      <CardDescription>@{subscriber.subscriberUsername}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subscription:</span>
                          <span className="font-medium">{subscriber.subscriptionTitle}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Your Earnings:</span>
                          <span className="font-medium text-green-600">
                            {formatPrice(subscriber.coachAmount)} / {subscriber.priceInterval}
                          </span>
                        </div>
                        {subscriber.currentPeriodStart && (
                          <div className="flex justify-between text-sm">
                            <span>Current Period:</span>
                            <span>
                              {formatDate(subscriber.currentPeriodStart)} - {formatDate(subscriber.currentPeriodEnd)}
                            </span>
                          </div>
                        )}
                      </div>

                      <Button asChild size="sm" className="w-full">
                        <Link href={`/profile/${subscriber.subscriberUsername}`}>
                          View Athlete Profile
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Offering Tab */}
          <TabsContent value="offering" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">My Subscription Offering</h2>
              <Button asChild>
                <Link href="/manage-subscription">
                  {myOffering ? (
                    <>
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Offering
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Offering
                    </>
                  )}
                </Link>
              </Button>
            </div>

            {myOffering ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Crown className="h-5 w-5 mr-2 text-yellow-500" />
                    {myOffering.title}
                  </CardTitle>
                  <CardDescription>{myOffering.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="text-2xl font-bold">
                        {formatPrice(myOffering.priceAmount, myOffering.priceCurrency)}
                      </p>
                      <p className="text-sm text-muted-foreground">per {myOffering.priceInterval}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className={myOffering.isActive ? "bg-green-500" : "bg-red-500"}>
                        {myOffering.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Your Earnings per Subscription:</p>
                    <div className="text-lg font-bold text-green-600">
                      {formatPrice(
                        myOffering.priceAmount - Math.round((myOffering.priceAmount * (user?.subscriptionTier === "star" ? 16 : user?.subscriptionTier === "pro" ? 18 : 22)) / 100),
                        myOffering.priceCurrency
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ({user?.subscriptionTier === "star" ? 16 : user?.subscriptionTier === "pro" ? 18 : 22}% platform fee)
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Subscription Offering</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a subscription offering to earn recurring income from coaching
                  </p>
                  <Button asChild>
                    <Link href="/manage-subscription">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Subscription Offering
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

      </main>
    </div>
  );
}