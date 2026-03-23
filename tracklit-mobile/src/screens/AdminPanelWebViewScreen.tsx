import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CaretLeft,
  Users,
  ShieldStar,
  Barbell,
  ChartBar,
  MagnifyingGlass,
  UserCircle,
  Crown,
  Trash,
  ArrowClockwise,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import type { RootStackParamList } from '@/navigation/types';
import { apiRequest } from '@/lib/api';
import { goBackOrNavigateToTab } from '@/navigation/appNavigation';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const C = {
  bg: '#0E0F14',
  card: '#1C1F2B',
  orange: '#FF7A00',
  red: '#FF4444',
  green: '#22C55E',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.4)',
  border: 'rgba(255,255,255,0.06)',
  iconBg: 'rgba(255,255,255,0.05)',
};

interface AdminUser {
  id: number;
  username: string;
  name: string;
  email?: string;
  role?: string;
  isCoach?: boolean;
  profileImageUrl?: string | null;
  createdAt?: string;
}

interface AdminStats {
  totalUsers?: number;
  totalCoaches?: number;
  totalAthletes?: number;
  totalPrograms?: number;
  totalSessions?: number;
}

const StatCard: React.FC<{ label: string; value: string | number; Icon: any; color?: string }> = ({
  label, value, Icon, color = C.orange,
}) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: `${color}18` }]}>
      <Icon size={18} color={color} weight="fill" />
    </View>
    <Text style={styles.statValue}>{value ?? '—'}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const AdminPanelWebViewScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'stats'>('users');
  const [refreshing, setRefreshing] = useState(false);

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiRequest<AdminUser[]>('/api/admin/users'),
    retry: 1,
  });

  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiRequest<AdminStats>('/api/admin/stats'),
    retry: 1,
  });

  const promoteAdminMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest<{ success: boolean }>(`/api/admin/promote/${userId}`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      Alert.alert('Success', 'User promoted to admin.');
    },
    onError: (err: Error) => Alert.alert('Error', err.message || 'Could not promote user.'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest<{ success: boolean }>(`/api/admin/users/${userId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      Alert.alert('Done', 'User removed.');
    },
    onError: (err: Error) => Alert.alert('Error', err.message || 'Could not remove user.'),
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const handlePromote = useCallback((user: AdminUser) => {
    Alert.alert(
      'Promote to Admin',
      `Grant admin role to @${user.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote',
          style: 'default',
          onPress: () => promoteAdminMutation.mutate(user.id),
        },
      ],
    );
  }, [promoteAdminMutation]);

  const handleDelete = useCallback((user: AdminUser) => {
    Alert.alert(
      'Remove User',
      `Permanently remove @${user.username}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => deleteUserMutation.mutate(user.id),
        },
      ],
    );
  }, [deleteUserMutation]);

  const filteredUsers = (usersQuery.data ?? []).filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${u.name} ${u.username} ${u.email ?? ''}`.toLowerCase().includes(q);
  });

  const stats = statsQuery.data;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => goBackOrNavigateToTab(navigation, 'Home')}
        >
          <CaretLeft size={18} color={C.textSecondary} weight="bold" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSub}>Tracklit Management</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
          <ArrowClockwise size={18} color={C.textMuted} weight="bold" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.tabActive]}
          onPress={() => setActiveTab('users')}
        >
          <Users size={14} color={activeTab === 'users' ? C.orange : C.textMuted} weight="fill" />
          <Text style={[styles.tabLabel, activeTab === 'users' && styles.tabLabelActive]}>
            Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.tabActive]}
          onPress={() => setActiveTab('stats')}
        >
          <ChartBar size={14} color={activeTab === 'stats' ? C.orange : C.textMuted} weight="fill" />
          <Text style={[styles.tabLabel, activeTab === 'stats' && styles.tabLabelActive]}>
            Stats
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'users' && (
        <>
          <View style={styles.searchWrap}>
            <View style={styles.searchRow}>
              <MagnifyingGlass size={13} color={C.textMuted} weight="bold" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users…"
                placeholderTextColor={C.textMuted}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={C.orange}
              />
            }
          >
            {usersQuery.isLoading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={C.orange} />
                <Text style={styles.loadingText}>Loading users…</Text>
              </View>
            ) : usersQuery.isError ? (
              <View style={styles.center}>
                <ShieldStar size={40} color={C.textMuted} weight="fill" />
                <Text style={styles.errorText}>
                  Could not load users.{'\n'}Check that this account has admin access.
                </Text>
              </View>
            ) : filteredUsers.length === 0 ? (
              <View style={styles.center}>
                <Text style={styles.emptyText}>No users found.</Text>
              </View>
            ) : (
              filteredUsers.map((u, i) => (
                <View key={u.id}>
                  {i > 0 && <View style={styles.separator} />}
                  <View style={styles.userRow}>
                    <Avatar
                      size="sm"
                      src={u.profileImageUrl || undefined}
                      fallback={(u.name || u.username || '?').slice(0, 2).toUpperCase()}
                    />
                    <View style={styles.userInfo}>
                      <View style={styles.userNameRow}>
                        <Text style={styles.userName} numberOfLines={1}>{u.name || u.username}</Text>
                        {u.role === 'admin' && (
                          <View style={styles.adminBadge}>
                            <Crown size={9} color={C.orange} weight="fill" />
                            <Text style={styles.adminBadgeText}>Admin</Text>
                          </View>
                        )}
                        {u.isCoach && (
                          <View style={styles.coachBadge}>
                            <Barbell size={9} color={C.green} weight="fill" />
                            <Text style={[styles.adminBadgeText, { color: C.green }]}>Coach</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.userHandle} numberOfLines={1}>@{u.username}</Text>
                      {!!u.email && (
                        <Text style={styles.userEmail} numberOfLines={1}>{u.email}</Text>
                      )}
                    </View>
                    <View style={styles.userActions}>
                      {u.role !== 'admin' && (
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => handlePromote(u)}
                          activeOpacity={0.7}
                        >
                          <ShieldStar size={15} color={C.orange} weight="fill" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnDanger]}
                        onPress={() => handleDelete(u)}
                        activeOpacity={0.7}
                      >
                        <Trash size={14} color={C.red} weight="fill" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </>
      )}

      {activeTab === 'stats' && (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={C.orange}
            />
          }
        >
          {statsQuery.isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={C.orange} />
              <Text style={styles.loadingText}>Loading stats…</Text>
            </View>
          ) : statsQuery.isError ? (
            <View style={styles.center}>
              <ChartBar size={40} color={C.textMuted} weight="fill" />
              <Text style={styles.errorText}>Stats unavailable for this account.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Platform Overview</Text>
              <View style={styles.statsGrid}>
                <StatCard
                  label="Total Users"
                  value={stats?.totalUsers ?? '—'}
                  Icon={Users}
                  color={C.orange}
                />
                <StatCard
                  label="Coaches"
                  value={stats?.totalCoaches ?? '—'}
                  Icon={ShieldStar}
                  color={C.green}
                />
                <StatCard
                  label="Athletes"
                  value={stats?.totalAthletes ?? '—'}
                  Icon={UserCircle}
                  color="#6366F1"
                />
                <StatCard
                  label="Programs"
                  value={stats?.totalPrograms ?? '—'}
                  Icon={Barbell}
                  color="#F59E0B"
                />
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 1,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  tabActive: {
    borderColor: C.orange,
    backgroundColor: 'rgba(255,122,0,0.08)',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMuted,
  },
  tabLabelActive: {
    color: C.orange,
  },
  searchWrap: {
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
    paddingVertical: 9,
    color: C.textPrimary,
    fontSize: 13,
  },
  scroll: {
    padding: 16,
    gap: 0,
  },
  center: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: C.textMuted,
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
  },
  separator: {
    height: 0.5,
    backgroundColor: C.border,
    marginLeft: 52,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textPrimary,
    flexShrink: 1,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,122,0,0.12)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coachBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(34,197,94,0.12)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: C.orange,
  },
  userHandle: {
    fontSize: 11,
    color: C.textMuted,
  },
  userEmail: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
  },
  userActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,122,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDanger: {
    backgroundColor: 'rgba(255,68,68,0.1)',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 16,
    gap: 6,
    alignItems: 'flex-start',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: C.textPrimary,
    lineHeight: 28,
  },
  statLabel: {
    fontSize: 11,
    color: C.textMuted,
  },
});
