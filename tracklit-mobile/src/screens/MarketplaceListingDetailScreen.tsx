import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';

import { Text } from '@/components/ui/Text';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { getScreenContentBottomPadding } from '@/utils/layoutPadding';
import theme from '@/utils/theme';
import type { RootStackParamList } from '@/navigation/types';
import { goBackOrNavigateToScreen } from '@/navigation/appNavigation';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type RouteT = RouteProp<RootStackParamList, 'MarketplaceListingDetail'>;

type ListingType = 'program' | 'consulting';

interface Listing {
  id: number;
  type: ListingType;
  title: string;
  subtitle?: string | null;
  heroUrl?: string | null;
  priceCents: number;
  currency?: string | null;
  tags?: string[];
  badges?: string[];
  rating?: number | null;
  visibility?: string;
  coach: {
    id: number;
    name: string;
    username?: string | null;
    profileImageUrl?: string | null;
    verified?: boolean | null;
  };
  // optional program fields (depending on server implementation)
  durationWeeks?: number | null;
  level?: string | null;
  category?: string | null;
}

export const MarketplaceListingDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<RouteT>();
  const { user } = useAuth();
  const isGuest = user?.id === 'guest';
  const listingId = route.params.id;

  const [quantity, setQuantity] = useState(1);

  const listingQuery = useQuery({
    queryKey: ['marketplace-listing', listingId],
    queryFn: () => apiRequest<Listing>(`/api/marketplace/listings/${listingId}`),
    enabled: !!listingId && !isGuest,
  });

  const reviewsQuery = useQuery({
    queryKey: ['marketplace-listing', listingId, 'reviews'],
    queryFn: () => apiRequest<any[]>(`/api/marketplace/listings/${listingId}/reviews`),
    enabled: !!listingId && !isGuest,
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (isGuest) throw new Error('Login required');
      const listing = listingQuery.data;
      if (!listing) throw new Error('Missing listing');
      return apiRequest('/api/marketplace/cart', {
        method: 'POST',
        data: { listingId: listing.id, type: listing.type, quantity },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-cart'] });
      Alert.alert('Added to cart', 'Item added to your cart.');
      navigation.navigate('MarketplaceCart');
    },
    onError: (error: Error) => {
      Alert.alert('Add failed', error.message || 'Please try again.');
    },
  });

  const formatPrice = (priceCents: number, currency: string = 'USD') => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(priceCents / 100);
    } catch {
      return `$${(priceCents / 100).toFixed(2)}`;
    }
  };

  const contentBottomPadding = useMemo(
    () => getScreenContentBottomPadding(insets.bottom, { includeBottomNav: false, extra: theme.spacing.xl }),
    [insets.bottom],
  );

  const listing = listingQuery.data;
  const reviewCount = (reviewsQuery.data ?? []).length;
  const handleBackPress = () => {
    goBackOrNavigateToScreen(navigation, 'Marketplace');
  };

  return (
    <LinearGradient colors={theme.gradient.background} locations={theme.gradient.locations} style={styles.container}>
      <ScrollView style={{ paddingTop: insets.top }} contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }]} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleBackPress}>
            <FontAwesome5 name="arrow-left" size={18} color={theme.colors.foreground} solid />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="h3" weight="bold" color="foreground">
              Listing
            </Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('MarketplaceCart')}>
            <FontAwesome5 name="shopping-cart" size={18} color={theme.colors.foreground} solid />
          </TouchableOpacity>
        </View>

        {isGuest ? (
          <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
            Sign in to view marketplace listings.
          </Text>
        ) : listingQuery.isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text variant="body" color="muted">
              Loading listing...
            </Text>
          </View>
        ) : listingQuery.isError || !listing ? (
          <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
            Unable to load listing.
          </Text>
        ) : (
          <>
            <Card style={styles.card}>
              <CardContent style={{ padding: 0 }}>
                {listing.heroUrl ? (
                  <Image source={{ uri: listing.heroUrl }} style={styles.hero} resizeMode="cover" />
                ) : (
                  <View style={styles.heroPlaceholder}>
                    <FontAwesome5 name="image" size={28} color={theme.colors.textMuted} solid />
                    <Text variant="small" color="muted" style={{ marginTop: theme.spacing.sm }}>
                      No image
                    </Text>
                  </View>
                )}
                <View style={styles.heroBadge}>
                  <Badge variant={listing.type === 'program' ? 'default' : 'secondary'} size="sm">
                    {listing.type === 'program' ? 'Program' : 'Consulting'}
                  </Badge>
                </View>
              </CardContent>
            </Card>

            <Card style={styles.card}>
              <CardHeader style={{ paddingBottom: theme.spacing.sm }}>
                <CardTitle>{listing.title}</CardTitle>
              </CardHeader>
              <CardContent style={{ gap: theme.spacing.sm }}>
                {!!listing.subtitle && (
                  <Text variant="body" color="muted">
                    {listing.subtitle}
                  </Text>
                )}

                <View style={styles.rowBetween}>
                  <Text variant="h3" weight="bold" color="primary">
                    {formatPrice(listing.priceCents, listing.currency || 'USD')}
                  </Text>
                  {!!listing.rating && (
                    <View style={styles.ratingRow}>
                      <FontAwesome5 name="star" size={14} color={theme.colors.primary} solid />
                      <Text variant="small" color="foreground">
                        {listing.rating.toFixed(1)} ({reviewCount})
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.coachRow}>
                  <FontAwesome5 name="user" size={14} color={theme.colors.textMuted} solid />
                  <Text variant="small" color="muted" style={{ flex: 1 }}>
                    Coach: {listing.coach?.name}
                  </Text>
                </View>

                {listing.tags && listing.tags.length > 0 && (
                  <View style={styles.tagRow}>
                    {listing.tags.slice(0, 6).map((t) => (
                      <Badge key={t} variant="outline" size="sm">
                        {t}
                      </Badge>
                    ))}
                  </View>
                )}

                <View style={styles.qtyRow}>
                  <Text variant="body" weight="semiBold" color="foreground">
                    Quantity
                  </Text>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                    >
                      <FontAwesome5 name="minus" size={14} color={theme.colors.foreground} solid />
                    </TouchableOpacity>
                    <Text variant="body" color="foreground" style={{ width: 24, textAlign: 'center' }}>
                      {quantity}
                    </Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q) => Math.min(99, q + 1))}>
                      <FontAwesome5 name="plus" size={14} color={theme.colors.foreground} solid />
                    </TouchableOpacity>
                  </View>
                </View>

                <Button
                  variant="default"
                  size="lg"
                  onPress={() => addToCartMutation.mutate()}
                  loading={addToCartMutation.isPending}
                  disabled={addToCartMutation.isPending}
                >
                  <FontAwesome5 name="shopping-cart" size={16} color="white" solid />
                  <Text variant="body" weight="bold" color="primary-foreground" style={{ marginLeft: theme.spacing.sm }}>
                    Add to cart
                  </Text>
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: theme.spacing.lg, gap: theme.spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.lg },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm },
  card: { marginBottom: 0 },
  hero: { width: '100%', height: 220, borderRadius: theme.borderRadius.lg },
  heroPlaceholder: {
    width: '100%',
    height: 220,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: { position: 'absolute', top: theme.spacing.md, left: theme.spacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  coachRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: theme.spacing.sm },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
});

