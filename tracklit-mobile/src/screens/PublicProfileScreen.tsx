import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated as RNAnimated,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation } from '@tanstack/react-query';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  ArrowLeft,
  UserPlus,
  Check,
  ChatCircleDots,
  Clock,
  Lightning,
  Coin,
  Trophy,
  Users,
  PencilSimple,
  CardsThree,
  Swap,
  Crown,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { RootStackParamList } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';

const stadiumBg = require('../../assets/stadium-bg.png');
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.9;

const COLORS = {
  bg: '#0E0F14',
  surface: '#161823',
  card: '#1C1F2B',
  glass: 'rgba(255,255,255,0.05)',
  gradStart: '#4B00FF',
  gradMid: '#7F00FF',
  gradEnd: '#00D4FF',
  orange: '#FF7A00',
  orangeGlow: 'rgba(255,122,0,0.6)',
  textPrimary: '#FFFFFF',
  textSecondary: '#B8C0FF',
  textMuted: '#8A90B5',
  xpBarBg: '#2A2D3E',
};

type Props = NativeStackScreenProps<RootStackParamList, 'PublicProfile'>;

interface FriendItem {
  id: number;
  name?: string | null;
  username?: string | null;
  profileImageUrl?: string | null;
}

const PLACEHOLDER_FORM = [10.12, 10.05, 9.98, 10.08, 10.03, 10.05];

function RecentFormGraph({ data }: { data: number[] }) {
  const graphW = CARD_WIDTH - 68;
  const graphH = 60;
  const padX = 20;
  const padY = 8;
  const w = graphW - padX * 2;
  const h = graphH - padY * 2;

  if (data.length < 2) return null;

  const minVal = Math.min(...data) - 0.05;
  const maxVal = Math.max(...data) + 0.05;
  const range = maxVal - minVal || 1;

  const points = data.map((val, i) => {
    const x = padX + (i / (data.length - 1)) * w;
    const y = padY + ((val - minVal) / range) * h;
    return { x, y };
  });

  const polyPoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <Svg width={graphW} height={graphH}>
      {[0, 0.5, 1].map((frac, i) => {
        const y = padY + frac * h;
        return (
          <Line
            key={i}
            x1={padX}
            y1={y}
            x2={padX + w}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={0.5}
          />
        );
      })}
      <Polyline
        points={polyPoints}
        fill="none"
        stroke={COLORS.orange}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((p, i) => (
        <React.Fragment key={i}>
          <Circle cx={p.x} cy={p.y} r={3.5} fill={COLORS.orange} />
          <SvgText
            x={p.x}
            y={p.y + 16}
            fill={COLORS.textMuted}
            fontSize={9}
            textAnchor="middle"
          >
            {data[i].toFixed(2)}
          </SvgText>
        </React.Fragment>
      ))}
    </Svg>
  );
}

