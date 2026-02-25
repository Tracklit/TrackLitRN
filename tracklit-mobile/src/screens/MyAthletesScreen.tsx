import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import {
  CaretLeft,
  MagnifyingGlass,
  Users,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { SkeletonListRows } from '@/components/Skeleton';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const C = {
  bg: '#0E0F14',
  orange: '#FF7A00',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.4)',
  border: 'rgba(255,255,255,0.06)',
  iconBg: 'rgba(255,255,255,0.05)',
};

interface CoachAthlete {
  id: number;
  username: string;
  name?: string | null;
  profileImageUrl?: string | null;
  bio?: string | null;
}

export const MyAthletesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';

  const [search, setSearch] = useState('');

  const athletesQuery = useQuery({
    queryKey: ['coach-athletes'],
    queryFn: () => apiRequest<CoachAthlete[]>('/api/coach/athletes'),
    enabled: isAuthenticated && !isGuest,
  });

  const athletes = athletesQuery.data ?? [];

  const filtered = search.trim()
    ? athletes.filter((a) => {
        const q = search.trim().toLowerCase();
        return (
          (a.name?.toLowerCase().includes(q)) ||
          a.username.toLowerCase().includes(q)
        );
      })
    : athletes;

  const handleAthletePress = useCallback((athlete: CoachAthlete) => {
    navigation.navigate('PublicProfile', {
      userId: athlete.id,
      name: athlete.name,
      username: athlete.username,
      profileImageUrl: athlete.profileImageUrl,
    });
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <CaretLeft size={18} color={C.textSecondary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Athletes</Text>
        <View style={{ flex: 1 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <MagnifyingGlass size={14} color={C.textMuted} weight="bold" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or username"
            placeholderTextColor={C.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {isGuest ? (
          <View style={styles.emptyContainer}>
            <Users size={40} color={C.textMuted} weight="fill" />
            <Text style={styles.emptyText}>Sign in to view your athletes.</Text>
          </View>
        ) : athletesQuery.isLoading ? (
          <SkeletonListRows count={6} />
        ) : athletesQuery.isError ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Unable to load athletes.</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users size={40} color={C.textMuted} weight="fill" />
            <Text style={styles.emptyText}>
              {athletes.length === 0
                ? 'No athletes yet. Athletes will appear here once they connect with you.'
                : 'No athletes match your search.'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((a, index) => (
              <View key={a.id}>
                {index > 0 && <View style={styles.itemSeparator} />}
                <TouchableOpacity
                  onPress={() => handleAthletePress(a)}
                  activeOpacity={0.6}
                  style={styles.itemRow}
                >
                  <Avatar
                    size="sm"
                    fallback={(a.name || a.username || 'U').slice(0, 2)}
                    src={a.profileImageUrl || undefined}
                  />
                  <View style={styles.itemBody}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {a.name || 'TrackLit Athlete'}
                    </Text>
                    <Text style={styles.itemUsername} numberOfLines={1}>@{a.username}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: 0.3,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.iconBg,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: C.textPrimary,
    fontSize: 13,
  },
  content: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    gap: 0,
  },
  itemSeparator: {
    height: 0.5,
    backgroundColor: C.border,
    marginLeft: 48,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  itemBody: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textPrimary,
    flexShrink: 1,
  },
  itemUsername: {
    fontSize: 11,
    color: C.textMuted,
  },
});
