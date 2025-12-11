import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useMutation } from '@tanstack/react-query';
import { launchImageLibrary, Asset } from 'react-native-image-picker';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { getToken } from '@/lib/tokenStorage';
import { env } from '@/config/env';
import theme from '@/utils/theme';

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, logout, refreshUser } = useAuth();
  const isGuest = user?.id === 'guest';
  const contentBottomPadding = theme.layout.bottomNavHeight + insets.bottom + theme.spacing.xl;

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState('');
  const [selectedImage, setSelectedImage] = useState<Asset | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'notifications' | 'privacy' | 'help' | 'about' | null>(null);

  // Update profile with image mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; bio?: string; imageAsset?: Asset }) => {
      const token = await getToken();
      
      // Use FormData for multipart upload
      const formData = new FormData();
      formData.append('name', data.name);
      if (data.bio) {
        formData.append('bio', data.bio);
      }
      
      // Add image if selected
      if (data.imageAsset?.uri) {
        const imageUri = data.imageAsset.uri;
        const fileName = data.imageAsset.fileName || 'profile.jpg';
        const type = data.imageAsset.type || 'image/jpeg';
        
        formData.append('profileImage', {
          uri: imageUri,
          name: fileName,
          type: type,
        } as any);
      }
      
      const response = await fetch(`${env.API_BASE_URL}/api/user/public-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - browser/RN will set it with boundary
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsEditing(false);
      setSelectedImage(null);
      refreshUser();
      Alert.alert('Success', 'Profile updated successfully!');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to update profile.');
    },
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshUser();
    setIsRefreshing(false);
  }, [refreshUser]);

  const handleSelectImage = useCallback(async () => {
    if (isGuest) {
      Alert.alert('Login Required', 'Please sign in to update your profile picture.');
      return;
    }

    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 500,
        maxHeight: 500,
      });

      if (result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
        // Start editing mode if not already
        if (!isEditing) {
          setEditName(user?.name || '');
          setIsEditing(true);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to select image. Please check permissions.');
    }
  }, [isGuest, isEditing, user?.name]);

  const handleSaveProfile = useCallback(() => {
    if (isGuest) {
      Alert.alert('Login Required', 'Please sign in to edit your profile.');
      return;
    }

    if (!editName.trim()) {
      Alert.alert('Invalid Name', 'Please enter your name.');
      return;
    }

    updateProfileMutation.mutate({
      name: editName.trim(),
      bio: editBio.trim() || undefined,
      imageAsset: selectedImage || undefined,
    });
  }, [isGuest, editName, editBio, selectedImage, updateProfileMutation]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditName(user?.name || '');
    setEditBio('');
    setSelectedImage(null);
  }, [user]);

  const handleStartEdit = useCallback(() => {
    if (isGuest) {
      Alert.alert('Login Required', 'Please sign in to edit your profile.');
      return;
    }
    setEditName(user?.name || '');
    setIsEditing(true);
  }, [isGuest, user]);

  const handleSettingsPress = (tab: 'notifications' | 'privacy' | 'help' | 'about') => {
    setActiveSettingsTab(tab);
    setShowSettingsModal(true);
  };

  const handleOpenWebsite = () => {
    Linking.openURL('https://tracklitapp.com');
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@tracklitapp.com');
  };

  const getProfileImageUrl = () => {
    if (selectedImage?.uri) {
      return selectedImage.uri;
    }
    if (user?.profileImageUrl) {
      // Handle relative URLs
      if (user.profileImageUrl.startsWith('/')) {
        return `${env.API_BASE_URL}${user.profileImageUrl}`;
      }
      return user.profileImageUrl;
    }
    return null;
  };

  const imageUrl = getProfileImageUrl();

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            tintColor="#fff"
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h2" weight="bold" color="foreground">
            Profile
          </Text>
        </View>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <CardContent style={styles.profileContent}>
            {/* Avatar with Edit Button */}
            <TouchableOpacity style={styles.avatarContainer} onPress={handleSelectImage}>
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <Avatar
                  size="xl"
                  fallback={user?.name?.[0] || 'U'}
                  src={undefined}
                />
              )}
              <View style={styles.editAvatarBadge}>
                {isUploadingImage ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <FontAwesome5 name="camera" size={12} color="white" solid />
                )}
              </View>
            </TouchableOpacity>

            {/* Profile Info */}
            {isEditing ? (
              <View style={styles.editForm}>
                <Text variant="body" weight="medium" color="foreground" style={styles.label}>
                  Display Name
                </Text>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Your name"
                  placeholderTextColor={theme.colors.textMuted}
                />

                <Text variant="body" weight="medium" color="foreground" style={styles.label}>
                  Bio
                </Text>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Tell us about yourself..."
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                {selectedImage && (
                  <View style={styles.imagePreviewRow}>
                    <FontAwesome5 name="check-circle" size={16} color={theme.colors.success} solid />
                    <Text variant="small" color="success" style={styles.imagePreviewText}>
                      New photo selected
                    </Text>
                  </View>
                )}

                <View style={styles.editActions}>
                  <Button
                    variant="outline"
                    size="md"
                    onPress={handleCancelEdit}
                    style={styles.editButton}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="md"
                    onPress={handleSaveProfile}
                    loading={updateProfileMutation.isPending}
                    style={styles.editButton}
                  >
                    Save
                  </Button>
                </View>
              </View>
            ) : (
              <View style={styles.profileInfo}>
                <Text variant="h3" weight="bold" color="foreground">
                  {user?.name || 'TrackLit Athlete'}
                </Text>
                <Text variant="body" color="muted">
                  @{user?.username || 'guest'}
                </Text>
                {user?.email && (
                  <Text variant="small" color="muted" style={styles.email}>
                    {user.email}
                  </Text>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onPress={handleStartEdit}
                  style={styles.editProfileButton}
                >
                  <FontAwesome5 name="edit" size={14} color={theme.colors.primary} solid />
                  <Text variant="body" weight="medium" color="primary" style={styles.buttonText}>
                    Edit Profile
                  </Text>
                </Button>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Settings Section */}
        <Card style={styles.settingsCard}>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent style={styles.settingsContent}>
            <TouchableOpacity 
              style={styles.settingRow}
              onPress={() => handleSettingsPress('notifications')}
            >
              <FontAwesome5 name="bell" size={18} color={theme.colors.textMuted} solid />
              <Text variant="body" color="foreground" style={styles.settingText}>
                Notifications
              </Text>
              <FontAwesome5 name="chevron-right" size={14} color={theme.colors.textMuted} solid />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingRow}
              onPress={() => handleSettingsPress('privacy')}
            >
              <FontAwesome5 name="lock" size={18} color={theme.colors.textMuted} solid />
              <Text variant="body" color="foreground" style={styles.settingText}>
                Privacy
              </Text>
              <FontAwesome5 name="chevron-right" size={14} color={theme.colors.textMuted} solid />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingRow}
              onPress={() => handleSettingsPress('help')}
            >
              <FontAwesome5 name="question-circle" size={18} color={theme.colors.textMuted} solid />
              <Text variant="body" color="foreground" style={styles.settingText}>
                Help & Support
              </Text>
              <FontAwesome5 name="chevron-right" size={14} color={theme.colors.textMuted} solid />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingRow}
              onPress={() => handleSettingsPress('about')}
            >
              <FontAwesome5 name="info-circle" size={18} color={theme.colors.textMuted} solid />
              <Text variant="body" color="foreground" style={styles.settingText}>
                About TrackLit
              </Text>
              <FontAwesome5 name="chevron-right" size={14} color={theme.colors.textMuted} solid />
            </TouchableOpacity>
          </CardContent>
        </Card>

        {/* Sign Out Button */}
        <Button
          variant="outline"
          size="lg"
          onPress={logout}
          style={styles.logoutButton}
        >
          <FontAwesome5 name="sign-out-alt" size={16} color={theme.colors.destructive} solid />
          <Text variant="body" weight="medium" style={[styles.buttonText, { color: theme.colors.destructive }]}>
            Sign Out
          </Text>
        </Button>

        {/* Version Info */}
        <Text variant="small" color="muted" style={styles.version}>
          TrackLit Mobile v1.0.0
        </Text>
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="h3" weight="bold" color="foreground">
                {activeSettingsTab === 'notifications' && 'Notifications'}
                {activeSettingsTab === 'privacy' && 'Privacy'}
                {activeSettingsTab === 'help' && 'Help & Support'}
                {activeSettingsTab === 'about' && 'About TrackLit'}
              </Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <FontAwesome5 name="times" size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {activeSettingsTab === 'notifications' && (
                <View style={styles.settingsSection}>
                  <Text variant="body" color="muted" style={styles.settingsText}>
                    Push notification settings will be available in a future update.
                  </Text>
                  <Text variant="body" color="muted" style={styles.settingsText}>
                    For now, you can manage email notifications from the web app.
                  </Text>
                </View>
              )}

              {activeSettingsTab === 'privacy' && (
                <View style={styles.settingsSection}>
                  <Text variant="body" color="foreground" weight="semiBold" style={styles.settingsSectionTitle}>
                    Profile Visibility
                  </Text>
                  <Text variant="body" color="muted" style={styles.settingsText}>
                    Your profile is visible to other TrackLit users. You can manage detailed privacy settings from the web app.
                  </Text>
                  
                  <Text variant="body" color="foreground" weight="semiBold" style={styles.settingsSectionTitle}>
                    Data Usage
                  </Text>
                  <Text variant="body" color="muted" style={styles.settingsText}>
                    We only collect data necessary to provide you with the TrackLit experience. Your workout data is private by default.
                  </Text>
                </View>
              )}

              {activeSettingsTab === 'help' && (
                <View style={styles.settingsSection}>
                  <Text variant="body" color="foreground" weight="semiBold" style={styles.settingsSectionTitle}>
                    Contact Support
                  </Text>
                  <Text variant="body" color="muted" style={styles.settingsText}>
                    Have a question or issue? We're here to help!
                  </Text>
                  <Button
                    variant="outline"
                    onPress={handleContactSupport}
                    style={styles.settingsButton}
                  >
                    Email Support
                  </Button>

                  <Text variant="body" color="foreground" weight="semiBold" style={styles.settingsSectionTitle}>
                    FAQs
                  </Text>
                  <Text variant="body" color="muted" style={styles.settingsText}>
                    Visit our website for frequently asked questions and guides.
                  </Text>
                  <Button
                    variant="outline"
                    onPress={handleOpenWebsite}
                    style={styles.settingsButton}
                  >
                    Visit Website
                  </Button>
                </View>
              )}

              {activeSettingsTab === 'about' && (
                <View style={styles.settingsSection}>
                  <Text variant="h4" color="primary" weight="bold" style={styles.aboutTitle}>
                    TrackLit
                  </Text>
                  <Text variant="body" color="muted" style={styles.settingsText}>
                    The ultimate training companion for track and field athletes.
                  </Text>

                  <Text variant="body" color="foreground" weight="semiBold" style={styles.settingsSectionTitle}>
                    Version
                  </Text>
                  <Text variant="body" color="muted" style={styles.settingsText}>
                    1.0.0 (Build 1)
                  </Text>

                  <Text variant="body" color="foreground" weight="semiBold" style={styles.settingsSectionTitle}>
                    Features
                  </Text>
                  <Text variant="body" color="muted" style={styles.settingsText}>
                    • AI-powered coaching with Sprinthia{'\n'}
                    • Workout tracking & journaling{'\n'}
                    • Training programs{'\n'}
                    • Competition calendar{'\n'}
                    • Community feed{'\n'}
                    • Training tools
                  </Text>

                  <Button
                    variant="outline"
                    onPress={handleOpenWebsite}
                    style={styles.settingsButton}
                  >
                    Visit tracklitapp.com
                  </Button>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                variant="default"
                onPress={() => setShowSettingsModal(false)}
                style={styles.modalCloseButton}
              >
                Close
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  profileCard: {
    marginBottom: theme.spacing.lg,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: theme.spacing.lg,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  profileInfo: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  email: {
    marginTop: theme.spacing.sm,
  },
  editProfileButton: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  buttonText: {
    marginLeft: theme.spacing.sm,
  },
  editForm: {
    width: '100%',
    gap: theme.spacing.sm,
  },
  label: {
    marginTop: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.foreground,
    fontSize: 16,
    backgroundColor: theme.colors.card,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  imagePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  imagePreviewText: {
    marginLeft: theme.spacing.xs,
  },
  editActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  editButton: {
    flex: 1,
  },
  settingsCard: {
    marginBottom: theme.spacing.lg,
  },
  settingsContent: {
    gap: theme.spacing.xs,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingText: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    borderColor: theme.colors.destructive,
    marginBottom: theme.spacing.lg,
  },
  version: {
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalBody: {
    padding: theme.spacing.lg,
  },
  modalFooter: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modalCloseButton: {
    width: '100%',
  },
  settingsSection: {
    gap: theme.spacing.md,
  },
  settingsSectionTitle: {
    marginTop: theme.spacing.lg,
  },
  settingsText: {
    lineHeight: 22,
  },
  settingsButton: {
    marginTop: theme.spacing.sm,
  },
  aboutTitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
});
