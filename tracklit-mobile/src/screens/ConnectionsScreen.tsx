import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, UserPlus, Users, ChevronRight, MessageCircle, UserMinus } from 'lucide-react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { WebScreen } from '@/components/web/Screen';
import { WebPageHeader } from '@/components/web/PageHeader';
import { WebCard } from '@/components/web/Card';
import { WebBadge } from '@/components/web/Badge';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import theme from '@/utils/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

interface ConnectionItem {
  id: number;
  name?: string | null;
  username?: string | null;
  profileImageUrl?: string | null;
}

interface ConnectionRequest {
  id: number;
  follower: { name: string; username: string; profileImageUrl?: string | null };
}

export const ConnectionsScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');

  const connectionsQuery = useQuery({
    queryKey: ['connections'],
    queryFn: () => apiRequest<ConnectionItem[]>('/api/friends'),
    enabled: isAuthenticated && !isGuest,
  });

  const pendingQuery = useQuery({
    queryKey: ['connection-requests'],
    queryFn: () => apiRequest<ConnectionRequest[]>('/api/friend-requests/pending'),
    enabled: isAuthenticated && !isGuest,
  });

  // Remove connection mutation
  const removeConnectionMutation = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest<{ success: boolean }>(`/api/follow/${userId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      Alert.alert('Success', 'Connection removed.');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to remove connection');
    },
  });

  const handleConnectionPress = useCallback((connection: ConnectionItem) => {
    Alert.alert(
      connection.name || 'TrackLit Athlete',
      `@${connection.username || 'user'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Message',
          onPress: () => {
            navigation.navigate('ChatConversation', {
              conversationId: connection.id,
              type: 'direct',
            });
          },
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Remove Connection',
              `Are you sure you want to remove ${connection.name || connection.username} from your connections?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: () => removeConnectionMutation.mutate(connection.id),
                },
              ]
            );
          },
        },
      ]
    );
  }, [navigation, removeConnectionMutation]);

  const handleAddConnection = useCallback(() => {
    navigation.navigate('Athletes');
  }, [navigation]);

  const filtered = useMemo(() => {
    const data = connectionsQuery.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((c) =>
      `${c.name || ''} ${c.username || ''}`.toLowerCase().includes(q),
    );
  }, [connectionsQuery.data, search]);

  return (
    <WebScreen
      backgroundColor="#0b1220"
      contentStyle={{ paddingTop: theme.spacing.lg }}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronRight size={18} color={theme.colors.foreground} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <WebPageHeader title="Connections" description="Friends and coached athletes you can message and share content with." />
        {pendingQuery.data && pendingQuery.data.length > 0 && (
          <WebBadge variant="secondary">{pendingQuery.data.length} pending</WebBadge>
        )}
      </View>

      <WebCard tone="muted" padding={theme.spacing.md}>
        <View style={styles.searchRow}>
          <Search size={16} color={theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search connections..."
            placeholderTextColor={theme.colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddConnection}>
            <UserPlus size={18} color={theme.colors.foreground} />
          </TouchableOpacity>
        </View>
      </WebCard>

      {isGuest ? (
        <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
          Sign in to view your connections.
        </Text>
      ) : connectionsQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="body" color="muted">Loading connections...</Text>
        </View>
      ) : connectionsQuery.isError ? (
        <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
          Unable to load connections.
        </Text>
      ) : filtered.length === 0 ? (
        <WebCard tone="muted" padding={theme.spacing.lg}>
          <View style={styles.emptyRow}>
            <Users size={24} color={theme.colors.textMuted} />
            <Text variant="body" color="muted">No connections yet.</Text>
          </View>
        </WebCard>
      ) : (
        filtered.map((c) => (
          <TouchableOpacity key={c.id} onPress={() => handleConnectionPress(c)} activeOpacity={0.7}>
            <WebCard tone="muted" padding={theme.spacing.md}>
              <View style={styles.itemRow}>
                <Avatar size="md" fallback={(c.name || c.username || 'U').slice(0, 2)} src={c.profileImageUrl || undefined} />
                <View style={{ flex: 1, gap: theme.spacing.xs }}>
                  <Text variant="body" weight="semiBold" color="foreground" numberOfLines={1}>
                    {c.name || 'TrackLit Athlete'}
                  </Text>
                  <Text variant="small" color="muted" numberOfLines={1}>
                    @{c.username || 'user'}
                  </Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.messageButton}
                    onPress={() => navigation.navigate('ChatConversation', { conversationId: c.id, type: 'direct' })}
                  >
                    <MessageCircle size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <ChevronRight size={14} color={theme.colors.textMuted} />
                </View>
              </View>
            </WebCard>
          </TouchableOpacity>
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
  searchInput: {
    flex: 1,
    color: theme.colors.foreground,
  },
  addButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  center: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xl,
  },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  messageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(147, 51, 234, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});


