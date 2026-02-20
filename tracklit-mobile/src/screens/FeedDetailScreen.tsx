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
  Image,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Heart, PaperPlaneTilt } from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
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
  profileImageUrl?: string | null;
  likesCount: number;
  isLiked: boolean;
}

const PLACEHOLDER_COMMENTS: FeedComment[] = [
  {
    id: 2001,
    userId: 3,
    content: 'Great work! Keep pushing those limits.',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    name: 'Coach Jones',
    username: 'coach_jones',
    profileImageUrl: 'https://i.pravatar.cc/150?img=12',
    likesCount: 3,
    isLiked: false,
  },
  {
    id: 2002,
    userId: 5,
    content: 'Inspiring! I need to step up my training too.',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    name: 'Marcus D.',
    username: 'hurdle_king',
    profileImageUrl: 'https://i.pravatar.cc/150?img=13',
    likesCount: 1,
    isLiked: false,
  },
];

export const FeedDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const postId = route.params?.id;
  const [commentText, setCommentText] = useState('');
  const { user } = useAuth();
  const canInteract = !!user && user.id !== 'guest';
  const [liked, setLiked] = useState(false);

  const postQuery = useQuery({
    queryKey: ['feed-post', postId],
    enabled: !!postId,
    queryFn: async () => {
      try {
        return await apiRequest<FeedItem>(`/api/feed/posts/${postId}`);
      } catch {
        return null;
      }
    },
  });

  const commentsQuery = useQuery({
    queryKey: ['feed-comments', postId],
    enabled: !!postId,
    queryFn: async () => {
      try {
        const data = await apiRequest<FeedComment[]>(`/api/feed/posts/${postId}/comments`);
        return data && data.length > 0 ? data : PLACEHOLDER_COMMENTS;
      } catch {
        return PLACEHOLDER_COMMENTS;
      }
    },
    initialData: PLACEHOLDER_COMMENTS,
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
    setLiked(prev => !prev);
    if (postId && Number(postId) < 1000) {
      likeMutation.mutate();
    }
  };

  const handleAddComment = () => {
    if (!canInteract) {
      Alert.alert('Login required', 'Sign in to join the conversation.');
      return;
    }
    if (!commentText.trim()) return;
    const localComment: FeedComment = {
      id: Date.now(),
      userId: user?.id ? Number(user.id) : 0,
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
      name: user?.name || user?.username || 'You',
      username: user?.username || '',
      profileImageUrl: null,
      likesCount: 0,
      isLiked: false,
    };
    const current = commentsQuery.data || [];
    queryClient.setQueryData(['feed-comments', postId], [...current, localComment]);
    setCommentText('');
    if (postId && Number(postId) < 1000) {
      commentMutation.mutate(localComment.content);
    }
  };

  const post = postQuery.data;
  const comments = commentsQuery.data ?? PLACEHOLDER_COMMENTS;
  const postLiked = liked || (post?.isLiked ?? false);
  const postLikeCount = (post?.likesCount ?? 0) + (liked && !post?.isLiked ? 1 : 0);

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top}
      >
        <View style={[styles.topBar, { paddingTop: insets.top + theme.spacing.md }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.backRow}
          >
            <ArrowLeft size={20} color="#e2e8f0" weight="bold" />
            <Text variant="body" weight="semiBold" color="foreground">Post</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {post ? (
            <View style={styles.postSection}>
              <View style={styles.postHeader}>
                {post.profileImageUrl ? (
                  <Image source={{ uri: post.profileImageUrl }} style={styles.postAvatar} />
                ) : (
                  <Avatar fallback={(post.name?.[0] || '?').toUpperCase()} size="md" />
                )}
                <View style={styles.postMeta}>
                  <Text variant="body" weight="semiBold" color="foreground">
                    {post.name || 'TrackLit Athlete'}
                  </Text>
                  <Text variant="small" color="muted">
                    {post.username ? `@${post.username} · ` : ''}{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </Text>
                </View>
              </View>
              {post.content && (
                <Text variant="body" color="secondary" style={styles.postContent}>
                  {post.content}
                </Text>
              )}
              <View style={styles.postActions}>
                <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                  <Heart size={18} color={postLiked ? '#FF9800' : 'rgba(255,255,255,0.3)'} weight={postLiked ? 'fill' : 'regular'} />
                  <Text variant="small" color={postLiked ? 'primary' : 'muted'}>{postLikeCount}</Text>
                </TouchableOpacity>
                <Text variant="small" color="muted">{comments.length} comments</Text>
              </View>
            </View>
          ) : (
            <View style={styles.postSection}>
              <Text variant="body" color="muted">Loading post...</Text>
            </View>
          )}

          <View style={styles.commentsDivider} />

          {comments.map((comment) => (
            <View key={comment.id} style={styles.commentRow}>
              <View style={styles.commentAvatarCol}>
                {comment.profileImageUrl ? (
                  <Image source={{ uri: comment.profileImageUrl }} style={styles.commentAvatar} />
                ) : (
                  <Avatar fallback={(comment.name?.[0] || '?').toUpperCase()} size="sm" />
                )}
              </View>
              <View style={styles.commentBody}>
                <View style={styles.commentNameRow}>
                  <Text variant="small" weight="semiBold" color="foreground">
                    {comment.name || 'Athlete'}
                  </Text>
                  <Text variant="small" color="muted" style={styles.commentTime}>
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </Text>
                </View>
                <Text variant="body" color="secondary" style={styles.commentText}>
                  {comment.content}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={[styles.inputBar, { paddingBottom: insets.bottom + theme.spacing.sm }]}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={commentText}
            onChangeText={setCommentText}
            returnKeyType="send"
            onSubmitEditing={handleAddComment}
          />
          <TouchableOpacity
            style={[styles.sendButton, !commentText.trim() && { opacity: 0.3 }]}
            onPress={handleAddComment}
            disabled={commentMutation.isPending || !commentText.trim()}
          >
            <PaperPlaneTilt size={18} color="#FF9800" weight="fill" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  postSection: {
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  postMeta: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  postContent: {
    marginTop: theme.spacing.sm,
    lineHeight: 22,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentsDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  commentRow: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  commentAvatarCol: {
    marginRight: theme.spacing.md,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  commentBody: {
    flex: 1,
  },
  commentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  commentTime: {
    fontSize: 11,
  },
  commentText: {
    marginTop: 2,
    lineHeight: 20,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    gap: theme.spacing.sm,
  },
  commentInput: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 10,
    color: theme.colors.foreground,
    backgroundColor: 'rgba(255,255,255,0.04)',
    fontSize: 14,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
