import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  Linking,
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';

import { Text } from '@/components/ui/Text';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DateField } from '@/components/profile/fields/DateField';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { getScreenContentBottomPadding } from '@/utils/layoutPadding';
import theme from '@/utils/theme';
import type { RootStackParamList } from '@/navigation/types';
import { countries as countryList } from '@/lib/countries';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, logout, refreshUser } = useAuth();
  const isGuest = user?.id === 'guest';

  const contentBottomPadding = useMemo(
    () => getScreenContentBottomPadding(insets.bottom, { includeBottomNav: false, extra: theme.spacing.xl }),
    [insets.bottom],
  );

  const [username, setUsername] = useState(user?.username || '');
  const [country, setCountry] = useState(user?.country || '');
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState('');
  const [dob, setDob] = useState(user?.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '');
  const [clubId, setClubId] = useState(
    user?.defaultClubId !== null && user?.defaultClubId !== undefined ? String(user.defaultClubId) : '',
  );
  const [isPrivate, setIsPrivate] = useState(!!user?.isPrivate);

  // Keep local state in sync with latest user
  React.useEffect(() => {
    setUsername(user?.username || '');
    setCountry(user?.country || '');
    setDob(user?.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '');
    setClubId(user?.defaultClubId !== null && user?.defaultClubId !== undefined ? String(user.defaultClubId) : '');
    setIsPrivate(!!user?.isPrivate);
  }, [user?.username, user?.country, user?.dateOfBirth, user?.defaultClubId, user?.isPrivate]);

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return countryList;
    return countryList.filter((c) => c.toLowerCase().includes(q));
  }, [countryQuery]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (payload: {
      username?: string;
      country?: string | null;
      dateOfBirth?: string | null;
      defaultClubId?: number | null;
      isPrivate?: boolean;
    }) => apiRequest('/api/user', { method: 'PATCH', data: payload }),
    onSuccess: async () => {
      await refreshUser();
      Alert.alert('Saved', 'Settings updated.');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to update settings.');
    },
  });

  const validateAndSave = () => {
    if (isGuest) {
      Alert.alert('Login Required', 'Please sign in to update settings.');
      return;
    }

    const clubIdRaw = clubId.trim();
    let clubIdNum: number | null = null;
    if (clubIdRaw) {
      const parsed = Number(clubIdRaw);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        Alert.alert('Invalid club', 'Club ID must be a positive number.');
        return;
      }
      clubIdNum = parsed;
    }

    const usernameTrim = username.trim();
    if (usernameTrim && !/^[a-zA-Z0-9_]{3,30}$/.test(usernameTrim)) {
      Alert.alert('Invalid username', 'Username must be 3-30 characters (letters, numbers, underscores).');
      return;
    }

    updateSettingsMutation.mutate({
      username: usernameTrim || undefined,
      country: country.trim() || null,
      dateOfBirth: dob || null,
      defaultClubId: clubIdNum,
      isPrivate,
    });
  };

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <ScrollView
        style={{ paddingTop: insets.top }}
        contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <FontAwesome5 name="arrow-left" size={18} color={theme.colors.foreground} solid />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="h3" weight="bold" color="foreground">
              Settings
            </Text>
          </View>
          <View style={styles.backButton} />
        </View>

        {/* Account */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            <Text variant="body" color="foreground" weight="semiBold">
              Username
            </Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="your_username"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
            />
            <Text variant="small" color="muted" style={styles.helperText}>
              3-30 characters. Letters, numbers, and underscores only.
            </Text>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Privacy</CardTitle>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text variant="body" weight="semiBold" color="foreground">
                  Private profile
                </Text>
                <Text variant="small" color="muted" style={styles.helperText}>
                  When enabled, your profile is hidden from public discovery.
                </Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                thumbColor={isPrivate ? theme.colors.primary : theme.colors.textMuted}
                trackColor={{ true: theme.colors.primary + '66', false: theme.colors.muted }}
              />
            </View>

            <Text variant="body" color="foreground" weight="semiBold" style={styles.fieldLabel}>
              Country
            </Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => {
                setCountryQuery('');
                setCountryPickerOpen(true);
              }}
              disabled={isGuest}
              activeOpacity={0.85}
            >
              <Text variant="body" color={country ? 'foreground' : 'muted'}>
                {country || 'Select your country'}
              </Text>
              <FontAwesome5 name="chevron-down" size={14} color={theme.colors.textMuted} solid />
            </TouchableOpacity>

            <DateField
              label="Date of birth"
              value={dob || undefined}
              onChange={(val) => setDob(val || '')}
              maximumDate={new Date()}
            />

            <Text variant="body" color="foreground" weight="semiBold" style={styles.fieldLabel}>
              Club (default)
            </Text>
            <TextInput
              style={styles.input}
              value={clubId}
              onChangeText={setClubId}
              placeholder="Club ID (optional)"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="number-pad"
            />
            <Text variant="small" color="muted" style={styles.helperText}>
              Note: the backend requires you to be a member of the club to set it as default.
            </Text>

            <Button
              variant="default"
              onPress={validateAndSave}
              loading={updateSettingsMutation.isPending}
              disabled={isGuest}
              style={styles.fullWidthButton}
            >
              Save settings
            </Button>

            {isGuest && (
              <Text variant="small" color="muted" style={[styles.helperText, { textAlign: 'center' }]}>
                Sign in to update settings.
              </Text>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <Text variant="body" color="muted" style={styles.helperText}>
              Push notification settings will be available in a future update.
            </Text>
          </CardContent>
        </Card>

        {/* Help */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Help & Support</CardTitle>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            <Button
              variant="outline"
              onPress={() => Linking.openURL('mailto:support@tracklitapp.com')}
              style={styles.fullWidthButton}
            >
              Email Support
            </Button>
            <Button
              variant="outline"
              onPress={() => Linking.openURL('https://tracklitapp.com')}
              style={styles.fullWidthButton}
            >
              Visit Website
            </Button>
          </CardContent>
        </Card>

        {/* About */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <Text variant="body" color="muted" style={styles.helperText}>
              TrackLit Mobile v1.0.0
            </Text>
            <Text variant="small" color="muted" style={styles.helperText}>
              AI coaching, workout tracking, programs, meets, community, and tools.
            </Text>
          </CardContent>
        </Card>

        {/* Account */}
        <Button
          variant="outline"
          onPress={logout}
          style={[styles.fullWidthButton, styles.logoutButton]}
        >
          <FontAwesome5 name="sign-out-alt" size={16} color={theme.colors.destructive} solid />
          <Text variant="body" weight="medium" style={{ marginLeft: theme.spacing.sm, color: theme.colors.destructive }}>
            Sign Out
          </Text>
        </Button>
      </ScrollView>

      <Modal
        visible={countryPickerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setCountryPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text variant="h4" weight="semiBold" color="foreground">
                Select Country
              </Text>
              <TouchableOpacity onPress={() => setCountryPickerOpen(false)} style={styles.modalClose}>
                <FontAwesome5 name="times" size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              value={countryQuery}
              onChangeText={setCountryQuery}
              placeholder="Search..."
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryRow}
                  onPress={() => {
                    setCountry(item);
                    setCountryPickerOpen(false);
                  }}
                >
                  <Text variant="body" color="foreground">
                    {item}
                  </Text>
                  {item === country && (
                    <FontAwesome5 name="check" size={14} color={theme.colors.primary} solid />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginBottom: 0,
  },
  cardContent: {
    gap: theme.spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  fieldLabel: {
    marginTop: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.card,
  },
  selectInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  helperText: {
    lineHeight: 20,
  },
  fullWidthButton: {
    width: '100%',
  },
  logoutButton: {
    borderColor: theme.colors.destructive,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: theme.colors.backgroundSolid,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    maxHeight: '85%',
    gap: theme.spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalClose: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.card,
  },
  countryRow: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});


