import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  CaretLeft,
  CheckCircle,
  Star,
  Crown,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import type { RootStackParamList } from '@/navigation/types';
import {
  TIER_DISPLAY_NAMES,
  TIER_PRICES,
  TIER_ENTITLEMENT_LABELS,
  resolveUserTier,
  type SubscriptionTier,
} from '@/constants/tierEntitlements';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const C = {
  bg: '#0E0F14',
  card: '#1C1F2B',
  cardHighlight: '#1E2235',
  orange: '#FF7A00',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.4)',
  border: 'rgba(255,255,255,0.06)',
  borderHighlight: '#FF7A00',
  iconBg: 'rgba(255,255,255,0.05)',
  green: '#22c55e',
  gold: '#FBBF24',
};

const TIERS: SubscriptionTier[] = ['free', 'pro', 'elite'];

const TierIcon: React.FC<{ tier: SubscriptionTier; size?: number }> = ({ tier, size = 20 }) => {
  if (tier === 'elite') return <Crown size={size} color={C.gold} weight="fill" />;
  if (tier === 'pro') return <Star size={size} color={C.orange} weight="fill" />;
  return <CheckCircle size={size} color={C.textMuted} weight="fill" />;
};

export const AppTierScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();

  const currentTier = resolveUserTier((user as any)?.subscriptionTier);

  const handleUpgrade = (_tier: SubscriptionTier) => {
    Linking.openURL('https://tracklit.app/upgrade').catch(() => {});
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <CaretLeft size={18} color={C.textSecondary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Plan</Text>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Choose the plan that fits your training journey.
        </Text>

        {TIERS.map((tier) => {
          const isCurrent = tier === currentTier;
          const prices = TIER_PRICES[tier];
          const labels = TIER_ENTITLEMENT_LABELS[tier];
          const displayName = TIER_DISPLAY_NAMES[tier];
          const isPaid = tier === 'pro' || tier === 'elite';

          return (
            <View
              key={tier}
              style={[
                styles.tierCard,
                isCurrent && styles.tierCardActive,
              ]}
            >
              <View style={styles.tierHeader}>
                <View style={styles.tierTitleRow}>
                  <TierIcon tier={tier} size={20} />
                  <Text style={[styles.tierName, tier === 'elite' && styles.tierNameElite, tier === 'pro' && styles.tierNamePro]}>
                    {displayName}
                  </Text>
                </View>

                {isCurrent && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current Plan</Text>
                  </View>
                )}
              </View>

              {isPaid && (
                <View style={styles.priceRow}>
                  {prices.weekly && (
                    <Text style={styles.priceText}>{prices.weekly}</Text>
                  )}
                  {prices.weekly && prices.monthly && (
                    <Text style={styles.priceSep}> · </Text>
                  )}
                  {prices.monthly && (
                    <Text style={styles.priceText}>{prices.monthly}</Text>
                  )}
                </View>
              )}

              <View style={styles.entitlementList}>
                {labels.map((label) => (
                  <View key={label} style={styles.entitlementRow}>
                    <CheckCircle
                      size={13}
                      color={tier === 'elite' ? C.gold : tier === 'pro' ? C.orange : C.green}
                      weight="fill"
                    />
                    <Text style={styles.entitlementText}>{label}</Text>
                  </View>
                ))}
              </View>

              {isPaid && !isCurrent && (
                <TouchableOpacity
                  style={[
                    styles.upgradeButton,
                    tier === 'elite' && styles.upgradeButtonElite,
                  ]}
                  onPress={() => handleUpgrade(tier)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.upgradeButtonText}>
                    Upgrade to {displayName}
                  </Text>
                </TouchableOpacity>
              )}

              {isPaid && isCurrent && (
                <TouchableOpacity
                  style={styles.manageButton}
                  onPress={() => Linking.openURL('https://tracklit.app/account').catch(() => {})}
                  activeOpacity={0.7}
                >
                  <Text style={styles.manageButtonText}>Manage Subscription</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        <Text style={styles.disclaimer}>
          Upgrade buttons link to external payment flow. Payment integration coming soon.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
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
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    letterSpacing: 0.3,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  subtitle: {
    fontSize: 13,
    color: C.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  tierCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 18,
    gap: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  tierCardActive: {
    borderColor: C.orange,
    backgroundColor: C.cardHighlight,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tierTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tierName: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
  },
  tierNamePro: {
    color: C.orange,
  },
  tierNameElite: {
    color: C.gold,
  },
  currentBadge: {
    backgroundColor: 'rgba(255,122,0,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,122,0,0.3)',
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.orange,
    letterSpacing: 0.3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textSecondary,
  },
  priceSep: {
    fontSize: 14,
    color: C.textMuted,
  },
  entitlementList: {
    gap: 8,
  },
  entitlementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entitlementText: {
    fontSize: 13,
    color: C.textSecondary,
    flex: 1,
  },
  upgradeButton: {
    backgroundColor: C.orange,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  upgradeButtonElite: {
    backgroundColor: C.gold,
  },
  upgradeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  manageButton: {
    backgroundColor: 'rgba(255,122,0,0.1)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,122,0,0.3)',
  },
  manageButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.orange,
  },
  disclaimer: {
    fontSize: 11,
    color: C.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
});
