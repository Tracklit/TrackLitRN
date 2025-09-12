import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

import { Text } from '../components/ui/Text';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import theme from '../utils/theme';

interface Meet {
  id: string;
  name: string;
  date: string;
  location: string;
  type: 'Local' | 'Regional' | 'National' | 'International';
  events: string[];
  registered?: boolean;
  weather?: {
    temp: number;
    condition: string;
    wind: string;
  };
}

export const RaceScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'calendar' | 'results'>('upcoming');

  const upcomingMeets: Meet[] = [
    {
      id: '1',
      name: 'State Championship Qualifiers',
      date: 'Dec 15, 2024',
      location: 'City Sports Complex',
      type: 'Regional',
      events: ['100m', '200m', '4x100m'],
      registered: true,
      weather: {
        temp: 22,
        condition: 'Sunny',
        wind: '5 mph tailwind',
      },
    },
    {
      id: '2',
      name: 'Winter Indoor Series #3',
      date: 'Dec 22, 2024',
      location: 'Metro Indoor Track',
      type: 'Local',
      events: ['60m', '200m'],
      registered: false,
    },
    {
      id: '3',
      name: 'New Year Invitational',
      date: 'Jan 5, 2025',
      location: 'University Stadium',
      type: 'Regional',
      events: ['100m', '200m', '400m'],
      registered: false,
    },
  ];

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h2" weight="bold" color="foreground">
            Races & Meets
          </Text>
          <Text variant="body" color="muted">
            Competition calendar & results
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <StatCard title="Next Meet" value="6" subtitle="days" />
          <StatCard title="This Season" value="3" subtitle="meets" />
          <StatCard title="PRs Set" value="2" subtitle="this year" />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
            onPress={() => setActiveTab('upcoming')}
            data-testid="tab-upcoming"
          >
            <Text 
              variant="small" 
              weight="medium"
              style={[
                styles.tabText,
                activeTab === 'upcoming' && styles.activeTabText
              ]}
            >
              Upcoming
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
            onPress={() => setActiveTab('calendar')}
            data-testid="tab-calendar"
          >
            <Text 
              variant="small" 
              weight="medium"
              style={[
                styles.tabText,
                activeTab === 'calendar' && styles.activeTabText
              ]}
            >
              Calendar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'results' && styles.activeTab]}
            onPress={() => setActiveTab('results')}
            data-testid="tab-results"
          >
            <Text 
              variant="small" 
              weight="medium"
              style={[
                styles.tabText,
                activeTab === 'results' && styles.activeTabText
              ]}
            >
              Results
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'upcoming' ? (
          <UpcomingMeetsTab meets={upcomingMeets} />
        ) : activeTab === 'calendar' ? (
          <CalendarTab />
        ) : (
          <ResultsTab />
        )}
      </ScrollView>
    </LinearGradient>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle }) => (
  <Card style={styles.statCard}>
    <CardContent style={styles.statCardContent}>
      <Text variant="small" color="muted" weight="medium">
        {title}
      </Text>
      <Text variant="h3" weight="bold" color="primary">
        {value}
      </Text>
      <Text variant="small" color="muted">
        {subtitle}
      </Text>
    </CardContent>
  </Card>
);

interface UpcomingMeetsTabProps {
  meets: Meet[];
}

