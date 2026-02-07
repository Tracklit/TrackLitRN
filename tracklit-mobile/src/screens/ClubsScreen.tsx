import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Switch,
} from 'react-native';
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

type Navigation = NativeStackNavigationProp<RootStackParamList>;

interface Club {
  id: number;
  name: string;
  description?: string | null;
  ownerId: number;
  isPrivate?: boolean | null;
  isPremium?: boolean | null;
  inviteCode?: string | null;
  createdAt?: string;
}

type Tab = 'discover' | 'my-clubs';

export const ClubsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';

  const [tab, setTab] = useState<Tab>('discover');

  const discoverQuery = useQuery({
    queryKey: ['clubs', 'discover'],
    queryFn: () => apiRequest<Club[]>('/api/clubs'),
    enabled: isAuthenticated && !isGuest,
  });

  const myClubsQuery = useQuery({
    queryKey: ['clubs', 'my'],
    queryFn: () => apiRequest<Club[]>('/api/clubs/my'),
    enabled: isAuthenticated && !isGuest,
  });

  const items = useMemo(() => {
    return tab === 'discover' ? (discoverQuery.data ?? []) : (myClubsQuery.data ?? []);
  }, [tab, discoverQuery.data, myClubsQuery.data]);

  const refreshing = discoverQuery.isFetching || myClubsQuery.isFetching;

  // Create club modal
  const [createOpen, setCreateOpen] = useState(false);
  const [clubName, setClubName] = useState('');
  const [clubDescription, setClubDescription] = useState('');
  const [clubPrivate, setClubPrivate] = useState(false);

  const createClubMutation = useMutation({
    mutationFn: async () => {
      if (isGuest) throw new Error('Login required');
      if (!clubName.trim()) throw new Error('Club name is required.');
      return apiRequest('/api/clubs', {
        method: 'POST',
        data: {
          name: clubName.trim(),
          description: clubDescription.trim() || null,
          isPrivate: clubPrivate,
        },
      });
    },
    onSuccess: () => {
      setCreateOpen(false);
      setClubName('');
      setClubDescription('');
      setClubPrivate(false);
      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      Alert.alert('Created', 'Club created successfully.');
    },
    onError: (error: Error) => {
      Alert.alert('Create failed', error.message || 'Please try again.');
    },
  });

  const requestJoinMutation = useMutation({
    mutationFn: async (clubId: number) => apiRequest(`/api/clubs/${clubId}/request`, { method: 'POST' }),
    onSuccess: () => {
      Alert.alert('Request sent', 'Your request to join was sent.');
    },
    onError: (error: Error) => {
      Alert.alert('Unable to request', error.message || 'Please try again.');
    },
  });

  const contentBottomPadding = useMemo(
    () => getScreenContentBottomPadding(insets.bottom, { includeBottomNav: false, extra: theme.spacing.xl }),
    [insets.bottom],
  );

  return (
    <LinearGradient colors={theme.gradient.background} locations={theme.gradient.locations} style={styles.container}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={{ paddingTop: insets.top }}
        contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl tintColor="#fff" refreshing={refreshing} onRefresh={() => {
            discoverQuery.refetch();
            myClubsQuery.refetch();
          }} />
        }
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <FontAwesome5 name="arrow-left" size={18} color={theme.colors.foreground} solid />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="h3" weight="bold" color="foreground">
              Clubs
            </Text>
            <Text variant="small" color="muted">
              Join clubs and connect with athletes
            </Text>
          </View>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setCreateOpen(true)}
            disabled={!isAuthenticated || isGuest}
          >
            <FontAwesome5 name="plus" size={16} color={isAuthenticated && !isGuest ? theme.colors.primary : theme.colors.textMuted} solid />
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity style={[styles.tab, tab === 'my-clubs' && styles.tabActive]} onPress={() => setTab('my-clubs')}>
            <Text variant="body" weight="medium" color={tab === 'my-clubs' ? 'foreground' : 'muted'}>
              My Clubs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'discover' && styles.tabActive]} onPress={() => setTab('discover')}>
            <Text variant="body" weight="medium" color={tab === 'discover' ? 'foreground' : 'muted'}>
              Discover
            </Text>
          </TouchableOpacity>
        </View>

        {!isAuthenticated || isGuest ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            Sign in to view and join clubs.
          </Text>
        ) : (tab === 'discover' ? discoverQuery.isLoading : myClubsQuery.isLoading) ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text variant="body" color="muted">
              Loading clubs...
            </Text>
          </View>
        ) : (tab === 'discover' ? discoverQuery.isError : myClubsQuery.isError) ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            Unable to load clubs.
          </Text>
        ) : items.length === 0 ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            {tab === 'my-clubs' ? 'No clubs yet.' : 'No clubs to show.'}
          </Text>
        ) : (
          <View style={styles.list}>
            {items.map((club) => (
              <TouchableOpacity
                key={club.id}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('ClubDetail', { id: club.id })}
              >
                <Card style={styles.card}>
                  <CardHeader style={{ paddingBottom: theme.spacing.sm }}>
                    <View style={styles.titleRow}>
                      <CardTitle style={{ flex: 1 }}>{club.name}</CardTitle>
                      {club.isPrivate ? (
                        <Badge variant="outline" size="sm">Private</Badge>
                      ) : (
                        <Badge variant="secondary" size="sm">Public</Badge>
                      )}
                    </View>
                  </CardHeader>
                  <CardContent style={{ gap: theme.spacing.sm }}>
                    {!!club.description && (
                      <Text variant="small" color="muted">
                        {club.description}
                      </Text>
                    )}
                    {tab === 'discover' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => requestJoinMutation.mutate(club.id)}
                      >
                        Request to Join
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={createOpen} transparent animationType="slide" onRequestClose={() => setCreateOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text variant="h4" weight="semiBold" color="foreground">
                Create Club
              </Text>
              <TouchableOpacity onPress={() => setCreateOpen(false)} style={styles.iconBtn}>
                <FontAwesome5 name="times" size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text variant="body" color="foreground" weight="semiBold">
              Name
            </Text>
            <TextInput
              style={styles.input}
              value={clubName}
              onChangeText={setClubName}
              placeholder="Club name"
              placeholderTextColor={theme.colors.textMuted}
            />

            <Text variant="body" color="foreground" weight="semiBold">
              Description
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={clubDescription}
              onChangeText={setClubDescription}
              placeholder="Optional description"
              placeholderTextColor={theme.colors.textMuted}
              multiline
            />

            <View style={styles.switchRow}>
              <Text variant="body" color="foreground" weight="semiBold">
                Private club
              </Text>
              <Switch
                value={clubPrivate}
                onValueChange={setClubPrivate}
                thumbColor={clubPrivate ? theme.colors.primary : theme.colors.textMuted}
                trackColor={{ true: theme.colors.primary + '66', false: theme.colors.muted }}
              />
            </View>

            <View style={styles.modalActions}>
              <Button variant="ghost" onPress={() => setCreateOpen(false)} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button
                variant="default"
                onPress={() => createClubMutation.mutate()}
                loading={createClubMutation.isPending}
                style={{ flex: 1 }}
              >
                Create
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: theme.spacing.lg, gap: theme.spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.lg },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.muted,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xs,
  },
  tab: { flex: 1, paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.md, alignItems: 'center' },
  tabActive: { backgroundColor: theme.colors.backgroundSolid },
  loadingRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: theme.spacing.sm },
  emptyText: { textAlign: 'center', paddingVertical: theme.spacing.lg },
  list: { gap: theme.spacing.md },
  card: { marginBottom: 0 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: theme.colors.backgroundSolid,
    padding: theme.spacing.lg,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    gap: theme.spacing.md,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.card,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalActions: { flexDirection: 'row', gap: theme.spacing.md },
});


