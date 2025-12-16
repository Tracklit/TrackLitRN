import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import type { RootStackParamList } from '@/navigation/types';
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
  const insets = useSafeAreaInsets();
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

  const handleConnect = () => {
    Alert.alert(
      'Connect to coach',
      'Coach connection requests will be wired to the same flow as the web app next.',
    );
  };

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
          Coaches
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <TextInput
          style={styles.searchInput}
          placeholder="Search coaches by name or username…"
          placeholderTextColor={theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        {isGuest ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            Sign in to browse coaches.
          </Text>
        ) : coachesQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text variant="body" color="muted" style={styles.emptyText}>
              Loading coaches...
            </Text>
          </View>
        ) : coachesQuery.isError ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            Unable to load coaches.
          </Text>
        ) : filtered.length === 0 ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            No coaches found.
          </Text>
        ) : (
          <View style={styles.list}>
            {filtered.map((coach) => (
              <Card key={coach.id} style={styles.card}>
                <CardContent style={styles.cardContent}>
                  <View style={styles.cardHeaderRow}>
                    <Avatar
                      size="lg"
                      fallback={coach.name?.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    />
                    <View style={styles.cardText}>
                      <View style={styles.nameRow}>
                        <Text variant="body" weight="semiBold" color="foreground" numberOfLines={1}>
                          {coach.name}
                        </Text>
                        {!!coach.isVerified && (
                          <FontAwesome5 name="check-circle" size={14} color={theme.colors.primary} solid />
                        )}
                      </View>
                      <Text variant="small" color="muted" numberOfLines={1}>
                        @{coach.username}
                      </Text>
                      {!!coach.location && (
                        <Text variant="small" color="muted" numberOfLines={1}>
                          {coach.location}
                        </Text>
                      )}
                    </View>
                  </View>

                  {!!coach.bio && (
                    <Text variant="small" color="muted" style={styles.bio} numberOfLines={3}>
                      {coach.bio}
                    </Text>
                  )}

                  <Button variant="outline" size="sm" onPress={handleConnect}>
                    <FontAwesome5 name="user-plus" size={14} color={theme.colors.primary} solid />
                    <Text variant="small" weight="medium" color="primary" style={styles.buttonText}>
                      Connect
                    </Text>
                  </Button>
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
  list: { gap: theme.spacing.md },
  card: { marginBottom: 0 },
  cardContent: { gap: theme.spacing.sm },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  cardText: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  bio: { lineHeight: 18 },
  buttonText: { marginLeft: theme.spacing.sm },
});
