import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import { Text } from '../components/ui/Text';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { RootStackParamList } from '@/navigation/types';
import theme from '../utils/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

interface Program {
  id: number | string;
  title: string;
  description?: string;
  coachName?: string;
  coachId?: number;
  duration?: string;
  durationWeeks?: number;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  difficulty?: string;
  events?: string[];
  price?: number;
  isPublic?: boolean;
  isPurchased?: boolean;
}

export const ProgramsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const [activeTab, setActiveTab] = useState<'my-programs' | 'marketplace'>('my-programs');
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;
  const isGuest = userId === 'guest';
  const contentBottomPadding = theme.layout.bottomNavHeight + insets.bottom + theme.spacing.xl;

  // Fetch user's programs
  const myProgramsQuery = useQuery({
    queryKey: ['user-programs'],
    queryFn: () => apiRequest<Program[]>('/api/programs'),
    enabled: isAuthenticated && !isGuest,
  });

  // Fetch marketplace/public programs
  const marketplaceQuery = useQuery({
    queryKey: ['marketplace-programs'],
    queryFn: () => apiRequest<Program[]>('/api/marketplace/programs/mine'),
    enabled: isAuthenticated && !isGuest,
  });

  const handleRefresh = () => {
    if (activeTab === 'my-programs') {
      myProgramsQuery.refetch();
    } else {
      marketplaceQuery.refetch();
    }
  };

  const handleContinueProgram = (program: Program) => {
    navigation.navigate('ProgramDetail', { id: program.id });
  };

  const handleViewDetails = (program: Program) => {
    navigation.navigate('ProgramDetail', { id: program.id });
  };

  const handlePurchase = (program: Program) => {
    Alert.alert(
      'Purchase Program',
      `Purchasing "${program.title}" for $${program.price || 0}. This feature will be available soon.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'View Details', 
          onPress: () => navigation.navigate('ProgramDetail', { id: program.id })
        }
      ]
    );
  };

  const isRefreshing = myProgramsQuery.isFetching || marketplaceQuery.isFetching;

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: contentBottomPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            tintColor="#fff"
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
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
            programs={myProgramsQuery.data ?? []}
            isLoading={myProgramsQuery.isLoading}
            isError={myProgramsQuery.isError}
            isGuest={isGuest}
            onBrowseMarketplace={() => setActiveTab('marketplace')}
            onContinue={handleContinueProgram}
            onViewDetails={handleViewDetails}
          />
        ) : (
          <MarketplaceTab 
            programs={marketplaceQuery.data ?? []}
            isLoading={marketplaceQuery.isLoading}
            isError={marketplaceQuery.isError}
            isGuest={isGuest}
            onPurchase={handlePurchase}
            onViewDetails={handleViewDetails}
          />
        )}
      </ScrollView>
    </LinearGradient>
  );
};

interface MyProgramsTabProps {
  programs: Program[];
  isLoading: boolean;
  isError: boolean;
  isGuest: boolean;
  onBrowseMarketplace?: () => void;
  onContinue: (program: Program) => void;
  onViewDetails: (program: Program) => void;
}

const MyProgramsTab: React.FC<MyProgramsTabProps> = ({ 
  programs, 
  isLoading, 
  isError, 
  isGuest,
  onBrowseMarketplace,
  onContinue,
  onViewDetails,
}) => {
  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'Beginner': return 'success';
      case 'Intermediate': return 'warning';
      case 'Advanced': return 'destructive';
      default: return 'default';
    }
  };

  if (isGuest) {
    return (
      <View style={styles.emptyState}>
        <FontAwesome5 name="user-lock" size={48} color={theme.colors.textMuted} solid />
        <Text variant="h4" weight="semiBold" color="foreground" style={styles.emptyTitle}>
          Sign In Required
        </Text>
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          Sign in to view your enrolled training programs.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          Loading your programs...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.emptyState}>
        <FontAwesome5 name="exclamation-circle" size={48} color={theme.colors.textMuted} solid />
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          Unable to load programs. Pull to refresh.
        </Text>
      </View>
    );
  }

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
              <Badge variant={getLevelColor(program.level || program.difficulty)} size="sm">
                {program.level || program.difficulty || 'All Levels'}
              </Badge>
            </View>
            <Text variant="small" color="muted">
              {program.coachName ? `by ${program.coachName}` : 'TrackLit Program'}
              {program.durationWeeks ? ` • ${program.durationWeeks} weeks` : program.duration ? ` • ${program.duration}` : ''}
            </Text>
          </CardHeader>
          
          <CardContent>
            {program.events && program.events.length > 0 && (
              <View style={styles.eventsContainer}>
                {program.events.map((event, index) => (
                  <Badge key={index} variant="outline" size="sm">
                    {event}
                  </Badge>
                ))}
              </View>
            )}
            
            <View style={styles.programActions}>
              <Button 
                variant="default" 
                size="sm" 
                style={styles.actionButton}
                onPress={() => onContinue(program)}
                data-testid={`button-continue-program-${program.id}`}
              >
                Continue Program
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onPress={() => onViewDetails(program)}
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
  isLoading: boolean;
  isError: boolean;
  isGuest: boolean;
  onPurchase: (program: Program) => void;
  onViewDetails: (program: Program) => void;
}

const MarketplaceTab: React.FC<MarketplaceTabProps> = ({ 
  programs, 
  isLoading, 
  isError,
  isGuest,
  onPurchase,
  onViewDetails,
}) => {
  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'Beginner': return 'success';
      case 'Intermediate': return 'warning';
      case 'Advanced': return 'destructive';
      default: return 'default';
    }
  };

  if (isGuest) {
    return (
      <View style={styles.emptyState}>
        <FontAwesome5 name="user-lock" size={48} color={theme.colors.textMuted} solid />
        <Text variant="h4" weight="semiBold" color="foreground" style={styles.emptyTitle}>
          Sign In Required
        </Text>
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          Sign in to browse and purchase training programs.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          Loading marketplace...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.emptyState}>
        <FontAwesome5 name="exclamation-circle" size={48} color={theme.colors.textMuted} solid />
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          Unable to load marketplace. Pull to refresh.
        </Text>
      </View>
    );
  }

  if (programs.length === 0) {
    return (
      <View style={styles.emptyState}>
        <FontAwesome5 name="store" size={48} color={theme.colors.textMuted} solid />
        <Text variant="h4" weight="semiBold" color="foreground" style={styles.emptyTitle}>
          No Programs Available
        </Text>
        <Text variant="body" color="muted" style={styles.emptyDescription}>
          Check back soon for new training programs!
        </Text>
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
              <Badge variant={getLevelColor(program.level || program.difficulty)} size="sm">
                {program.level || program.difficulty || 'All Levels'}
              </Badge>
            </View>
            <Text variant="small" color="muted">
              {program.coachName ? `by ${program.coachName}` : 'TrackLit Program'}
              {program.durationWeeks ? ` • ${program.durationWeeks} weeks` : program.duration ? ` • ${program.duration}` : ''}
            </Text>
          </CardHeader>
          
          <CardContent>
            {program.events && program.events.length > 0 && (
              <View style={styles.eventsContainer}>
                {program.events.map((event, index) => (
                  <Badge key={index} variant="outline" size="sm">
                    {event}
                  </Badge>
                ))}
              </View>
            )}
            
            {program.price !== undefined && program.price > 0 && (
              <View style={styles.priceRow}>
                <Text variant="h3" weight="bold" color="primary">
                  ${program.price}
                </Text>
                <Text variant="small" color="muted">
                  one-time payment
                </Text>
              </View>
            )}
            
            <View style={styles.programActions}>
              <Button 
                variant="default" 
                size="sm" 
                style={styles.actionButton}
                onPress={() => onPurchase(program)}
                data-testid={`button-purchase-program-${program.id}`}
              >
                {program.price ? 'Purchase Program' : 'Enroll Free'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onPress={() => onViewDetails(program)}
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
