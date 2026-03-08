import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Lightning,
  Trophy,
  ArrowRight,
  CaretLeft,
  Info,
  ChartLineUp,
  List,
} from 'phosphor-react-native';
import { ScreenTabBar } from '@/components/ScreenTabBar';

import { Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import type { RootStackParamList } from '@/navigation/types';
import { getScreenContentBottomPadding } from '@/utils/layoutPadding';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const C = {
  bg: '#0E0F14',
  orange: '#FF7A00',
  card: '#1C1F2B',
  border: 'rgba(255,255,255,0.06)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.5)',
  iconBg: 'rgba(255,255,255,0.05)',
};

export const SpikesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();
  const spikesBalance = Number((user as any)?.spikes ?? 0);
  const contentBottomPadding = getScreenContentBottomPadding(insets.bottom);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <CaretLeft size={18} color={C.textSecondary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Spikes</Text>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <List size={20} color="rgba(255,255,255,0.7)" weight="bold" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: contentBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.balanceSection}>
          <View style={styles.balanceIconWrap}>
            <Lightning size={28} color={C.orange} weight="fill" />
          </View>
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
              <Info size={22} color={C.orange} weight="fill" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>What are Spikes?</Text>
              <Text style={styles.cardDesc}>
                Learn how spikes work, how to earn them, and what you can unlock.
              </Text>
            </View>
            <ArrowRight size={18} color={C.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SpikesProgress')}
          >
            <View style={styles.cardIconWrap}>
              <ChartLineUp size={22} color={C.orange} weight="fill" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>My Progress</Text>
              <Text style={styles.cardDesc}>
                View your streak, achievements, and transaction history.
              </Text>
            </View>
            <ArrowRight size={18} color={C.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.quickStats}>
          <View style={styles.statBox}>
            <Trophy size={16} color={C.orange} weight="fill" />
            <Text style={styles.statValue}>
              {spikesBalance >= 1000 ? 'Pro' : 'Free'}
            </Text>
            <Text style={styles.statLabel}>Current Tier</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Lightning size={16} color={C.orange} weight="fill" />
            <Text style={styles.statValue}>
              {spikesBalance >= 1000 ? '0' : `${1000 - spikesBalance}`}
            </Text>
            <Text style={styles.statLabel}>To Pro Tier</Text>
          </View>
        </View>
      </ScrollView>
      <ScreenTabBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
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
    gap: 4,
  },
  balanceIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,122,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  balanceValue: {
    fontSize: 42,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: -1,
  },
  balanceLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: C.orange,
    marginTop: 2,
  },
  balanceSub: {
    fontSize: 13,
    color: C.textMuted,
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
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 16,
    gap: 14,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,122,0,0.1)',
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
    color: C.textPrimary,
  },
  cardDesc: {
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 17,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: C.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: C.textMuted,
  },
});
