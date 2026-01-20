import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { launchImageLibrary, Asset } from 'react-native-image-picker';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Card, CardContent } from '@/components/ui/Card';
import { CollapsibleCard } from '@/components/profile/CollapsibleCard';
import { TradingCardPreview } from '@/components/profile/TradingCardPreview';
import { ProfileImageCropModal } from '@/components/profile/ProfileImageCropModal';
import { SelectField } from '@/components/profile/fields/SelectField';
import { DateField } from '@/components/profile/fields/DateField';
import { ReadOnlyField } from '@/components/profile/fields/ReadOnlyField';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { getToken } from '@/lib/tokenStorage';
import { env } from '@/config/env';
import { countries } from '@/lib/countries';
import theme from '@/utils/theme';
import { getScreenContentBottomPadding } from '@/utils/layoutPadding';
import type { RootStackParamList, TabParamList } from '@/navigation/types';

type BackgroundType = 'color' | 'image';

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<TabParamList, 'Profile'>>();
  const { user, logout, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [backgroundType, setBackgroundType] = useState<BackgroundType>('color');
  const [backgroundColor, setBackgroundColor] = useState('#1e293b');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [publicName, setPublicName] = useState(user?.name || '');
  const [publicBio, setPublicBio] = useState((user as any)?.bio || '');
  const [profileImageAsset, setProfileImageAsset] = useState<Asset | null>(null);
  const [cropVisible, setCropVisible] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    country: (user as any)?.country || '',
    dateOfBirth: (user as any)?.dateOfBirth || '',
    gender: (user as any)?.gender || '',
    trainingGoal: (user as any)?.trainingGoal || '',
    injuryStatus: (user as any)?.injuryStatus || '',
    trainingDaysPerWeek: (user as any)?.trainingDaysPerWeek?.toString?.() || '',
    sleepHours: (user as any)?.sleepHours?.toString?.() || '',
    sleepQuality: (user as any)?.sleepQuality || '',
    mood: (user as any)?.mood || '',
    coachMode: (user as any)?.coachMode || '',
  });

  const isCoach = user?.isCoach === true;
  const focusCoachToggle = route.params?.focusCoachToggle === true;
  const memberSinceYear = useMemo(() => {
    const createdAt = (user as any)?.createdAt;
    if (!createdAt) return null;
    try {
      return new Date(createdAt as any).getFullYear().toString();
    } catch {
      return null;
    }
  }, [(user as any)?.createdAt]);

  const { data: coachLimits } = useQuery({
    queryKey: ['/api/coach/limits'],
    queryFn: () => apiRequest('/api/coach/limits'),
    enabled: isCoach,
  });

  const { data: athletes = [] } = useQuery({
    queryKey: ['/api/coach/athletes'],
    queryFn: () => apiRequest('/api/coach/athletes'),
    enabled: isCoach,
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['/api/athlete/coaches'],
    queryFn: () => apiRequest('/api/athlete/coaches'),
    enabled: true,
  });

  const coachStatusMutation = useMutation({
    mutationFn: async (value: boolean) => {
      return apiRequest('/api/user/coach-status', {
        method: 'PATCH',
        data: { isCoach: value },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coach/limits'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coach/athletes'] });
      refreshUser();
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Unable to update coach status.');
    },
  });

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        ...profileForm,
        trainingDaysPerWeek: profileForm.trainingDaysPerWeek
          ? parseInt(profileForm.trainingDaysPerWeek, 10)
          : undefined,
        sleepHours: profileForm.sleepHours ? parseFloat(profileForm.sleepHours) : undefined,
      };
      return apiRequest('/api/user', { method: 'PATCH', data: payload });
    },
    onSuccess: () => {
      Alert.alert('Profile updated', 'Your changes have been saved.');
      refreshUser();
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to update profile.');
    },
  });

  const publicProfileMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      const formData = new FormData();
      formData.append('name', publicName || '');
      formData.append('bio', publicBio || '');
      if (profileImageAsset?.uri) {
        formData.append('profileImage', {
          uri: profileImageAsset.uri,
          name: profileImageAsset.fileName || 'profile.jpg',
          type: profileImageAsset.type || 'image/jpeg',
        } as any);
      }
      const response = await fetch(`${env.API_BASE_URL}/api/user/public-profile`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to update public profile');
      }
      return response.json();
    },
    onSuccess: () => {
      setProfileImageAsset(null);
      Alert.alert('Success', 'Public profile updated.');
      refreshUser();
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to update public profile.');
    },
  });

  const handleSelectProfileImage = useCallback(async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.9,
    });
    if (result.assets && result.assets[0]) {
      setProfileImageAsset(result.assets[0]);
      setCropVisible(true);
    }
  }, []);

  const handleSelectBackgroundImage = useCallback(async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });
    if (result.assets && result.assets[0]?.uri) {
      setBackgroundType('image');
      setBackgroundImage(result.assets[0].uri);
    }
  }, []);

  const profileImageUrl = useMemo(() => {
    if (profileImageAsset?.uri) return profileImageAsset.uri;
    if (user?.profileImageUrl) {
      if (user.profileImageUrl.startsWith('/')) return `${env.API_BASE_URL}${user.profileImageUrl}`;
      return user.profileImageUrl;
    }
    return null;
  }, [profileImageAsset?.uri, user?.profileImageUrl]);

  const renderCoachLimitInfo = () => {
    if (!coachLimits) return null;
    const { currentAthletes, maxAthletes, tier } = coachLimits as any;
    return (
      <View style={styles.infoRow}>
        <Text variant="body" color="muted">
          Athletes: {currentAthletes} / {maxAthletes === 'unlimited' ? '∞' : maxAthletes}
        </Text>
        {tier ? (
          <Text variant="small" color="primary">
            {tier.toUpperCase()}
          </Text>
        ) : null}
      </View>
    );
  };

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
    { label: 'Prefer not to say', value: 'prefer_not_to_say' },
  ];

  const trainingGoalOptions = [
    { label: 'Improve Speed', value: 'improve_speed' },
    { label: 'Build Endurance', value: 'build_endurance' },
    { label: 'Increase Strength', value: 'increase_strength' },
    { label: 'Lose Weight', value: 'lose_weight' },
    { label: 'Maintain Fitness', value: 'maintain_fitness' },
    { label: 'Competition Preparation', value: 'competition_prep' },
  ];

  const sleepQualityOptions = [
    { label: 'Poor', value: 'poor' },
    { label: 'Fair', value: 'fair' },
    { label: 'Good', value: 'good' },
    { label: 'Very Good', value: 'very_good' },
    { label: 'Excellent', value: 'excellent' },
  ];

  const moodOptions = [
    { label: 'Poor', value: 'poor' },
    { label: 'Low', value: 'low' },
    { label: 'Neutral', value: 'neutral' },
    { label: 'Good', value: 'good' },
    { label: 'Great', value: 'great' },
  ];

  const coachModeOptions = [
    { label: 'Supportive & Encouraging', value: 'supportive' },
    { label: 'Analytical & Data-Driven', value: 'analytical' },
    { label: 'Motivational & Energetic', value: 'motivational' },
    { label: 'Balanced & Practical', value: 'balanced' },
  ];

  const trainingDaysOptions = Array.from({ length: 7 }).map((_, i) => ({
    label: `${i + 1} day${i === 0 ? '' : 's'}`,
    value: String(i + 1),
  }));

  const calculateAge = (dateString: string) => {
    if (!dateString) return '';
    const dob = new Date(dateString);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 0 ? age.toString() : '';
  };

  const isNarrowHeader = screenWidth < 390;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: getScreenContentBottomPadding(insets.bottom, { includeBottomNav: true, extra: theme.spacing.xl }) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="h2" weight="bold" color="foreground" style={styles.title}>
          Your Profile
        </Text>
        <Text variant="body" color="muted" style={styles.subtitle}>
          Manage your personal information and settings
        </Text>

        {/* Header Card */}
        <Card style={styles.headerCard} contentStyle={styles.nonStretchingCard}>
          <CardContent style={styles.nonStretchingCardContent}>
            <View style={[styles.headerTop, isNarrowHeader && styles.headerTopNarrow]}>
              <View style={[styles.headerIdentity, isNarrowHeader && styles.headerIdentityNarrow]}>
                <View style={styles.avatarRing}>
                  <Avatar
                    size="lg"
                    fallback={user?.name?.charAt(0) || 'U'}
                    src={profileImageUrl || undefined}
                  />
                </View>
                <View style={[styles.headerTextBlock, isNarrowHeader && styles.headerTextBlockNarrow]}>
                  <Text variant="h3" weight="bold" color="foreground" numberOfLines={1} ellipsizeMode="tail">
                    {user?.name || 'TrackLit Athlete'}
                  </Text>
                  <Text variant="body" color="muted" numberOfLines={1} ellipsizeMode="tail">
                    @{user?.username || 'guest'}
                  </Text>
                </View>
              </View>
              <View style={[styles.headerActions, isNarrowHeader && styles.headerActionsNarrow]}>
                <Button
                  variant="outline"
                  size="sm"
                  style={[styles.headerActionButton, isNarrowHeader && styles.headerActionButtonNarrow]}
                  onPress={() => navigation.navigate('Subscriptions')}
                >
                  Manage Coaching
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  style={[styles.headerActionButton, isNarrowHeader && styles.headerActionButtonNarrow]}
                  onPress={logout}
                >
                  Sign Out
                </Button>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Coach Status */}
        <CollapsibleCard
          title="Coach Status"
          subtitle="Enable coaching tools and athlete management"
          defaultOpen={focusCoachToggle}
          cardStyle={styles.cardVariant}
          headerStyle={styles.cardHeaderVariant}
        >
          <View style={styles.rowBetween}>
            <Text variant="body" color="foreground">
              Coaching features
            </Text>
            <TouchableOpacity
              onPress={() => coachStatusMutation.mutate(!isCoach)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.switchTrack,
                  { backgroundColor: isCoach ? theme.colors.primary : theme.colors.border },
                ]}
              >
                <View
                  style={[
                    styles.switchThumb,
                    { transform: [{ translateX: isCoach ? 18 : 0 }] },
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>
          {renderCoachLimitInfo()}
          {isCoach && (athletes as any[]).length > 0 ? (
            <View style={styles.listBlock}>
              <Text variant="small" weight="medium" color="muted">
                Athletes ({(athletes as any[]).length})
              </Text>
              {(athletes as any[]).slice(0, 3).map((ath) => (
                <Text key={ath.id} variant="body" color="foreground">
                  • {ath.name || ath.username}
                </Text>
              ))}
            </View>
          ) : null}
          {(coaches as any[]).length > 0 ? (
            <View style={styles.listBlock}>
              <Text variant="small" weight="medium" color="muted">
                Coaches ({(coaches as any[]).length})
              </Text>
              {(coaches as any[]).map((coach: any) => (
                <Text key={coach.id} variant="body" color="foreground">
                  • {coach.name || coach.username}
                </Text>
              ))}
            </View>
          ) : null}
        </CollapsibleCard>

        {/* Public Profile / Trading Card */}
        <CollapsibleCard
          title="Your Public Profile"
          subtitle="This is how others see your card"
          defaultOpen={false}
          cardStyle={styles.cardVariant}
          headerStyle={styles.cardHeaderVariant}
          contentStyle={styles.publicProfileContent}
        >
          <TradingCardPreview
            name={publicName}
            username={user?.username}
            bio={publicBio}
            profileImageUrl={profileImageUrl || undefined}
            subscriptionTier={user?.subscriptionTier || (user?.isPremium ? 'premium' : 'free')}
            backgroundType={backgroundType}
            backgroundColor={backgroundColor}
            backgroundImage={backgroundImage}
            memberSinceYear={memberSinceYear}
            cardNumber={typeof user?.id === 'number' ? user.id : null}
          />

          <View style={styles.sectionActions}>
            <Button variant="outline" size="sm" onPress={handleSelectProfileImage}>
              Change Profile Image
            </Button>
            <Button variant="outline" size="sm" onPress={() => setBackgroundType('color')}>
              Solid Color
            </Button>
            <Button variant="outline" size="sm" onPress={handleSelectBackgroundImage}>
              Upload Background
            </Button>
          </View>

          <View style={styles.colorRow}>
            {['#1e293b', '#7c3aed', '#059669', '#dc2626', '#ea580c', '#0891b2'].map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorSwatch, { backgroundColor: c }]}
                onPress={() => {
                  setBackgroundType('color');
                  setBackgroundColor(c);
                }}
              />
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text variant="body" weight="medium" color="foreground">
              Display Name
            </Text>
            <TextInput
              style={styles.input}
              value={publicName}
              onChangeText={setPublicName}
              placeholder="Your display name"
              placeholderTextColor={theme.colors.textMuted}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text variant="body" weight="medium" color="foreground">
              Bio
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={publicBio}
              onChangeText={setPublicBio}
              placeholder="Tell others about yourself..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <Button
            variant="default"
            onPress={() => publicProfileMutation.mutate()}
            loading={publicProfileMutation.isPending}
            style={styles.saveButton}
          >
            Save Public Profile
          </Button>
        </CollapsibleCard>

        {/* Profile Settings */}
        <CollapsibleCard
          title="Profile Settings"
          subtitle="Private settings and preferences"
          defaultOpen
          cardStyle={styles.cardVariant}
          headerStyle={styles.cardHeaderVariant}
          contentStyle={styles.cardContentVariant}
        >
          <View style={styles.formGrid}>
            {renderTextInput('Full Name', 'name')}
            {renderTextInput('Email', 'email', 'email-address')}

            <SelectField
              label="Country"
              value={profileForm.country}
              options={countries.map((c) => ({ label: c, value: c }))}
              placeholder="Select your country"
              onChange={(val) => setProfileForm((prev) => ({ ...prev, country: val }))}
            />

            <DateField
              label="Date of Birth"
              value={profileForm.dateOfBirth || undefined}
              onChange={(val) => setProfileForm((prev) => ({ ...prev, dateOfBirth: val || '' }))}
              maximumDate={new Date()}
            />

            <ReadOnlyField
              label="Age"
              value={
                profileForm.dateOfBirth
                  ? String(calculateAge(profileForm.dateOfBirth))
                  : undefined
              }
              placeholder="Set your date of birth to calculate age"
            />

            <SelectField
              label="Gender"
              value={profileForm.gender}
              options={genderOptions}
              onChange={(val) => setProfileForm((prev) => ({ ...prev, gender: val }))}
            />

            <SelectField
              label="Training Goal"
              value={profileForm.trainingGoal}
              options={trainingGoalOptions}
              onChange={(val) => setProfileForm((prev) => ({ ...prev, trainingGoal: val }))}
            />

            {renderTextInput('Injury Status', 'injuryStatus')}

            <SelectField
              label="Training Days Per Week"
              value={profileForm.trainingDaysPerWeek}
              options={trainingDaysOptions}
              onChange={(val) => setProfileForm((prev) => ({ ...prev, trainingDaysPerWeek: val }))}
            />

            {renderNumericInput('Average Sleep Hours', 'sleepHours', 'numeric')}

            <SelectField
              label="Sleep Quality"
              value={profileForm.sleepQuality}
              options={sleepQualityOptions}
              onChange={(val) => setProfileForm((prev) => ({ ...prev, sleepQuality: val }))}
            />

            <SelectField
              label="Mood"
              value={profileForm.mood}
              options={moodOptions}
              onChange={(val) => setProfileForm((prev) => ({ ...prev, mood: val }))}
            />

            <SelectField
              label="AI Coach Personality"
              value={profileForm.coachMode}
              options={coachModeOptions}
              onChange={(val) => setProfileForm((prev) => ({ ...prev, coachMode: val }))}
            />
          </View>
          <Button
            variant="default"
            onPress={() => saveProfileMutation.mutate()}
            loading={saveProfileMutation.isPending}
            style={styles.saveButton}
          >
            Save Settings
          </Button>
        </CollapsibleCard>

        <Button
          variant="outline"
          size="lg"
          onPress={logout}
          style={styles.logoutButton}
        >
          Sign Out
        </Button>
      </ScrollView>

      <ProfileImageCropModal
        visible={cropVisible}
        imageUri={profileImageAsset?.uri || null}
        onCancel={() => setCropVisible(false)}
        onSave={() => {
          setCropVisible(false);
          publicProfileMutation.mutate();
        }}
      />
    </View>
  );

  function renderTextInput(
    label: string,
    key: keyof typeof profileForm,
    keyboardType: 'default' | 'numeric' | 'email-address' = 'default',
  ) {
    return (
      <View style={styles.inputGroup}>
        <Text variant="body" weight="medium" color="foreground">
          {label}
        </Text>
        <TextInput
          style={styles.input}
          value={profileForm[key] as string}
          onChangeText={(text) =>
            setProfileForm((prev) => ({
              ...prev,
              [key]: text,
            }))
          }
          placeholder={label}
          placeholderTextColor={theme.colors.textMuted}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        />
      </View>
    );
  }

  function renderNumericInput(
    label: string,
    key: keyof typeof profileForm,
    keyboardType: 'default' | 'numeric' | 'email-address' = 'default',
  ) {
    return (
      <View style={styles.inputGroup}>
        <Text variant="body" weight="medium" color="foreground">
          {label}
        </Text>
        <TextInput
          style={styles.input}
          value={profileForm[key] as string}
          onChangeText={(text) =>
            setProfileForm((prev) => ({
              ...prev,
              [key]: text.replace(/[^0-9.]/g, ''),
            }))
          }
          placeholder={label}
          placeholderTextColor={theme.colors.textMuted}
          keyboardType={keyboardType}
        />
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#010a18',
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  title: {
    marginTop: theme.spacing.lg,
  },
  subtitle: {
    marginBottom: theme.spacing.sm,
  },
  headerCard: {
    backgroundColor: '#0a1529',
    borderColor: '#1e3a8a33',
    borderWidth: 1,
  },
  cardVariant: {
    backgroundColor: '#0a1529',
    borderColor: '#1e3a8a33',
    borderWidth: 1,
  },
  cardHeaderVariant: {
    paddingVertical: theme.spacing.md,
  },
  cardContentVariant: {
    paddingBottom: theme.spacing.lg,
  },
  publicProfileContent: {
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  headerContent: {
  },
  nonStretchingCard: {
    // Prevent Card's internal wrapper from stretching in ScrollView (Android in particular).
    flex: 0,
  },
  nonStretchingCardContent: {
    // Prevent `CardContent` from stretching to fill ScrollView viewport on Android
    // (which can cause the header card to become huge / visually glitchy).
    flex: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    flexWrap: 'wrap',
  },
  headerTopNarrow: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  headerIdentity: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
    flex: 1,
  },
  headerIdentityNarrow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 0,
  },
  headerTextBlock: {
    flexShrink: 1,
  },
  headerTextBlockNarrow: {
    marginTop: theme.spacing.sm,
    width: '100%',
  },
  avatarRing: {
    padding: 4,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#f5c842',
  },
  headerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
    flexShrink: 0,
  },
  headerActionsNarrow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    width: '100%',
    marginTop: theme.spacing.md,
  },
  headerActionButton: {
    minWidth: 140,
  },
  headerActionButtonNarrow: {
    minWidth: 0,
    width: '100%',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  switchTrack: {
    width: 42,
    height: 24,
    borderRadius: 12,
    padding: 3,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  listBlock: {
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  sectionActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  colorRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.md,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.md,
  },
  inputGroup: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.card,
  },
  textArea: {
    minHeight: 80,
  },
  saveButton: {
    marginTop: theme.spacing.sm,
  },
  formGrid: {
    gap: theme.spacing.sm,
  },
  logoutButton: {
    marginTop: theme.spacing.lg,
    borderColor: theme.colors.destructive,
  },
});
