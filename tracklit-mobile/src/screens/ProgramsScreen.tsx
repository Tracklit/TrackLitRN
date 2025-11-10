import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { Text } from '../components/ui/Text';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import theme from '../utils/theme';

interface Program {
  id: string;
  title: string;
  coach: string;
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  events: string[];
  price?: number;
  enrolled?: boolean;
}

export const ProgramsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'my-programs' | 'marketplace'>('my-programs');

  const myPrograms: Program[] = [
    {
      id: '1',
      title: 'Sprint Development Phase 1',
      coach: 'Coach Martinez',
      duration: '8 weeks',
      level: 'Intermediate',
      events: ['100m', '200m'],
      enrolled: true,
    },
    {
      id: '2',
      title: 'Base Building Program',
      coach: 'Coach Johnson',
      duration: '12 weeks',
      level: 'Beginner',
      events: ['800m', '1500m'],
      enrolled: true,
    },
  ];

  const marketplacePrograms: Program[] = [
    {
      id: '3',
      title: 'Elite Sprint Training',
      coach: 'Coach Williams',
      duration: '10 weeks',
      level: 'Advanced',
      events: ['100m', '200m'],
      price: 99,
    },
    {
      id: '4',
      title: 'Jumping Fundamentals',
      coach: 'Coach Davis',
      duration: '6 weeks',
      level: 'Beginner',
      events: ['Long Jump', 'Triple Jump'],
      price: 59,
    },
    {
      id: '5',
      title: 'Distance Running Mastery',
      coach: 'Coach Thompson',
      duration: '16 weeks',
      level: 'Advanced',
      events: ['5000m', '10000m'],
      price: 129,
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
            Programs
          </Text>
          <Text variant="body" color="muted">
            Training programs & marketplace
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my-programs' && styles.activeTab]}
            onPress={() => setActiveTab('my-programs')}
            data-testid="tab-my-programs"
          >
            <Text 
              variant="body" 
              weight="medium"
              style={[
                styles.tabText,
                activeTab === 'my-programs' && styles.activeTabText
              ]}
            >
              My Programs
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'marketplace' && styles.activeTab]}
            onPress={() => setActiveTab('marketplace')}
            data-testid="tab-marketplace"
          >
            <Text 
              variant="body" 
              weight="medium"
              style={[
                styles.tabText,
                activeTab === 'marketplace' && styles.activeTabText
              ]}
            >
              Marketplace
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'my-programs' ? (
          <MyProgramsTab
            programs={myPrograms}
            onBrowseMarketplace={() => setActiveTab('marketplace')}
          />
        ) : (
          <MarketplaceTab programs={marketplacePrograms} />
        )}
      </ScrollView>
    </LinearGradient>
  );
};

interface MyProgramsTabProps {
  programs: Program[];
  onBrowseMarketplace?: () => void;
}

const MyProgramsTab: React.FC<MyProgramsTabProps> = ({ programs, onBrowseMarketplace }) => {
  const getLevelColor = (level: Program['level']) => {
    switch (level) {
      case 'Beginner': return 'success';
      case 'Intermediate': return 'warning';
      case 'Advanced': return 'destructive';
      default: return 'default';
    }
  };

  if (programs.length === 0) {
    return (
      <View style={styles.emptyState}>
        <FontAwesome5 name="clipboard-list" size={48} color={theme.colors.textMuted} solid />
        <Text variant="h4" weight="semiBold" color="foreground" style={styles.emptyTitle}>
          No Programs Yet
        </Text>
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          Browse the marketplace to find training programs that match your goals.
        </Text>
        <Button
          variant="outline"
          style={styles.emptyButton}
          onPress={onBrowseMarketplace}
          data-testid="button-browse-marketplace"
        >
          Browse Marketplace
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.programsContainer}>
      {programs.map((program) => (
        <Card key={program.id} style={styles.programCard}>
          <CardHeader style={styles.programHeader}>
            <View style={styles.programTitleRow}>
              <CardTitle style={styles.programTitle}>{program.title}</CardTitle>
              <Badge variant={getLevelColor(program.level)} size="sm">
                {program.level}
              </Badge>
            </View>
            <Text variant="small" color="muted">
              by {program.coach} • {program.duration}
            </Text>
          </CardHeader>
          
          <CardContent>
            <View style={styles.eventsContainer}>
              {program.events.map((event, index) => (
                <Badge key={index} variant="outline" size="sm">
                  {event}
                </Badge>
              ))}
            </View>
            
            <View style={styles.programActions}>
              <Button 
                variant="default" 
                size="sm" 
                style={styles.actionButton}
                data-testid={`button-continue-program-${program.id}`}
              >
                Continue Program
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                data-testid={`button-view-program-${program.id}`}
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

interface MarketplaceTabProps {
  programs: Program[];
}

const MarketplaceTab: React.FC<MarketplaceTabProps> = ({ programs }) => {
  const getLevelColor = (level: Program['level']) => {
    switch (level) {
      case 'Beginner': return 'success';
      case 'Intermediate': return 'warning';
      case 'Advanced': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <View style={styles.programsContainer}>
      {programs.map((program) => (
        <Card key={program.id} style={styles.programCard}>
          <CardHeader style={styles.programHeader}>
            <View style={styles.programTitleRow}>
              <CardTitle style={styles.programTitle}>{program.title}</CardTitle>
              <Badge variant={getLevelColor(program.level)} size="sm">
                {program.level}
              </Badge>
            </View>
            <Text variant="small" color="muted">
              by {program.coach} • {program.duration}
            </Text>
          </CardHeader>
          
          <CardContent>
            <View style={styles.eventsContainer}>
              {program.events.map((event, index) => (
                <Badge key={index} variant="outline" size="sm">
                  {event}
                </Badge>
              ))}
            </View>
            
            <View style={styles.priceRow}>
              <Text variant="h3" weight="bold" color="primary">
                ${program.price}
              </Text>
              <Text variant="small" color="muted">
                one-time payment
              </Text>
            </View>
            
            <View style={styles.programActions}>
              <Button 
                variant="default" 
                size="sm" 
                style={styles.actionButton}
                data-testid={`button-purchase-program-${program.id}`}
              >
                Purchase Program
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                data-testid={`button-preview-program-${program.id}`}
              >
                Preview
              </Button>
            </View>
          </CardContent>
        </Card>
      ))}
    </View>
  );
};

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
  programsContainer: {
    gap: theme.spacing.md,
  },
  programCard: {
    marginBottom: theme.spacing.md,
  },
  programHeader: {
    paddingBottom: theme.spacing.sm,
  },
  programTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  programTitle: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  eventsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  programActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl * 2,
  },
  emptyTitle: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  emptyDescription: {
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyButton: {
    paddingHorizontal: theme.spacing.xl,
  },
});