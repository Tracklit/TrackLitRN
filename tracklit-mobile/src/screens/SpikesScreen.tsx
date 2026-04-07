import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowRight,
  CaretLeft,
  Info,
  ChartLineUp,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import type { RootStackParamList } from '@/navigation/types';
import { getScreenContentBottomPadding } from '@/utils/layoutPadding';

import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';
type Navigation = NativeStackNavigationProp<RootStackParamList>;


export const SpikesScreen: React.FC = () => {
  const { styles, theme } = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();
  const spikesBalance = Number((user as any)?.spikes ?? 0);
  const contentBottomPadding = getScreenContentBottomPadding(insets.bottom);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <CaretLeft size={18} color={theme.colors.textSecondary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Spikes</Text>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: contentBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.balanceSection}>
          <Text style={styles.balanceValue}>{spikesBalance.toLocaleString()}</Text>
          <Text style={styles.balanceLabel}>Spikes</Text>
          <Text style={styles.balanceSub}>
            Earn spikes by training, competing, and staying active.
          </Text>
        </View>

        <View style={styles.cards}>
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SpikesInfo')}
          >
            <View style={styles.cardIconWrap}>
              <Info size={22} color={theme.colors.brandOrange} weight="fill" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>What are Spikes?</Text>
              <Text style={styles.cardDesc}>
                Learn how spikes work, how to earn them, and what you can unlock.
              </Text>
            </View>
            <ArrowRight size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SpikesProgress')}
          >
            <View style={styles.cardIconWrap}>
              <ChartLineUp size={22} color={theme.colors.brandOrange} weight="fill" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>My Progress</Text>
              <Text style={styles.cardDesc}>
                View your streak, achievements, and transaction history.
              </Text>
            </View>
            <ArrowRight size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.quickStats}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {spikesBalance >= 1000 ? 'Pro' : 'Free'}
            </Text>
            <Text style={styles.statLabel}>Current Tier</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {spikesBalance >= 1000 ? '0' : `${1000 - spikesBalance}`}
            </Text>
            <Text style={styles.statLabel}>To Pro Tier</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.colors.backgroundSolid,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: t.colors.overlayLight,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: t.colors.overlaySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: t.colors.textPrimary,
    letterSpacing: 0.3,
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 28,
  },
  balanceSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 8,
  },
  balanceIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: t.colors.brandOrangeLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  balanceValue: {
    fontSize: 42,
    lineHeight: 52,
    fontWeight: '700',
    color: t.colors.textPrimary,
    letterSpacing: -1,
  },
  balanceLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: t.colors.brandOrange,
    marginTop: 6,
  },
  balanceSub: {
    fontSize: 13,
    color: t.colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 260,
    lineHeight: 18,
  },
  cards: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.colors.cardSolid,
    borderRadius: 12,
    padding: 16,
    gap: 14,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: t.colors.brandOrangeLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: t.colors.textPrimary,
  },
  cardDesc: {
    fontSize: 12,
    color: t.colors.textMuted,
    lineHeight: 17,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: t.colors.cardSolid,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: t.colors.overlayLight,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: t.colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: t.colors.textMuted,
  },
});
