import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PencilSimpleLine, Heart, ChatCircle, Book } from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { InlineRefreshHeader } from '@/components/refresh/InlineRefreshHeader';
import { MainScreenHeader } from '@/components/MainScreenHeader';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import type { RootStackParamList } from '@/navigation/types';
import { getScreenContentBottomPadding, getBottomNavOverlayHeight } from '@/utils/layoutPadding';
import theme from '@/utils/theme';
import { KeyboardAwareScreenScrollView } from '@/components/keyboard/KeyboardAwareScroll';

type FeedFilter = 'all' | 'connections';

const SkeletonPostCard: React.FC = () => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.55] });

  return (
    <Animated.View style={[skeletonStyles.card, { opacity }]}>
      <View style={skeletonStyles.headerRow}>
        <View style={skeletonStyles.avatar} />
        <View style={skeletonStyles.nameBlock}>
          <View style={skeletonStyles.nameLine} />
          <View style={skeletonStyles.subLine} />
        </View>
      </View>
      <View style={skeletonStyles.bodyLine} />
      <View style={[skeletonStyles.bodyLine, skeletonStyles.bodyLineMid]} />
      <View style={[skeletonStyles.bodyLine, skeletonStyles.bodyLineShort]} />
    </Animated.View>
  );
};

const skeletonStyles = StyleSheet.create({
  card: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  nameBlock: { gap: 6, flex: 1 },
  nameLine: {
    height: 13,
    width: '45%',
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  subLine: {
    height: 11,
    width: '30%',
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  bodyLine: {
    height: 12,
    width: '95%',
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bodyLineMid: { width: '80%' },
  bodyLineShort: { width: '55%' },
});

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

  const feedQuery = useQuery({
    queryKey: ['feed', filter],
    queryFn: () => apiRequest<FeedItem[]>(`/api/feed?filter=${filter}`),
    staleTime: 30000,
    retry: 1,
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

  useEffect(() => {
    const items = feedQuery.data ?? [];
    if (items.length > 0) {
      const latestTime = Math.max(...items.map(i => new Date(i.createdAt).getTime()));
      AsyncStorage.setItem('feed_last_seen', String(latestTime));
    }
  }, [feedQuery.data]);

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

  const navigateToPost = (item: FeedItem) => {
    navigation.navigate('FeedPost', {
      id: item.id,
      postData: {
        userId: item.userId,
        name: item.name,
        username: item.username,
        profileImageUrl: item.profileImageUrl,
        content: item.content,
        createdAt: item.createdAt,
        likesCount: item.likesCount,
        commentsCount: item.commentsCount,
        isLiked: item.isLiked,
      },
    });
  };

  const navigateToProfile = (item: FeedItem) => {
    if (!item.userId) return;
    navigation.navigate('PublicProfile', {
      userId: item.userId,
      name: item.name,
      username: item.username,
      profileImageUrl: item.profileImageUrl,
    });
  };

  const renderItem = ({ item }: { item: FeedItem }) => {
    const liked = localLikes[item.id] !== undefined ? localLikes[item.id] : item.isLiked;
    const likeCount = item.likesCount + (liked && !item.isLiked ? 1 : !liked && item.isLiked ? -1 : 0);
    const hasProfileImage = !!item.profileImageUrl;
    const initial = (item.name?.[0] || item.username?.[0] || '?').toUpperCase();

    return (
      <TouchableOpacity
        style={styles.postContainer}
        onPress={() => navigateToPost(item)}
        activeOpacity={0.8}
      >
        <View style={styles.postHeader}>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); navigateToProfile(item); }}
            activeOpacity={0.7}
          >
            {hasProfileImage ? (
              <Image source={{ uri: item.profileImageUrl! }} style={styles.avatarImage} />
            ) : (
              <Avatar fallback={initial} size="md" style={styles.avatarFallback} />
            )}
          </TouchableOpacity>
          <View style={styles.postMeta}>
            <Text variant="body" weight="semiBold" color="foreground">
              {item.name || 'TrackLit Athlete'}
            </Text>
            <Text variant="small" color="muted">
              {item.username ? `@${item.username} · ` : ''}{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </Text>
          </View>
        </View>
        {item.content && (
          <Text variant="body" color="secondary" style={styles.postContent}>
            {item.content}
          </Text>
        )}
        {item.isJournalEntry && (
          <TouchableOpacity
            style={styles.journalLink}
            onPress={(e) => {
              e.stopPropagation();
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
            onPress={(e) => { e.stopPropagation(); handleLocalLike(item); }}
            disabled={likeMutation.isPending}
          >
            <Heart size={20} color={liked ? '#FF9800' : 'rgba(255,255,255,0.3)'} weight={liked ? 'fill' : 'regular'} />
            <Text variant="small" color={liked ? 'primary' : 'muted'} style={styles.socialLabel}>
              {likeCount}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => navigateToPost(item)}
          >
            <ChatCircle size={20} color="rgba(255,255,255,0.3)" weight="regular" />
            <Text variant="small" color="muted" style={styles.socialLabel}>
              {item.commentsCount}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
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
      <MainScreenHeader />

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

      {feedQuery.isLoading ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: getScreenContentBottomPadding(insets.bottom, { includeBottomNav: true, extra: theme.spacing.xl }) }}
          showsVerticalScrollIndicator={false}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <React.Fragment key={i}>
              <SkeletonPostCard />
              {i < 5 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </ScrollView>
      ) : (
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
            feedQuery.isError ? (
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
      )}

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
    gap: 10,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarFallback: {
    width: 36,
    height: 36,
  },
  postMeta: {
    flex: 1,
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
