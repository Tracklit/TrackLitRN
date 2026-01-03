import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Text } from '@/components/ui/Text';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { ScreenHeader } from '@/components/ScreenHeader';
import { getScreenContentBottomPadding } from '@/utils/layoutPadding';
import theme from '@/utils/theme';
import type { RootStackParamList } from '@/navigation/types';

type ListingType = 'program' | 'consulting';

interface MarketplaceListing {
  id: number;
  type: ListingType;
  title: string;
  subtitle?: string | null;
  heroUrl?: string | null;
  priceCents: number;
  currency?: string | null;
  tags?: string[];
  badges?: string[];
  visibility?: string;
  coach: {
    id: number;
    name: string;
    profileImageUrl?: string | null;
  };
}

interface MarketplaceListingsResponse {
  items: MarketplaceListing[];
  total: number | string;
}

const CATEGORIES = ['Sprint', 'Distance', 'Jumping', 'Throwing', 'Combined', 'Strength'] as const;

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

export const MarketplaceScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';
  const contentBottomPadding = getScreenContentBottomPadding(insets.bottom, { includeBottomNav: true });

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const listingsQuery = useQuery({
    queryKey: ['marketplace-listings', query, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.trim()) params.append('query', query.trim());
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('sort', 'newest');
      params.append('limit', '20');

      return apiRequest<MarketplaceListingsResponse>(`/api/marketplace/listings?${params.toString()}`);
    },
    enabled: isAuthenticated && !isGuest,
  });

  const items = useMemo(() => listingsQuery.data?.items ?? [], [listingsQuery.data]);

  const handleToggleCategory = (category: string) => {
    setSelectedCategory((prev) => (prev === category ? '' : category));
  };

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: contentBottomPadding }]}
        refreshControl={
          <RefreshControl
            tintColor="#fff"
            refreshing={listingsQuery.isFetching}
            onRefresh={() => listingsQuery.refetch()}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Marketplace"
          subtitle="Browse programs and services"
          containerStyle={styles.header}
        />

        {(!isAuthenticated || isGuest) && (
          <View style={styles.emptyState}>
            <Text variant="h4" weight="semiBold" color="foreground" style={styles.emptyTitle}>
              Sign In Required
            </Text>
            <Text variant="body" color="muted" style={styles.emptyDescription}>
              Sign in to browse marketplace listings.
            </Text>
          </View>
        )}

        {isAuthenticated && !isGuest && (
          <>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionChip} onPress={() => navigation.navigate('MarketplaceCart')}>
                <Text variant="small" weight="medium" color="foreground">
                  Cart
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionChip} onPress={() => navigation.navigate('MarketplaceCreateListing')}>
                <Text variant="small" weight="medium" color="foreground">
                  Create listing
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search programs, coaches, keywords..."
              placeholderTextColor={theme.colors.textMuted}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />

            <View style={styles.categoryRow}>
              {CATEGORIES.map((category) => {
                const active = selectedCategory === category;
                return (
                  <TouchableOpacity
                    key={category}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                    onPress={() => handleToggleCategory(category)}
                  >
                    <Text
                      variant="small"
                      weight="medium"
                      style={{ color: active ? theme.colors.foreground : theme.colors.textSecondary }}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {listingsQuery.isLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text variant="body" color="muted" style={styles.emptyDescription}>
                  Loading marketplace...
                </Text>
              </View>
            ) : listingsQuery.isError ? (
              <View style={styles.emptyState}>
                <Text variant="body" color="muted" style={styles.emptyDescription}>
                  Unable to load marketplace listings. Pull to refresh.
                </Text>
              </View>
            ) : items.length === 0 ? (
              <View style={styles.emptyState}>
                <Text variant="h4" weight="semiBold" color="foreground" style={styles.emptyTitle}>
                  No listings found
                </Text>
                <Text variant="body" color="muted" style={styles.emptyDescription}>
                  Try adjusting your search or filters.
                </Text>
              </View>
            ) : (
              <View style={styles.listingsContainer}>
                {items.map((listing) => (
                  <TouchableOpacity key={listing.id} activeOpacity={0.85} onPress={() => navigation.navigate('MarketplaceListingDetail', { id: listing.id })}>
                    <Card style={styles.listingCard}>
                      <CardHeader style={styles.listingHeader}>
                        <View style={styles.listingTitleRow}>
                          <CardTitle style={styles.listingTitle}>{listing.title}</CardTitle>
                          <Badge variant="outline" size="sm">
                            {listing.type === 'consulting' ? 'Consulting' : 'Program'}
                          </Badge>
                        </View>
                        {!!listing.subtitle && (
                          <Text variant="small" color="muted">
                            {listing.subtitle}
                          </Text>
                        )}
                        <Text variant="small" color="muted">
                          By {listing.coach?.name ?? 'Coach'}
                        </Text>
                      </CardHeader>

                      <CardContent>
                        <View style={styles.priceRow}>
                          <Text variant="h3" weight="bold" color="primary">
                            {formatPrice(listing.priceCents, listing.currency ?? 'USD')}
                          </Text>
                        </View>

                        {!!listing.badges?.length && (
                          <View style={styles.badgeRow}>
                            {listing.badges.slice(0, 2).map((b) => (
                              <Badge key={b} variant="secondary" size="sm">
                                {b}
                              </Badge>
                            ))}
                          </View>
                        )}

                        {!!listing.tags?.length && (
                          <View style={styles.badgeRow}>
                            {listing.tags.slice(0, 3).map((t) => (
                              <Badge key={t} variant="outline" size="sm">
                                {t}
                              </Badge>
                            ))}
                          </View>
                        )}

                        <Text variant="small" color="muted">
                          Tap to view details.
                        </Text>
                      </CardContent>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  actionChip: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  searchInput: {
    width: '100%',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background + 'CC',
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.lg,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  categoryChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.muted,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  listingsContainer: {
    gap: theme.spacing.md,
  },
  listingCard: {
    marginBottom: theme.spacing.md,
  },
  listingHeader: {
    paddingBottom: theme.spacing.sm,
  },
  listingTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  listingTitle: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl * 2,
  },
  emptyTitle: {
    marginBottom: theme.spacing.md,
  },
  emptyDescription: {
    textAlign: 'center',
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
});
