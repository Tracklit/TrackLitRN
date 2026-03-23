import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeSlash,
  SignOut,
  EnvelopeSimple,
  Bell,
  Newspaper,
  UsersThree,
  ShieldCheck,
  CaretRight,
  FloppyDisk,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { setToken, setProfileFields } from '@/lib/tokenStorage';
import type { RootStackParamList } from '@/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const COLORS = {
  bg: '#0E0F14',
  surface: '#161823',
  card: '#1C1F2B',
  glass: 'rgba(255,255,255,0.05)',
  gradStart: '#4B00FF',
  gradMid: '#7F00FF',
  gradEnd: '#00D4FF',
  orange: '#FF7A00',
  textPrimary: '#FFFFFF',
  textSecondary: '#B8C0FF',
  textMuted: '#8A90B5',
  border: 'rgba(255,255,255,0.08)',
  destructive: '#ef4444',
};

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, logout, refreshUser, setUserAndPersist } = useAuth();
  const queryClient = useQueryClient();
  const isGuest = user?.id === 'guest';
  const isCoach = user?.isCoach === true;

  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [fullName, setFullName] = useState(user?.name || '');
  const [isPrivate, setIsPrivate] = useState(!!user?.isPrivate);
  const [age, setAge] = useState(String((user as any)?.age ?? ''));
  const [height, setHeight] = useState(String((user as any)?.height ?? ''));
  const [weight, setWeight] = useState(String((user as any)?.weight ?? ''));
  const [gender, setGender] = useState<string>((user as any)?.gender ?? '');
  const [pushNotifications, setPushNotifications] = useState(true);
  const [showTicker, setShowTicker] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setUsername(user?.username || '');
    setEmail(user?.email || '');
    setFullName(user?.name || '');
    setIsPrivate(!!user?.isPrivate);
    setAge(String((user as any)?.age ?? ''));
    setHeight(String((user as any)?.height ?? ''));
    setWeight(String((user as any)?.weight ?? ''));
    setGender((user as any)?.gender ?? '');
  }, [user?.username, user?.email, user?.name, user?.isPrivate, (user as any)?.age, (user as any)?.height, (user as any)?.weight, (user as any)?.gender]);

  useEffect(() => {
    AsyncStorage.getItem('push_notifications').then(val => {
      if (val === 'false') setPushNotifications(false);
    });
    AsyncStorage.getItem('carousel_hidden').then(val => {
      if (val === 'true') setShowTicker(false);
    });
  }, []);

  useEffect(() => {
    const changed =
      username !== (user?.username || '') ||
      email !== (user?.email || '') ||
      fullName !== (user?.name || '') ||
      isPrivate !== !!user?.isPrivate ||
      age !== String((user as any)?.age ?? '') ||
      height !== String((user as any)?.height ?? '') ||
      weight !== String((user as any)?.weight ?? '') ||
      gender !== ((user as any)?.gender ?? '');
    setHasChanges(changed);
  }, [username, email, fullName, isPrivate, age, height, weight, gender, user]);

  const coachStatusMutation = useMutation({
    mutationFn: async (value: boolean) => {
      return apiRequest('/api/user/coach-status', {
        method: 'PATCH',
        data: { isCoach: value },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      refreshUser();
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Unable to update status.');
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (payload: any) =>
      apiRequest('/api/user', { method: 'PATCH', data: payload }),
    onSuccess: async (data: any) => {
      if (data?.token) await setToken(String(data.token));
      const nextUser: any = { ...(user as any) };
      if (fullName.trim()) nextUser.name = fullName.trim();
      if (username.trim()) nextUser.username = username.trim();
      nextUser.isPrivate = isPrivate;
      if (age.trim()) nextUser.age = parseInt(age.trim(), 10);
      if (height.trim()) nextUser.height = parseFloat(height.trim());
      if (weight.trim()) nextUser.weight = parseFloat(weight.trim());
      if (gender) nextUser.gender = gender;
      delete nextUser.token;
      // Persist athlete profile fields to the dedicated store — survives logout.
      await setProfileFields({
        age: nextUser.age ?? null,
        height: nextUser.height ?? null,
        weight: nextUser.weight ?? null,
        gender: nextUser.gender ?? null,
      });
      await setUserAndPersist(nextUser);
      setHasChanges(false);
      Alert.alert('Saved', 'Account details updated.');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to update settings.');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (payload: { currentPassword: string; newPassword: string }) =>
      apiRequest('/api/user/change-password', { method: 'POST', data: payload }),
    onSuccess: () => {
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password changed successfully.');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to change password.');
    },
  });

  const handleSave = () => {
    if (isGuest) {
      Alert.alert('Login Required', 'Please sign in to update settings.');
      return;
    }
    const usernameTrim = username.trim();
    if (usernameTrim && !/^[a-zA-Z0-9_]{3,30}$/.test(usernameTrim)) {
      Alert.alert('Invalid username', 'Username must be 3-30 characters (letters, numbers, underscores).');
      return;
    }
    updateSettingsMutation.mutate({
      username: usernameTrim || undefined,
      name: fullName.trim() || undefined,
      isPrivate,
      age: age.trim() ? parseInt(age.trim(), 10) : undefined,
      height: height.trim() ? parseFloat(height.trim()) : undefined,
      weight: weight.trim() ? parseFloat(weight.trim()) : undefined,
      gender: gender || undefined,
    });
  };

  const handleChangePassword = () => {
    if (!currentPassword.trim()) {
      Alert.alert('Required', 'Enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Too Short', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const handleTogglePush = (val: boolean) => {
    setPushNotifications(val);
    AsyncStorage.setItem('push_notifications', val ? 'true' : 'false');
  };

  const handleToggleTicker = (val: boolean) => {
    setShowTicker(val);
    AsyncStorage.setItem('carousel_hidden', val ? 'false' : 'true');
  };

  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLine} />
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );

  const renderToggleRow = (
    label: string,
    subtitle: string,
    value: boolean,
    onToggle: (v: boolean) => void,
    icon: React.ReactNode,
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingIconWrap}>{icon}</View>
      <View style={styles.settingTextWrap}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingSubtext}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        thumbColor={value ? COLORS.orange : '#555'}
        trackColor={{ true: 'rgba(255,122,0,0.4)', false: 'rgba(255,255,255,0.1)' }}
      />
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: COLORS.bg }]}>
      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerLeft}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color={COLORS.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
        {hasChanges ? (
          <TouchableOpacity onPress={handleSave} style={styles.headerSaveBtn}>
            <FloppyDisk size={18} color={COLORS.orange} weight="fill" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderSectionHeader('ACCOUNT DETAILS')}

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your full name"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="your_username"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
            />
            <Text style={styles.inputHint}>3-30 characters. Letters, numbers, underscores.</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => setShowPasswordModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.settingIconWrap}>
              <Lock size={18} color={COLORS.orange} weight="fill" />
            </View>
            <Text style={styles.actionRowText}>Change Password</Text>
            <CaretRight size={16} color={COLORS.textMuted} weight="bold" />
          </TouchableOpacity>

          {hasChanges && (
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.orange, '#FF9D00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtnInner}
              >
                <FloppyDisk size={16} color="white" weight="fill" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {renderSectionHeader('ATHLETE PROFILE')}

        <View style={styles.card}>
          <View style={styles.profileGrid}>
            <View style={styles.profileGridCell}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                placeholder="Years"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
            <View style={styles.profileGridCell}>
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                placeholder="cm"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
            <View style={styles.profileGridCell}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder="kg"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
          </View>

          <View style={styles.genderBlock}>
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {['Male', 'Female', 'Other', 'N/A'].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.genderBtn, gender === opt && styles.genderBtnActive]}
                  onPress={() => setGender(gender === opt ? '' : opt)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.genderBtnText, gender === opt && styles.genderBtnTextActive]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.inputHint}>
            Used by Sprinthia for personalized biomechanical analysis.
          </Text>
        </View>

        {renderSectionHeader('ROLE')}

        <View style={styles.card}>
          {renderToggleRow(
            isCoach ? 'Coach' : 'Athlete',
            isCoach ? 'You have coaching tools enabled' : 'Switch to Coach to manage athletes',
            isCoach,
            (val) => {
              if (isGuest) return;
              coachStatusMutation.mutate(val);
            },
            <UsersThree size={18} color={COLORS.gradEnd} weight="fill" />,
          )}
        </View>

        {renderSectionHeader('PRIVACY')}

        <View style={styles.card}>
          {renderToggleRow(
            'Private Profile',
            'Hide your profile from public discovery',
            isPrivate,
            (val) => {
              if (isGuest) return;
              setIsPrivate(val);
              updateSettingsMutation.mutate({ isPrivate: val });
            },
            <ShieldCheck size={18} color={COLORS.gradMid} weight="fill" />,
          )}
        </View>

        {renderSectionHeader('PREFERENCES')}

        <View style={styles.card}>
          {renderToggleRow(
            'Push Notifications',
            'Receive alerts for messages and updates',
            pushNotifications,
            handleTogglePush,
            <Bell size={18} color={COLORS.orange} weight="fill" />,
          )}
          <View style={styles.rowDivider} />
          {renderToggleRow(
            'Show Ticker on Home',
            'Display the activity carousel on home screen',
            showTicker,
            handleToggleTicker,
            <Newspaper size={18} color={COLORS.gradEnd} weight="fill" />,
          )}
        </View>

        {renderSectionHeader('SUPPORT')}

        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
            <View style={styles.settingIconWrap}>
              <EnvelopeSimple size={18} color={COLORS.textSecondary} weight="fill" />
            </View>
            <Text style={styles.actionRowText}>Email Support</Text>
            <CaretRight size={16} color={COLORS.textMuted} weight="bold" />
          </TouchableOpacity>
          <View style={styles.rowDivider} />
          <View style={styles.versionRow}>
            <Text style={styles.versionText}>TrackLit Mobile v1.0.0</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={logout}
          activeOpacity={0.8}
        >
          <SignOut size={18} color={COLORS.destructive} weight="fill" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowPasswordModal(false)}
          >
            <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>Change Password</Text>

              <View style={styles.pwInputWrap}>
                <TextInput
                  style={styles.pwInput}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Current password"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showCurrentPw}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowCurrentPw(!showCurrentPw)} style={styles.pwEye}>
                  {showCurrentPw ? <EyeSlash size={18} color={COLORS.textMuted} /> : <Eye size={18} color={COLORS.textMuted} />}
                </TouchableOpacity>
              </View>

              <View style={styles.pwInputWrap}>
                <TextInput
                  style={styles.pwInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="New password (min 6 chars)"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showNewPw}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowNewPw(!showNewPw)} style={styles.pwEye}>
                  {showNewPw ? <EyeSlash size={18} color={COLORS.textMuted} /> : <Eye size={18} color={COLORS.textMuted} />}
                </TouchableOpacity>
              </View>

              <View style={styles.pwInputWrap}>
                <TextInput
                  style={styles.pwInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showNewPw}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleChangePassword}
                />
              </View>

              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleChangePassword}
                >
                  <LinearGradient
                    colors={[COLORS.orange, '#FF9D00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalSaveBtnInner}
                  >
                    <Text style={styles.modalSaveText}>
                      {changePasswordMutation.isPending ? 'Saving...' : 'Change Password'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  headerSaveBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },

  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  profileGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  profileGridCell: {
    flex: 1,
  },

  genderBlock: {
    marginBottom: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  genderBtnActive: {
    borderColor: COLORS.orange,
    backgroundColor: 'rgba(255,122,0,0.12)',
  },
  genderBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  genderBtnTextActive: {
    color: COLORS.orange,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionRowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.glass,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  settingSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  rowDivider: {
    height: 0.5,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },

  versionRow: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  saveBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  saveBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.destructive,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  pwInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  pwInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  pwEye: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  modalSaveBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalSaveBtnInner: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});
