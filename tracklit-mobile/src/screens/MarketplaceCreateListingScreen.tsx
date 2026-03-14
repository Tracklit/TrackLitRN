import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
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
import { KeyboardAwareScreenScrollView } from '@/components/keyboard/KeyboardAwareScroll';
import { goBackOrNavigateToScreen } from '@/navigation/appNavigation';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type ListingType = 'program' | 'consulting';

export const MarketplaceCreateListingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();
  const isGuest = user?.id === 'guest';

  const [type, setType] = useState<ListingType>('program');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [price, setPrice] = useState('99.99'); // dollars
  const [category, setCategory] = useState('sprint');
  const [level, setLevel] = useState('intermediate');
  const [durationWeeks, setDurationWeeks] = useState('8');

  // Optional: allow selecting one of coach programs (if supported)
  const coachProgramsQuery = useQuery({
    queryKey: ['marketplace-programs-mine'],
    queryFn: () => apiRequest<{ items: any[] }>('/api/marketplace/programs/mine'),
    enabled: !isGuest,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (isGuest) throw new Error('Login required');
      if (!title.trim()) throw new Error('Title is required.');

      const priceCents = Math.round(Number(price) * 100);
      if (!Number.isFinite(priceCents) || priceCents < 0) throw new Error('Invalid price.');

      const listing = {
        type,
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        heroUrl: null,
        priceCents,
        currency: 'USD',
        tags: [],
        badges: [],
        rating: null,
        visibility: 'public',
      };

      const typeSpecific =
        type === 'program'
          ? {
              // If your backend expects a programId, you can wire it in later from coachProgramsQuery.
              programId: null,
              durationWeeks: Math.max(1, parseInt(durationWeeks || '8', 10)),
              level,
              category,
            }
          : {
              slotLengthMin: 60,
              pricePerSlotCents: priceCents,
              maxParticipants: 1,
              deliveryFormat: 'video-call',
              sessionDurationMinutes: 60,
              category,
            };

      return apiRequest('/api/marketplace/listings', { method: 'POST', data: { listing, typeSpecific } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      Alert.alert('Created', 'Listing created successfully.');
      goBackOrNavigateToScreen(navigation, 'Marketplace');
    },
    onError: (error: Error) => {
      Alert.alert('Create failed', error.message || 'Please try again.');
    },
  });

  const contentBottomPadding = useMemo(
    () => getScreenContentBottomPadding(insets.bottom, { includeBottomNav: false, extra: theme.spacing.xl }),
    [insets.bottom],
  );
  const handleBackPress = () => {
    goBackOrNavigateToScreen(navigation, 'Marketplace');
  };

  return (
    <LinearGradient colors={theme.gradient.background} locations={theme.gradient.locations} style={styles.container}>
      <KeyboardAwareScreenScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={{ paddingTop: insets.top }}
        contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }]}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={80}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleBackPress}>
            <FontAwesome5 name="arrow-left" size={18} color={theme.colors.foreground} solid />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="h3" weight="bold" color="foreground">
              Create Listing
            </Text>
            <Text variant="small" color="muted">
              Coach-only marketplace feature
            </Text>
          </View>
          <View style={styles.iconBtn} />
        </View>

        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Type</CardTitle>
          </CardHeader>
          <CardContent style={{ gap: theme.spacing.sm }}>
            <View style={styles.typeRow}>
              <TouchableOpacity style={[styles.typeChip, type === 'program' && styles.typeChipActive]} onPress={() => setType('program')}>
                <Badge variant={type === 'program' ? 'default' : 'outline'} size="sm">
                  Program
                </Badge>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeChip, type === 'consulting' && styles.typeChipActive]} onPress={() => setType('consulting')}>
                <Badge variant={type === 'consulting' ? 'default' : 'outline'} size="sm">
                  Consulting
                </Badge>
              </TouchableOpacity>
            </View>
            {coachProgramsQuery.isError && (
              <Text variant="small" color="muted">
                Note: programs list is only available for coaches. If you’re not a coach yet, the API will return 403.
              </Text>
            )}
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent style={{ gap: theme.spacing.sm }}>
            <Text variant="body" color="foreground" weight="semiBold">
              Title
            </Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Listing title" placeholderTextColor={theme.colors.textMuted} />

            <Text variant="body" color="foreground" weight="semiBold">
              Subtitle
            </Text>
            <TextInput
              style={styles.input}
              value={subtitle}
              onChangeText={setSubtitle}
              placeholder="Optional subtitle"
              placeholderTextColor={theme.colors.textMuted}
            />

            <Text variant="body" color="foreground" weight="semiBold">
              Price (USD)
            </Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="99.99"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="decimal-pad"
            />

            <Text variant="body" color="foreground" weight="semiBold">
              Category
            </Text>
            <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="sprint" placeholderTextColor={theme.colors.textMuted} />

            {type === 'program' && (
              <>
                <Text variant="body" color="foreground" weight="semiBold">
                  Level
                </Text>
                <TextInput style={styles.input} value={level} onChangeText={setLevel} placeholder="intermediate" placeholderTextColor={theme.colors.textMuted} />

                <Text variant="body" color="foreground" weight="semiBold">
                  Duration (weeks)
                </Text>
                <TextInput
                  style={styles.input}
                  value={durationWeeks}
                  onChangeText={setDurationWeeks}
                  placeholder="8"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="number-pad"
                />
              </>
            )}

            <Button variant="default" size="lg" onPress={() => createMutation.mutate()} loading={createMutation.isPending} disabled={createMutation.isPending || isGuest}>
              <FontAwesome5 name="plus" size={16} color="white" solid />
              <Text variant="body" weight="bold" color="primary-foreground" style={{ marginLeft: theme.spacing.sm }}>
                Create listing
              </Text>
            </Button>
            {isGuest && (
              <Text variant="small" color="muted" style={{ textAlign: 'center' }}>
                Sign in as a coach to create listings.
              </Text>
            )}
          </CardContent>
        </Card>
      </KeyboardAwareScreenScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: theme.spacing.lg, gap: theme.spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.lg },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  card: { marginBottom: 0 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.card,
  },
  typeRow: { flexDirection: 'row', gap: theme.spacing.md },
  typeChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    backgroundColor: theme.colors.card,
  },
  typeChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '12',
  },
});
