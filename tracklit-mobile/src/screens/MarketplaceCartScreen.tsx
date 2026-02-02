import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';

import { Text } from '@/components/ui/Text';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import { getScreenContentBottomPadding } from '@/utils/layoutPadding';
import theme from '@/utils/theme';
import type { RootStackParamList } from '@/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

interface CartItem {
  id: number;
  type: 'program' | 'consulting';
  quantity: number;
  listing?: {
    id: number;
    title: string;
    heroUrl?: string | null;
    priceCents: number;
    currency?: string | null;
    coach?: { name: string };
  };
}

export const MarketplaceCartScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();
  const isGuest = user?.id === 'guest';

  const cartQuery = useQuery({
    queryKey: ['marketplace-cart'],
    queryFn: () => apiRequest<CartItem[]>('/api/marketplace/cart'),
    enabled: !isGuest,
  });

  const updateQtyMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) =>
      apiRequest(`/api/marketplace/cart/${id}`, { method: 'PATCH', data: { quantity } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketplace-cart'] }),
    onError: (error: Error) => Alert.alert('Update failed', error.message || 'Please try again.'),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/marketplace/cart/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marketplace-cart'] }),
    onError: (error: Error) => Alert.alert('Remove failed', error.message || 'Please try again.'),
  });

  const items = useMemo(() => cartQuery.data ?? [], [cartQuery.data]);

  const subtotalCents = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.listing?.priceCents ?? 0) * (item.quantity ?? 1), 0);
  }, [items]);

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

  return (
    <LinearGradient colors={theme.gradient.background} locations={theme.gradient.locations} style={styles.container}>
      <ScrollView style={{ paddingTop: insets.top }} contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }]} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <FontAwesome5 name="arrow-left" size={18} color={theme.colors.foreground} solid />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="h3" weight="bold" color="foreground">
              Cart
            </Text>
            <Text variant="small" color="muted">
              {items.length} item{items.length === 1 ? '' : 's'}
            </Text>
          </View>
          <View style={styles.iconBtn} />
        </View>

        {isGuest ? (
          <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
            Sign in to use the marketplace cart.
          </Text>
        ) : cartQuery.isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text variant="body" color="muted">
              Loading cart...
            </Text>
          </View>
        ) : cartQuery.isError ? (
          <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
            Unable to load cart.
          </Text>
        ) : items.length === 0 ? (
          <Text variant="body" color="muted" style={{ textAlign: 'center', paddingVertical: theme.spacing.lg }}>
            Your cart is empty.
          </Text>
        ) : (
          <>
            <View style={styles.list}>
              {items.map((item) => (
                <Card key={item.id} style={styles.card}>
                  <CardContent style={styles.itemRow}>
                    <View style={styles.thumb}>
                      {item.listing?.heroUrl ? (
                        <Image source={{ uri: item.listing.heroUrl }} style={{ width: '100%', height: '100%' }} />
                      ) : (
                        <View style={styles.thumbPlaceholder}>
                          <FontAwesome5 name="shopping-cart" size={18} color={theme.colors.textMuted} solid />
                        </View>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text variant="body" weight="semiBold" color="foreground" numberOfLines={1}>
                        {item.listing?.title || 'Unknown item'}
                      </Text>
                      <Text variant="small" color="muted">
                        {item.type === 'program' ? 'Training Program' : 'Consulting'} • {item.listing?.coach?.name ? `by ${item.listing.coach.name}` : ''}
                      </Text>
                      <Text variant="body" color="foreground" style={{ marginTop: theme.spacing.xs }}>
                        {formatPrice(item.listing?.priceCents || 0, item.listing?.currency || 'USD')}
                      </Text>

                      <View style={styles.qtyRow}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQtyMutation.mutate({ id: item.id, quantity: Math.max(1, (item.quantity ?? 1) - 1) })}
                        >
                          <FontAwesome5 name="minus" size={14} color={theme.colors.foreground} solid />
                        </TouchableOpacity>
                        <Text variant="body" color="foreground" style={{ width: 28, textAlign: 'center' }}>
                          {item.quantity}
                        </Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQtyMutation.mutate({ id: item.id, quantity: Math.min(99, (item.quantity ?? 1) + 1) })}
                        >
                          <FontAwesome5 name="plus" size={14} color={theme.colors.foreground} solid />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.removeBtn}
                          onPress={() =>
                            Alert.alert('Remove item?', 'Remove this item from your cart?', [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Remove', style: 'destructive', onPress: () => removeMutation.mutate(item.id) },
                            ])
                          }
                        >
                          <FontAwesome5 name="trash" size={14} color={theme.colors.destructive} solid />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>

            <Card style={styles.card}>
              <CardHeader style={{ paddingBottom: theme.spacing.sm }}>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent style={{ gap: theme.spacing.sm }}>
                <View style={styles.summaryRow}>
                  <Text variant="body" color="muted">
                    Subtotal
                  </Text>
                  <Text variant="body" color="foreground" weight="semiBold">
                    {formatPrice(subtotalCents)}
                  </Text>
                </View>
                <Text variant="small" color="muted">
                  Checkout/payment is web-only for now; this cart parity ensures add/update/remove works on mobile.
                </Text>
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
  list: { gap: theme.spacing.md },
  card: { marginBottom: 0 },
  itemRow: { flexDirection: 'row', gap: theme.spacing.md, paddingVertical: theme.spacing.md },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  thumbPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
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
  removeBtn: {
    marginLeft: 'auto',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});


