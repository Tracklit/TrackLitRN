import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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

interface ConnectionItem {
  id: number;
  name?: string | null;
  username?: string | null;
  profileImageUrl?: string | null;
}

export const ConnectionsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';

  const connectionsQuery = useQuery({
    queryKey: ['connections'],
    queryFn: () => apiRequest<ConnectionItem[]>('/api/connections'),
    enabled: isAuthenticated && !isGuest,
  });

  const connections = useMemo(() => connectionsQuery.data ?? [], [connectionsQuery.data]);

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
          Connections
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="body" color="muted">
          Friends and coached athletes you can message and share content with.
        </Text>

        {isGuest ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            Sign in to view your connections.
          </Text>
        ) : connectionsQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text variant="body" color="muted" style={styles.emptyText}>
              Loading connections...
            </Text>
          </View>
        ) : connectionsQuery.isError ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            Unable to load connections.
          </Text>
        ) : connections.length === 0 ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            No connections yet.
          </Text>
        ) : (
          <View style={styles.list}>
            {connections.map((c) => (
              <Card key={c.id} style={styles.itemCard}>
                <CardContent style={styles.itemContent}>
                  <Avatar size="md" fallback={(c.name || c.username || 'U').slice(0, 2)} />
                  <View style={styles.itemText}>
                    <Text variant="body" weight="semiBold" color="foreground" numberOfLines={1}>
                      {c.name || 'TrackLit Athlete'}
                    </Text>
                    <Text variant="small" color="muted" numberOfLines={1}>
                      @{c.username || 'user'}
                    </Text>
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
