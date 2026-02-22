import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

type Props = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export const Skeleton: React.FC<Props> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as any, height, borderRadius },
        animStyle,
        style,
      ]}
    />
  );
};

export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.card, style]}>
    <Skeleton height={14} width="40%" borderRadius={6} />
    <Skeleton height={10} width="70%" borderRadius={4} style={{ marginTop: 10 }} />
    <Skeleton height={10} width="55%" borderRadius={4} style={{ marginTop: 6 }} />
  </View>
);

export const SkeletonNotificationRow: React.FC = () => (
  <View style={styles.notifRow}>
    <Skeleton width={32} height={32} borderRadius={10} />
    <View style={styles.notifBody}>
      <Skeleton height={10} width="55%" borderRadius={4} />
      <Skeleton height={9} width="80%" borderRadius={4} />
      <Skeleton height={8} width="30%" borderRadius={4} />
    </View>
  </View>
);

export const SkeletonNotificationList: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <View style={{ gap: 0 }}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i}>
        {i > 0 && <View style={styles.notifSep} />}
        <SkeletonNotificationRow />
      </View>
    ))}
  </View>
);

export const SkeletonListRow: React.FC<{ hasAvatar?: boolean }> = ({ hasAvatar = true }) => (
  <View style={styles.listRow}>
    {hasAvatar && <Skeleton width={40} height={40} borderRadius={20} />}
    <View style={styles.listRowBody}>
      <Skeleton height={12} width="50%" borderRadius={4} />
      <Skeleton height={9} width="70%" borderRadius={4} />
    </View>
  </View>
);

export const SkeletonListRows: React.FC<{ count?: number; hasAvatar?: boolean }> = ({
  count = 5,
  hasAvatar = true,
}) => (
  <View style={{ gap: 16 }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonListRow key={i} hasAvatar={hasAvatar} />
    ))}
  </View>
);

export const SkeletonChatRow: React.FC = () => (
  <View style={styles.chatRow}>
    <Skeleton width={44} height={44} borderRadius={22} />
    <View style={styles.chatBody}>
      <View style={styles.chatTopRow}>
        <Skeleton height={11} width="40%" borderRadius={4} />
        <Skeleton height={8} width={40} borderRadius={4} />
      </View>
      <Skeleton height={9} width="75%" borderRadius={4} />
    </View>
  </View>
);

export const SkeletonChatList: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <View style={{ gap: 4 }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonChatRow key={i} />
    ))}
  </View>
);

export const SkeletonMessageBubble: React.FC<{ isOwn?: boolean }> = ({ isOwn = false }) => (
  <View style={[styles.msgBubble, isOwn && styles.msgBubbleOwn]}>
    <Skeleton height={10} width={isOwn ? 120 : 160} borderRadius={4} />
    <Skeleton height={10} width={isOwn ? 80 : 100} borderRadius={4} />
  </View>
);

export const SkeletonMessageList: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <View style={{ gap: 12 }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonMessageBubble key={i} isOwn={i % 3 === 1} />
    ))}
  </View>
);

export const SkeletonGridCard: React.FC = () => (
  <View style={styles.gridCard}>
    <Skeleton height={12} width="60%" borderRadius={4} />
    <Skeleton height={9} width="80%" borderRadius={4} style={{ marginTop: 8 }} />
    <Skeleton height={9} width="40%" borderRadius={4} style={{ marginTop: 6 }} />
  </View>
);

export const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <View style={styles.gridWrap}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonGridCard key={i} />
    ))}
  </View>
);

export const SkeletonProgramCard: React.FC = () => (
  <View style={styles.card}>
    <Skeleton height={12} width="50%" borderRadius={4} />
    <Skeleton height={9} width="75%" borderRadius={4} style={{ marginTop: 10 }} />
    <Skeleton height={28} width="100%" borderRadius={6} style={{ marginTop: 14 }} />
  </View>
);

export const SkeletonProgramList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View style={{ gap: 10 }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonProgramCard key={i} />
    ))}
  </View>
);

export const SkeletonBlock: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.card, style]}>
    <Skeleton height={14} width="35%" borderRadius={6} />
    <Skeleton height={10} width="60%" borderRadius={4} style={{ marginTop: 12 }} />
    <Skeleton height={10} width="90%" borderRadius={4} style={{ marginTop: 6 }} />
    <Skeleton height={10} width="45%" borderRadius={4} style={{ marginTop: 6 }} />
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  notifRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  notifBody: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  notifSep: {
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginLeft: 56,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listRowBody: {
    flex: 1,
    gap: 6,
  },
  chatRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  chatBody: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  chatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  msgBubble: {
    alignSelf: 'flex-start',
    gap: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  msgBubbleOwn: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,122,0,0.08)',
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCard: {
    flexBasis: '48%',
    borderRadius: 12,
    padding: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
});