function XPBar({ current, max }: { current: number; max: number }) {
  const progress = useSharedValue(0);
  const pct = Math.min(current / max, 1);

  useEffect(() => {
    progress.value = withTiming(pct, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, [pct]);

  const animStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={xpStyles.container}>
      <Text style={xpStyles.label}>
        <Text style={xpStyles.labelOrange}>{current.toLocaleString()}</Text> / {max.toLocaleString()} XP
      </Text>
      <View style={xpStyles.track}>
        <Animated.View style={[xpStyles.fill, animStyle]}>
          <LinearGradient
            colors={[COLORS.orange, COLORS.gradEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const xpStyles = StyleSheet.create({
  container: { alignItems: 'center', marginTop: 8, marginBottom: 4 },
  label: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 },
  labelOrange: { color: COLORS.orange, fontWeight: '700' },
  track: {
    width: '80%',
    height: 8,
    backgroundColor: COLORS.xpBarBg,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
});

export const PublicProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { userId, name, username, profileImageUrl } = route.params;
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';
  const isOwnProfile = user?.id && Number(user.id) === userId;
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;

  const [connectionState, setConnectionState] = useState<'none' | 'pending' | 'connected'>('none');

  useEffect(() => {
    RNAnimated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const friendsQuery = useQuery({
    queryKey: ['friends'],
    enabled: isAuthenticated && !isGuest,
    queryFn: async () => {
      try {
        const data = await apiRequest<FriendItem[]>('/api/friends');
        return data || [];
      } catch {
        return [];
      }
    },
  });

  useEffect(() => {
    if (friendsQuery.data && !isOwnProfile) {
      const isFriend = friendsQuery.data.some((f) => f.id === userId);
      if (isFriend) setConnectionState('connected');
    }
  }, [friendsQuery.data, userId, isOwnProfile]);

  const connectMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/follow/${userId}`, { method: 'POST' });
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

  const displayName = name || (isOwnProfile ? (user as any)?.name : null) || 'TrackLit Athlete';
  const displayUsername = username || (isOwnProfile ? (user as any)?.username : null) || '';
  const displayImage = profileImageUrl || (isOwnProfile ? (user as any)?.profileImageUrl : null);
  const spikesCount = isOwnProfile ? ((user as any)?.spikes ?? 100) : 0;
  const connectionsCount = friendsQuery.data?.length ?? 0;

  const level = 7;
  const xpCurrent = 2150;
  const xpMax = 3000;
  const cardsCount = 12;
  const leaderboardRank = 215;
  const pb = '9.92';
  const sb = '10.03';
  const rank = 4;
  const event = '100M SPRINT';

  return (
    <View style={[styles.root, { backgroundColor: COLORS.bg }]}>
      <RNAnimated.View style={[styles.flex, { opacity: fadeAnim }]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <ImageBackground
            source={stadiumBg}
            style={styles.heroBg}
            imageStyle={{ opacity: 0.25 }}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['transparent', 'rgba(14,15,20,0.6)', 'rgba(14,15,20,0.95)']}
              locations={[0, 0.6, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.headerLeft}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ArrowLeft size={20} color={COLORS.textPrimary} weight="bold" />
                <Text style={styles.headerTitle}>
                  {isOwnProfile ? 'My Profile' : 'Profile'}
                </Text>
              </TouchableOpacity>
              <View style={styles.headerRight}>
                <View style={styles.currencyBadge}>
                  <Lightning size={14} color={COLORS.orange} weight="fill" />
                  <Text style={styles.currencyText}>
                    {spikesCount.toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.currencyBadge, styles.coinBadge]}>
                  <Coin size={14} color="#FFD700" weight="fill" />
                  <Text style={styles.currencyText}>250</Text>
                </View>
              </View>
            </View>

            <View style={styles.avatarSection}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryStatLeft}>
                  <Text style={styles.summaryLabel}>Cards:</Text>
                  <Text style={styles.summaryValue}>{cardsCount}</Text>
                </View>

                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={[COLORS.gradStart, COLORS.gradMid, COLORS.gradEnd]}
                    style={styles.avatarBorder}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.avatarInner}>
                      {displayImage ? (
                        <Image source={{ uri: displayImage }} style={styles.avatarImage} />
                      ) : (
                        <View style={styles.avatarFallback}>
                          <Avatar fallback={(displayName[0] || '?').toUpperCase()} size="lg" />
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </View>

                <View style={styles.summaryStatRight}>
                  <Text style={styles.summaryLabel}>
                    {isOwnProfile ? 'Trades:' : 'Connections:'}
                  </Text>
                  <Text style={styles.summaryValue}>
                    {isOwnProfile ? 5 : connectionsCount}
                  </Text>
                </View>
              </View>

              <View style={styles.leaderboardBadge}>
                <LinearGradient
                  colors={[COLORS.gradStart, COLORS.gradMid]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.leaderboardGradient}
                >
                  <Crown size={12} color={COLORS.textPrimary} weight="fill" />
                  <Text style={styles.leaderboardText}>
                    Leaderboard Rank{' '}
                    <Text style={styles.leaderboardNumber}>#{leaderboardRank}</Text>
                  </Text>
                </LinearGradient>
              </View>
            </View>
          </ImageBackground>

          <View style={styles.cardSection}>
            <View style={styles.cardOuter}>
              <LinearGradient
                colors={[COLORS.gradStart, COLORS.gradMid, COLORS.gradEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardBorder}
              >
                <View style={styles.cardInner}>
                  <LinearGradient
                    colors={['rgba(75,0,255,0.15)', 'rgba(28,31,43,0.95)', COLORS.card]}
                    locations={[0, 0.3, 1]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.cardInnerGradient}
                  >
                    <Text style={styles.athleteName}>
                      {displayName.toUpperCase()}
                    </Text>
                    <Text style={styles.athleteEvent}>{event}</Text>

                    <View style={styles.athleteImageRow}>
                      <View style={styles.athleteImageContainer}>
                        {displayImage ? (
                          <Image source={{ uri: displayImage }} style={styles.athleteImage} />
                        ) : (
                          <View style={styles.athleteImagePlaceholder}>
                            <Avatar fallback={(displayName[0] || '?').toUpperCase()} size="lg" />
                          </View>
                        )}
                      </View>
                      <View style={styles.levelBadge}>
                        <LinearGradient
                          colors={[COLORS.orange, '#FF9D00']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.levelGradient}
                        >
                          <Text style={styles.levelLabel}>LEVEL</Text>
                          <Text style={styles.levelNumber}>{level}</Text>
                        </LinearGradient>
                      </View>
                    </View>

                    <XPBar current={xpCurrent} max={xpMax} />

                    <View style={styles.statsRow}>
                      <View style={styles.statPanel}>
                        <Text style={styles.statLabel}>PB</Text>
                        <Text style={styles.statValue}>{pb}</Text>
                      </View>
                      <View style={[styles.statPanel, styles.statPanelMiddle]}>
                        <Text style={styles.statLabel}>SB</Text>
                        <Text style={styles.statValueBold}>{sb}</Text>
                      </View>
                      <View style={styles.statPanel}>
                        <Text style={styles.statLabel}>RANK</Text>
                        <Text style={styles.statValue}>#{rank}</Text>
                      </View>
                    </View>

                    <View style={styles.formSection}>
                      <View style={styles.formDivider}>
                        <View style={styles.formLine} />
                        <Text style={styles.formTitle}>RECENT FORM</Text>
                        <View style={styles.formLine} />
                      </View>
                      <RecentFormGraph data={PLACEHOLDER_FORM} />
                    </View>
                  </LinearGradient>
                </View>
              </LinearGradient>
            </View>
          </View>

          {!isOwnProfile ? (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtnConnect]}
                onPress={handleConnect}
                disabled={connectionState !== 'none' || connectMutation.isPending}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    connectionState === 'connected'
                      ? ['#22c55e', '#16a34a']
                      : connectionState === 'pending'
                      ? ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']
                      : [COLORS.orange, '#FF9D00']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionBtnGradient}
                >
                  {connectMutation.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : connectionState === 'connected' ? (
                    <>
                      <Check size={18} color="white" weight="bold" />
                      <Text style={styles.actionBtnText}>CONNECTED</Text>
                    </>
                  ) : connectionState === 'pending' ? (
                    <>
                      <Clock size={18} color="white" weight="fill" />
                      <Text style={styles.actionBtnText}>PENDING</Text>
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} color="white" weight="fill" />
                      <Text style={styles.actionBtnText}>CONNECT</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtnMessage}
                onPress={handleMessage}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[COLORS.gradStart, COLORS.gradMid]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionBtnGradient}
                >
                  <ChatCircleDots size={18} color="white" weight="fill" />
                  <Text style={styles.actionBtnText}>MESSAGE</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtnConnect, { flex: 1 }]}
                onPress={() => Alert.alert('Edit Profile', 'Profile editing coming soon.')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[COLORS.orange, '#FF9D00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionBtnGradient}
                >
                  <PencilSimple size={18} color="white" weight="fill" />
                  <Text style={styles.actionBtnText}>EDIT PROFILE</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.connectionsSection}>
            <Text style={styles.sectionTitle}>Connections</Text>
            {friendsQuery.isLoading ? (
              <ActivityIndicator color={COLORS.gradMid} style={{ marginTop: 16 }} />
            ) : (friendsQuery.data?.length ?? 0) === 0 ? (
              <View style={styles.emptyConnections}>
                <Users size={28} color={COLORS.textMuted} weight="fill" />
                <Text style={styles.emptyText}>No connections yet</Text>
              </View>
            ) : (
              <View style={styles.connectionsList}>
                {friendsQuery.data?.slice(0, 6).map((friend) => (
                  <TouchableOpacity
                    key={friend.id}
                    style={styles.connectionItem}
                    onPress={() =>
                      navigation.push('PublicProfile', {
                        userId: friend.id,
                        name: friend.name,
                        username: friend.username,
                        profileImageUrl: friend.profileImageUrl,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.connectionAvatarWrap}>
                      {friend.profileImageUrl ? (
                        <Image
                          source={{ uri: friend.profileImageUrl }}
                          style={styles.connectionAvatar}
                        />
                      ) : (
                        <View style={styles.connectionAvatarFallback}>
                          <Text style={styles.connectionAvatarLetter}>
                            {(friend.name?.[0] || '?').toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.connectionInfo}>
                      <Text style={styles.connectionName} numberOfLines={1}>
                        {friend.name || 'Athlete'}
                      </Text>
                      {friend.username && (
                        <Text style={styles.connectionUsername} numberOfLines={1}>
                          @{friend.username}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </RNAnimated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },

  heroBg: {
    width: '100%',
    minHeight: 360,
  },

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  coinBadge: {
    backgroundColor: 'rgba(255,215,0,0.12)',
  },
  currencyText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  avatarSection: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  summaryStatLeft: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  summaryStatRight: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: 16,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },

  avatarContainer: {
    alignItems: 'center',
  },
  avatarBorder: {
    width: 116,
    height: 116,
    borderRadius: 58,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.gradMid,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  avatarInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarFallback: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },

  leaderboardBadge: {
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  leaderboardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  leaderboardText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  leaderboardNumber: {
    fontWeight: '800',
    color: COLORS.textPrimary,
  },

  cardSection: {
    alignItems: 'center',
    marginTop: -20,
    paddingHorizontal: 20,
  },
  cardOuter: {
    width: CARD_WIDTH,
  },
  cardBorder: {
    borderRadius: 26,
    padding: 3,
    shadowColor: COLORS.gradMid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  cardInner: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardInnerGradient: {
    padding: 22,
    alignItems: 'center',
  },

  athleteName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  athleteEvent: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
    letterSpacing: 0.5,
  },

  athleteImageRow: {
    width: '100%',
    alignItems: 'center',
    marginTop: 14,
    position: 'relative',
  },
  athleteImageContainer: {
    width: '85%',
    aspectRatio: 4 / 5,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  athleteImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  athleteImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  levelBadge: {
    position: 'absolute',
    right: 8,
    top: 12,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: COLORS.orange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  levelGradient: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 10,
  },
  levelLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  levelNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: -2,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginTop: 10,
  },
  statPanel: {
    flex: 1,
    backgroundColor: COLORS.glass,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statPanelMiddle: {
    backgroundColor: 'rgba(75,0,255,0.15)',
    borderColor: 'rgba(127,0,255,0.3)',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 1,
  },
  statValueBold: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 1,
  },

  formSection: {
    width: '100%',
    marginTop: 10,
  },
  formDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  formLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  formTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  actionBtnConnect: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionBtnMessage: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },

  connectionsSection: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 14,
  },
  emptyConnections: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  connectionsList: {
    gap: 2,
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glass,
    borderRadius: 14,
    padding: 12,
    gap: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  connectionAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  connectionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  connectionAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionAvatarLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  connectionUsername: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
});
