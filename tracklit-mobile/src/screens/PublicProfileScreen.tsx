import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  UserPlus,
  Check,
  ChatCircleDots,
  Clock,
  Trophy,
  Fire,
  Users,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';
import theme from '@/utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PublicProfile'>;

interface UserProfileData {
  id: number;
  name?: string | null;
  username?: string | null;
  profileImageUrl?: string | null;
  bio?: string | null;
  role?: string | null;
  createdAt?: string | null;
  isFollowing?: boolean;
  isPending?: boolean;
  connectionsCount?: number;
  postsCount?: number;
}

export const PublicProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { userId, name, username, profileImageUrl } = route.params;
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';
  const isOwnProfile = user?.id && Number(user.id) === userId;

  const [connectionState, setConnectionState] = useState<'none' | 'pending' | 'connected'>('none');

  const profileQuery = useQuery({
    queryKey: ['public-profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      try {
        const data = await apiRequest<UserProfileData>(`/api/users/${userId}/profile`);
        if (data?.isFollowing) setConnectionState('connected');
        else if (data?.isPending) setConnectionState('pending');
        return data;
      } catch {
        return null;
      }
    },
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/follow/${userId}`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      setConnectionState('pending');
      queryClient.invalidateQueries({ queryKey: ['public-profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
    onError: (error: Error) => {
      if (error.message?.includes('already')) {
        setConnectionState('pending');
      } else {
        Alert.alert('Unable to connect', error.message || 'Please try again.');
      }
    },
  });

  const handleConnect = () => {
    if (!isAuthenticated || isGuest) {
      Alert.alert('Login required', 'Sign in to connect with other athletes.');
      return;
    }
    if (connectionState === 'none') {
      if (userId >= 1000) {
        setConnectionState('pending');
        return;
      }
      connectMutation.mutate();
    }
  };

  const handleMessage = () => {
    if (!isAuthenticated || isGuest) {
      Alert.alert('Login required', 'Sign in to send messages.');
      return;
    }
    navigation.navigate('ChatConversation', {
      conversationId: userId,
      type: 'direct',
    });
  };

  const profile = profileQuery.data;
  const displayName = profile?.name || name || 'TrackLit Athlete';
  const displayUsername = profile?.username || username || '';
  const displayImage = profile?.profileImageUrl || profileImageUrl || null;
  const displayBio = profile?.bio || null;
  const displayRole = profile?.role || 'athlete';

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + theme.spacing.md }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color="#e2e8f0" weight="bold" />
        </TouchableOpacity>
        <Text variant="body" weight="semiBold" color="foreground">
          Profile
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + theme.spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          {displayImage ? (
            <Image source={{ uri: displayImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileAvatarWrap}>
              <Avatar fallback={(displayName[0] || '?').toUpperCase()} size="lg" />
            </View>
          )}
          <Text variant="h3" weight="bold" color="foreground" style={styles.profileName}>
            {displayName}
          </Text>
          {displayUsername ? (
            <Text variant="body" color="muted">@{displayUsername}</Text>
          ) : null}
          <Text variant="small" color="primary" weight="medium" style={styles.roleTag}>
            {displayRole.charAt(0).toUpperCase() + displayRole.slice(1)}
          </Text>
          {displayBio && (
            <Text variant="body" color="secondary" style={styles.bio}>
              {displayBio}
            </Text>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Trophy size={16} color="rgba(255,255,255,0.4)" weight="fill" />
            <Text variant="body" weight="bold" color="foreground">{profile?.postsCount ?? 0}</Text>
            <Text variant="small" color="muted">Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Users size={16} color="rgba(255,255,255,0.4)" weight="fill" />
            <Text variant="body" weight="bold" color="foreground">{profile?.connectionsCount ?? 0}</Text>
            <Text variant="small" color="muted">Connections</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Fire size={16} color="rgba(255,255,255,0.4)" weight="fill" />
            <Text variant="body" weight="bold" color="foreground">--</Text>
            <Text variant="small" color="muted">Streak</Text>
          </View>
        </View>

        {!isOwnProfile && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.connectButton,
                connectionState === 'connected' && styles.connectedButton,
                connectionState === 'pending' && styles.pendingButton,
              ]}
              onPress={handleConnect}
              disabled={connectionState !== 'none' || connectMutation.isPending}
              activeOpacity={0.7}
            >
              {connectMutation.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : connectionState === 'connected' ? (
                <>
                  <Check size={16} color="white" weight="bold" />
                  <Text variant="body" weight="semiBold" style={{ color: 'white' }}>Connected</Text>
                </>
              ) : connectionState === 'pending' ? (
                <>
                  <Clock size={16} color="white" weight="fill" />
                  <Text variant="body" weight="semiBold" style={{ color: 'white' }}>Pending</Text>
                </>
              ) : (
                <>
                  <UserPlus size={16} color="white" weight="fill" />
                  <Text variant="body" weight="semiBold" style={{ color: 'white' }}>Connect</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.messageButton}
              onPress={handleMessage}
              activeOpacity={0.7}
            >
              <ChatCircleDots size={16} color="#FF9800" weight="fill" />
              <Text variant="body" weight="semiBold" color="primary">Message</Text>
            </TouchableOpacity>
          </View>
        )}

        {isOwnProfile && (
          <View style={styles.ownProfileNote}>
            <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
              This is your profile. Other athletes see this when they tap your picture.
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.xl,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  profileAvatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#FF9800',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileName: {
    marginTop: theme.spacing.lg,
  },
  roleTag: {
    marginTop: 4,
    backgroundColor: 'rgba(255,152,0,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  bio: {
    marginTop: theme.spacing.md,
    textAlign: 'center',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  connectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF9800',
    borderRadius: 12,
    paddingVertical: 14,
  },
  connectedButton: {
    backgroundColor: '#22c55e',
  },
  pendingButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FF9800',
    borderRadius: 12,
    paddingVertical: 14,
  },
  ownProfileNote: {
    padding: theme.spacing.xl,
  },
});
