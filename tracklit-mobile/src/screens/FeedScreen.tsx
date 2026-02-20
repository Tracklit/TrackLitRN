import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PencilSimpleLine, Heart, ChatCircle, PaperPlaneTilt } from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { InlineRefreshHeader } from '@/components/refresh/InlineRefreshHeader';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import type { RootStackParamList } from '@/navigation/types';
import { getScreenContentBottomPadding, getBottomNavOverlayHeight } from '@/utils/layoutPadding';
import theme from '@/utils/theme';
import { KeyboardAwareScreenScrollView } from '@/components/keyboard/KeyboardAwareScroll';

type FeedFilter = 'all' | 'connections';

interface FeedItem {
  id: number;
  userId: number | null;
  name?: string | null;
  username?: string | null;
  profileImageUrl?: string | null;
  content?: string | null;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isOwnPost: boolean;
}

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const FeedScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, refreshUser } = useAuth();
  const canInteract = !!user && user.id !== 'guest';
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerText, setComposerText] = useState('');

  const PLACEHOLDER_FEED: FeedItem[] = [
    {
      id: 1001,
      userId: 1,
      name: 'Alex R.',
      username: 'speedster_pro',
      profileImageUrl: 'https://i.pravatar.cc/150?img=11',
      content: 'Finished 6x100m sprint session with excellent form. Felt strong on the blocks and maintained good posture through the drive phase.',
      createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      likesCount: 12,
      commentsCount: 3,
      isLiked: false,
      isOwnPost: false,
    },
    {
      id: 1002,
      userId: 2,
      name: 'Sarah M.',
      username: 'sarah_m_runner',
      profileImageUrl: 'https://i.pravatar.cc/150?img=5',
      content: 'Just joined the TrackLit community! Excited to connect with other athletes and track my progress this season.',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      likesCount: 8,
      commentsCount: 5,
      isLiked: true,
      isOwnPost: false,
    },
    {
      id: 1003,
      userId: 3,
      name: 'Coach Jones',
      username: 'coach_jones',
      profileImageUrl: 'https://i.pravatar.cc/150?img=12',
      content: 'New meet scheduled for April 15th at Metro Stadium. Events include 100m, 200m, 400m, and 4x100m relay. Make sure your entries are in by Friday!',
      createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      likesCount: 24,
      commentsCount: 7,
      isLiked: false,
      isOwnPost: false,
    },
    {
      id: 1004,
      userId: 4,
      name: 'Mia T.',
      username: 'mia_track',
      profileImageUrl: 'https://i.pravatar.cc/150?img=9',
      content: 'Took an easy recovery day with stretching and foam rolling. Feeling fresh for tomorrow\'s tempo run. Remember — rest days are training days too!',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      likesCount: 15,
      commentsCount: 2,
      isLiked: false,
      isOwnPost: false,
    },
    {
      id: 1005,
      userId: 5,
      name: 'Marcus D.',
      username: 'hurdle_king',
      profileImageUrl: 'https://i.pravatar.cc/150?img=13',
      content: 'Worked on 3-step rhythm over 5 hurdles. Coach said my trail leg is improving. PB on the last rep! 🔥',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      likesCount: 31,
      commentsCount: 9,
      isLiked: true,
      isOwnPost: false,
    },
    {
      id: 1006,
      userId: 6,
      name: 'Coach Rivera',
      username: 'coach_rivera',
      profileImageUrl: 'https://i.pravatar.cc/150?img=14',
      content: 'Congrats to all athletes who competed today! 3 new personal bests recorded across the squad. Proud of the work everyone is putting in.',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      likesCount: 42,
      commentsCount: 11,
      isLiked: false,
      isOwnPost: false,
    },
    {
      id: 1007,
      userId: 7,
      name: 'Ella W.',
      username: 'ella_sprints',
      profileImageUrl: 'https://i.pravatar.cc/150?img=16',
      content: 'Starting an 8-week speed endurance block on Monday. Focus on lactate threshold and race-pace training. Who else is in prep season?',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      likesCount: 18,
      commentsCount: 6,
      isLiked: false,
      isOwnPost: false,
    },
    {
      id: 1008,
      userId: 8,
      name: 'Jordan K.',
      username: 'jordan_k',
      profileImageUrl: 'https://i.pravatar.cc/150?img=8',
      content: 'Just joined the Sprint Squad training group! Looking forward to pushing each other this season. Let\'s get faster together.',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      likesCount: 9,
      commentsCount: 4,
      isLiked: false,
      isOwnPost: false,
    },
    {
      id: 1009,
      userId: 9,
      name: 'Quinn L.',
      username: 'dash_quinn',
      profileImageUrl: 'https://i.pravatar.cc/150?img=33',
      content: 'Visualized my race plan for Saturday. Feeling confident about the 200m. Goal: sub-22 seconds. Mind and body aligned.',
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      likesCount: 27,
      commentsCount: 8,
      isLiked: true,
      isOwnPost: false,
    },
  ];

  const feedQuery = useQuery({
    queryKey: ['feed', filter],
    queryFn: () => apiRequest<FeedItem[]>(`/api/feed?filter=${filter}`),
    placeholderData: PLACEHOLDER_FEED,
    select: (data: FeedItem[]) => {
      if (!data || data.length === 0) return PLACEHOLDER_FEED;
      return data;
    },
  });

  const likeMutation = useMutation({
    mutationFn: (postId: number) =>
      apiRequest<{ liked: boolean }>(`/api/feed/posts/${postId}/like`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: () => {
      Alert.alert('Unable to like post', 'Please try again.');
    },
  });

  const createPostMutation = useMutation({
    mutationFn: (content: string) =>
      apiRequest('/api/feed/posts', {
        method: 'POST',
        data: { content },
      }),
    onSuccess: () => {
      setComposerText('');
      setIsComposerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (error: Error) => {
      Alert.alert('Unable to post', error.message || 'Please try again.');
    },
  });

  const handleToggleLike = (postId: number) => {
    if (!canInteract) {
      Alert.alert('Login required', 'Sign in to like posts.');
      return;
    }
    likeMutation.mutate(postId);
  };

  const { isRefreshing, onRefresh } = usePullToRefresh(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['feed'] }),
      refreshUser(),
    ]);
  });

  const handleCreatePost = () => {
    if (!canInteract) {
      Alert.alert('Login required', 'Sign in to share updates.');
      return;
    }
    if (!composerText.trim()) {
      Alert.alert('Add content', 'Share something with your community.');
      return;
    }
    createPostMutation.mutate(composerText.trim());
  };

  const filteredItems = feedQuery.data ?? [];
  const feedError = feedQuery.error as Error | undefined;
  const unauthorized =
    !!feedError &&
    /unauthorized|401|login required/i.test(feedError.message ?? '');

  const [localLikes, setLocalLikes] = useState<Record<number, boolean>>({});

  const handleLocalLike = (item: FeedItem) => {
    if (!canInteract) {
      Alert.alert('Login required', 'Sign in to like posts.');
      return;
    }
    setLocalLikes(prev => ({ ...prev, [item.id]: !prev[item.id] }));
    handleToggleLike(item.id);
  };

  const renderItem = ({ item }: { item: FeedItem }) => {
    const liked = localLikes[item.id] !== undefined ? localLikes[item.id] : item.isLiked;
    const likeCount = item.likesCount + (liked && !item.isLiked ? 1 : !liked && item.isLiked ? -1 : 0);
    const hasProfileImage = !!item.profileImageUrl;
    const initial = (item.name?.[0] || item.username?.[0] || '?').toUpperCase();

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => navigation.navigate('FeedPost', { id: item.id })}
        >
          <View style={styles.avatarContainer}>
            {hasProfileImage ? (
              <Image source={{ uri: item.profileImageUrl! }} style={styles.avatarImage} />
            ) : (
              <Avatar fallback={initial} size="md" style={styles.cardAvatar} />
            )}
          </View>
          <View style={styles.cardHeaderText}>
            <Text variant="body" weight="semiBold" color="foreground">
              {item.name || 'TrackLit Athlete'}
            </Text>
            <Text variant="small" color="muted">
              {item.username ? `@${item.username} · ` : ''}{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </Text>
          </View>
        </TouchableOpacity>
        {item.content && (
          <TouchableOpacity
            onPress={() => navigation.navigate('FeedPost', { id: item.id })}
          >
            <Text variant="body" color="foreground" style={styles.cardContentText}>
              {item.content}
            </Text>
          </TouchableOpacity>
        )}
        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleLocalLike(item)}
            disabled={likeMutation.isPending}
          >
            <Heart size={16} color={liked ? '#FF9800' : '#94a3b8'} weight={liked ? 'fill' : 'regular'} />
            <Text variant="small" color={liked ? 'primary' : 'muted'} style={styles.socialLabel}>
              {likeCount}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => navigation.navigate('FeedPost', { id: item.id })}
          >
            <ChatCircle size={16} color="#94a3b8" weight="regular" />
            <Text variant="small" color="muted" style={styles.socialLabel}>
              {item.commentsCount}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <InlineRefreshHeader visible={isRefreshing} />
        <Text variant="h2" weight="bold" color="foreground">
          Feed
        </Text>
        <Text variant="body" color="muted">
          Catch up with your TrackLit community
        </Text>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'all' && styles.activeFilterButton,
          ]}
          onPress={() => setFilter('all')}
        >
          <Text
            variant="body"
            color={filter === 'all' ? 'foreground' : 'muted'}
            weight="medium"
          >
            Everyone
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter === 'connections' && styles.activeFilterButton,
          ]}
          onPress={() => setFilter('connections')}
        >
          <Text
            variant="body"
            color={filter === 'connections' ? 'foreground' : 'muted'}
            weight="medium"
          >
            Connections
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContent,
          // Feed is a stack screen (no bottom tab bar), but still needs safe-area padding.
          { paddingBottom: getScreenContentBottomPadding(insets.bottom, { includeBottomNav: false, extra: theme.spacing.xl * 3 }) },
        ]}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            tintColor="#fff"
            refreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        }
        ListEmptyComponent={
          feedQuery.isLoading ? (
            <View style={styles.emptyState}>
              <Text variant="body" color="muted">
                Loading feed...
              </Text>
            </View>
          ) : feedQuery.isError ? (
            <View style={styles.emptyState}>
              <Text variant="body" color="muted" style={styles.emptyStateText}>
                {unauthorized
                  ? 'Please log in to view your community feed.'
                  : 'Unable to load the feed right now. Pull to refresh.'}
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text variant="body" color="muted" style={styles.emptyStateText}>
                No posts to show yet. Be the first to share something!
              </Text>
            </View>
          )
        }
      />

      {canInteract && (
        <TouchableOpacity
          style={[
            styles.fab,
            { bottom: getBottomNavOverlayHeight(insets.bottom) + theme.spacing.lg },
          ]}
          onPress={() => setIsComposerOpen(true)}
          data-testid="button-create-post"
        >
          <LinearGradient
            colors={theme.gradients.webPurple.colors}
            start={theme.gradients.webPurple.start}
            end={theme.gradients.webPurple.end}
            style={styles.fabGradient}
          >
            <PencilSimpleLine size={22} color="white" weight="fill" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      <Modal
        transparent
        visible={isComposerOpen}
        animationType="slide"
        onRequestClose={() => setIsComposerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAwareScreenScrollView
            style={styles.modalCard}
            contentContainerStyle={[
              styles.modalCardContent,
              { paddingBottom: insets.bottom + theme.spacing.lg },
            ]}
            showsVerticalScrollIndicator={false}
            extraScrollHeight={80}
          >
            <Text variant="h4" weight="semiBold" color="foreground" style={styles.modalTitle}>
              Share an update
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="What's on your mind?"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              value={composerText}
              onChangeText={setComposerText}
            />
            <View style={styles.modalActions}>
              <Button
                variant="ghost"
                onPress={() => setIsComposerOpen(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                loading={createPostMutation.isPending}
                onPress={handleCreatePost}
                style={styles.modalButton}
              >
                Post
              </Button>
            </View>
          </KeyboardAwareScreenScrollView>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.muted,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
  },
  filterButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  activeFilterButton: {
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingBottom: theme.spacing.xl * 3,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.background + 'EE',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: theme.spacing.md,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  cardAvatar: {
  },
  cardHeaderText: {
    flex: 1,
  },
  cardContentText: {
    lineHeight: 22,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    gap: 5,
  },
  socialLabel: {
    marginTop: 1,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  emptyStateText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.xl * 2,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    ...theme.shadows.lg,
    zIndex: 50,
    elevation: 20,
  },
  fabGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '85%',
  },
  modalCardContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  modalTitle: {
    textAlign: 'center',
  },
  modalInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.foreground,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
  },
  modalButton: {
    minWidth: 120,
  },
});
