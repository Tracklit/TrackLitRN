import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Search, Users, ChevronRight } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { WebScreen } from '@/components/web/Screen';
import { WebPageHeader } from '@/components/web/PageHeader';
import { WebCard } from '@/components/web/Card';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import theme from '@/utils/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

interface Athlete {
  id: number;
  username: string;
  name?: string | null;
  profileImageUrl?: string | null;
  isFollowing?: boolean;
  isFollower?: boolean;
}

interface AthletesResponse {
  athletes: Athlete[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export const AthletesScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';

  const [search, setSearch] = useState('');

  const athletesQuery = useQuery({
    queryKey: ['athletes', search],
    queryFn: () =>
      apiRequest<AthletesResponse>(
        `/api/athletes?search=${encodeURIComponent(search.trim())}&page=1`,
      ),
    enabled: isAuthenticated && !isGuest,
  });

  const athletes = useMemo(() => athletesQuery.data?.athletes ?? [], [athletesQuery.data]);

  return (
    <WebScreen backgroundColor="#0b1220" contentStyle={{ paddingTop: theme.spacing.lg }}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronRight size={18} color={theme.colors.foreground} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <WebPageHeader title="Athletes" description="Search athletes by name or username." />
      </View>

      <WebCard tone="muted" padding={theme.spacing.md}>
        <View style={styles.searchRow}>
          <Search size={16} color={theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search athletes..."
            placeholderTextColor={theme.colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </WebCard>

      {isGuest ? (
        <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
          Sign in to browse athletes.
        </Text>
      ) : athletesQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="body" color="muted">Loading athletes...</Text>
        </View>
      ) : athletesQuery.isError ? (
        <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
          Unable to load athletes.
        </Text>
      ) : athletes.length === 0 ? (
        <WebCard tone="muted" padding={theme.spacing.lg}>
          <View style={styles.emptyRow}>
            <Users size={24} color={theme.colors.textMuted} />
            <Text variant="body" color="muted">No athletes found.</Text>
          </View>
        </WebCard>
      ) : (
        athletes.map((a) => (
          <WebCard key={a.id} tone="muted" padding={theme.spacing.md}>
            <View style={styles.itemRow}>
              <Avatar size="md" fallback={(a.name || a.username || 'U').slice(0, 2)} src={a.profileImageUrl || undefined} />
              <View style={{ flex: 1, gap: theme.spacing.xs }}>
                <Text variant="body" weight="semiBold" color="foreground" numberOfLines={1}>
                  {a.name || 'TrackLit Athlete'}
                </Text>
                <Text variant="small" color="muted" numberOfLines={1}>
                  @{a.username}
                </Text>
                {(a.isFollowing || a.isFollower) && (
                  <Text variant="small" color="muted">
                    {a.isFollowing ? 'Following' : ''}
                    {a.isFollowing && a.isFollower ? ' • ' : ''}
                    {a.isFollower ? 'Follows you' : ''}
                  </Text>
                )}
              </View>
              <ChevronRight size={14} color={theme.colors.textMuted} />
            </View>
          </WebCard>
        ))
      )}
    </WebScreen>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
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
});


