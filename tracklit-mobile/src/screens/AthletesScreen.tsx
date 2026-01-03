import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import type { RootStackParamList } from '@/navigation/types';
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
  const insets = useSafeAreaInsets();
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
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.colors.foreground} solid />
        </TouchableOpacity>
        <Text variant="h3" weight="bold" color="foreground">
          Athletes
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <TextInput
          style={styles.searchInput}
          placeholder="Search athletes by name or username…"
          placeholderTextColor={theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        {isGuest ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            Sign in to browse athletes.
          </Text>
        ) : athletesQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text variant="body" color="muted" style={styles.emptyText}>
              Loading athletes...
            </Text>
          </View>
        ) : athletesQuery.isError ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            Unable to load athletes.
          </Text>
        ) : athletes.length === 0 ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            No athletes found.
          </Text>
        ) : (
          <View style={styles.list}>
            {athletes.map((a) => (
              <Card key={a.id} style={styles.itemCard}>
                <CardContent style={styles.itemContent}>
                  <Avatar size="md" fallback={(a.name || a.username || 'U').slice(0, 2)} />
                  <View style={styles.itemText}>
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
                  <FontAwesome5 name="chevron-right" size={14} color={theme.colors.textMuted} solid />
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  headerSpacer: { flex: 1 },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.card,
  },
  center: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  emptyText: { textAlign: 'center', lineHeight: 22 },
  list: { gap: theme.spacing.sm },
  itemCard: { marginBottom: 0 },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  itemText: { flex: 1, gap: 2 },
});
