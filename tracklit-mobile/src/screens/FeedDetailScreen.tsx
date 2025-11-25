import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';
import theme from '@/utils/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'FeedPost'>;

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

interface FeedComment {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
  name?: string | null;
  username?: string | null;
  likesCount: number;
  isLiked: boolean;
}

export const FeedDetailScreen: React.FC<Props> = ({ route }) => {
  const insets = useSafeAreaInsets();
  const postId = route.params?.id;
  const [commentText, setCommentText] = useState('');
  const { user } = useAuth();
  const canInteract = !!user && user.id !== 'guest';

  const postQuery = useQuery({
    queryKey: ['feed-post', postId],
    enabled: !!postId,
    queryFn: () => apiRequest<FeedItem>(`/api/feed/posts/${postId}`),
  });

  const commentsQuery = useQuery({
    queryKey: ['feed-comments', postId],
    enabled: !!postId,
    queryFn: () => apiRequest<FeedComment[]>(`/api/feed/posts/${postId}/comments`),
  });

  const likeMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/feed/posts/${postId}/like`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-post', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) =>
      apiRequest(`/api/feed/posts/${postId}/comments`, {
        method: 'POST',
        data: { content },
      }),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['feed-comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed-post', postId] });
    },
    onError: (error: Error) => {
      Alert.alert('Unable to comment', error.message || 'Please try again.');
    },
  });

  const handleLike = () => {
    if (!canInteract) {
      Alert.alert('Login required', 'Sign in to react to posts.');
      return;
    }
    likeMutation.mutate();
  };

  const handleAddComment = () => {
    if (!canInteract) {
      Alert.alert('Login required', 'Sign in to join the conversation.');
      return;
    }
    if (!commentText.trim()) {
      Alert.alert('Add a comment', 'Say something about this post.');
      return;
    }
    commentMutation.mutate(commentText.trim());
  };

  const post = postQuery.data;

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 64}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {post ? (
            <View style={styles.postCard}>
              <View style={styles.postHeader}>
                <Avatar
                  fallback={post.name?.slice(0, 2)}
                  style={styles.postAvatar}
                />
                <View>
                  <Text variant="body" weight="semiBold" color="foreground">
                    {post.name || 'TrackLit Athlete'}
                  </Text>
                  <Text variant="small" color="muted">
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </Text>
                </View>
              </View>
              {post.content && (
                <Text variant="body" color="foreground" style={styles.postContent}>
                  {post.content}
                </Text>
              )}
              <View style={styles.postActions}>
                <TouchableOpacity onPress={handleLike} disabled={!canInteract}>
                  <Text variant="body" color={post.isLiked ? 'primary' : 'muted'}>
                    {post.isLiked ? '♥ Unlike' : '♡ Like'} ({post.likesCount})
                  </Text>
                </TouchableOpacity>
                <Text variant="body" color="muted">
                  💬 {post.commentsCount}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.postCard}>
              <Text variant="body" color="muted">
                Loading post...
              </Text>
            </View>
          )}

          <Text variant="h4" weight="semiBold" color="foreground" style={styles.commentsTitle}>
            Comments
          </Text>

          {(commentsQuery.data ?? []).map((comment) => (
            <View key={comment.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Avatar
                  fallback={comment.name?.slice(0, 2)}
                  size="sm"
                  style={styles.commentAvatar}
                />
                <View>
                  <Text variant="body" weight="medium" color="foreground">
                    {comment.name || 'Athlete'}
                  </Text>
                  <Text variant="small" color="muted">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </Text>
                </View>
              </View>
              <Text variant="body" color="foreground">
                {comment.content}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.commentInputBar}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor={theme.colors.textMuted}
            value={commentText}
            onChangeText={setCommentText}
          />
          <Button
            variant="default"
            size="sm"
            loading={commentMutation.isPending}
            onPress={handleAddComment}
            disabled={!canInteract}
          >
            Send
          </Button>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl * 2,
    gap: theme.spacing.lg,
  },
  postCard: {
    backgroundColor: theme.colors.background + 'EE',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAvatar: {
    marginRight: theme.spacing.md,
  },
  postContent: {
    lineHeight: 22,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commentsTitle: {
    marginTop: theme.spacing.md,
  },
  commentCard: {
    backgroundColor: theme.colors.background + 'CC',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  commentAvatar: {
    marginRight: theme.spacing.sm,
  },
  commentInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.foreground,
  },
});

