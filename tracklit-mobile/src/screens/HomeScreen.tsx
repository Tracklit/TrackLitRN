import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ImageBackground,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Text } from '../components/ui/Text';
import Icon from '@expo/vector-icons/FontAwesome5';
import theme from '../utils/theme';

const { width: screenWidth } = Dimensions.get('window');

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
    title: 'Race',
    subtitle: 'Upcoming meets & competitions',
    iconName: 'trophy',
    route: 'Race',
    gradient: ['rgba(74, 20, 140, 0.8)', 'rgba(123, 31, 162, 0.6)'],
  },
  {
    title: 'Tools',
    subtitle: 'Training utilities & calculators',
    iconName: 'tools',
    route: 'Tools',
    gradient: ['rgba(26, 26, 46, 0.8)', 'rgba(22, 33, 62, 0.6)'],
  },
  {
    title: 'Sprinthia',
    subtitle: 'AI-powered coaching assistant',
    iconName: 'robot',
    route: 'Sprinthia',
    gradient: ['rgba(74, 20, 140, 0.8)', 'rgba(123, 31, 162, 0.6)'],
  },
];

interface DashboardCardProps {
  card: DashboardCard;
  onPress: () => void;
}

interface HomeScreenProps {
  onNavigate?: (route: string) => void;
}

const DashboardCardComponent: React.FC<DashboardCardProps> = ({ card, onPress }) => (
  <Card
    style={styles.dashboardCard}
    onPress={onPress}
    gradient={true}
    opacity={0.85}
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
          { paddingBottom: theme.layout.bottomNavHeight + insets.bottom + theme.spacing.xl }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text variant="h2" weight="bold" color="primary">
              {greeting}
            </Text>
            <Text variant="body" color="secondary">
              Ready to train today?
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => {
              Alert.alert('Coming Soon', 'Profile screen is under development.');
            }}
            data-testid="button-profile"
          >
            <Icon
              name="user-circle"
              size={theme.iconSizes.xl}
              color={theme.colors.primary}
              solid
            />
          </TouchableOpacity>
        </View>

        {/* Stats Cards Row */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard} gradient={true}>
            <View style={styles.statContent}>
              <Text variant="h3" weight="bold" color="accent">
                24
              </Text>
              <Text variant="caption" color="secondary">
                Workouts
              </Text>
            </View>
          </Card>
          
          <Card style={styles.statCard} gradient={true}>
            <View style={styles.statContent}>
              <Text variant="h3" weight="bold" color="accent">
                8
              </Text>
              <Text variant="caption" color="secondary">
                Programs
              </Text>
            </View>
          </Card>
          
          <Card style={styles.statCard} gradient={true}>
            <View style={styles.statContent}>
              <Text variant="h3" weight="bold" color="accent">
                3
              </Text>
              <Text variant="caption" color="secondary">
                Meets
              </Text>
            </View>
          </Card>
        </View>

        {/* Dashboard Cards */}
        <View style={styles.cardsContainer}>
          {dashboardCards.map((card, index) => (
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  headerLeft: {
    flex: 1,
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
    flex: 1,
  },
  dashboardCard: {
    marginBottom: theme.spacing.xl,
    minHeight: 100,
    padding: 0,
    overflow: 'hidden',
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
});