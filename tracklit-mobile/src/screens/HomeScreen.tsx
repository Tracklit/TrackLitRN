import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Text } from '../components/ui/Text';
import Icon from '@expo/vector-icons/FontAwesome5';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { getScreenContentBottomPadding } from '@/utils/layoutPadding';
import theme from '../utils/theme';

interface DashboardCard {
  title: string;
  subtitle: string;
  iconName: string;
  backgroundImage?: any;
  route: string;
  gradient: string[];
}

// Dashboard cards - exact replica from web app
const dashboardCards: DashboardCard[] = [
  {
    title: 'Practice',
    subtitle: 'Log your daily workouts',
    iconName: 'calendar-alt',
    route: 'Practice',
    gradient: ['rgba(74, 20, 140, 0.8)', 'rgba(123, 31, 162, 0.6)'],
  },
  {
    title: 'Programs',
    subtitle: 'Training programs & schedules',
    iconName: 'book',
    route: 'Programs', 
    gradient: ['rgba(26, 26, 46, 0.8)', 'rgba(22, 33, 62, 0.6)'],
  },
  {
    title: 'Sprinthia AI',
    subtitle: 'Your AI athletics coach',
    iconName: 'robot',
    route: 'Sprinthia',
    gradient: ['rgba(245, 196, 66, 0.8)', 'rgba(204, 153, 51, 0.6)'],
  },
  {
    title: 'Feed',
    subtitle: 'See what your community is doing',
    iconName: 'newspaper',
    route: 'Feed',
    gradient: ['rgba(74, 20, 140, 0.8)', 'rgba(123, 31, 162, 0.6)'],
  },
  {
    title: 'Tools',
    subtitle: 'Training utilities & calculators',
    iconName: 'tools',
    route: 'Tools',
    gradient: ['rgba(26, 26, 46, 0.8)', 'rgba(22, 33, 62, 0.6)'],
  },
];

interface DashboardCardProps {
  card: DashboardCard;
  onPress: () => void;
}

interface HomeScreenProps {
  onNavigate?: (route: string) => void;
}

interface UserProgram {
  id: number;
  title: string;
}

interface Meet {
  id: number;
  name: string;
}

const DashboardCardComponent: React.FC<DashboardCardProps> = ({ card, onPress }) => (
  <Card
    style={styles.dashboardCard}
    onPress={onPress}
  >
    <LinearGradient
      colors={card.gradient}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 1}}
      style={styles.cardGradient}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <Icon
            name={card.iconName}
            size={theme.iconSizes.lg}
            color={theme.colors.primary}
            solid
          />
        </View>
        <View style={styles.cardTextContainer}>
          <Text variant="h4" weight="bold" color="primary">
            {card.title}
          </Text>
          <Text variant="caption" color="secondary" style={styles.cardSubtitle}>
            {card.subtitle}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Icon
          name="chevron-right"
          size={theme.iconSizes.sm}
          color={theme.colors.primary}
          solid
        />
      </View>
    </LinearGradient>
  </Card>
);

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const insets = useSafeAreaInsets();
  const [greeting, setGreeting] = useState('');
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;
  const isGuest = userId === 'guest';

  // Fetch user programs count
  const programsQuery = useQuery({
    queryKey: ['user-programs'],
    queryFn: () => apiRequest<UserProgram[]>('/api/programs'),
    enabled: isAuthenticated && !isGuest,
  });

  // Fetch meets count
  const meetsQuery = useQuery({
    queryKey: ['meets'],
    queryFn: () => apiRequest<Meet[]>('/api/meets'),
    enabled: isAuthenticated && !isGuest,
  });

  // Fetch saved workouts count
  const practiceQuery = useQuery({
    queryKey: ['workout-library'],
    queryFn: async () => {
      const response = await apiRequest<{ workouts: any[]; totalSaved: number }>('/api/workout-library');
      return response.workouts ?? [];
    },
    enabled: isAuthenticated && !isGuest,
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const handleCardPress = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    }
  };

  // Calculate stats
  const workoutsCount = practiceQuery.data?.length ?? 0;
  const programsCount = programsQuery.data?.length ?? 0;
  const meetsCount = meetsQuery.data?.length ?? 0;
  const isLoadingStats = programsQuery.isLoading || meetsQuery.isLoading || practiceQuery.isLoading;

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
      
      <ScrollView
        style={[styles.scrollView, { paddingTop: insets.top }]}
        contentContainerStyle={[
          styles.contentContainer,
          // Home has tall tiles; give it a bit more breathing room so the last tile is never clipped
          { paddingBottom: getScreenContentBottomPadding(insets.bottom, { includeBottomNav: true, extra: theme.spacing.xxxxl }) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title={`${greeting}${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
          subtitle="Ready to train today?"
          right={
            <>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => onNavigate?.('Notifications')}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
              >
                <Icon name="bell" size={18} color={theme.colors.primary} solid />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerActionButton}
                onPress={() => onNavigate?.('Chat')}
                accessibilityRole="button"
                accessibilityLabel="Messages"
              >
                <Icon name="comments" size={18} color={theme.colors.primary} solid />
              </TouchableOpacity>
            </>
          }
          containerStyle={styles.header}
        />

        {/* Stats Cards Row */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard} gradient={true}>
            <View style={styles.statContent}>
              {isLoadingStats ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text variant="h3" weight="bold" color="accent">
                  {workoutsCount}
                </Text>
              )}
              <Text variant="caption" color="secondary">
                Workouts
              </Text>
            </View>
          </Card>
          
          <Card style={styles.statCard} gradient={true}>
            <View style={styles.statContent}>
              {isLoadingStats ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text variant="h3" weight="bold" color="accent">
                  {programsCount}
                </Text>
              )}
              <Text variant="caption" color="secondary">
                Programs
              </Text>
            </View>
          </Card>
          
          <Card style={styles.statCard} gradient={true}>
            <View style={styles.statContent}>
              {isLoadingStats ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text variant="h3" weight="bold" color="accent">
                  {meetsCount}
                </Text>
              )}
              <Text variant="caption" color="secondary">
                Meets
              </Text>
            </View>
          </Card>
        </View>

        {/* Dashboard Cards */}
        <View style={styles.cardsContainer}>
          {dashboardCards.map((card) => (
            <DashboardCardComponent
              key={card.route}
              card={card}
              onPress={() => handleCardPress(card.route)}
            />
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

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
  header: {
    paddingVertical: theme.spacing.xxl,
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
    gap: theme.spacing.lg,
  },
  dashboardCard: {
    marginBottom: 0,
    minHeight: 100,
    padding: 0,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  cardGradient: {
    flex: 1,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(245, 196, 66, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.lg,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardSubtitle: {
    marginTop: theme.spacing.xs,
  },
  cardFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
  },
  headerActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
