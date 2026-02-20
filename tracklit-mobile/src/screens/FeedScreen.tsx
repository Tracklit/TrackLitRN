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
import { PencilSimpleLine, Heart, ChatCircle, ArrowLeft, Book } from 'phosphor-react-native';

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
  isJournalEntry?: boolean;
  journalTitle?: string | null;
  journalNotes?: string | null;
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
      content: 'Took an easy recovery day with stretching and foam rolling. Feeling fresh for tomorrow\'s tempo run.',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      likesCount: 15,
      commentsCount: 2,
      isLiked: false,
      isOwnPost: false,
      isJournalEntry: true,
      journalTitle: 'Recovery Day Reflection',
      journalNotes: 'Took an easy recovery day with stretching and foam rolling. Feeling fresh for tomorrow\'s tempo run. Remember — rest days are training days too!\n\nDid 20 minutes of yoga, 10 minutes foam rolling on quads and hamstrings, and 15 minutes of dynamic stretching. Legs feel much better after yesterday\'s hard session.\n\nMood: 8/10\nSleep: 7.5 hours',
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
      content: 'Visualized my race plan for Saturday. Feeling confident about the 200m. Goal: sub-22 seconds.',
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      likesCount: 27,
      commentsCount: 8,
      isLiked: true,
      isOwnPost: false,
      isJournalEntry: true,
      journalTitle: 'Pre-Competition Notes',
      journalNotes: 'Visualized my race plan for Saturday. Feeling confident about the 200m. Goal: sub-22 seconds. Mind and body aligned.\n\nRace plan:\n- Explode out of blocks, stay low for 30m\n- Transition to upright by 50m\n- Hold form through the bend\n- Lean into finish\n\nVisualization: 3 reps of full race mentally\nFeeling: Calm and focused\nConfidence: 9/10',
    },
  ];

  const feedQuery = useQuery({
    queryKey: ['feed', filter],
    queryFn: async () => {
      try {
        const data = await apiRequest<FeedItem[]>(`/api/feed?filter=${filter}`);
        return data && data.length > 0 ? data : PLACEHOLDER_FEED;
      } catch {
        return PLACEHOLDER_FEED;
      }
    },
    initialData: PLACEHOLDER_FEED,
    staleTime: 60000,
    retry: false,
  });

  const likeMutation = useMutation({
    mutationFn: (postId: number) =>
      apiRequest<{ liked: boolean }>(`/api/feed/posts/${postId}/like`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
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
  const [journalModalVisible, setJournalModalVisible] = useState(false);
  const [selectedJournalPost, setSelectedJournalPost] = useState<FeedItem | null>(null);

  const handleLocalLike = (item: FeedItem) => {
    if (!canInteract) {
      Alert.alert('Login required', 'Sign in to like posts.');
      return;
    }
    const isCurrentlyLiked = localLikes[item.id] !== undefined ? localLikes[item.id] : item.isLiked;
    setLocalLikes(prev => ({ ...prev, [item.id]: !isCurrentlyLiked }));
    if (item.id < 1000) {
      handleToggleLike(item.id);
    }
  };

  const renderItem = ({ item }: { item: FeedItem }) => {
    const liked = localLikes[item.id] !== undefined ? localLikes[item.id] : item.isLiked;
    const likeCount = item.likesCount + (liked && !item.isLiked ? 1 : !liked && item.isLiked ? -1 : 0);
    const hasProfileImage = !!item.profileImageUrl;
    const initial = (item.name?.[0] || item.username?.[0] || '?').toUpperCase();

    return (
      <View style={styles.postContainer}>
        <TouchableOpacity
          style={styles.postHeader}
          onPress={() => navigation.navigate('FeedPost', { id: item.id })}
          activeOpacity={0.7}
        >
          {hasProfileImage ? (
            <Image source={{ uri: item.profileImageUrl! }} style={styles.avatarImage} />
          ) : (
            <Avatar fallback={initial} size="md" style={styles.avatarFallback} />
          )}
          <View style={styles.postMeta}>
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
            activeOpacity={0.7}
          >
            <Text variant="body" color="secondary" style={styles.postContent}>
              {item.content}
            </Text>
          </TouchableOpacity>
        )}
        {item.isJournalEntry && (
          <TouchableOpacity
            style={styles.journalLink}
            onPress={() => {
              setSelectedJournalPost(item);
              setJournalModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Book size={13} color="#FF9800" weight="fill" />
            <Text variant="small" color="primary" weight="medium">
              View full journal entry
            </Text>
          </TouchableOpacity>
        )}
        <View style={styles.postFooter}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleLocalLike(item)}
            disabled={likeMutation.isPending}
          >
            <Heart size={20} color={liked ? '#FF9800' : 'rgba(255,255,255,0.3)'} weight={liked ? 'fill' : 'regular'} />
            <Text variant="small" color={liked ? 'primary' : 'muted'} style={styles.socialLabel}>
              {likeCount}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => navigation.navigate('FeedPost', { id: item.id })}
          >
            <ChatCircle size={20} color="rgba(255,255,255,0.3)" weight="regular" />
            <Text variant="small" color="muted" style={styles.socialLabel}>
              {item.commentsCount}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderDivider = () => (
    <View style={styles.divider} />
  );

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + theme.spacing.md }]}>
        <InlineRefreshHeader visible={isRefreshing} />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color="#e2e8f0" weight="bold" />
        </TouchableOpacity>
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
            variant="caption"
            color={filter === 'all' ? 'foreground' : 'muted'}
            weight={filter === 'all' ? 'bold' : 'medium'}
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
            variant="caption"
            color={filter === 'connections' ? 'foreground' : 'muted'}
            weight={filter === 'connections' ? 'bold' : 'medium'}
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
          { paddingBottom: getScreenContentBottomPadding(insets.bottom, { includeBottomNav: true, extra: theme.spacing.xl }) },
        ]}
        renderItem={renderItem}
        ItemSeparatorComponent={renderDivider}
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
        >
          <View style={styles.fabCircle}>
            <PencilSimpleLine size={22} color="white" weight="fill" />
          </View>
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
            <View style={styles.composerHeader}>
              <TouchableOpacity onPress={() => setIsComposerOpen(false)}>
                <Text variant="body" color="muted">Cancel</Text>
              </TouchableOpacity>
              <Text variant="body" weight="semiBold" color="foreground">New Post</Text>
              <TouchableOpacity
                onPress={handleCreatePost}
                disabled={createPostMutation.isPending || !composerText.trim()}
              >
                <Text variant="body" weight="bold" color={composerText.trim() ? 'primary' : 'muted'}>
                  {createPostMutation.isPending ? 'Posting...' : 'Post'}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="What's on your mind?"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              value={composerText}
              onChangeText={setComposerText}
              autoFocus
            />
          </KeyboardAwareScreenScrollView>
        </View>
      </Modal>

      <Modal
        transparent
        visible={journalModalVisible}
        animationType="slide"
        onRequestClose={() => setJournalModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.journalModalBackdrop}
          activeOpacity={1}
          onPress={() => setJournalModalVisible(false)}
        >
          <TouchableOpacity
            style={[styles.journalModalContent, { paddingBottom: insets.bottom + theme.spacing.lg }]}
            activeOpacity={1}
          >
            <View style={styles.journalModalHandle} />
            {selectedJournalPost && (
              <>
                <View style={styles.journalModalHeader}>
                  {selectedJournalPost.profileImageUrl ? (
                    <Image source={{ uri: selectedJournalPost.profileImageUrl }} style={styles.journalModalAvatar} />
                  ) : (
                    <Avatar fallback={(selectedJournalPost.name?.[0] || '?').toUpperCase()} size="md" />
                  )}
                  <View style={{ flex: 1, marginLeft: theme.spacing.md }}>
                    <Text variant="body" weight="bold" color="foreground">
                      {selectedJournalPost.journalTitle || 'Journal Entry'}
                    </Text>
                    <Text variant="small" color="muted">
                      {selectedJournalPost.name} · {formatDistanceToNow(new Date(selectedJournalPost.createdAt), { addSuffix: true })}
                    </Text>
                  </View>
                </View>
                <View style={styles.journalModalDivider} />
                <Text variant="body" color="secondary" style={styles.journalModalBody}>
                  {selectedJournalPost.journalNotes || selectedJournalPost.content || ''}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    marginHorizontal: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  filterButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeFilterButton: {
    borderBottomColor: '#FF9800',
  },
  listContent: {
    paddingHorizontal: theme.spacing.xl,
  },
  postContainer: {
    paddingVertical: theme.spacing.lg,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarFallback: {
  },
  postMeta: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  postContent: {
    marginTop: theme.spacing.sm,
    marginLeft: 48,
    lineHeight: 20,
    fontSize: 13,
  },
  journalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginLeft: 48,
  },
  postFooter: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    marginBottom: 4,
    marginLeft: 48,
    gap: theme.spacing.xl,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  socialLabel: {
    marginTop: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
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
    right: theme.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    zIndex: 50,
    elevation: 20,
  },
  fabCircle: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: '#FF9800',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
  },
  modalCardContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  composerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalInput: {
    minHeight: 120,
    padding: theme.spacing.md,
    color: theme.colors.foreground,
    textAlignVertical: 'top',
    fontSize: 16,
    lineHeight: 22,
  },
  journalModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  journalModalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: theme.spacing.lg,
    maxHeight: '80%',
  },
  journalModalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },
  journalModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  journalModalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  journalModalDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: theme.spacing.lg,
  },
  journalModalBody: {
    lineHeight: 22,
  },
});
