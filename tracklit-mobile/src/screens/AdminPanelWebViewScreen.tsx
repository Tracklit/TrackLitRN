import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
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
  LockSimple,
  ProhibitInset,
  DotsThreeVertical,
  Warning,
  SignOut,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import type { RootStackParamList } from '@/navigation/types';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { goBackOrNavigateToTab } from '@/navigation/appNavigation';

import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';
type Navigation = NativeStackNavigationProp<RootStackParamList>;


interface AdminUser {
  id: number;
  username: string;
  name: string;
  email?: string;
  role?: string;
  isCoach?: boolean;
  isActive?: boolean;
  disabled?: boolean;
  profileImageUrl?: string | null;
  createdAt?: string;
}

interface AdminStats {
  totalUsers?: number;
  totalCoaches?: number;
  totalAthletes?: number;
  totalPrograms?: number;
  total?: number;
  users?: number;
  coaches?: number;
  athletes?: number;
  programs?: number;
}

async function fetchAdminUsers(search: string): Promise<AdminUser[]> {
  const response = await apiRequest<any>(`/api/admin/users?search=${encodeURIComponent(search)}`);
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.users)) return response.users;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.results)) return response.results;
  return [];
}

function getErrorStatus(error: unknown): number | null {
  return (error as any)?.status ?? null;
}

function getErrorMessage(error: unknown): string {
  return (error as any)?.message ?? 'Unknown error';
}

async function fetchAdminStats(): Promise<AdminStats> {
  try {
    const response = await apiRequest<any>('/api/admin/stats');
    return response ?? {};
  } catch {
    return {};
  }
}

