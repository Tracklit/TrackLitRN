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

async function fetchAdminUsers(): Promise<AdminUser[]> {
  const response = await apiRequest<any>('/api/admin/users');
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.users)) return response.users;
  if (Array.isArray(response?.data)) return response.data;
  return [];
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
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchAdminUsers,
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

  const filteredUsers = (usersQuery.data ?? []).filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${u.name ?? ''} ${u.username} ${u.email ?? ''}`.toLowerCase().includes(q);
  });

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
          <CaretLeft size={18} color={C.textSecondary} weight="bold" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSub}>Tracklit Management</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={handleRefresh}>
          <ArrowClockwise size={18} color={C.textMuted} weight="bold" />
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
              ? <Users size={13} color={activeTab === t ? C.orange : C.textMuted} weight="fill" />
              : <ChartBar size={13} color={activeTab === t ? C.orange : C.textMuted} weight="fill" />}
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
              <MagnifyingGlass size={13} color={C.textMuted} weight="bold" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, username or email…"
                placeholderTextColor={C.textMuted}
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
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.orange} />
            }
          >
            {usersQuery.isLoading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={C.orange} />
                <Text style={styles.mutedText}>Loading users…</Text>
              </View>
            ) : usersQuery.isError ? (
              <View style={styles.center}>
                <ShieldStar size={40} color={C.textMuted} weight="fill" />
                <Text style={styles.mutedText}>
                  Could not load users.{'\n'}Make sure this account has admin access.
                </Text>
              </View>
            ) : filteredUsers.length === 0 ? (
              <View style={styles.center}>
                <Users size={36} color={C.textMuted} weight="fill" />
                <Text style={styles.mutedText}>
                  {search ? 'No users match your search.' : 'No users found.'}
                </Text>
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
                              <Crown size={9} color={C.orange} weight="fill" />
                              <Text style={[styles.badgeText, { color: C.orange }]}>Admin</Text>
                            </View>
                          )}
                          {u.isCoach && (
                            <View style={[styles.badge, styles.badgeGreen]}>
                              <Barbell size={9} color={C.green} weight="fill" />
                              <Text style={[styles.badgeText, { color: C.green }]}>Coach</Text>
                            </View>
                          )}
                          {(u.isActive === false || u.disabled === true) && (
                            <View style={[styles.badge, styles.badgeRed]}>
                              <ProhibitInset size={9} color={C.red} weight="fill" />
                              <Text style={[styles.badgeText, { color: C.red }]}>Disabled</Text>
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
                        <DotsThreeVertical size={18} color={C.textMuted} weight="bold" />
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
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.orange} />
          }
        >
          {statsQuery.isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={C.orange} />
              <Text style={styles.mutedText}>Loading stats…</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Platform Overview</Text>
              <View style={styles.statsGrid}>
                <StatCard label="Total Users" value={totalUsers ?? '—'} Icon={Users} color={C.orange} />
                <StatCard label="Coaches" value={totalCoaches ?? '—'} Icon={ShieldStar} color={C.green} />
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
                    <Crown size={18} color={C.orange} weight="fill" />
                    <Text style={styles.sheetActionText}>Make Admin</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.sheetAction}
                  onPress={confirmResetPassword}
                  disabled={isBusy}
                  activeOpacity={0.7}
                >
                  <LockSimple size={18} color={C.textSecondary} weight="fill" />
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
                  <Trash size={18} color={C.red} weight="fill" />
                  <Text style={[styles.sheetActionText, { color: C.red }]}>Delete User</Text>
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
                <ActivityIndicator size="small" color={C.orange} />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
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
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.textPrimary, letterSpacing: 0.3 },
  headerSub: { fontSize: 11, color: C.textMuted, marginTop: 1 },
  iconBtn: {
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
  tabActive: { borderColor: C.orange, backgroundColor: 'rgba(255,122,0,0.08)' },
  tabLabel: { fontSize: 12, fontWeight: '600', color: C.textMuted },
  tabLabelActive: { color: C.orange },
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
  searchInput: { flex: 1, paddingVertical: 9, color: C.textPrimary, fontSize: 13 },
  scroll: { padding: 16 },
  center: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  mutedText: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20 },
  countText: { fontSize: 11, color: C.textMuted, marginBottom: 10 },
  separator: { height: 0.5, backgroundColor: C.border, marginLeft: 52 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  userInfo: { flex: 1, gap: 2 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  userName: { fontSize: 13, fontWeight: '600', color: C.textPrimary, flexShrink: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,122,0,0.12)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeGreen: { backgroundColor: 'rgba(34,197,94,0.12)' },
  badgeRed: { backgroundColor: 'rgba(255,68,68,0.12)' },
  badgeText: { fontSize: 9, fontWeight: '700', color: C.orange },
  userHandle: { fontSize: 11, color: C.textMuted },
  userEmail: { fontSize: 10, color: 'rgba(255,255,255,0.3)' },
  menuBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
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
  statValue: { fontSize: 24, fontWeight: '700', color: C.textPrimary, lineHeight: 28 },
  statLabel: { fontSize: 11, color: C.textMuted },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: '#1C1F2B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 28,
    paddingTop: 8,
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  sheetTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary },
  sheetSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  sheetDivider: { height: 0.5, backgroundColor: C.border, marginVertical: 4 },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sheetActionText: { fontSize: 15, color: C.textPrimary, fontWeight: '500' },
  sheetCancel: { marginTop: 4 },
  sheetCancelText: { fontSize: 15, color: C.textMuted, fontWeight: '500' },
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
