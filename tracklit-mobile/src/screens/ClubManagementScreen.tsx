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
import { queryClient } from '@/lib/queryClient';
import { getScreenContentBottomPadding } from '@/utils/layoutPadding';
import themeStatic from '@/utils/theme';
import type { RootStackParamList } from '@/navigation/types';

import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';
type Navigation = NativeStackNavigationProp<RootStackParamList>;
type RouteT = RouteProp<RootStackParamList, 'ClubManagement'>;

export const ClubManagementScreen: React.FC = () => {
  const { styles, theme } = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<RouteT>();
  const { user } = useAuth();
  const isGuest = user?.id === 'guest';
  const clubId = route.params.id;

  const membersQuery = useQuery({
    queryKey: ['club-members', clubId],
    queryFn: () => apiRequest<any[]>(`/api/clubs/${clubId}/members`),
    enabled: !!clubId && !isGuest,
    retry: false,
  });

  const generateInviteMutation = useMutation({
    mutationFn: async () => apiRequest<{ inviteLink: string; inviteCode: string }>(`/api/clubs/${clubId}/generateInviteLink`, { method: 'POST' }),
    onSuccess: (data) => {
      Alert.alert('Invite link', data.inviteLink);
    },
    onError: (error: Error) => {
      Alert.alert('Unable to generate', error.message || 'Please try again.');
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: number) => apiRequest(`/api/clubs/${clubId}/approve/${userId}`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-members', clubId] });
      Alert.alert('Approved', 'Member approved.');
    },
    onError: (error: Error) => {
      Alert.alert('Approve failed', error.message || 'Please try again.');
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (member: { memberId: number; userId: number }) =>
      apiRequest(`/api/clubs/${clubId}/members/${member.memberId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-members', clubId] });
    },
    onError: (error: Error) => {
      Alert.alert('Remove failed', error.message || 'Please try again.');
    },
  });

  const contentBottomPadding = useMemo(
    () => getScreenContentBottomPadding(insets.bottom, { includeBottomNav: false, extra: themeStatic.spacing.xl }),
    [insets.bottom],
  );

  const members = membersQuery.data ?? [];
  const pending = members.filter((m: any) => m.joinedAt === null || m.joinedAt === undefined);

  return (
    <LinearGradient colors={theme.gradient.background} locations={theme.gradient.locations} style={styles.container}>
      <ScrollView style={{ paddingTop: insets.top }} contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }]} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <FontAwesome5 name="arrow-left" size={18} color={theme.colors.foreground} solid />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="h3" weight="bold" color="foreground">
              Club Management
            </Text>
          </View>
          <View style={styles.iconBtn} />
        </View>

        {isGuest ? (
          <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
            Sign in to manage clubs.
          </Text>
        ) : membersQuery.isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text variant="body" color="muted">
              Loading...
            </Text>
          </View>
        ) : membersQuery.isError ? (
          <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
            You may not have permission to manage this club.
          </Text>
        ) : (
          <>
            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Invite</CardTitle>
              </CardHeader>
              <CardContent style={{ gap: themeStatic.spacing.md }}>
                <Button variant="default" onPress={() => generateInviteMutation.mutate()} loading={generateInviteMutation.isPending}>
                  Generate invite link
                </Button>
              </CardContent>
            </Card>

            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Pending requests</CardTitle>
              </CardHeader>
              <CardContent style={{ gap: themeStatic.spacing.sm }}>
                {pending.length === 0 ? (
                  <Text variant="body" color="muted">
                    No pending requests.
                  </Text>
                ) : (
                  pending.map((m: any, idx: number) => (
                    <View key={m.id ?? idx} style={styles.row}>
                      <Text variant="body" color="foreground" style={{ flex: 1 }}>
                        {m.user?.name || `User #${m.userId}`}
                      </Text>
                      <Button variant="outline" size="sm" onPress={() => approveMutation.mutate(Number(m.userId))}>
                        Approve
                      </Button>
                    </View>
                  ))
                )}
              </CardContent>
            </Card>

            <Card style={styles.card}>
              <CardHeader>
                <CardTitle>Members</CardTitle>
              </CardHeader>
              <CardContent style={{ gap: themeStatic.spacing.sm }}>
                {members.length === 0 ? (
                  <Text variant="body" color="muted">
                    No members found.
                  </Text>
                ) : (
                  members.map((m: any, idx: number) => (
                    <View key={m.id ?? idx} style={styles.row}>
                      <Text variant="body" color="foreground" style={{ flex: 1 }}>
                        {m.user?.name || `User #${m.userId}`}
                      </Text>
                      <Text variant="small" color="muted" style={{ marginRight: themeStatic.spacing.sm }}>
                        {m.role || 'member'}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          Alert.alert('Remove member?', 'This will remove them from the club.', [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Remove',
                              style: 'destructive',
                              onPress: () => removeMutation.mutate({ memberId: Number(m.id), userId: Number(m.userId) }),
                            },
                          ])
                        }
                        style={styles.removeBtn}
                      >
                        <FontAwesome5 name="user-times" size={14} color={theme.colors.destructive} solid />
                      </TouchableOpacity>
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

const createStyles = (t: ThemeValues) => StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: themeStatic.spacing.lg, gap: themeStatic.spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: themeStatic.spacing.lg },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  loadingRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: themeStatic.spacing.sm },
  card: { marginBottom: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: themeStatic.spacing.md },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.card,
  },
});


