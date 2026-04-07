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

import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';
type Navigation = NativeStackNavigationProp<RootStackParamList>;


const TIERS: SubscriptionTier[] = ['free', 'pro', 'elite'];

const TierIcon: React.FC<{ tier: SubscriptionTier; size?: number }> = ({ tier, size = 20 }) => {
  const { styles, theme } = useThemedStyles(createStyles);
  if (tier === 'elite') return <Crown size={size} color={theme.colors.deepGold} weight="fill" />;
  if (tier === 'pro') return <Star size={size} color={theme.colors.brandOrange} weight="fill" />;
  return <CheckCircle size={size} color={theme.colors.textMuted} weight="fill" />;
};

export const AppTierScreen: React.FC = () => {
  const { styles, theme } = useThemedStyles(createStyles);
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
          <CaretLeft size={18} color={theme.colors.textSecondary} weight="bold" />
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
                      color={tier === 'elite' ? theme.colors.deepGold : tier === 'pro' ? theme.colors.brandOrange : theme.colors.success}
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

const createStyles = (t: ThemeValues) => StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.backgroundSolid },
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
  content: {
    padding: 16,
    gap: 14,
  },
  subtitle: {
    fontSize: 13,
    color: t.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  tierCard: {
    backgroundColor: t.colors.cardSolid,
    borderRadius: 14,
    padding: 18,
    gap: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  tierCardActive: {
    borderColor: t.colors.brandOrange,
    backgroundColor: t.colors.cardSolid,
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
    color: t.colors.textPrimary,
  },
  tierNamePro: {
    color: t.colors.brandOrange,
  },
  tierNameElite: {
    color: t.colors.deepGold,
  },
  currentBadge: {
    backgroundColor: t.colors.brandOrangeLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,122,0,0.3)',
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: t.colors.brandOrange,
    letterSpacing: 0.3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: t.colors.textSecondary,
  },
  priceSep: {
    fontSize: 14,
    color: t.colors.textMuted,
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
    color: t.colors.textSecondary,
    flex: 1,
  },
  upgradeButton: {
    backgroundColor: t.colors.brandOrange,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  upgradeButtonElite: {
    backgroundColor: t.colors.deepGold,
  },
  upgradeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  manageButton: {
    backgroundColor: t.colors.brandOrangeLight,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,122,0,0.3)',
  },
  manageButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: t.colors.brandOrange,
  },
  disclaimer: {
    fontSize: 11,
    color: t.colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
});
