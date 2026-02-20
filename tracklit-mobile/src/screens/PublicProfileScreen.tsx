import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActionSheetIOS,
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
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ArrowLeft,
  UserPlus,
  Check,
  ChatCircleDots,
  Clock,
  Lightning,
  Coin,
  Users,
  PencilSimple,
  Crown,
  Camera,
  Image as ImageIcon,
  Trash,
  X,
  FloppyDisk,
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

const STORAGE_KEY_PREFIX = 'tracklit_profile_';

type Props = NativeStackScreenProps<RootStackParamList, 'PublicProfile'>;

interface FriendItem {
  id: number;
  name?: string | null;
  username?: string | null;
  profileImageUrl?: string | null;
}

interface ProfileData {
  avatarUri?: string | null;
  actionShotUri?: string | null;
  pb?: string;
  sb?: string;
  event?: string;
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

async function pickImage(): Promise<string | null> {
  try {
    const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log('[pickImage] permission status:', permResult.status);
    if (permResult.status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library permission is required to choose photos.');
      return null;
    }
    console.log('[pickImage] launching library...');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    console.log('[pickImage] result:', JSON.stringify(result).substring(0, 200));
    if (!result.canceled && result.assets?.[0]) {
      return result.assets[0].uri;
    }
    return null;
  } catch (err) {
    console.error('[pickImage] error:', err);
    Alert.alert('Error', 'Could not open photo library. Please try again.');
    return null;
  }
}

async function takePhoto(): Promise<string | null> {
  try {
    const permResult = await ImagePicker.requestCameraPermissionsAsync();
    console.log('[takePhoto] permission status:', permResult.status);
    if (permResult.status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos.');
      return null;
    }
    console.log('[takePhoto] launching camera...');
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    console.log('[takePhoto] result:', JSON.stringify(result).substring(0, 200));
    if (!result.canceled && result.assets?.[0]) {
      return result.assets[0].uri;
    }
    return null;
  } catch (err) {
    console.error('[takePhoto] error:', err);
    Alert.alert('Error', 'Could not open camera. Please try again.');
    return null;
  }
}

export const PublicProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { userId, name, username, profileImageUrl } = route.params;
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';
  const isOwnProfile = user?.id && Number(user.id) === userId;
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;

  const [connectionState, setConnectionState] = useState<'none' | 'pending' | 'connected'>('none');
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [actionShotUri, setActionShotUri] = useState<string | null>(null);
  const [editPB, setEditPB] = useState('--');
  const [editSB, setEditSB] = useState('--');
  const [editEvent, setEditEvent] = useState('100M SPRINT');
  const [loaded, setLoaded] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState<'avatar' | 'action' | null>(null);
  const [editModal, setEditModal] = useState<{ field: 'pb' | 'sb'; value: string } | null>(null);
  const editSnapshot = useRef<{ avatarUri: string | null; actionShotUri: string | null; pb: string; sb: string; event: string } | null>(null);

  const storageKey = `${STORAGE_KEY_PREFIX}${userId}`;

  useEffect(() => {
    loadProfileData();
  }, [userId]);

