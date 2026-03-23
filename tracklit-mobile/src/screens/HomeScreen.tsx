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
  TextInput,
  KeyboardAvoidingView,
  Platform,
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
  Plus,
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
  | 'feed_post'
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
  feedPostId?: number;
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

const MONTH_ABBR_H = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const parseHomeSessionDate = (rawDate?: string | null): Date | null => {
  if (!rawDate) return null;
  const t = rawDate.trim();
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(parseInt(iso[1]), parseInt(iso[2]) - 1, parseInt(iso[3]));
  const short = t.match(/^([A-Za-z]{3})-(\d{1,2})$/);
  if (short) {
    const mon = short[1][0].toUpperCase() + short[1].slice(1).toLowerCase();
    const idx = MONTH_ABBR_H.indexOf(mon);
    if (idx >= 0) return new Date(new Date().getFullYear(), idx, parseInt(short[2]));
  }
  const d = new Date(t);
  return isNaN(d.getTime()) ? null : d;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [greeting, setGreeting] = useState('');
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [tickerModalVisible, setTickerModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<CommunityActivity | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<CarouselUserEntry | null>(null);
  const [likedActivities, setLikedActivities] = useState<Set<number>>(new Set());
  const [readActivities, setReadActivities] = useState<Set<number>>(new Set());
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerText, setComposerText] = useState('');
  const carouselRef = useRef<FlatList>(null);
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
    programSessions?.forEach((s: any) => {
      if (s.dayNumber != null) map[s.dayNumber] = s;
    });
    return map;
  }, [programSessions]);

  const sessionsByDateKey = useMemo(() => {
    const map: Record<string, any> = {};
    programSessions?.forEach((s: any) => {
      const parsed = parseHomeSessionDate(s.date);
      if (parsed) {
        const key = `${MONTH_ABBR_H[parsed.getMonth()]}-${parsed.getDate()}`;
        map[key] = s;
      }
    });
    return map;
  }, [programSessions]);

  const todaySession = useMemo(() => {
    if (!programSessions || programSessions.length === 0) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = `${MONTH_ABBR_H[today.getMonth()]}-${today.getDate()}`;
    const totalDays = Math.max(...Object.keys(sessionsByDay).map(Number), programSessions.length, 1);

    // Date-key lookup first — mirrors PracticeScreen behaviour, handles rest-day gaps
    const byDateKey = sessionsByDateKey[todayKey];
    if (byDateKey) {
      return { ...byDateKey, dayNumber: byDateKey.dayNumber ?? 1, totalDays, programId: resolvedProgramId };
    }

    // Fall back: compute day offset from program start date
    const datesFromSessions = programSessions
      .map((s: any) => parseHomeSessionDate(s.date))
      .filter(Boolean) as Date[];

    let dayNum = 1;
    if (datesFromSessions.length > 0) {
      datesFromSessions.sort((a, b) => a.getTime() - b.getTime());
      const diff = Math.round((today.getTime() - datesFromSessions[0].getTime()) / (1000 * 60 * 60 * 24)) + 1;
      dayNum = diff >= 1 && diff <= totalDays ? diff : 1;
    }

    const matched = sessionsByDay[dayNum];
    if (!matched) return null;
    return { ...matched, dayNumber: matched.dayNumber ?? dayNum, totalDays, programId: resolvedProgramId };
  }, [programSessions, sessionsByDay, sessionsByDateKey, resolvedProgramId]);

  const todayDayNumber = todaySession?.dayNumber ?? null;

  const todaySessionId = useMemo(() => {
    if (!todaySession) return { sessionId: undefined, dayNumber: undefined };
    return { sessionId: todaySession.id, dayNumber: todaySession.dayNumber };
  }, [todaySession]);

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

  const activitiesQuery = useQuery<CommunityActivity[]>({
    queryKey: ['community-activities'],
    queryFn: () => apiRequest<CommunityActivity[]>('/api/community/activities?offset=0&limit=25'),
    refetchInterval: 30000,
    retry: false,
    staleTime: 60000,
  });

  const feedPostsQuery = useQuery({
    queryKey: ['feed-home'],
    queryFn: () => apiRequest<any[]>('/api/feed?filter=all'),
    staleTime: 60000,
    retry: false,
  });

  // Fetched early so ownActivity (below) can reference it without a forward-declaration error
  const { data: journalEntriesEarly = [] } = useQuery({
    queryKey: ['journal-home'],
    queryFn: () => apiRequest<any[]>('/api/journal'),
    staleTime: 120000,
    enabled: !!userId && userId !== 'guest',
  });

  const rawActivities = activitiesQuery.data ?? [];

  // Normalize feed posts into CommunityActivity shape and merge with community activities.
  // Most recent entry per user wins so each user appears once in the carousel.
  const allActivities = useMemo<CommunityActivity[]>(() => {
    const feedPosts = (feedPostsQuery.data ?? [])
      .filter((p: any) => p.userId && p.content)
      .map((p: any): CommunityActivity => ({
        id: -(p.id + 100000),
        userId: p.userId,
        activityType: p.isJournalEntry ? 'journal_entry' : 'feed_post',
        title: String(p.content ?? '').slice(0, 80),
        description: p.content ?? '',
        createdAt: p.createdAt,
        feedPostId: p.isJournalEntry ? undefined : p.id,
        user: {
          id: p.userId,
          username: p.username || '',
          name: p.name || p.username || '',
          profileImageUrl: p.profileImageUrl,
        },
      }));
    const combined = [...rawActivities, ...feedPosts];
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    // One entry per user — first (newest) wins
    const seen = new Set<number>();
    return combined.filter((a) => {
      const uid = a.user?.id ?? a.userId;
      if (!uid || seen.has(uid)) return false;
      seen.add(uid);
      return true;
    });
  }, [rawActivities, feedPostsQuery.data]);

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
  }, [journalEntriesEarly, ownStoredAvatarUri, user, userId]);

  const carouselAvatarLookupUserIds = useMemo(() => {
    const ids: number[] = [];
    const seen = new Set<number>();

    if (
      numericUserId &&
      (
        !normalizeProfileImageUrl(ownStoredAvatarUri || (user as any)?.profileImageUrl || null) ||
        !((user as any)?.name || (user as any)?.username)
      )
    ) {
      ids.push(numericUserId);
      seen.add(numericUserId);
    }

    for (const activity of allActivities) {
      const activityUserId = activity.user?.id ?? activity.userId;
      if (!activityUserId || seen.has(activityUserId)) {
        continue;
      }

      const needsName = !activity.user?.name && !activity.user?.username;
      const needsImage = !normalizeProfileImageUrl(activity.user?.profileImageUrl);
      if (!needsName && !needsImage) {
        continue;
      }

      ids.push(activityUserId);
      seen.add(activityUserId);

      if (ids.length >= 12) {
        break;
      }
    }

    return ids;
  }, [numericUserId, ownStoredAvatarUri, allActivities, user]);

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

    for (const activity of allActivities) {
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
        activity.user.username ||
        `User ${activityUserId}`;
      const resolvedUsername =
        profile?.username?.trim() ||
        activity.user.username ||
        '';

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
  }, [carouselUserProfileByUserId, numericUserId, ownActivity, ownStoredAvatarUri, allActivities, user]);

  const PLUS_ENTRY: CarouselUserEntry = {
    key: 'carousel-new-post',
    userId: -1,
    displayName: 'Post',
    username: '',
    profileImageUrl: undefined,
    isSelf: false,
    activity: null,
  };

  const carouselData = useMemo<CarouselUserEntry[]>(
    () => [PLUS_ENTRY, ...carouselEntries],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [carouselEntries],
  );

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

  const createPostMutation = useMutation({
    mutationFn: (content: string) =>
      apiRequest('/api/feed/posts', { method: 'POST', data: { content } }),
    onSuccess: () => {
      setComposerText('');
      setIsComposerOpen(false);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['feed-home'] });
      queryClient.invalidateQueries({ queryKey: ['community-activities'] });
      // Slide carousel back to hide the "+" card
      setTimeout(() => {
        carouselRef.current?.scrollToOffset({ offset: CAROUSEL_ITEM_WIDTH, animated: true });
      }, 300);
    },
    onError: (error: Error) => {
      Alert.alert('Unable to post', error.message || 'Please try again.');
    },
  });

  const handleTickerTap = (entry: CarouselUserEntry) => {
    if (!entry.activity) return;
    setReadActivities(prev => new Set(prev).add(entry.activity!.id));
    setSelectedActivity(entry.activity);
    setSelectedEntry(entry);
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

        {/* Activity Carousel — scrolls with page */}
        {carouselEntries.length > 0 && !carouselHidden && (
          <View style={styles.carouselContainer}>
            <FlatList
              ref={carouselRef}
              data={carouselData}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.key}
              contentContainerStyle={styles.carouselContent}
              contentOffset={{ x: CAROUSEL_ITEM_WIDTH, y: 0 }}
              snapToInterval={CAROUSEL_ITEM_WIDTH}
              decelerationRate="fast"
              getItemLayout={(_, index) => ({
                length: CAROUSEL_ITEM_WIDTH,
                offset: CAROUSEL_ITEM_WIDTH * index,
                index,
              })}
              renderItem={({ item }) => {
                if (item.key === 'carousel-new-post') {
                  return (
                    <TouchableOpacity
                      style={styles.carouselItem}
                      activeOpacity={0.7}
                      onPress={() => setIsComposerOpen(true)}
                    >
                      <View style={[styles.carouselRing, styles.carouselRingRead]}>
                        <View style={[styles.carouselCircle, styles.carouselPlusCircle]}>
                          <Plus size={20} color="#FF7A00" weight="bold" />
                        </View>
                      </View>
                      <Text
                        variant="caption"
                        color="secondary"
                        numberOfLines={1}
                        style={styles.carouselUsername}
                      >
                        Post
                      </Text>
                    </TouchableOpacity>
                  );
                }

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
                      handleTickerTap(item);
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
          </View>
        )}

        {/* Practice Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleCardPress('Training')}
          style={styles.practiceCardWrapper}
        >
          <LinearGradient
            colors={['#1d1333', '#1C1F2B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.practiceCard}
          >
            {/* Header row */}
            <View style={styles.practiceCardHeader}>
              <View style={styles.practiceCardHeaderLeft}>
                <View style={styles.practiceCardIconWrap}>
                  <Image
                    source={require('../../assets/tracklit-logo.png')}
                    style={styles.practiceCardLogo}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.practiceCardLabel}>
                  {isTextBasedProgram || isUploadedProgram ? 'YOUR PROGRAM' : 'TODAY\'S SESSION'}
                </Text>
              </View>
              <CaretRight size={13} color="rgba(255,255,255,0.25)" weight="bold" />
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
                {todaySession.title && !/^Day\s*\d*\s*(Training|Session)?\s*$/i.test(todaySession.title.trim()) && (
                  <Text style={styles.practiceSessionTitle} numberOfLines={2}>
                    {todaySession.title}
                  </Text>
                )}
                <HomeWorkoutContent session={todaySession} gymData={todayGymData} />
              </>
            ) : (
              <Text style={styles.practiceNoSession}>
                No session scheduled — add a program to get started
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
          style={styles.modalOverlay}
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

            {selectedActivity && selectedEntry && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    style={styles.modalAvatar}
                    activeOpacity={selectedEntry.userId ? 0.7 : 1}
                    onPress={() => {
                      if (!selectedEntry.userId) return;
                      setTickerModalVisible(false);
                      navigation.navigate('PublicProfile', {
                        userId: selectedEntry.userId,
                        name: selectedEntry.displayName || null,
                        username: selectedEntry.username || null,
                        profileImageUrl: selectedEntry.profileImageUrl || null,
                      });
                    }}
                  >
                    {selectedEntry.profileImageUrl ? (
                      <Image
                        source={{ uri: selectedEntry.profileImageUrl }}
                        style={{ width: 36, height: 36, borderRadius: 18 }}
                      />
                    ) : (
                      (() => {
                        const ActivityIcon = getActivityIconComponent(selectedActivity.activityType);
                        return <ActivityIcon size={18} color="#e2e8f0" weight="fill" />;
                      })()
                    )}
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text variant="body" weight="bold" color="foreground">
                      {selectedEntry.displayName || selectedEntry.username || selectedActivity.title}
                    </Text>
                    {!!selectedEntry.username && (
                      <Text variant="caption" color="secondary">
                        @{selectedEntry.username} · {formatTimeAgo(selectedActivity.createdAt)}
                      </Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.modalBody}
                  activeOpacity={selectedActivity.activityType === 'feed_post' ? 0.7 : 1}
                  onPress={() => {
                    if (selectedActivity.activityType === 'feed_post') {
                      setTickerModalVisible(false);
                      (navigation as any).navigate('MainTabs', { screen: 'Feed' });
                    }
                  }}
                >
                  <Text variant="body" color="foreground" style={{ lineHeight: 22 }}>
                    {selectedActivity.description || 'No additional details available.'}
                  </Text>
                  {selectedActivity.activityType === 'feed_post' && (
                    <Text variant="caption" color="secondary" style={{ marginTop: 6 }}>
                      Tap to view post
                    </Text>
                  )}
                </TouchableOpacity>

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

                  {selectedActivity.activityType !== 'feed_post' && (
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
                  )}
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Feed post composer — opened by carousel + button */}
      <Modal
        transparent
        visible={isComposerOpen}
        animationType="slide"
        onRequestClose={() => setIsComposerOpen(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.composerBackdrop}>
            <View style={styles.composerCard}>
              <View style={styles.composerHeader}>
                <TouchableOpacity onPress={() => { setIsComposerOpen(false); setComposerText(''); }}>
                  <Text variant="body" color="secondary">Cancel</Text>
                </TouchableOpacity>
                <Text variant="body" weight="semiBold" color="foreground">New Post</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (composerText.trim().length < 5) return;
                    createPostMutation.mutate(composerText.trim());
                  }}
                  disabled={createPostMutation.isPending || composerText.trim().length < 5}
                >
                  <Text
                    variant="body"
                    weight="bold"
                    color={composerText.trim().length >= 5 ? 'primary' : 'secondary'}
                  >
                    {createPostMutation.isPending ? 'Posting...' : 'Post'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.composerInput}
                placeholder="What's on your mind?"
                placeholderTextColor={theme.colors.textMuted}
                multiline
                value={composerText}
                onChangeText={setComposerText}
                autoFocus
              />
            </View>
          </View>
        </KeyboardAvoidingView>
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
              <Image
                source={require('../../assets/tracklit-logo.png')}
                style={tsStyles.statLogo}
                resizeMode="contain"
              />
            </View>
            <View style={tsStyles.statText}>
              <RNText style={tsStyles.statValue}>{item.sessions}<RNText style={tsStyles.statTotal}>/{item.weeklyTotal}</RNText></RNText>
              <RNText style={tsStyles.statLabel}>Sessions</RNText>
            </View>
          </View>
          <View style={tsStyles.vDivider} />
          <View style={tsStyles.statCell}>
            <View style={[tsStyles.iconWrap, { backgroundColor: 'rgba(0,0,0,0.25)' }]}>
              <PencilLine size={14} color="#fff" weight="fill" />
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
            <View style={[tsStyles.iconWrap, { backgroundColor: 'rgba(0,0,0,0.25)' }]}>
              <Lightning size={14} color="#fff" weight="fill" />
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
    marginTop: 0,
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
  statLogo: {
    width: 16,
    height: 16,
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
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10,
    padding: 12,
    gap: 7,
    marginTop: 8,
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
  carouselPlusCircle: {
    backgroundColor: 'rgba(255,122,0,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,122,0,0.4)',
    borderStyle: 'dashed',
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(109,40,217,0.3)',
    padding: theme.spacing.xl,
    overflow: 'hidden',
  },
  practiceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  practiceCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  practiceCardIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: 'rgba(109,40,217,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceCardLogo: {
    width: 15,
    height: 15,
  },
  practiceCardLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
  },
  practiceSessionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 8,
    lineHeight: 21,
  },
  practiceNoSession: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontWeight: '500' as const,
    fontStyle: 'italic' as const,
  },
  practiceTapPrompt: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600' as const,
    marginTop: 4,
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
    justifyContent: 'center',
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
  composerBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  composerCard: {
    backgroundColor: '#1C1F2B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 240,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  composerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  composerInput: {
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 22,
    minHeight: 120,
    textAlignVertical: 'top',
  },
});