const UpcomingMeetsTab: React.FC<UpcomingMeetsTabProps> = ({ meets }) => {
  const getTypeColor = (type: Meet['type']) => {
    switch (type) {
      case 'Local': return 'default';
      case 'Regional': return 'warning';
      case 'National': return 'destructive';
      case 'International': return 'success';
      default: return 'default';
    }
  };

  return (
    <View style={styles.meetsContainer}>
      {meets.map((meet) => (
        <Card key={meet.id} style={styles.meetCard}>
          <CardHeader style={styles.meetHeader}>
            <View style={styles.meetTitleRow}>
              <CardTitle style={styles.meetTitle}>{meet.name}</CardTitle>
              <Badge variant={getTypeColor(meet.type)} size="sm">
                {meet.type}
              </Badge>
            </View>
            <View style={styles.meetMeta}>
              <View style={styles.meetInfo}>
                <FontAwesome5 name="calendar" size={14} color={theme.colors.textMuted} />
                <Text variant="small" color="muted" style={styles.metaText}>
                  {meet.date}
                </Text>
              </View>
              <View style={styles.meetInfo}>
                <FontAwesome5 name="map-marker-alt" size={14} color={theme.colors.textMuted} />
                <Text variant="small" color="muted" style={styles.metaText}>
                  {meet.location}
                </Text>
              </View>
            </View>
          </CardHeader>
          
          <CardContent>
            {/* Events */}
            <View style={styles.eventsContainer}>
              {meet.events.map((event, index) => (
                <Badge key={index} variant="outline" size="sm">
                  {event}
                </Badge>
              ))}
            </View>
            
            {/* Weather (if available) */}
            {meet.weather && (
              <View style={styles.weatherContainer}>
                <Text variant="small" weight="medium" color="foreground">
                  Weather Forecast:
                </Text>
                <View style={styles.weatherDetails}>
                  <Text variant="small" color="muted">
                    {meet.weather.temp}°C • {meet.weather.condition} • {meet.weather.wind}
                  </Text>
                </View>
              </View>
            )}
            
            {/* Actions */}
            <View style={styles.meetActions}>
              {meet.registered ? (
                <Badge variant="success" size="md">
                  <FontAwesome5 name="check" size={12} color={theme.colors.destructiveForeground} />
                  <Text variant="small" weight="medium" style={styles.registeredText}>
                    Registered
                  </Text>
                </Badge>
              ) : (
                <Button 
                  variant="default" 
                  size="sm" 
                  style={styles.registerButton}
                  data-testid={`button-register-meet-${meet.id}`}
                >
                  Register
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                data-testid={`button-view-meet-${meet.id}`}
              >
                View Details
              </Button>
            </View>
          </CardContent>
        </Card>
      ))}
    </View>
  );
};

const CalendarTab: React.FC = () => (
  <View style={styles.calendarContainer}>
    <Card style={styles.calendarCard}>
      <CardHeader>
        <CardTitle>December 2024</CardTitle>
      </CardHeader>
      <CardContent>
        <Text variant="body" color="muted" style={styles.calendarText}>
          Calendar view with meet dates and training schedule coming soon.
        </Text>
        <Button variant="outline" style={styles.calendarButton}>
          <FontAwesome5 name="calendar-plus" size={16} color={theme.colors.primary} />
          <Text variant="body" weight="medium" color="primary" style={styles.calendarButtonText}>
            Add to Calendar
          </Text>
        </Button>
      </CardContent>
    </Card>
  </View>
);

const ResultsTab: React.FC = () => (
  <View style={styles.resultsContainer}>
    <Card style={styles.resultsCard}>
      <CardHeader>
        <CardTitle>Season Results</CardTitle>
      </CardHeader>
      <CardContent>
        <Text variant="body" color="muted" style={styles.resultsText}>
          Your competition results and performance history will appear here.
        </Text>
        <Text variant="small" color="muted" style={styles.noResults}>
          No results recorded yet. Start competing to track your progress!
        </Text>
      </CardContent>
    </Card>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
  },
  statCardContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.muted,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.colors.background,
  },
  tabText: {
    color: theme.colors.textMuted,
  },
  activeTabText: {
    color: theme.colors.foreground,
  },
  meetsContainer: {
    gap: theme.spacing.md,
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
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  meetTitle: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  meetMeta: {
    gap: theme.spacing.xs,
  },
  meetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  metaText: {
    marginLeft: theme.spacing.xs,
  },
  eventsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  weatherContainer: {
    marginBottom: theme.spacing.md,
  },
  weatherDetails: {
    marginTop: theme.spacing.xs,
  },
  meetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  registerButton: {
    paddingHorizontal: theme.spacing.lg,
  },
  registeredText: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.destructiveForeground,
  },
  calendarContainer: {
    gap: theme.spacing.lg,
  },
  calendarCard: {
    marginBottom: theme.spacing.lg,
  },
  calendarText: {
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  calendarButtonText: {
    marginLeft: theme.spacing.sm,
  },
  resultsContainer: {
    gap: theme.spacing.lg,
  },
  resultsCard: {
    marginBottom: theme.spacing.lg,
  },
  resultsText: {
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  noResults: {
    textAlign: 'center',
  },
});