  const loadProfileData = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      if (raw) {
        const data: ProfileData = JSON.parse(raw);
        if (data.avatarUri) setAvatarUri(data.avatarUri);
        if (data.actionShotUri) setActionShotUri(data.actionShotUri);
        if (data.pb) setEditPB(data.pb);
        if (data.sb) setEditSB(data.sb);
        if (data.event) setEditEvent(data.event);
      }
    } catch {}
    setLoaded(true);
  }, [storageKey]);

  const saveProfileData = useCallback(async () => {
    try {
      const data: ProfileData = {
        avatarUri,
        actionShotUri,
        pb: editPB,
        sb: editSB,
        event: editEvent,
      };
      await AsyncStorage.setItem(storageKey, JSON.stringify(data));
    } catch {}
  }, [storageKey, avatarUri, actionShotUri, editPB, editSB, editEvent]);

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

  const handlePickPhoto = async (type: 'avatar' | 'action', source: 'camera' | 'library' | 'remove') => {
    setShowPhotoModal(null);
    if (source === 'remove') {
      if (type === 'avatar') setAvatarUri(null);
      else setActionShotUri(null);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    const uri = source === 'camera' ? await takePhoto() : await pickImage();
    if (uri) {
      if (type === 'avatar') setAvatarUri(uri);
      else setActionShotUri(uri);
    }
  };

  const autoSavePhoto = useCallback(async (newAvatar: string | null | undefined, newAction: string | null | undefined) => {
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      const existing: ProfileData = raw ? JSON.parse(raw) : {};
      const data: ProfileData = {
        ...existing,
        avatarUri: newAvatar !== undefined ? newAvatar : existing.avatarUri,
        actionShotUri: newAction !== undefined ? newAction : existing.actionShotUri,
        pb: editPB,
        sb: editSB,
        event: editEvent,
      };
      await AsyncStorage.setItem(storageKey, JSON.stringify(data));
    } catch {}
    editSnapshot.current = null;
    setIsEditing(false);
  }, [storageKey, editPB, editSB, editEvent]);

  const showNativePhotoSheet = (type: 'avatar' | 'action') => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Take Photo', 'Choose From Library', 'Remove Photo', 'Cancel'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 3,
          title: type === 'avatar' ? 'Profile Photo' : 'Action Shot',
        },
        async (buttonIndex) => {
          let uri: string | null = null;
          if (buttonIndex === 0) {
            uri = await takePhoto();
          } else if (buttonIndex === 1) {
            uri = await pickImage();
          } else if (buttonIndex === 2) {
            if (type === 'avatar') { setAvatarUri(null); autoSavePhoto(null, undefined); }
            else { setActionShotUri(null); autoSavePhoto(undefined, null); }
            return;
          } else {
            editSnapshot.current = null;
            setIsEditing(false);
            return;
          }
          if (uri) {
            if (type === 'avatar') { setAvatarUri(uri); autoSavePhoto(uri, undefined); }
            else { setActionShotUri(uri); autoSavePhoto(undefined, uri); }
          } else {
            editSnapshot.current = null;
            setIsEditing(false);
          }
        }
      );
    } else {
      setShowPhotoModal(type);
    }
  };

  const handleSave = async () => {
    await saveProfileData();
    editSnapshot.current = null;
    setIsEditing(false);
  };

  const startEditing = () => {
    editSnapshot.current = {
      avatarUri,
      actionShotUri,
      pb: editPB,
      sb: editSB,
      event: editEvent,
    };
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (editSnapshot.current) {
      setAvatarUri(editSnapshot.current.avatarUri);
      setActionShotUri(editSnapshot.current.actionShotUri);
      setEditPB(editSnapshot.current.pb);
      setEditSB(editSnapshot.current.sb);
      setEditEvent(editSnapshot.current.event);
    }
    editSnapshot.current = null;
    setIsEditing(false);
  };

  const displayName = name || (isOwnProfile ? (user as any)?.name : null) || 'TrackLit Athlete';
  const displayUsername = username || (isOwnProfile ? (user as any)?.username : null) || '';
  const displayImage = avatarUri || profileImageUrl || (isOwnProfile ? (user as any)?.profileImageUrl : null);
  const displayActionShot = actionShotUri;
  const spikesCount = isOwnProfile ? ((user as any)?.spikes ?? 100) : 0;
  const connectionsCount = friendsQuery.data?.length ?? 0;

  const level = 7;
  const xpCurrent = 2150;
  const xpMax = 3000;
  const cardsCount = 12;
  const leaderboardRank = 215;
  const rank = 4;

  return (
    <View style={[styles.root, { backgroundColor: COLORS.bg }]}>
      <RNAnimated.View style={[styles.flex, { opacity: fadeAnim }]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
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
                onPress={() => {
                  if (isEditing) {
                    Alert.alert('Unsaved changes', 'Save your changes before leaving?', [
                      { text: 'Discard', style: 'destructive', onPress: () => { handleCancelEdit(); navigation.goBack(); } },
                      { text: 'Save', onPress: async () => { await handleSave(); navigation.goBack(); } },
                    ]);
                  } else {
                    navigation.goBack();
                  }
                }}
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
                {isOwnProfile && !isEditing && (
                  <TouchableOpacity
                    style={styles.currencyBadge}
                    onPress={startEditing}
                    activeOpacity={0.7}
                  >
                    <PencilSimple size={14} color={COLORS.orange} weight="fill" />
                    <Text style={styles.currencyText}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.avatarSection}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryStatLeft}>
                  <Text style={styles.summaryLabel}>Cards:</Text>
                  <Text style={styles.summaryValue}>{cardsCount}</Text>
                </View>

                <TouchableOpacity
                  style={styles.avatarContainer}
                  onPress={() => {
                    if (isOwnProfile) {
                      if (!isEditing) startEditing();
                      showNativePhotoSheet('avatar');
                    }
                  }}
                  activeOpacity={isOwnProfile ? 0.7 : 1}
                  disabled={!isOwnProfile}
                >
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
                  {isEditing && (
                    <View style={styles.avatarEditBadge}>
                      <Camera size={14} color={COLORS.textPrimary} weight="fill" />
                    </View>
                  )}
                </TouchableOpacity>

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
                    {isEditing ? (
                      <TextInput
                        style={styles.eventInput}
                        value={editEvent}
                        onChangeText={setEditEvent}
                        placeholder="e.g. 100M SPRINT"
                        placeholderTextColor={COLORS.textMuted}
                        autoCapitalize="characters"
                      />
                    ) : (
                      <Text style={styles.athleteEvent}>{editEvent}</Text>
                    )}

                    <View style={styles.athleteImageRow}>
                      <TouchableOpacity
                        style={styles.athleteImageContainer}
                        onPress={() => {
                          if (isOwnProfile) {
                            if (!isEditing) startEditing();
                            showNativePhotoSheet('action');
                          }
                        }}
                        activeOpacity={isOwnProfile ? 0.7 : 1}
                        disabled={!isOwnProfile}
                      >
                        {displayActionShot ? (
                          <Image source={{ uri: displayActionShot }} style={styles.athleteImage} />
                        ) : (
                          <View style={styles.athleteImagePlaceholder}>
                            <Camera size={36} color={COLORS.textMuted} weight="fill" />
                            <Text style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 4, fontWeight: '600', letterSpacing: 1 }}>ACTION SHOT</Text>
                          </View>
                        )}
                        {isEditing && (
                          <View style={styles.actionShotOverlay}>
                            <Camera size={28} color={COLORS.textPrimary} weight="fill" />
                            <Text style={styles.actionShotLabel}>
                              {displayActionShot ? 'Change Action Shot' : 'Upload Action Shot'}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
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
                      <TouchableOpacity
                        style={styles.statPanel}
                        onPress={() => isEditing && setEditModal({ field: 'pb', value: editPB === '--' ? '' : editPB })}
                        disabled={!isEditing}
                        activeOpacity={isEditing ? 0.7 : 1}
                      >
                        <Text style={styles.statLabel}>PB</Text>
                        <Text style={styles.statValue}>{editPB}</Text>
                        {isEditing && (
                          <PencilSimple size={10} color={COLORS.orange} weight="fill" style={{ position: 'absolute', top: 4, right: 4 }} />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.statPanel, styles.statPanelMiddle]}
                        onPress={() => isEditing && setEditModal({ field: 'sb', value: editSB === '--' ? '' : editSB })}
                        disabled={!isEditing}
                        activeOpacity={isEditing ? 0.7 : 1}
                      >
                        <Text style={styles.statLabel}>SB</Text>
                        <Text style={styles.statValueBold}>{editSB}</Text>
                        {isEditing && (
                          <PencilSimple size={10} color={COLORS.orange} weight="fill" style={{ position: 'absolute', top: 4, right: 4 }} />
                        )}
                      </TouchableOpacity>
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
                style={styles.actionBtnConnect}
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
          ) : isEditing ? (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionBtnConnect}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#22c55e', '#16a34a']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionBtnGradient}
                >
                  <FloppyDisk size={18} color="white" weight="fill" />
                  <Text style={styles.actionBtnText}>SAVE</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtnMessage}
                onPress={handleCancelEdit}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionBtnGradient}
                >
                  <X size={18} color={COLORS.textSecondary} weight="bold" />
                  <Text style={[styles.actionBtnText, { color: COLORS.textSecondary }]}>CANCEL</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : null}

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

      <Modal
        visible={showPhotoModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPhotoModal(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPhotoModal(null)}
        >
          <View style={styles.photoSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.photoSheetTitle}>
              {showPhotoModal === 'avatar' ? 'Profile Photo' : 'Action Shot'}
            </Text>
            <TouchableOpacity
              style={styles.photoSheetOption}
              onPress={() => handlePickPhoto(showPhotoModal!, 'camera')}
            >
              <Camera size={20} color={COLORS.orange} weight="fill" />
              <Text style={styles.photoSheetOptionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photoSheetOption}
              onPress={() => handlePickPhoto(showPhotoModal!, 'library')}
            >
              <ImageIcon size={20} color={COLORS.gradEnd} weight="fill" />
              <Text style={styles.photoSheetOptionText}>Choose From Library</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photoSheetOption}
              onPress={() => handlePickPhoto(showPhotoModal!, 'remove')}
            >
              <Trash size={20} color="#ef4444" weight="fill" />
              <Text style={[styles.photoSheetOptionText, { color: '#ef4444' }]}>Remove Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photoSheetCancel}
              onPress={() => setShowPhotoModal(null)}
            >
              <Text style={styles.photoSheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal
        visible={editModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModal(null)}
      >
        <KeyboardAvoidingView
          style={styles.editModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.editModalOverlay}
            activeOpacity={1}
            onPress={() => setEditModal(null)}
          >
            <View style={styles.editSheet} onStartShouldSetResponder={() => true}>
              <Text style={styles.photoSheetTitle}>
                {editModal?.field === 'pb' ? 'Personal Best' : 'Season Best'}
              </Text>
              <Text style={styles.editSheetHint}>
                Enter your {editModal?.field === 'pb' ? 'personal best' : 'season best'} time
              </Text>
              <TextInput
                style={styles.editSheetInput}
                value={editModal?.value ?? ''}
                onChangeText={(val) => setEditModal(prev => prev ? { ...prev, value: val } : null)}
                placeholder="e.g. 9.92"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="decimal-pad"
                autoFocus
                selectTextOnFocus
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (editModal) {
                    const val = editModal.value.trim() || '--';
                    if (editModal.field === 'pb') setEditPB(val);
                    else setEditSB(val);
                    setEditModal(null);
                  }
                }}
              />
              <View style={styles.editSheetButtons}>
                <TouchableOpacity
                  style={styles.editSheetCancelBtn}
                  onPress={() => setEditModal(null)}
                >
                  <Text style={styles.editSheetCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editSheetSaveBtn}
                  onPress={() => {
                    if (editModal) {
                      const val = editModal.value.trim() || '--';
                      if (editModal.field === 'pb') setEditPB(val);
                      else setEditSB(val);
                      setEditModal(null);
                    }
                  }}
                >
                  <LinearGradient
                    colors={[COLORS.orange, '#FF9D00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.editSheetSaveBtnInner}
                  >
                    <Text style={styles.editSheetSaveText}>Done</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
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
    position: 'relative',
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
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.bg,
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
  eventInput: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
    letterSpacing: 0.5,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.orange,
    paddingVertical: 4,
    paddingHorizontal: 16,
    minWidth: 150,
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
    position: 'relative',
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
  actionShotOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    gap: 8,
  },
  actionShotLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  actionShotHintOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  actionShotHintText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
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
    position: 'relative',
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  photoSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 34,
    paddingHorizontal: 20,
  },
  photoSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  photoSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  photoSheetOptionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  photoSheetCancel: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  photoSheetCancelText: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: '600',
  },

  editSheet: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  editSheetHint: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 16,
  },
  editSheetInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  editSheetButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editSheetCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  editSheetCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  editSheetSaveBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  editSheetSaveBtnInner: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  editSheetSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});
