import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  View,
  ScrollView,
  FlatList,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  Image,
  Text as RNText,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  Bell,
  PaperPlaneTilt,
  X,
  CaretRight,
  Star,
  Minus,
  Plus,
  Book,
  Users,
  CalendarBlank,
  Medal,
  Trophy,
  BookOpen,
  User,
  Heart,
  FloppyDisk,
  Newspaper,
  Lightning,
  Barbell,
  PencilLine,
  FilmStrip,
  PersonSimpleThrow,
  Timer,
  Clock,
  VideoCamera,
  FirstAidKit,
  Brain,
} from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

import { LinearGradient } from '@/components/LinearGradient';
import { Card } from '../components/ui/Card';
import { Text } from '../components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { InlineRefreshHeader } from '@/components/refresh/InlineRefreshHeader';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { getScreenContentBottomPadding } from '@/utils/layoutPadding';
import { apiRequest } from '@/lib/api';
import { env } from '@/config/env';
import { PROGRAM_SELECTION_KEY } from '@/utils/programSelection';

import { useProgramSessions } from '@/hooks/use-program-sessions';
import type { RootStackParamList } from '@/navigation/types';
import theme from '../utils/theme';

interface HomeScreenProps {
  onNavigate?: (route: string) => void;
}
interface CategoryCard {
  title: string;
  description: string;
  iconName: string;
  route: string;
  disabled?: boolean;
  isSpecial?: boolean;
  showStar?: boolean;
}

type ActivityType =
  | 'workout'
  | 'journal_entry'
  | 'user_joined'
  | 'meet_created'
  | 'meet_results'
  | 'coach_status'
  | 'program_assigned'
  | 'group_joined'
  | string;

interface CommunityActivity {
  id: number;
  userId: number;
  activityType: ActivityType;
  title: string;
  description?: string;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    name: string;
    profileImageUrl?: string;
  };
}

interface CarouselUserEntry {
  key: string;
  activity: CommunityActivity | null;
  userId: number;
  displayName: string;
  username: string;
  profileImageUrl?: string;
  isSelf: boolean;
}

const PROFILE_STORAGE_KEY_PREFIX = 'tracklit_profile_';

type PublicProfileSummary = {
  id: number;
  name?: string | null;
  username?: string | null;
  profileImageUrl?: string | null;
};

const normalizeProfileImageUrl = (profileImageUrl?: string | null): string | undefined => {
  if (!profileImageUrl || typeof profileImageUrl !== 'string') return undefined;

  const trimmed = profileImageUrl.trim();
  if (!trimmed) return undefined;

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('file://') ||
    trimmed.startsWith('content://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  if (trimmed.startsWith('/')) {
    return `${env.API_BASE_URL}${trimmed}`;
  }

  return `${env.API_BASE_URL}/${trimmed.replace(/^\/+/, '')}`;
};

