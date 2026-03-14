import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  CaretLeft,
  Lightning,
  Trophy,
  Timer,
  UsersThree,
  CalendarCheck,
  Medal,
  Target,
  Crown,
  Star,
} from 'phosphor-react-native';
import { LinearGradient } from '@/components/LinearGradient';

import { Text } from '@/components/ui/Text';
import theme from '@/utils/theme';

const C = {
  orange: '#FF7A00',
  card: '#1C1F2B',
  textMuted: 'rgba(255,255,255,0.5)',
  border: 'rgba(255,255,255,0.06)',
};

interface EarnMethod {
  icon: React.ReactNode;
  title: string;
  description: string;
  amount: string;
}

const EARN_METHODS: EarnMethod[] = [
  {
    icon: <Trophy size={18} color={C.orange} weight="fill" />,
    title: 'Compete in Meets',
    description: 'Earn spikes every time you race or compete in a track event.',
    amount: '20–100',
  },
  {
    icon: <Timer size={18} color={C.orange} weight="fill" />,
    title: 'Complete Training',
    description: 'Log and finish a practice session to earn spikes.',
    amount: '10–30',
  },
  {
    icon: <CalendarCheck size={18} color={C.orange} weight="fill" />,
    title: 'Daily Login',
    description: 'Open the app each day. Consecutive days earn bonus spikes.',
    amount: '5–15',
  },
  {
    icon: <UsersThree size={18} color={C.orange} weight="fill" />,
    title: 'Group Participation',
    description: 'Engage with your training groups and community.',
    amount: '5',
  },
  {
    icon: <Target size={18} color={C.orange} weight="fill" />,
    title: 'Personal Records',
    description: 'Set a new PR in any event to earn a big spike bonus.',
    amount: '50',
  },
  {
    icon: <Medal size={18} color={C.orange} weight="fill" />,
    title: 'Achievements',
    description: 'Unlock milestones and badges as you progress.',
    amount: 'Varies',
  },
];

interface Tier {
  icon: React.ReactNode;
  name: string;
  cost: string;
  perks: string[];
}

const TIERS: Tier[] = [
  {
    icon: <Crown size={20} color={C.orange} weight="fill" />,
    name: 'Pro Tier',
    cost: '1,000 Spikes',
    perks: [
      'Advanced performance analytics',
      'Custom workout plan generator',
      'Priority support',
      'Extended data history',
    ],
  },
  {
    icon: <Star size={20} color={C.orange} weight="fill" />,
    name: 'Star Tier',
    cost: '2,500 Spikes',
    perks: [
      'Everything in Pro',
      'AI-powered coaching insights',
      'Personalised nutrition guidance',
      'Early access to new features',
    ],
  },
];

export const SpikesInfoScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <CaretLeft size={22} color="#fff" weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>What are Spikes?</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introSection}>
          <View style={styles.introIconWrap}>
            <Lightning size={24} color={C.orange} weight="fill" />
          </View>
          <Text style={styles.introText}>
            Spikes are Tracklit's in-app currency. You earn them automatically
            by training, competing, logging in daily, and hitting milestones.
            Use them to unlock premium tiers and exclusive features.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>How to Earn</Text>
        <View style={styles.earnList}>
          {EARN_METHODS.map((method, i) => (
            <View key={i} style={styles.earnRow}>
              <View style={styles.earnIcon}>{method.icon}</View>
              <View style={styles.earnContent}>
                <Text style={styles.earnTitle}>{method.title}</Text>
                <Text style={styles.earnDesc}>{method.description}</Text>
              </View>
              <View style={styles.earnBadge}>
                <Text style={styles.earnAmount}>{method.amount}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Unlock Tiers</Text>
        {TIERS.map((tier, i) => (
          <View key={i} style={styles.tierCard}>
            <View style={styles.tierHeader}>
              {tier.icon}
              <Text style={styles.tierName}>{tier.name}</Text>
              <Text style={styles.tierCost}>{tier.cost}</Text>
            </View>
            <View style={styles.tierPerks}>
              {tier.perks.map((perk, j) => (
                <View key={j} style={styles.perkRow}>
                  <View style={styles.perkDot} />
                  <Text style={styles.perkText}>{perk}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={{ height: insets.bottom + 20 }} />
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 20,
  },
  introSection: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  introIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,122,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  introText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.7)',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 4,
  },
  earnList: {
    backgroundColor: C.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  earnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  earnIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,122,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earnContent: {
    flex: 1,
    gap: 2,
  },
  earnTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  earnDesc: {
    fontSize: 11,
    color: C.textMuted,
    lineHeight: 15,
  },
  earnBadge: {
    backgroundColor: 'rgba(255,122,0,0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  earnAmount: {
    fontSize: 11,
    fontWeight: '700',
    color: C.orange,
  },
  tierCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  tierCost: {
    fontSize: 12,
    fontWeight: '700',
    color: C.orange,
  },
  tierPerks: {
    gap: 8,
    paddingLeft: 4,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  perkDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.orange,
  },
  perkText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 17,
  },
});
