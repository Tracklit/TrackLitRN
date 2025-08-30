import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Minus,
  CreditCard
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function MarketplaceCart() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cartItems, isLoading } = useQuery({
    queryKey: ['/api/marketplace/cart'],
    queryFn: async () => {
      const response = await fetch('/api/marketplace/cart');
      if (!response.ok) throw new Error('Failed to fetch cart');
      return response.json();
    }
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      return apiRequest(`/api/marketplace/cart/${id}`, {
        method: 'PATCH',
        body: { quantity }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/cart'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to update cart item",
        variant: "destructive"
      });
    }
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/marketplace/cart/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/cart'] });
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive"
      });
    }
  });

  const formatPrice = (cents: number, currency: string = 'USD') => {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const calculateSubtotal = () => {
    if (!cartItems) return 0;
    return cartItems.reduce((total: number, item: any) => {
      return total + (item.listing?.priceCents || 0) * item.quantity;
    }, 0);
  };

  const calculatePlatformFee = (subtotal: number) => {
    // Default 20% platform fee (would be calculated server-side based on user tier)
    return Math.round(subtotal * 0.20);
  };

  const subtotalCents = calculateSubtotal();
  const platformFeeCents = calculatePlatformFee(subtotalCents);
  const totalCents = subtotalCents + platformFeeCents;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-32 mb-8" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-700 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/marketplace">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Shopping Cart</h1>
            <p className="text-gray-300">
              {cartItems?.length || 0} {cartItems?.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {cartItems && cartItems.length > 0 ? (
              <div className="space-y-4">
                {cartItems.map((item: any) => (
                  <Card key={item.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Item Image */}
                        <div className="w-20 h-20 bg-gray-700 rounded-lg flex-shrink-0 overflow-hidden">
                          {item.listing?.heroUrl ? (
                            <img 
                              src={item.listing.heroUrl} 
                              alt={item.listing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              <ShoppingCart className="h-8 w-8" />
                            </div>
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-white truncate">
                                {item.listing?.title || 'Unknown Item'}
                              </h3>
                              <p className="text-gray-300 text-sm">
                                by {item.listing?.coach?.name || 'Unknown Coach'}
                              </p>
                              <Badge 
                                variant={item.type === 'program' ? 'default' : 'secondary'}
                                className="mt-2"
                              >
                                {item.type === 'program' ? 'Training Program' : 'Consulting'}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-white">
                                {formatPrice(item.listing?.priceCents || 0, item.listing?.currency)}
                              </div>
                              {item.type === 'consulting' && (
                                <div className="text-sm text-gray-400">per session</div>
                              )}
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-3">
                              <span className="text-gray-300 text-sm">Quantity:</span>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantityMutation.mutate({ 
                                    id: item.id, 
                                    quantity: Math.max(1, item.quantity - 1) 
                                  })}
                                  disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                                  className="h-8 w-8 p-0 bg-white/10 border-white/20 text-white"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="text-white font-medium w-8 text-center">
                                  {item.quantity}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantityMutation.mutate({ 
                                    id: item.id, 
                                    quantity: item.quantity + 1 
                                  })}
                                  disabled={updateQuantityMutation.isPending}
                                  className="h-8 w-8 p-0 bg-white/10 border-white/20 text-white"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeItemMutation.mutate(item.id)}
                              disabled={removeItemMutation.isPending}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-12 text-center">
                  <ShoppingCart className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Your cart is empty</h3>
                  <p className="text-gray-300 mb-6">Browse our marketplace to find training programs and coaching</p>
                  <Link href="/marketplace">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                      Browse Marketplace
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          {cartItems && cartItems.length > 0 && (
            <div className="lg:col-span-1">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 sticky top-4">
                <CardHeader>
                  <CardTitle className="text-white">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span>{formatPrice(subtotalCents)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Platform Fee (20%)</span>
                    <span>{formatPrice(platformFeeCents)}</span>
                  </div>
                  <Separator className="bg-white/20" />
                  <div className="flex justify-between text-lg font-semibold text-white">
                    <span>Total</span>
                    <span>{formatPrice(totalCents)}</span>
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    size="lg"
                    disabled={!cartItems.length}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Checkout
                  </Button>
                  
                  <div className="text-xs text-gray-400 text-center">
                    <p>Secure checkout powered by Stripe</p>
                    <p className="mt-1">30-day money-back guarantee</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}