const CarouselAvatar: React.FC<{ imageUrl?: string; initial: string }> = ({ imageUrl, initial }) => {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  if (!imageUrl || imageFailed) {
    return <Text style={styles.carouselInitial}>{initial}</Text>;
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={styles.carouselImage}
      onError={() => setImageFailed(true)}
    />
  );
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [greeting, setGreeting] = useState('');
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [tickerModalVisible, setTickerModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<CommunityActivity | null>(null);
  const [likedActivities, setLikedActivities] = useState<Set<number>>(new Set());
  const [readActivities, setReadActivities] = useState<Set<number>>(new Set());
  const [carouselCollapsed, setCarouselCollapsed] = useState(false);
  const [carouselHidden, setCarouselHidden] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [selectionLoaded, setSelectionLoaded] = useState(false);
  const userId = user?.id;
  const numericUserId = userId && userId !== 'guest' ? Number(userId) : null;
  const [ownStoredAvatarUri, setOwnStoredAvatarUri] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('carousel_hidden').then(val => {
        setCarouselHidden(val === 'true');
      });
      if (numericUserId) {
        AsyncStorage.getItem(`${PROFILE_STORAGE_KEY_PREFIX}${numericUserId}`).then((raw) => {
          if (!raw) {
            setOwnStoredAvatarUri(null);
            return;
          }

          try {
            const data = JSON.parse(raw);
            setOwnStoredAvatarUri(typeof data?.avatarUri === 'string' ? data.avatarUri : null);
          } catch {
            setOwnStoredAvatarUri(null);
          }
        });
      } else {
        setOwnStoredAvatarUri(null);
      }
      AsyncStorage.getItem(PROGRAM_SELECTION_KEY).then(val => {
        setSelectedProgramId(val);
        setSelectionLoaded(true);
      });
      queryClient.invalidateQueries({ queryKey: ['today-session'] });
      queryClient.invalidateQueries({ queryKey: ['purchased-programs-home'] });
    }, [numericUserId, queryClient])
  );

  const purchasedProgramsQuery = useQuery({
    queryKey: ['purchased-programs-home'],
    queryFn: () => apiRequest<Array<{ id: number | string; programId: number | string; program?: { title?: string; isTextBased?: boolean; textContent?: string; isUploadedProgram?: boolean; programFileUrl?: string } }>>('/api/purchased-programs'),
    enabled: !!userId && userId !== 'guest',
    staleTime: 120000,
  });

  useEffect(() => {
    if (!selectionLoaded) return;
    if (selectedProgramId) return;
    const purchases = purchasedProgramsQuery.data;
    if (!purchases || purchases.length === 0) return;
    const firstPurchase = purchases[0];
    AsyncStorage.setItem(PROGRAM_SELECTION_KEY, String(firstPurchase.id));
    setSelectedProgramId(String(firstPurchase.id));
  }, [selectionLoaded, selectedProgramId, purchasedProgramsQuery.data]);

  const resolvedProgramId = React.useMemo(() => {
    if (!selectionLoaded) return null;
    const purchases = purchasedProgramsQuery.data;
    if (!purchases || purchases.length === 0) return null;
    if (selectedProgramId) {
      const match = purchases.find((p) => String(p.id) === String(selectedProgramId));
      if (match) {
        console.warn('[Home] Resolved program:', { purchaseId: match.id, programId: match.programId, title: match.program?.title });
        return String(match.programId);
      }
      const directMatch = purchases.find((p) => String(p.programId) === String(selectedProgramId));
      if (directMatch) {
        console.warn('[Home] Resolved via direct match:', { programId: directMatch.programId });
        return String(directMatch.programId);
      }
      console.warn('[Home] No match found for selectedProgramId:', selectedProgramId, 'falling back to first purchase');
    }
    const fallback = purchases[0];
    console.warn('[Home] Using fallback program:', { purchaseId: fallback.id, programId: fallback.programId, title: fallback.program?.title });
    return String(fallback.programId);
  }, [selectionLoaded, selectedProgramId, purchasedProgramsQuery.data]);

  const selectedPurchase = useMemo(() => {
    const purchases = purchasedProgramsQuery.data;
    if (!purchases || !selectedProgramId) return null;
    return purchases.find((p) => String(p.id) === String(selectedProgramId) || String(p.programId) === String(selectedProgramId)) ?? null;
  }, [selectedProgramId, purchasedProgramsQuery.data]);

  const isTextBasedProgram = selectedPurchase?.program?.isTextBased === true;
  const isUploadedProgram = selectedPurchase?.program?.isUploadedProgram === true;

  useEffect(() => {
    if (!selectionLoaded) return;
    const purchases = purchasedProgramsQuery.data;
    if (!purchases || purchases.length === 0) return;
    if (!selectedProgramId) return;
    const hasMatch = purchases.some(
      (p) => String(p.id) === String(selectedProgramId) || String(p.programId) === String(selectedProgramId)
    );
    if (!hasMatch) {
      const fallbackId = String(purchases[0].id);
      console.warn('[Home] Correcting stale selection to:', fallbackId);
      AsyncStorage.setItem(PROGRAM_SELECTION_KEY, fallbackId);
      setSelectedProgramId(fallbackId);
    }
  }, [selectionLoaded, selectedProgramId, purchasedProgramsQuery.data]);

  const { programSessions, programDuration } = useProgramSessions(resolvedProgramId);

  const sessionsByDay = useMemo(() => {
    const map: Record<number, any> = {};
    if (programSessions) {
      programSessions.forEach((session: any) => {
        if (session.dayNumber != null) {
          map[session.dayNumber] = session;
        }
      });
    }
    return map;
  }, [programSessions]);

  const todayDayNumber = useMemo(() => {
    if (!programSessions || programSessions.length === 0) return null;
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const datesFromSessions = programSessions
      .map((s: any) => {
        if (!s.date) return null;
        const shortM = String(s.date).match(/^([A-Za-z]{3})-(\d{1,2})$/);
        if (shortM) {
          const monIdx = MONTHS.indexOf(shortM[1][0].toUpperCase() + shortM[1].slice(1).toLowerCase());
          if (monIdx >= 0) return new Date(today.getFullYear(), monIdx, parseInt(shortM[2]));
        }
        const isoM = String(s.date).match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoM) return new Date(parseInt(isoM[1]), parseInt(isoM[2]) - 1, parseInt(isoM[3]));
        return null;
      })
      .filter(Boolean) as Date[];

    if (datesFromSessions.length === 0) return 1;
    datesFromSessions.sort((a, b) => a.getTime() - b.getTime());
    const programStartDate = datesFromSessions[0];
    const diff = Math.round((today.getTime() - programStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalDays = Math.max(...Object.keys(sessionsByDay).map(Number), programSessions.length);
    if (diff >= 1 && diff <= totalDays) return diff;
    return 1;
  }, [programSessions, sessionsByDay]);

  const todaySessionId = useMemo(() => {
    if (!todayDayNumber) return { sessionId: undefined, dayNumber: undefined };
    const session = sessionsByDay[todayDayNumber];
    if (session) return { sessionId: session.id, dayNumber: todayDayNumber };
    if (!programSessions || programSessions.length === 0) return { sessionId: undefined, dayNumber: undefined };
    const incomplete = programSessions.filter((s: any) => !s.completed_at);
    const fallback = incomplete.length > 0 ? incomplete[incomplete.length - 1] : programSessions[programSessions.length - 1];
    return { sessionId: fallback?.id, dayNumber: fallback?.dayNumber };
  }, [todayDayNumber, sessionsByDay, programSessions]);

  const todayGymQuery = useQuery({
    queryKey: ['gym-data-home', resolvedProgramId, todaySessionId.dayNumber, todaySessionId.sessionId],
    queryFn: async () => {
      if (todaySessionId.sessionId) {
        return apiRequest<{ gymData: string[] }>(`/api/sessions/${todaySessionId.sessionId}/gym-data`);
      }
      if (resolvedProgramId && todaySessionId.dayNumber) {
        return apiRequest<{ gymData: string[] }>(`/api/programs/${resolvedProgramId}/days/${todaySessionId.dayNumber}/gym-data`);
      }
      return { gymData: [] };
    },
    enabled: !!(todaySessionId.sessionId || (resolvedProgramId && todaySessionId.dayNumber)),
  });
  const todayGymData = todayGymQuery.data?.gymData ?? [];

  const todaySession = useMemo(() => {
    if (!todayDayNumber || !programSessions || programSessions.length === 0) return null;

    const matched = sessionsByDay[todayDayNumber];
    if (!matched) return null;

    const totalDays = Math.max(...Object.keys(sessionsByDay).map(Number), programSessions.length);

    return {
      ...matched,
      dayNumber: matched.dayNumber || todayDayNumber,
      totalDays,
      programId: resolvedProgramId,
    };
  }, [todayDayNumber, sessionsByDay, programSessions, resolvedProgramId]);

  const screenOpacity = useSharedValue(0);
  useEffect(() => {
    screenOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });
  }, []);
  const screenFadeStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const [allActivities, setAllActivities] = useState<CommunityActivity[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const activitiesQuery = useQuery<CommunityActivity[]>({
    queryKey: ['community-activities'],
    queryFn: () => apiRequest<CommunityActivity[]>('/api/community/activities?offset=0&limit=25'),
    refetchInterval: 30000,
    retry: false,
    staleTime: 60000,
  });

  useEffect(() => {
    const data = activitiesQuery.data ?? [];
    setAllActivities(data);
    setHasMore(data.length >= 25);
  // dataUpdatedAt is a stable timestamp — only changes when new data arrives, not on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activitiesQuery.dataUpdatedAt]);

  const loadMoreActivities = useCallback(async () => {
    if (isLoadingMore || !hasMore || allActivities.length === 0) return;
    setIsLoadingMore(true);
    try {
      const more = await apiRequest<CommunityActivity[]>(
        `/api/community/activities?offset=${allActivities.length}&limit=25`
      );
      if (more && more.length > 0) {
        setAllActivities(prev => [...prev, ...more]);
        setHasMore(more.length >= 25);
      } else {
        setHasMore(false);
      }
    } catch {
      // silently fail — user can trigger again by continuing to scroll
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, allActivities.length]);

  // Fetched early so ownActivity (below) can reference it without a forward-declaration error
  const { data: journalEntriesEarly = [] } = useQuery({
    queryKey: ['journal-home'],
    queryFn: () => apiRequest<any[]>('/api/journal'),
    staleTime: 120000,
    enabled: !!userId && userId !== 'guest',
  });

  const rawActivities = allActivities.length > 0 ? allActivities : (activitiesQuery.data ?? []);

  // Build a synthetic ticker card from the user's own most-recent public journal entry.
  // This works regardless of which backend is in use (Azure or dev), since journal entries
  // are fetched separately and always available in HomeScreen.
  const ownActivity: CommunityActivity | null = useMemo(() => {
    if (!user || !userId || userId === 'guest') return null;
    const entries = (journalEntriesEarly as any[]);
    if (!entries.length) return null;
    const latest = entries
      .filter((e: any) => e.isPublic !== false)
      .sort((a: any, b: any) =>
        new Date(b.createdAt ?? b.date ?? 0).getTime() -
        new Date(a.createdAt ?? a.date ?? 0).getTime()
      )[0];
    if (!latest) return null;
    return {
      id: -(latest.id ?? 1),
      userId: Number(userId),
      activityType: 'journal_entry',
      title: latest.title || 'Journal Entry',
      description: latest.notes ? String(latest.notes).slice(0, 140) : undefined,
      createdAt: latest.createdAt || new Date().toISOString(),
      user: {
        id: Number(userId),
        username: (user as any).username || '',
        name: (user as any).name || (user as any).username || 'You',
        profileImageUrl: normalizeProfileImageUrl(
          ownStoredAvatarUri || (user as any).profileImageUrl || null
        ),
      },
    };
  }, [ownStoredAvatarUri, user, userId, journalEntriesEarly]);

  const carouselAvatarLookupUserIds = useMemo(() => {
    const ids: number[] = [];
    const seen = new Set<number>();

    if (
      numericUserId &&
      !normalizeProfileImageUrl(ownStoredAvatarUri || (user as any)?.profileImageUrl || null)
    ) {
      ids.push(numericUserId);
      seen.add(numericUserId);
    }

    for (const activity of rawActivities) {
      const activityUserId = activity.user?.id ?? activity.userId;
      if (!activityUserId || seen.has(activityUserId)) {
        continue;
      }

      if (!normalizeProfileImageUrl(activity.user?.profileImageUrl)) {
        ids.push(activityUserId);
        seen.add(activityUserId);
      }

      if (ids.length >= 12) {
        break;
      }
    }

    return ids;
  }, [numericUserId, ownStoredAvatarUri, rawActivities, user]);

  const carouselUserProfilesQuery = useQuery({
    queryKey: ['community-carousel-user-profiles', carouselAvatarLookupUserIds],
    enabled: carouselAvatarLookupUserIds.length > 0,
    staleTime: 300000,
    retry: false,
    queryFn: async () => {
      const profiles = await Promise.all(
        carouselAvatarLookupUserIds.map(async (lookupUserId) => {
          try {
            return await apiRequest<PublicProfileSummary>(`/api/users/${lookupUserId}`);
          } catch {
            return null;
          }
        })
      );

      return profiles.filter((profile): profile is PublicProfileSummary => !!profile);
    },
  });

  const carouselUserProfileByUserId = useMemo(() => {
    const profileMap = new Map<number, PublicProfileSummary>();

    for (const profile of carouselUserProfilesQuery.data ?? []) {
      profileMap.set(profile.id, profile);
    }

    return profileMap;
  }, [carouselUserProfilesQuery.data]);

  const carouselEntries = useMemo<CarouselUserEntry[]>(() => {
    const entries: CarouselUserEntry[] = [];
    const seenUserIds = new Set<number>();
    const ownProfile = numericUserId ? carouselUserProfileByUserId.get(numericUserId) : undefined;
    const ownResolvedProfileImageUrl =
      normalizeProfileImageUrl(ownStoredAvatarUri || (user as any)?.profileImageUrl || null) ||
      normalizeProfileImageUrl(ownProfile?.profileImageUrl);
    const ownResolvedDisplayName =
      ownProfile?.name?.trim() ||
      (user as any)?.name ||
      (user as any)?.username ||
      'You';
    const ownResolvedUsername =
      ownProfile?.username?.trim() ||
      (user as any)?.username ||
      '';

    if (numericUserId && user) {
      entries.push({
        key: `self-${numericUserId}`,
        activity: ownActivity,
        userId: numericUserId,
        displayName: ownResolvedDisplayName,
        username: ownResolvedUsername,
        profileImageUrl: ownResolvedProfileImageUrl,
        isSelf: true,
      });
      seenUserIds.add(numericUserId);
    }

    for (const activity of rawActivities) {
      const activityUserId = activity.user?.id ?? activity.userId;
      if (!activity.user || !activityUserId || seenUserIds.has(activityUserId)) {
        continue;
      }

      const profile = carouselUserProfileByUserId.get(activityUserId);
      const resolvedProfileImageUrl =
        normalizeProfileImageUrl(activity.user.profileImageUrl) ||
        normalizeProfileImageUrl(profile?.profileImageUrl);
      const resolvedDisplayName =
        profile?.name?.trim() ||
        activity.user.name ||
        activity.user.username;
      const resolvedUsername =
        profile?.username?.trim() ||
        activity.user.username;

      entries.push({
        key: `activity-user-${activityUserId}`,
        activity,
        userId: activityUserId,
        displayName: resolvedDisplayName,
        username: resolvedUsername,
        profileImageUrl: resolvedProfileImageUrl,
        isSelf: false,
      });
      seenUserIds.add(activityUserId);
    }

    return entries;
  }, [carouselUserProfileByUserId, numericUserId, ownActivity, ownStoredAvatarUri, rawActivities, user]);

  const getActivityBadge = (activityType: ActivityType) => {
    switch (activityType) {
      case 'journal_entry':
        return 'journal';
      case 'user_joined':
      case 'group_joined':
        return 'system';
      default:
        return 'feed';
    }
  };

  const openOwnProfile = useCallback(() => {
    if (!numericUserId || !user) {
      return;
    }

    const parentNavigation = navigation.getParent<NavigationProp<RootStackParamList>>();
    const targetNavigation = parentNavigation ?? navigation;

    targetNavigation.navigate('PublicProfile', {
      userId: numericUserId,
      name: (user as any).name || null,
      username: (user as any).username || null,
      profileImageUrl:
        normalizeProfileImageUrl(ownStoredAvatarUri || (user as any).profileImageUrl || null) || null,
    });
  }, [navigation, numericUserId, ownStoredAvatarUri, user]);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications-home'],
    queryFn: () => apiRequest<any[]>('/api/notifications'),
    staleTime: 30000,
    select: (data: any[] | undefined) =>
      (data || []).filter((n: any) => n.type !== 'message_received'),
  });

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['friend-requests-pending'],
    queryFn: () => apiRequest<any[]>('/api/friend-requests/pending'),
    staleTime: 30000,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations-home'],
    queryFn: () => apiRequest<any[]>('/api/conversations'),
    staleTime: 30000,
    enabled: !!userId && userId !== 'guest',
  });

  const { data: journalEntries = [] } = useQuery({
    queryKey: ['journal-home'],
    queryFn: () => apiRequest<any[]>('/api/journal'),
    staleTime: 120000,
    enabled: !!userId && userId !== 'guest',
  });

  const [lastUsedTool, setLastUsedTool] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('last_used_tool').then((val) => {
      setLastUsedTool(val || 'PhotoFinish');
    });
  }, []);

  const spikesBalance = Number((user as any)?.spikes ?? 0);

  const trainingStats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(todayStart.getTime() - 7 * 86400000);
    const monthAgo = new Date(todayStart.getTime() - 30 * 86400000);

    const completedSessions = programSessions?.filter((s: any) => s.completed_at) ?? [];
    const allJournal = (journalEntries as any[]) ?? [];
    const totalWeeklySessions = 7;

    const inRange = (dateStr: string | undefined, from: Date) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= from && d <= now;
    };

    const todaySessions = completedSessions.filter((s: any) => inRange(s.completed_at, todayStart)).length;
    const todayJournal = allJournal.filter((j: any) => inRange(j.date || j.createdAt, todayStart)).length;

    const weekSessions = completedSessions.filter((s: any) => inRange(s.completed_at, weekAgo)).length;
    const weekJournal = allJournal.filter((j: any) => inRange(j.date || j.createdAt, weekAgo)).length;

    const monthSessions = completedSessions.filter((s: any) => inRange(s.completed_at, monthAgo)).length;
    const monthJournal = allJournal.filter((j: any) => inRange(j.date || j.createdAt, monthAgo)).length;

    return [
      { key: 'today', label: 'Today', sessions: todaySessions, weeklyTotal: 1, journal: todayJournal, spikes: spikesBalance, quickAction: lastUsedTool || 'PhotoFinish' },
      { key: '7days', label: '7 Days', sessions: weekSessions, weeklyTotal: totalWeeklySessions, journal: weekJournal, spikes: spikesBalance, quickAction: lastUsedTool || 'PhotoFinish' },
      { key: '30days', label: '30 Days', sessions: monthSessions, weeklyTotal: totalWeeklySessions * 4, journal: monthJournal, spikes: spikesBalance, quickAction: lastUsedTool || 'PhotoFinish' },
    ];
  }, [programSessions, journalEntries, spikesBalance, lastUsedTool]);

  const unreadNotifications =
    (notifications as any[]).filter((n) => !n.isRead).length + (pendingRequests as any[]).length;

  const unreadMessages =
    conversations && userId
      ? (conversations as any[]).filter(
          (conv) =>
            conv.lastMessage &&
            !conv.lastMessage.isRead &&
            conv.lastMessage.receiverId === userId
        ).length
      : 0;

  const CAROUSEL_ITEM_WIDTH = 80;

  const formatTimeAgo = (dateString: string) => {
    const now = Date.now();
    const diff = Math.floor((now - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleTickerTap = (activity: CommunityActivity | undefined) => {
    if (!activity) return;
    setReadActivities(prev => new Set(prev).add(activity.id));
    setSelectedActivity(activity);
    setTickerModalVisible(true);
  };

  const handleLikeActivity = (activityId: number) => {
    setLikedActivities(prev => {
      const next = new Set(prev);
      if (next.has(activityId)) next.delete(activityId);
      else next.add(activityId);
      return next;
    });
  };

  const saveToJournalMutation = useMutation({
    mutationFn: (activity: CommunityActivity) =>
      apiRequest('/api/journal', {
        method: 'POST',
        data: {
          title: activity.title,
          notes: `Saved from community feed:\n\n${activity.description || ''}\n\nOriginally posted by ${activity.user?.name || activity.user?.username || 'Unknown'}`,
          type: 'workout',
          date: new Date().toISOString().split('T')[0],
          moodRating: 5,
          isPublic: false,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      Alert.alert('Saved', 'Added to your Journal.');
      setTickerModalVisible(false);
    },
    onError: () => {
      Alert.alert('Error', 'Could not save to Journal. Please try again.');
    },
  });

  const getActivityIconComponent = (activityType: ActivityType) => {
    switch (activityType) {
      case 'workout':
      case 'journal_entry':
        return Book;
      case 'user_joined':
      case 'group_joined':
        return Users;
      case 'meet_created':
        return CalendarBlank;
      case 'meet_results':
        return Medal;
      case 'coach_status':
        return Trophy;
      case 'program_assigned':
        return BookOpen;
      default:
        return User;
    }
  };

  const categoryCards: CategoryCard[] = [
    {
      title: 'Programs',
      description: 'Training plans and schedules',
      iconName: 'book',
      route: 'Programs',
    },
    {
      title: 'Tools',
      description: 'Training and performance tools',
      iconName: 'clock',
      route: 'Tools',
    },
    {
      title: 'Sprinthia',
      description: 'Your AI Track Companion',
      iconName: 'comments',
      route: 'Sprinthia',
      disabled: false,
      showStar: true,
    },
  ];

  const { isRefreshing, onRefresh } = usePullToRefresh(async () => {
    await Promise.all([queryClient.invalidateQueries(), refreshUser()]);
  });

  const handleCardPress = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    }
  };

  return (
    <LinearGradient
      colors={theme.gradients.background.colors}
      locations={theme.gradients.background.locations}
      start={theme.gradients.background.start}
      end={theme.gradients.background.end}
      style={styles.container}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <Animated.View style={[{ flex: 1 }, screenFadeStyle]}>
      <View style={[styles.fixedHeader, { paddingTop: insets.top }]}>
        <ScreenHeader
          title=""
          right={
            <>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => onNavigate?.('Notifications')}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
              >
              <Bell size={22} color="#94a3b8" weight="fill" />
              {unreadNotifications > 0 && (
                <View style={styles.badge}>
                  <Text variant="caption" weight="bold" color="foreground">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </Text>
                </View>
              )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => onNavigate?.('Chat')}
                accessibilityRole="button"
                accessibilityLabel="Messages"
              >
              <PaperPlaneTilt size={19} color="#94a3b8" weight="fill" />
              {unreadMessages > 0 && (
                <View style={styles.badge}>
                  <Text variant="caption" weight="bold" color="foreground">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </Text>
                </View>
              )}
              </TouchableOpacity>
            </>
          }
          containerStyle={styles.header}
        />
      </View>

      {/* Activity Carousel — fixed above scroll */}
      {carouselEntries.length > 0 && !carouselHidden && (
        <View style={styles.carouselContainer}>
          <TouchableOpacity
            style={styles.carouselToggle}
            activeOpacity={0.6}
            onPress={() => setCarouselCollapsed(prev => !prev)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {carouselCollapsed ? (
              <Plus size={14} color="rgba(255,255,255,0.35)" weight="bold" />
            ) : (
              <Minus size={14} color="rgba(255,255,255,0.35)" weight="bold" />
            )}
          </TouchableOpacity>
          {!carouselCollapsed && (
            <FlatList
              data={carouselEntries}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.key}
              contentContainerStyle={styles.carouselContent}
              onEndReached={() => {
                if (hasMore && !isLoadingMore) {
                  loadMoreActivities();
                }
              }}
              onEndReachedThreshold={0.6}
              getItemLayout={(_, index) => ({
                length: CAROUSEL_ITEM_WIDTH,
                offset: CAROUSEL_ITEM_WIDTH * index,
                index,
              })}
              renderItem={({ item }) => {
                const badge = item.isSelf ? 'profile' : getActivityBadge(item.activity?.activityType ?? 'workout');
                const initial = (item.displayName?.[0] || item.username?.[0] || '?').toUpperCase();
                const username = item.displayName?.split(' ')[0] || item.username || (item.isSelf ? 'You' : '');
                const isRead = item.activity ? readActivities.has(item.activity.id) : false;

                return (
                  <TouchableOpacity
                    style={styles.carouselItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (item.isSelf) {
                        openOwnProfile();
                        return;
                      }

                      handleTickerTap(item.activity ?? undefined);
                    }}
                  >
                    <View style={[
                      styles.carouselRing,
                      isRead ? styles.carouselRingRead : styles.carouselRingUnread,
                    ]}>
                      <View style={styles.carouselCircle}>
                        <CarouselAvatar imageUrl={item.profileImageUrl} initial={initial} />
                      </View>
                      <View style={[
                        styles.carouselBadge,
                        badge === 'journal' && styles.carouselBadgeJournal,
                        badge === 'feed' && styles.carouselBadgeFeed,
                        badge === 'system' && styles.carouselBadgeSystem,
                      ]}>
                        {badge === 'journal' ? (
                          <Book size={10} color="#fff" weight="fill" />
                        ) : badge === 'feed' ? (
                          <Newspaper size={10} color="#fff" weight="fill" />
                        ) : badge === 'profile' ? (
                          <User size={10} color="#fff" weight="fill" />
                        ) : (
                          <View style={styles.carouselRedDot} />
                        )}
                      </View>
                    </View>
                    <Text
                      variant="caption"
                      color="secondary"
                      numberOfLines={1}
                      style={styles.carouselUsername}
                    >
                      {username}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}
          <View style={styles.carouselDivider} />
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: getScreenContentBottomPadding(insets.bottom, { includeBottomNav: true, extra: theme.spacing.xxxxl }) }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            tintColor="#fff"
            refreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        }
      >
        <InlineRefreshHeader visible={isRefreshing} />

        {/* Practice Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleCardPress('Practice')}
          style={[styles.practiceCardWrapper, carouselHidden && { marginTop: 16 }]}
        >
          <LinearGradient
            colors={['#6d28d9', '#c084fc']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.practiceCard}
          >
            <View style={styles.practiceTopRow}>
              <View style={styles.practiceLabelPill}>
                <Text style={styles.practiceLabelText}>{isTextBasedProgram || isUploadedProgram ? 'YOUR PROGRAM' : 'TODAY\'S SESSION'}</Text>
              </View>
            </View>

            {isTextBasedProgram ? (
              <Text style={styles.practiceTapPrompt}>
                Tap to open your program
              </Text>
            ) : isUploadedProgram ? (
              <Text style={styles.practiceTapPrompt}>
                Tap to open {selectedPurchase?.program?.title || 'your program'}
              </Text>
            ) : todaySession ? (
              <>
                <Text style={styles.practiceSessionTitle} numberOfLines={2}>
                  {todaySession.title && todaySession.title !== 'Day Training' ? todaySession.title : `Day ${todaySession.dayNumber} Session`}
                </Text>
                <HomeWorkoutContent session={todaySession} gymData={todayGymData} />
              </>
            ) : (
              <Text style={styles.practiceNoSession}>
                No Session Scheduled — add a Program to get started
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Training Stats Carousel */}
        <TrainingStatsCarousel data={trainingStats} onNavigate={onNavigate} />

        {/* Category Cards */}
        <View style={styles.cardsContainer}>
          {categoryCards.map((card, idx) => {
            const disabled = card.disabled;
            const CardContent = (
              <Card
                key={card.title}
                style={[styles.categoryCard, idx > 0 && styles.categoryCardSpacer, disabled && styles.cardDisabled]}
                gradient={false}
              >
                <View style={styles.categoryInner}>
                  <View style={styles.categoryText}>
                    <Text variant="body" weight="bold" color={disabled ? 'muted' : 'foreground'}>
                      {card.title}{' '}
                      {card.showStar ? (
                        <Star size={12} color="#facc15" weight="fill" />
                      ) : null}
                    </Text>
                    <View style={styles.categorySubRow}>
                      <View style={styles.categoryDot} />
                      <Text variant="caption" color={disabled ? 'muted' : 'secondary'}>
                        {card.description}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.categoryIcons}>
                    {card.isSpecial && (
                      <TouchableOpacity
                        style={styles.previewButton}
                        activeOpacity={0.7}
                        onPress={() => !disabled && handleCardPress(card.route)}
                      >
                        <CaretRight size={14} color="#cbd5e1" weight="fill" />
                      </TouchableOpacity>
                    )}
                    <CaretRight size={12} color={disabled ? '#94a3b8' : '#cbd5e1'} weight="fill" />
                  </View>
                </View>
              </Card>
            );

            if (disabled) {
              return (
                <View key={card.title} style={{ width: '100%' }} pointerEvents="none">
                  {CardContent}
                </View>
              );
            }

            return (
              <TouchableOpacity
                key={card.title}
                activeOpacity={0.85}
                onPress={() => handleCardPress(card.route)}
              >
                {CardContent}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      </Animated.View>

      <Modal
        visible={tickerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTickerModalVisible(false)}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { paddingTop: insets.top + 60 }]}
          activeOpacity={1}
          onPress={() => setTickerModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContent}
            onPress={() => {}}
          >
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setTickerModalVisible(false)}
            >
              <X size={16} color="#94a3b8" weight="bold" />
            </TouchableOpacity>

            {selectedActivity && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalAvatar}>
                    {(() => {
                      const ActivityIcon = getActivityIconComponent(selectedActivity.activityType);
                      return <ActivityIcon size={18} color="#e2e8f0" weight="fill" />;
                    })()}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="body" weight="bold" color="foreground">
                      {selectedActivity.title}
                    </Text>
                    {!!selectedActivity.user?.username && (
                      <Text variant="caption" color="secondary">
                        {selectedActivity.user.name || selectedActivity.user.username} · {formatTimeAgo(selectedActivity.createdAt)}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.modalBody}>
                  <Text variant="body" color="foreground" style={{ lineHeight: 22 }}>
                    {selectedActivity.description || 'No additional details available.'}
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[
                      styles.modalActionButton,
                      likedActivities.has(selectedActivity.id) && styles.modalActionButtonActive,
                    ]}
                    onPress={() => handleLikeActivity(selectedActivity.id)}
                  >
                    <Heart
                      size={18}
                      color={likedActivities.has(selectedActivity.id) ? '#ef4444' : '#94a3b8'}
                      weight={likedActivities.has(selectedActivity.id) ? 'fill' : 'regular'}
                    />
                    <Text
                      variant="caption"
                      weight="medium"
                      color={likedActivities.has(selectedActivity.id) ? 'foreground' : 'secondary'}
                    >
                      {likedActivities.has(selectedActivity.id) ? 'Liked' : 'Like'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalActionButton}
                    onPress={() => saveToJournalMutation.mutate(selectedActivity)}
                    disabled={saveToJournalMutation.isPending}
                  >
                    <FloppyDisk size={18} color="#FF9800" weight="fill" />
                    <Text variant="caption" weight="medium" color="secondary">
                      {saveToJournalMutation.isPending ? 'Saving...' : 'Save to Journal'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
};

const STATS_CARD_WIDTH = Dimensions.get('window').width - 2 * theme.spacing.container;

interface StatsPeriod {
  key: string;
  label: string;
  sessions: number;
  weeklyTotal: number;
  journal: number;
  spikes: number;
  quickAction: string;
}

const TOOL_CONFIG: Record<string, { label: string; icon: React.ReactNode; screen: string }> = {
  PhotoFinish: { label: 'Photo Finish', icon: <FilmStrip size={14} color="#818cf8" weight="fill" />, screen: 'PhotoFinish' },
  Sprinthia: { label: 'Sprinthia AI', icon: <Brain size={14} color="#a78bfa" weight="fill" />, screen: 'Sprinthia' },
  StartGun: { label: 'Start Gun', icon: <PersonSimpleThrow size={14} color="#f87171" weight="fill" />, screen: 'StartGun' },
  Stopwatch: { label: 'Stopwatch', icon: <Timer size={14} color="#38bdf8" weight="fill" />, screen: 'Stopwatch' },
  IntervalTimer: { label: 'Interval Timer', icon: <Clock size={14} color="#4ade80" weight="fill" />, screen: 'IntervalTimer' },
  Journal: { label: 'Journal', icon: <BookOpen size={14} color="#fbbf24" weight="fill" />, screen: 'Journal' },
  ExerciseLibrary: { label: 'Exercise Lib', icon: <VideoCamera size={14} color="#c084fc" weight="fill" />, screen: 'ExerciseLibrary' },
  Rehab: { label: 'Rehab', icon: <FirstAidKit size={14} color="#fb7185" weight="fill" />, screen: 'Rehab' },
  Spikes: { label: 'Spikes', icon: <Lightning size={14} color="#facc15" weight="fill" />, screen: 'Spikes' },
};

const TrainingStatsCarousel = ({ data, onNavigate }: { data: StatsPeriod[]; onNavigate?: (route: string) => void }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const statsRef = useRef<FlatList>(null);

  const handleScroll = useCallback((e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / STATS_CARD_WIDTH);
    setActiveIndex(Math.max(0, Math.min(idx, data.length - 1)));
  }, [data.length]);

  const handleQuickAction = useCallback((toolKey: string) => {
    const tool = TOOL_CONFIG[toolKey];
    if (tool && onNavigate) {
      onNavigate(tool.screen);
    }
  }, [onNavigate]);

  const renderStatsPage = ({ item }: { item: StatsPeriod }) => {
    const tool = TOOL_CONFIG[item.quickAction] || TOOL_CONFIG.PhotoFinish;
    return (
      <View style={tsStyles.page}>
        <View style={tsStyles.row}>
          <View style={tsStyles.statCell}>
            <View style={tsStyles.iconWrap}>
              <Barbell size={14} color="#fff" weight="fill" />
            </View>
            <View style={tsStyles.statText}>
              <RNText style={tsStyles.statValue}>{item.sessions}<RNText style={tsStyles.statTotal}>/{item.weeklyTotal}</RNText></RNText>
              <RNText style={tsStyles.statLabel}>Sessions</RNText>
            </View>
          </View>
          <View style={tsStyles.vDivider} />
          <View style={tsStyles.statCell}>
            <View style={[tsStyles.iconWrap, { backgroundColor: 'rgba(251,191,36,0.25)' }]}>
              <PencilLine size={14} color="#fbbf24" weight="fill" />
            </View>
            <View style={tsStyles.statText}>
              <RNText style={tsStyles.statValue}>{item.journal}</RNText>
              <RNText style={tsStyles.statLabel}>Journal</RNText>
            </View>
          </View>
        </View>
        <View style={tsStyles.hDivider} />
        <View style={tsStyles.row}>
          <TouchableOpacity
            style={tsStyles.statCell}
            activeOpacity={0.7}
            onPress={() => handleQuickAction(item.quickAction)}
          >
            <View style={[tsStyles.iconWrap, { backgroundColor: 'rgba(99,102,241,0.25)' }]}>
              {tool.icon}
            </View>
            <View style={tsStyles.statText}>
              <RNText style={tsStyles.statValue} numberOfLines={1}>{tool.label}</RNText>
              <RNText style={tsStyles.statLabel}>Quick Action</RNText>
            </View>
            <CaretRight size={12} color="rgba(255,255,255,0.4)" weight="bold" />
          </TouchableOpacity>
          <View style={tsStyles.vDivider} />
          <View style={tsStyles.statCell}>
            <View style={[tsStyles.iconWrap, { backgroundColor: 'rgba(250,204,21,0.25)' }]}>
              <Lightning size={14} color="#facc15" weight="fill" />
            </View>
            <View style={tsStyles.statText}>
              <RNText style={tsStyles.statValue}>{item.spikes.toLocaleString()}</RNText>
              <RNText style={tsStyles.statLabel}>Spikes</RNText>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={tsStyles.wrapper}>
      <LinearGradient
        colors={['#FF7A00', '#FF9A40']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={tsStyles.card}
      >
        <View style={tsStyles.header}>
          <RNText style={tsStyles.headerTitle}>YOUR ACTIVITY</RNText>
          <View style={tsStyles.dots}>
            {data.map((d, i) => (
              <TouchableOpacity
                key={d.key}
                onPress={() => {
                  statsRef.current?.scrollToOffset({ offset: i * STATS_CARD_WIDTH, animated: true });
                  setActiveIndex(i);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <View style={[tsStyles.dot, i === activeIndex && tsStyles.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>
          <RNText style={tsStyles.periodLabel}>{data[activeIndex]?.label}</RNText>
        </View>
        <FlatList
          ref={statsRef}
          data={data}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          onMomentumScrollEnd={handleScroll}
          renderItem={renderStatsPage}
          getItemLayout={(_, index) => ({
            length: STATS_CARD_WIDTH,
            offset: STATS_CARD_WIDTH * index,
            index,
          })}
        />
      </LinearGradient>
    </View>
  );
};

const tsStyles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.spacing.xxxl,
    marginTop: -theme.spacing.xl,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    paddingTop: 12,
    paddingBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerTitle: {
    color: 'rgba(0,0,0,0.6)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    flex: 1,
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
    marginRight: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 16,
  },
  periodLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  page: {
    width: STATS_CARD_WIDTH,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  statCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  vDivider: {
    width: 0.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  hDivider: {
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statText: {
    flex: 1,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  statTotal: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  statLabel: {
    color: 'rgba(0,0,0,0.5)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    lineHeight: 14,
  },
});

const HomeWorkoutContent = ({ session, gymData = [] }: { session: any; gymData: string[] }) => {
  if (!session) return null;

  const contentSections = [
    { label: 'PA1', value: session.preActivation1 },
    { label: 'PA2', value: session.preActivation2 },
    { label: '60/100', value: session.shortDistanceWorkout },
    { label: '200', value: session.mediumDistanceWorkout },
    { label: '400', value: session.longDistanceWorkout },
    { label: 'Extra', value: session.extraSession },
  ];

  const hasGymData = gymData.length > 0;
  const sessionDescription = session.description && session.description !== 'Training Session' ? session.description : null;
  const hasWorkoutData = hasGymData || contentSections.some((s) => !!s.value) || session.notes || sessionDescription;

  const extractGymNumber = () => {
    const fields = [
      session.shortDistanceWorkout, session.mediumDistanceWorkout,
      session.longDistanceWorkout, session.preActivation1,
      session.preActivation2, session.extraSession,
    ];
    for (const field of fields) {
      if (field && typeof field === 'string') {
        const match = field.match(/Gym\s*(\d+)/i);
        if (match && match[1]) return match[1];
      }
    }
    return null;
  };

  if (!hasWorkoutData) return null;

  return (
    <View style={hwStyles.container}>
      {sessionDescription && (
        <RNText style={hwStyles.descriptionText} numberOfLines={3}>
          {sessionDescription}
        </RNText>
      )}
      {hasGymData && (
        <View style={hwStyles.row}>
          <RNText style={hwStyles.labelText}>
            {extractGymNumber() ? `Gym ${extractGymNumber()}` : 'Gym'}
          </RNText>
          <RNText style={hwStyles.valueText} numberOfLines={3}>
            {gymData.join(', ')}
          </RNText>
        </View>
      )}
      {contentSections.map((section) =>
        section.value ? (
          <View key={section.label} style={hwStyles.row}>
            <RNText style={hwStyles.labelText}>{section.label}</RNText>
            <RNText style={hwStyles.valueText} numberOfLines={3}>
              {String(section.value).replace(/^"|"$/g, '')}
            </RNText>
          </View>
        ) : null
      )}
      {session.notes && (
        <View style={hwStyles.row}>
          <RNText style={hwStyles.labelText}>Notes</RNText>
          <RNText style={hwStyles.valueText} numberOfLines={3}>
            {session.notes}
          </RNText>
        </View>
      )}
    </View>
  );
};

const hwStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 12,
    gap: 6,
    marginTop: 8,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  labelText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    width: 44,
    paddingTop: 1,
  },
  valueText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    flexShrink: 1,
  },
  descriptionText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 2,
  },
  fallbackText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.container,
  },
  fixedHeader: {
    zIndex: 10,
    paddingHorizontal: theme.spacing.container,
  },
  header: {
    paddingVertical: theme.spacing.xs,
  },
  profileButton: {
    padding: theme.spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    minHeight: 80,
    marginBottom: 0,
  },
  statContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cardsContainer: {
    gap: theme.spacing.sm,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  carouselContainer: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  carouselToggle: {
    alignSelf: 'flex-end',
    marginRight: theme.spacing.container,
    marginBottom: 4,
    padding: 4,
  },
  carouselContent: {
    paddingHorizontal: 8,
  },
  carouselItem: {
    width: 80,
    alignItems: 'center',
    paddingVertical: 6,
  },
  carouselRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  carouselRingUnread: {
    borderColor: '#FF9800',
  },
  carouselRingRead: {
    borderColor: 'rgba(255,255,255,0.12)',
  },
  carouselCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  carouselImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  carouselInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  carouselBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0f1623',
  },
  carouselBadgeJournal: {
    backgroundColor: '#FF9800',
  },
  carouselBadgeFeed: {
    backgroundColor: '#6366f1',
  },
  carouselBadgeSystem: {
    backgroundColor: '#1e293b',
  },
  carouselRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  carouselUsername: {
    marginTop: 4,
    fontSize: 10,
    textAlign: 'center',
    width: 72,
  },
  carouselDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop: 8,
    marginHorizontal: theme.spacing.container,
  },
  categoryCard: {
    height: 90,
    overflow: 'hidden',
    backgroundColor: 'rgba(147, 51, 234, 0.08)',
    borderColor: 'rgba(100, 116, 139, 0.25)',
    borderWidth: 0.5,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  categoryCardSpacer: {
    marginTop: theme.spacing.sm,
  },
  categoryInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  categoryText: {
    flex: 1,
  },
  categorySubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(203,213,225,0.5)',
  },
  categoryIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginLeft: theme.spacing.md,
  },
  previewButton: {
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(203,213,225,0.08)',
  },
  cardDisabled: {
    opacity: 0.5,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  practiceCardWrapper: {
    marginBottom: theme.spacing.xxxl,
  },
  practiceCard: {
    borderRadius: 16,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    height: 240,
  },
  practiceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  practiceLabelPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  practiceLabelText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  practiceFireIcon: {
    fontSize: 22,
  },
  practiceSessionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800' as const,
    marginBottom: 4,
  },
  practiceSessionDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
    marginBottom: 8,
  },
  practiceNoSession: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '500' as const,
    fontStyle: 'italic' as const,
  },
  practiceTapPrompt: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700' as const,
    marginTop: 8,
    letterSpacing: 0.2,
  },
  workoutContentContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  workoutSection: {
    flexDirection: 'row',
    gap: 8,
  },
  workoutSectionLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    width: 44,
    flexShrink: 0,
    paddingTop: 1,
  },
  workoutSectionValue: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    paddingHorizontal: theme.spacing.container,
  },
  modalContent: {
    backgroundColor: '#141c2b',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingRight: 36,
  },
  modalAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15,23,42,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  modalActionButtonActive: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
});
