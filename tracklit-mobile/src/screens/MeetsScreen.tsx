import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';

import { Text } from '../components/ui/Text';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { RootStackParamList } from '@/navigation/types';
import theme from '../utils/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

interface Meet {
  id: number;
  name: string;
  location?: string;
  address?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isPublic?: boolean;
  createdBy?: number;
  events?: string[];
}

type MeetFilter = 'upcoming' | 'past' | 'all';

export const MeetsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';
  const [filter, setFilter] = useState<MeetFilter>('upcoming');
  const contentBottomPadding = theme.layout.bottomNavHeight + insets.bottom + theme.spacing.xl;

  // Fetch meets
  const meetsQuery = useQuery({
    queryKey: ['meets'],
    queryFn: () => apiRequest<Meet[]>('/api/meets'),
    enabled: isAuthenticated && !isGuest,
  });

  const meets = meetsQuery.data ?? [];
  const today = startOfDay(new Date());

  // Filter meets based on selected filter
  const filteredMeets = meets.filter(meet => {
    const meetDate = startOfDay(parseISO(meet.startDate));
    
    switch (filter) {
      case 'upcoming':
        return isAfter(meetDate, today) || meetDate.getTime() === today.getTime();
      case 'past':
        return isBefore(meetDate, today);
      case 'all':
      default:
        return true;
    }
  });

  // Sort meets
  const sortedMeets = [...filteredMeets].sort((a, b) => {
    const dateA = parseISO(a.startDate);
    const dateB = parseISO(b.startDate);
    
    if (filter === 'past') {
      return dateB.getTime() - dateA.getTime(); // Most recent first for past
    }
    return dateA.getTime() - dateB.getTime(); // Soonest first for upcoming
  });

  const formatMeetDate = (startDate: string, endDate?: string) => {
    const start = parseISO(startDate);
    const formattedStart = format(start, 'MMM d, yyyy');
    
    if (endDate) {
      const end = parseISO(endDate);
      if (format(start, 'MMM yyyy') === format(end, 'MMM yyyy')) {
        return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
      }
      return `${formattedStart} - ${format(end, 'MMM d, yyyy')}`;
    }
    
    return formattedStart;
  };

  const getDaysUntil = (dateString: string) => {
    const meetDate = startOfDay(parseISO(dateString));
    const diffTime = meetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays <= 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
    return format(parseISO(dateString), 'MMM d');
  };

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={20} color={theme.colors.foreground} />
        </TouchableOpacity>
        <Text variant="h3" weight="bold" color="foreground">
          Competitions
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <View style={styles.filterTabs}>
          {(['upcoming', 'past', 'all'] as MeetFilter[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text
                variant="body"
                weight={filter === f ? 'semiBold' : 'regular'}
                color={filter === f ? 'foreground' : 'muted'}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: contentBottomPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            tintColor="#fff"
            refreshing={meetsQuery.isFetching}
            onRefresh={() => meetsQuery.refetch()}
          />
        }
      >
        {isGuest ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="user-lock" size={48} color={theme.colors.textMuted} solid />
            <Text variant="h4" weight="semiBold" color="foreground" style={styles.emptyTitle}>
              Sign In Required
            </Text>
            <Text variant="body" color="muted" style={styles.emptyText}>
              Sign in to view your competition calendar.
            </Text>
          </View>
        ) : meetsQuery.isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text variant="body" color="muted" style={styles.emptyText}>
              Loading competitions...
            </Text>
          </View>
        ) : meetsQuery.isError ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="exclamation-circle" size={48} color={theme.colors.textMuted} solid />
            <Text variant="body" color="muted" style={styles.emptyText}>
              Unable to load competitions. Pull to refresh.
            </Text>
          </View>
        ) : sortedMeets.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="calendar-alt" size={48} color={theme.colors.textMuted} solid />
            <Text variant="h4" weight="semiBold" color="foreground" style={styles.emptyTitle}>
              No {filter === 'all' ? '' : filter + ' '}competitions
            </Text>
            <Text variant="body" color="muted" style={styles.emptyText}>
              {filter === 'upcoming'
                ? 'You don\'t have any upcoming meets scheduled.'
                : filter === 'past'
                ? 'No past competitions found.'
                : 'No competitions found.'}
            </Text>
          </View>
        ) : (
          sortedMeets.map((meet) => (
            <Card key={meet.id} style={styles.meetCard}>
              <CardHeader style={styles.meetHeader}>
                <View style={styles.meetTitleRow}>
                  <CardTitle style={styles.meetTitle}>{meet.name}</CardTitle>
                  <Badge 
                    variant={filter === 'past' ? 'secondary' : 'default'} 
                    size="sm"
                  >
                    {getDaysUntil(meet.startDate)}
                  </Badge>
                </View>
              </CardHeader>
              
              <CardContent>
                {/* Date */}
                <View style={styles.meetInfoRow}>
                  <FontAwesome5 name="calendar" size={14} color={theme.colors.primary} solid />
                  <Text variant="body" color="foreground" style={styles.meetInfoText}>
                    {formatMeetDate(meet.startDate, meet.endDate)}
                  </Text>
                </View>

                {/* Location */}
                {(meet.location || meet.address) && (
                  <View style={styles.meetInfoRow}>
                    <FontAwesome5 name="map-marker-alt" size={14} color={theme.colors.primary} solid />
                    <Text variant="body" color="muted" style={styles.meetInfoText}>
                      {meet.location || meet.address}
                    </Text>
                  </View>
                )}

                {/* Description */}
                {meet.description && (
                  <Text variant="small" color="muted" style={styles.meetDescription}>
                    {meet.description}
                  </Text>
                )}

                {/* Events */}
                {meet.events && meet.events.length > 0 && (
                  <View style={styles.eventsContainer}>
                    {meet.events.slice(0, 4).map((event, index) => (
                      <Badge key={index} variant="outline" size="sm">
                        {event}
                      </Badge>
                    ))}
                    {meet.events.length > 4 && (
                      <Badge variant="outline" size="sm">
                        +{meet.events.length - 4} more
                      </Badge>
                    )}
                  </View>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  headerSpacer: {
    flex: 1,
  },
  filterContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.muted,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xs,
  },
  filterTab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  filterTabActive: {
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyTitle: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  meetCard: {
    marginBottom: theme.spacing.md,
  },
  meetHeader: {
    paddingBottom: theme.spacing.sm,
  },
  meetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  meetTitle: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  meetInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  meetInfoText: {
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  meetDescription: {
    marginTop: theme.spacing.sm,
    lineHeight: 20,
  },
  eventsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
});

