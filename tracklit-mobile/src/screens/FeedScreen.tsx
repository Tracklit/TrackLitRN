import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { RootStackParamList } from '@/navigation/types';
import theme from '@/utils/theme';

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
  const { user } = useAuth();
  const canInteract = !!user && user.id !== 'guest';
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerText, setComposerText] = useState('');

  const feedQuery = useQuery({
    queryKey: ['feed', filter],
    queryFn: () => apiRequest<FeedItem[]>(`/api/feed?filter=${filter}`),
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

  const handleRefresh = () => {
    feedQuery.refetch();
  };

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

  const renderItem = ({ item }: { item: FeedItem }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => navigation.navigate('FeedPost', { id: item.id })}
      >
        <Avatar
          fallback={item.name?.slice(0, 2)}
          size="md"
          style={styles.cardAvatar}
        />
        <View style={styles.cardHeaderText}>
          <Text variant="body" weight="semiBold" color="foreground">
            {item.name || 'TrackLit Athlete'}
          </Text>
          <Text variant="small" color="muted">
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
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
          onPress={() => handleToggleLike(item.id)}
          disabled={!canInteract || likeMutation.isPending}
        >
          <Text variant="small" color={item.isLiked ? 'primary' : 'muted'}>
            {item.isLiked ? '♥' : '♡'} {item.likesCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.socialButton}
          onPress={() => navigation.navigate('FeedPost', { id: item.id })}
        >
          <Text variant="small" color="muted">
            💬 {item.commentsCount}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
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
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            tintColor="#fff"
            refreshing={feedQuery.isFetching}
            onRefresh={handleRefresh}
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
          style={styles.fab}
          onPress={() => setIsComposerOpen(true)}
          data-testid="button-create-post"
        >
          <Text variant="h3" color="foreground">
            +
          </Text>
        </TouchableOpacity>
      )}

      <Modal
        transparent
        visible={isComposerOpen}
        animationType="slide"
        onRequestClose={() => setIsComposerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
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
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.muted,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
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
  cardAvatar: {
    marginRight: theme.spacing.md,
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
    paddingVertical: theme.spacing.xs,
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
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
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