const StatCard: React.FC<{ label: string; value: string | number; Icon: any; color?: string }> = ({
  label, value, Icon, color,
}) => {
  const { styles, theme } = useThemedStyles(createStyles);
  const c = color || theme.colors.brandOrange;
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${c}18` }]}>
        <Icon size={18} color={c} weight="fill" />
      </View>
      <Text style={styles.statValue}>{value ?? '\u2014'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

export const AdminPanelWebViewScreen: React.FC = () => {
  const { styles, theme } = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const queryClient = useQueryClient();
  const { refreshUser, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'stats'>('users');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    refreshUser().then(() => {
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    }).catch(() => {});
  }, []);

  const searchReady = search.trim().length >= 2;

  const usersQuery = useQuery({
    queryKey: ['admin-users', search.trim()],
    queryFn: () => fetchAdminUsers(search.trim()),
    enabled: searchReady,
    retry: 1,
  });

  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchAdminStats,
    retry: 1,
  });

  const makeAdminMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest<{ success: boolean }>('/api/admin/seed-admin', {
        method: 'POST',
        data: { userId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setMenuVisible(false);
      Alert.alert('Done', 'User has been promoted to admin.');
    },
    onError: (err: Error) => Alert.alert('Error', err.message || 'Could not promote user.'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest<{ success: boolean }>(`/api/admin/users/${userId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setMenuVisible(false);
      Alert.alert('Done', 'User has been deleted.');
    },
    onError: (err: Error) => Alert.alert('Error', err.message || 'Could not delete user.'),
  });

  const disableUserMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest<{ success: boolean }>(`/api/admin/users/${userId}/disable`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setMenuVisible(false);
      Alert.alert('Done', 'User account has been disabled.');
    },
    onError: (err: Error) => Alert.alert('Error', err.message || 'Could not disable user.'),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (userId: number) =>
      apiRequest<{ success: boolean; tempPassword?: string }>(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      setMenuVisible(false);
      const msg = data?.tempPassword
        ? `Temporary password: ${data.tempPassword}`
        : 'A password reset email has been sent to the user.';
      Alert.alert('Password Reset', msg);
    },
    onError: (err: Error) => Alert.alert('Error', err.message || 'Could not reset password.'),
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const openMenu = useCallback((user: AdminUser) => {
    setSelectedUser(user);
    setMenuVisible(true);
  }, []);

  const confirmMakeAdmin = useCallback(() => {
    if (!selectedUser) return;
    Alert.alert(
      'Promote to Admin',
      `Grant admin role to @${selectedUser.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Promote', onPress: () => makeAdminMutation.mutate(selectedUser.id) },
      ],
    );
  }, [selectedUser, makeAdminMutation]);

  const confirmDisable = useCallback(() => {
    if (!selectedUser) return;
    Alert.alert(
      'Disable Account',
      `Disable @${selectedUser.username}'s account? They won't be able to log in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disable', style: 'destructive', onPress: () => disableUserMutation.mutate(selectedUser.id) },
      ],
    );
  }, [selectedUser, disableUserMutation]);

  const confirmResetPassword = useCallback(() => {
    if (!selectedUser) return;
    Alert.alert(
      'Reset Password',
      `Reset the password for @${selectedUser.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', onPress: () => resetPasswordMutation.mutate(selectedUser.id) },
      ],
    );
  }, [selectedUser, resetPasswordMutation]);

  const confirmDelete = useCallback(() => {
    if (!selectedUser) return;
    Alert.alert(
      'Delete User',
      `Permanently delete @${selectedUser.username}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteUserMutation.mutate(selectedUser.id) },
      ],
    );
  }, [selectedUser, deleteUserMutation]);

  const filteredUsers = usersQuery.data ?? [];

  const stats = statsQuery.data;
  const totalUsers = stats?.totalUsers ?? stats?.users ?? stats?.total;
  const totalCoaches = stats?.totalCoaches ?? stats?.coaches;
  const totalAthletes = stats?.totalAthletes ?? stats?.athletes;
  const totalPrograms = stats?.totalPrograms ?? stats?.programs;

  const isBusy =
    makeAdminMutation.isPending ||
    deleteUserMutation.isPending ||
    disableUserMutation.isPending ||
    resetPasswordMutation.isPending;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => goBackOrNavigateToTab(navigation, 'Home')}
        >
          <CaretLeft size={18} color={theme.colors.textSecondary} weight="bold" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSub}>Tracklit Management</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={handleRefresh}>
          <ArrowClockwise size={18} color={theme.colors.textMuted} weight="bold" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {(['users', 'stats'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            {t === 'users'
              ? <Users size={13} color={activeTab === t ? theme.colors.brandOrange : theme.colors.textMuted} weight="fill" />
              : <ChartBar size={13} color={activeTab === t ? theme.colors.brandOrange : theme.colors.textMuted} weight="fill" />}
            <Text style={[styles.tabLabel, activeTab === t && styles.tabLabelActive]}>
              {t === 'users' ? 'Users' : 'Stats'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'users' && (
        <>
          <View style={styles.searchWrap}>
            <View style={styles.searchRow}>
              <MagnifyingGlass size={13} color={theme.colors.textMuted} weight="bold" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, username or email…"
                placeholderTextColor={theme.colors.textMuted}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
              />
            </View>
          </View>

          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.brandOrange} />
            }
          >
            {!searchReady ? (
              <View style={styles.center}>
                <MagnifyingGlass size={36} color={theme.colors.textMuted} weight="fill" />
                <Text style={styles.errorHeading}>Search for a user</Text>
                <Text style={styles.mutedText}>Type at least 2 characters{'\n'}to find users by name, username, or email.</Text>
              </View>
            ) : usersQuery.isLoading || usersQuery.isFetching ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.brandOrange} />
                <Text style={styles.mutedText}>Searching…</Text>
              </View>
            ) : usersQuery.isError ? (
              <View style={styles.center}>
                <Warning size={40} color={theme.colors.destructive} weight="fill" />
                <Text style={styles.errorHeading}>Could not load users</Text>
                <Text style={styles.errorDetail}>
                  {getErrorStatus(usersQuery.error) === 401 || getErrorStatus(usersQuery.error) === 403
                    ? `Permission denied (${getErrorStatus(usersQuery.error)}). If you were recently promoted to admin, you need to log out and log back in to refresh your session.`
                    : `Server returned: ${getErrorMessage(usersQuery.error)} (${getErrorStatus(usersQuery.error) ?? 'no status'})`
                  }
                </Text>
                {(getErrorStatus(usersQuery.error) === 401 || getErrorStatus(usersQuery.error) === 403) && (
                  <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={() => {
                      Alert.alert(
                        'Log out required',
                        'You need to log out and log back in for your admin permissions to take effect.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Log Out',
                            style: 'destructive',
                            onPress: () => {
                              logout();
                              navigation.goBack();
                            },
                          },
                        ],
                      );
                    }}
                    activeOpacity={0.7}
                  >
                    <SignOut size={15} color={theme.colors.textPrimary} weight="fill" />
                    <Text style={styles.logoutBtnText}>Log Out & Re-login</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => queryClient.invalidateQueries({ queryKey: ['admin-users'] })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.retryBtnText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : filteredUsers.length === 0 ? (
              <View style={styles.center}>
                <Users size={36} color={theme.colors.textMuted} weight="fill" />
                <Text style={styles.mutedText}>No users found for "{search.trim()}"</Text>
              </View>
            ) : (
              <>
                <Text style={styles.countText}>{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</Text>
                {filteredUsers.map((u, i) => (
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
                            <View style={styles.badge}>
                              <Crown size={9} color={theme.colors.brandOrange} weight="fill" />
                              <Text style={[styles.badgeText, { color: theme.colors.brandOrange }]}>Admin</Text>
                            </View>
                          )}
                          {u.isCoach && (
                            <View style={[styles.badge, styles.badgeGreen]}>
                              <Barbell size={9} color={theme.colors.success} weight="fill" />
                              <Text style={[styles.badgeText, { color: theme.colors.success }]}>Coach</Text>
                            </View>
                          )}
                          {(u.isActive === false || u.disabled === true) && (
                            <View style={[styles.badge, styles.badgeRed]}>
                              <ProhibitInset size={9} color={theme.colors.destructive} weight="fill" />
                              <Text style={[styles.badgeText, { color: theme.colors.destructive }]}>Disabled</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.userHandle}>@{u.username}</Text>
                        {!!u.email && <Text style={styles.userEmail} numberOfLines={1}>{u.email}</Text>}
                      </View>
                      <TouchableOpacity
                        style={styles.menuBtn}
                        onPress={() => openMenu(u)}
                        activeOpacity={0.7}
                      >
                        <DotsThreeVertical size={18} color={theme.colors.textMuted} weight="bold" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        </>
      )}

      {activeTab === 'stats' && (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.brandOrange} />
          }
        >
          {statsQuery.isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={theme.colors.brandOrange} />
              <Text style={styles.mutedText}>Loading stats…</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Platform Overview</Text>
              <View style={styles.statsGrid}>
                <StatCard label="Total Users" value={totalUsers ?? '—'} Icon={Users} color={theme.colors.brandOrange} />
                <StatCard label="Coaches" value={totalCoaches ?? '—'} Icon={ShieldStar} color={theme.colors.success} />
                <StatCard label="Athletes" value={totalAthletes ?? '—'} Icon={UserCircle} color="#6366F1" />
                <StatCard label="Programs" value={totalPrograms ?? '—'} Icon={Barbell} color="#F59E0B" />
              </View>
              {statsQuery.isError && (
                <Text style={[styles.mutedText, { textAlign: 'center', marginTop: 16 }]}>
                  Stats endpoint not available.
                </Text>
              )}
            </>
          )}
        </ScrollView>
      )}

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.actionSheet}>
            {selectedUser && (
              <>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle} numberOfLines={1}>
                    @{selectedUser.username}
                  </Text>
                  <Text style={styles.sheetSub} numberOfLines={1}>
                    {selectedUser.email ?? selectedUser.name ?? ''}
                  </Text>
                </View>

                <View style={styles.sheetDivider} />

                {selectedUser.role !== 'admin' && (
                  <TouchableOpacity
                    style={styles.sheetAction}
                    onPress={confirmMakeAdmin}
                    disabled={isBusy}
                    activeOpacity={0.7}
                  >
                    <Crown size={18} color={theme.colors.brandOrange} weight="fill" />
                    <Text style={styles.sheetActionText}>Make Admin</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.sheetAction}
                  onPress={confirmResetPassword}
                  disabled={isBusy}
                  activeOpacity={0.7}
                >
                  <LockSimple size={18} color={theme.colors.textSecondary} weight="fill" />
                  <Text style={styles.sheetActionText}>Reset Password</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetAction}
                  onPress={confirmDisable}
                  disabled={isBusy}
                  activeOpacity={0.7}
                >
                  <ProhibitInset size={18} color="#F59E0B" weight="fill" />
                  <Text style={[styles.sheetActionText, { color: '#F59E0B' }]}>Disable Account</Text>
                </TouchableOpacity>

                <View style={styles.sheetDivider} />

                <TouchableOpacity
                  style={styles.sheetAction}
                  onPress={confirmDelete}
                  disabled={isBusy}
                  activeOpacity={0.7}
                >
                  <Trash size={18} color={theme.colors.destructive} weight="fill" />
                  <Text style={[styles.sheetActionText, { color: theme.colors.destructive }]}>Delete User</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sheetAction, styles.sheetCancel]}
                  onPress={() => setMenuVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sheetCancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
            {isBusy && (
              <View style={styles.sheetBusy}>
                <ActivityIndicator size="small" color={theme.colors.brandOrange} />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.backgroundSolid },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: t.colors.overlayLight,
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: t.colors.overlaySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: t.colors.textPrimary, letterSpacing: 0.3 },
  headerSub: { fontSize: 11, color: t.colors.textMuted, marginTop: 1 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: t.colors.overlaySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: t.colors.overlayLight,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: t.colors.overlayLight,
  },
  tabActive: { borderColor: t.colors.brandOrange, backgroundColor: 'rgba(255,122,0,0.08)' },
  tabLabel: { fontSize: 12, fontWeight: '600', color: t.colors.textMuted },
  tabLabelActive: { color: t.colors.brandOrange },
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: t.colors.overlayLight,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: t.colors.overlaySubtle,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 9, color: t.colors.textPrimary, fontSize: 13 },
  scroll: { padding: 16 },
  center: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  mutedText: { fontSize: 13, color: t.colors.textMuted, textAlign: 'center', lineHeight: 20 },
  errorHeading: { fontSize: 16, fontWeight: '700', color: t.colors.textPrimary, marginTop: 12, textAlign: 'center' },
  errorDetail: { fontSize: 13, color: t.colors.textMuted, textAlign: 'center', lineHeight: 18, marginTop: 8, paddingHorizontal: 16, maxWidth: 300 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.colors.destructive, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, marginTop: 16 },
  logoutBtnText: { fontSize: 13, fontWeight: '700', color: t.colors.textPrimary },
  retryBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: t.colors.overlayLight },
  retryBtnText: { fontSize: 13, fontWeight: '600', color: t.colors.textMuted },
  countText: { fontSize: 11, color: t.colors.textMuted, marginBottom: 10 },
  separator: { height: 0.5, backgroundColor: t.colors.overlayLight, marginLeft: 52 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  userInfo: { flex: 1, gap: 2 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  userName: { fontSize: 13, fontWeight: '600', color: t.colors.textPrimary, flexShrink: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: t.colors.brandOrangeLight,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeGreen: { backgroundColor: 'rgba(34,197,94,0.12)' },
  badgeRed: { backgroundColor: 'rgba(255,68,68,0.12)' },
  badgeText: { fontSize: 9, fontWeight: '700', color: t.colors.brandOrange },
  userHandle: { fontSize: 11, color: t.colors.textMuted },
  userEmail: { fontSize: 10, color: t.colors.textMuted },
  menuBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: t.colors.overlaySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: t.colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: t.colors.cardSolid,
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
  statValue: { fontSize: 24, fontWeight: '700', color: t.colors.textPrimary, lineHeight: 28 },
  statLabel: { fontSize: 11, color: t.colors.textMuted },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: t.colors.cardSolid,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 28,
    paddingTop: 8,
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  sheetTitle: { fontSize: 15, fontWeight: '700', color: t.colors.textPrimary },
  sheetSub: { fontSize: 12, color: t.colors.textMuted, marginTop: 2 },
  sheetDivider: { height: 0.5, backgroundColor: t.colors.overlayLight, marginVertical: 4 },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sheetActionText: { fontSize: 15, color: t.colors.textPrimary, fontWeight: '500' },
  sheetCancel: { marginTop: 4 },
  sheetCancelText: { fontSize: 15, color: t.colors.textMuted, fontWeight: '500' },
  sheetBusy: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});
