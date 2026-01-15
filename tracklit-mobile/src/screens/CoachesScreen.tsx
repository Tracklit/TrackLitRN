import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Trophy, ChevronRight } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { WebScreen } from '@/components/web/Screen';
import { WebPageHeader } from '@/components/web/PageHeader';
import { WebCard } from '@/components/web/Card';
import { WebBadge } from '@/components/web/Badge';
import { WebButton } from '@/components/web/Button';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import theme from '@/utils/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

interface Coach {
  id: number;
  username: string;
  name: string;
  profileImageUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  specialties?: string[] | null;
  isVerified?: boolean | null;
}

export const CoachesScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';

  const [search, setSearch] = useState('');

  const coachesQuery = useQuery({
    queryKey: ['coaches'],
    queryFn: () => apiRequest<Coach[]>('/api/coaches'),
    enabled: isAuthenticated && !isGuest,
  });

  const filtered = useMemo(() => {
    const list = coachesQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) =>
      `${c.name} ${c.username} ${c.bio || ''}`.toLowerCase().includes(q),
    );
  }, [coachesQuery.data, search]);

  return (
    <WebScreen backgroundColor="#0b1220" contentStyle={{ paddingTop: theme.spacing.lg }}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronRight size={18} color={theme.colors.foreground} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <WebPageHeader title="Coaches" description="Connect with experienced track and field coaches." />
      </View>

      <WebCard tone="muted" padding={theme.spacing.md}>
        <View style={styles.searchRow}>
          <Search size={16} color={theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search coaches by name, username, or bio..."
            placeholderTextColor={theme.colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </WebCard>

      {isGuest ? (
        <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
          Sign in to browse coaches.
        </Text>
      ) : coachesQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="body" color="muted">Loading coaches...</Text>
        </View>
      ) : coachesQuery.isError ? (
        <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
          Unable to load coaches.
        </Text>
      ) : filtered.length === 0 ? (
        <WebCard tone="muted" padding={theme.spacing.lg}>
          <View style={styles.emptyRow}>
            <Trophy size={24} color={theme.colors.textMuted} />
            <Text variant="body" color="muted">No coaches found.</Text>
          </View>
        </WebCard>
      ) : (
        filtered.map((coach) => (
          <WebCard key={coach.id} tone="muted" padding={theme.spacing.md}>
            <View style={styles.itemRow}>
              <Avatar
                size="lg"
                fallback={coach.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                src={coach.profileImageUrl || undefined}
              />
              <View style={{ flex: 1, gap: theme.spacing.xs }}>
                <View style={styles.nameRow}>
                  <Text variant="body" weight="semiBold" color="foreground" numberOfLines={1}>
                    {coach.name}
                  </Text>
                  {!!coach.isVerified && (
                    <WebBadge variant="secondary">Verified</WebBadge>
                  )}
                </View>
                <Text variant="small" color="muted" numberOfLines={1}>
                  @{coach.username}
                </Text>
                {!!coach.location && (
                  <View style={styles.locationRow}>
                    <MapPin size={12} color={theme.colors.textMuted} />
                    <Text variant="small" color="muted" numberOfLines={1}>
                      {coach.location}
                    </Text>
                  </View>
                )}
                {!!coach.bio && (
                  <Text variant="small" color="muted" numberOfLines={3}>
                    {coach.bio}
                  </Text>
                )}
              </View>
              <ChevronRight size={14} color={theme.colors.textMuted} />
            </View>
            <WebButton variant="outline" size="sm" onPress={() => {}}>
              Connect
            </WebButton>
          </WebCard>
        ))
      )}
    </WebScreen>
  );
};

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: '#0f172a',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  searchInput: { flex: 1, color: theme.colors.foreground },
  center: { alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.xl },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});


