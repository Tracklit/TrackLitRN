import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';

import { Text } from '@/components/ui/Text';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { getScreenContentBottomPadding } from '@/utils/layoutPadding';
import theme from '@/utils/theme';
import type { RootStackParamList } from '@/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type RouteT = RouteProp<RootStackParamList, 'ClubDetail'>;

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

export const ClubDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<RouteT>();
  const { user } = useAuth();
  const isGuest = user?.id === 'guest';

  const clubId = route.params.id;

  const clubQuery = useQuery({
    queryKey: ['club', clubId],
    queryFn: () => apiRequest<Club>(`/api/clubs/${clubId}`),
    enabled: !!clubId && !isGuest,
  });

  const membersQuery = useQuery({
    queryKey: ['club-members', clubId],
    queryFn: () => apiRequest<any[]>(`/api/clubs/${clubId}/members`),
    enabled: !!clubId && !isGuest,
    retry: false,
  });

  const requestJoinMutation = useMutation({
    mutationFn: async () => apiRequest(`/api/clubs/${clubId}/request`, { method: 'POST' }),
    onSuccess: () => {
      Alert.alert('Request sent', 'Your request to join was sent.');
    },
    onError: (error: Error) => {
      Alert.alert('Unable to request', error.message || 'Please try again.');
    },
  });

  const isMember = !membersQuery.isError && Array.isArray(membersQuery.data);
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
              Club
            </Text>
          </View>
          <View style={styles.iconBtn} />
        </View>

        {isGuest ? (
          <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
            Sign in to view clubs.
          </Text>
        ) : clubQuery.isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text variant="body" color="muted">
              Loading...
            </Text>
          </View>
        ) : clubQuery.isError || !clubQuery.data ? (
          <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
            Club not found.
          </Text>
        ) : (
          <>
            <Card style={styles.card}>
              <CardHeader style={{ paddingBottom: theme.spacing.sm }}>
                <CardTitle>{clubQuery.data.name}</CardTitle>
              </CardHeader>
              <CardContent style={{ gap: theme.spacing.sm }}>
                {!!clubQuery.data.description && (
                  <Text variant="body" color="muted">
                    {clubQuery.data.description}
                  </Text>
                )}
                <Text variant="small" color="muted">
                  {clubQuery.data.isPrivate ? 'Private club' : 'Public club'}
                  {clubQuery.data.isPremium ? ' • Premium chat enabled' : ''}
                </Text>

                {!isMember && (
                  <Button
                    variant="default"
                    onPress={() => requestJoinMutation.mutate()}
                    loading={requestJoinMutation.isPending}
                  >
                    Request to join
                  </Button>
                )}

                {isMember && (
                  <View style={styles.actionsRow}>
                    <Button variant="outline" onPress={() => membersQuery.refetch()} style={{ flex: 1 }}>
                      Refresh members
                    </Button>
                    <Button variant="default" onPress={() => navigation.navigate('ClubManagement', { id: clubId })} style={{ flex: 1 }}>
                      Manage
                    </Button>
                  </View>
                )}
              </CardContent>
            </Card>

            <Card style={styles.card}>
              <CardHeader style={{ paddingBottom: theme.spacing.sm }}>
                <CardTitle>Members</CardTitle>
              </CardHeader>
              <CardContent style={{ gap: theme.spacing.sm }}>
                {membersQuery.isLoading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text variant="body" color="muted">
                      Loading members...
                    </Text>
                  </View>
                ) : membersQuery.isError ? (
                  <Text variant="body" color="muted">
                    Join the club to view members.
                  </Text>
                ) : (membersQuery.data ?? []).length === 0 ? (
                  <Text variant="body" color="muted">
                    No members found.
                  </Text>
                ) : (
                  (membersQuery.data ?? []).slice(0, 15).map((m: any, idx: number) => (
                    <View key={m.id ?? idx} style={styles.memberRow}>
                      <FontAwesome5 name="user" size={14} color={theme.colors.textMuted} solid />
                      <Text variant="body" color="foreground" style={{ flex: 1 }}>
                        {m.user?.name || m.name || `User #${m.userId ?? ''}`}
                      </Text>
                      {!!m.role && (
                        <Text variant="small" color="muted">
                          {String(m.role)}
                        </Text>
                      )}
                    </View>
                  ))
                )}
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
  loadingRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: theme.spacing.sm },
  card: { marginBottom: 0 },
  actionsRow: { flexDirection: 'row', gap: theme.spacing.md },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
});


