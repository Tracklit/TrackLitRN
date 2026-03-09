import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import { Text } from '@/components/ui/Text';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { getScreenContentBottomPadding } from '@/utils/layoutPadding';
import theme from '@/utils/theme';
import type { RootStackParamList } from '@/navigation/types';
import { goBackOrNavigateToScreen } from '@/navigation/appNavigation';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

interface ResultItem {
  id: number;
  meetId: number;
  event: string;
  result: string;
  windSpeed?: string | number | null;
  place?: string | number | null;
  notes?: string | null;
  createdAt?: string;
  userId: number;
}

export const ResultsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';

  const resultsQuery = useQuery({
    queryKey: ['results'],
    queryFn: () => apiRequest<ResultItem[]>('/api/results'),
    enabled: isAuthenticated && !isGuest,
  });

  const items = useMemo(() => resultsQuery.data ?? [], [resultsQuery.data]);
  const handleBackPress = () => {
    goBackOrNavigateToScreen(navigation, 'Meets');
  };

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <ScrollView
        style={{ paddingTop: insets.top }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: getScreenContentBottomPadding(insets.bottom, { includeBottomNav: false, extra: theme.spacing.xl }) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleBackPress}>
            <FontAwesome5 name="arrow-left" size={18} color={theme.colors.foreground} solid />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="h3" weight="bold" color="foreground">
              Results
            </Text>
            <Text variant="small" color="muted">
              Your meet performances
            </Text>
          </View>
          <View style={styles.iconBtn} />
        </View>

        {isGuest ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            Sign in to view results.
          </Text>
        ) : resultsQuery.isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text variant="body" color="muted">
              Loading results...
            </Text>
          </View>
        ) : resultsQuery.isError ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            Unable to load results. Pull to refresh from Meets for now.
          </Text>
        ) : items.length === 0 ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            No results yet.
          </Text>
        ) : (
          <View style={styles.list}>
            {items.map((r) => (
              <Card key={r.id} style={styles.card}>
                <CardHeader style={{ paddingBottom: theme.spacing.sm }}>
                  <CardTitle>{r.event || 'Event'}</CardTitle>
                </CardHeader>
                <CardContent style={{ gap: theme.spacing.xs }}>
                  <Text variant="body" color="foreground" weight="semiBold">
                    Result: {r.result}
                  </Text>
                  {r.place !== null && r.place !== undefined && (
                    <Text variant="small" color="muted">
                      Place: {String(r.place)}
                    </Text>
                  )}
                  {r.windSpeed !== null && r.windSpeed !== undefined && (
                    <Text variant="small" color="muted">
                      Wind: {String(r.windSpeed)}
                    </Text>
                  )}
                  {!!r.notes && (
                    <Text variant="small" color="muted">
                      Notes: {r.notes}
                    </Text>
                  )}
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, justifyContent: 'center' },
  emptyText: { textAlign: 'center', paddingVertical: theme.spacing.lg },
  list: { gap: theme.spacing.md },
  card: { marginBottom: 0 },
});

