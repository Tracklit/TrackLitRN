import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
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
import { SkeletonGrid } from '@/components/Skeleton';
import themeStatic from '@/utils/theme';
import type { RootStackParamList } from '@/navigation/types';
import { KeyboardAwareScreenScrollView } from '@/components/keyboard/KeyboardAwareScroll';

import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';
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
  const { styles, theme } = useThemedStyles(createStyles);
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
      style={styles.container}
    >
      <KeyboardAwareScreenScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={{ paddingTop: insets.top }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: contentBottomPadding }]}
        extraScrollHeight={80}
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
                <SkeletonGrid count={4} />
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
      </KeyboardAwareScreenScrollView>
    </LinearGradient>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: themeStatic.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: themeStatic.spacing.xl,
    marginBottom: themeStatic.spacing.xl,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: themeStatic.spacing.md,
    marginBottom: themeStatic.spacing.lg,
  },
  actionChip: {
    flex: 1,
    paddingVertical: themeStatic.spacing.md,
    borderRadius: themeStatic.borderRadius.lg,
    backgroundColor: t.colors.card,
    borderWidth: 1,
    borderColor: t.colors.border,
    alignItems: 'center',
  },
  searchInput: {
    width: '100%',
    borderRadius: themeStatic.borderRadius.lg,
    backgroundColor: t.colors.background + 'CC',
    borderWidth: 1,
    borderColor: t.colors.border,
    paddingHorizontal: themeStatic.spacing.lg,
    paddingVertical: themeStatic.spacing.md,
    color: t.colors.foreground,
    marginBottom: themeStatic.spacing.lg,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: themeStatic.spacing.sm,
    marginBottom: themeStatic.spacing.xl,
  },
  categoryChip: {
    paddingHorizontal: themeStatic.spacing.md,
    paddingVertical: themeStatic.spacing.sm,
    borderRadius: themeStatic.borderRadius.lg,
    backgroundColor: t.colors.muted,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  categoryChipActive: {
    backgroundColor: t.colors.primary,
    borderColor: t.colors.primary,
  },
  listingsContainer: {
    gap: themeStatic.spacing.md,
  },
  listingCard: {
    marginBottom: themeStatic.spacing.md,
  },
  listingHeader: {
    paddingBottom: themeStatic.spacing.sm,
  },
  listingTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: themeStatic.spacing.md,
    marginBottom: themeStatic.spacing.xs,
  },
  listingTitle: {
    flex: 1,
    marginRight: themeStatic.spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: themeStatic.spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: themeStatic.spacing.xs,
    marginBottom: themeStatic.spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: themeStatic.spacing.xl * 2,
  },
  emptyTitle: {
    marginBottom: themeStatic.spacing.md,
  },
  emptyDescription: {
    textAlign: 'center',
    marginTop: themeStatic.spacing.md,
    paddingHorizontal: themeStatic.spacing.lg,
  },
});
