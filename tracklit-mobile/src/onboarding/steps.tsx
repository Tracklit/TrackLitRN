import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Sparkle,
  Info,
  CurrencyDollar,
} from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import theme from '@/utils/theme';

export type OnboardingStep = {
  id: string;
  mode: 'intro' | 'tour';
  title: string;
  body: React.ReactNode;
  icon?: React.ReactNode;
  onEnter?: (navRef: any) => void;
  primaryCtaLabel?: string;
  showClaimSpikes?: boolean;
};

const styles = StyleSheet.create({
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  bulletGlyph: {
    marginTop: 2,
    width: 14,
    textAlign: 'center',
  },
  bulletText: {
    flex: 1,
  },
  panel: {
    padding: theme.spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  panelAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderColor: 'rgba(245, 158, 11, 0.12)',
  },
});

const BulletRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.bulletRow}>
    <Text variant="body" color="muted" style={styles.bulletGlyph}>
      •
    </Text>
    <Text variant="body" color="muted" style={styles.bulletText}>
      {children}
    </Text>
  </View>
);


export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    mode: 'intro',
    title: 'Welcome to TrackLit',
    icon: <Sparkle size={28} color={theme.colors.primary} weight="fill" />,
    body: (
      <View style={{ gap: theme.spacing.md }}>
        <Text variant="body" color="muted" center>
          Your complete track and field training companion.
        </Text>
        <Text variant="body" color="muted" center>
          TrackLit helps you track workouts, manage programs, and analyze performance to reach your
          athletic potential.
        </Text>
      </View>
    ),
  },
  {
    id: 'alpha-info',
    mode: 'intro',
    title: 'Alpha Testing Information',
    icon: <Info size={28} color={theme.colors.primary} weight="fill" />,
    body: (
      <View style={{ gap: theme.spacing.md }}>
        <Text variant="body" color="muted" center>
          Welcome to the TrackLit alpha test. This app is still in development and not finalized
          yet.
        </Text>
        <View style={styles.panel}>
          <Text variant="caption" weight="medium" color="foreground" style={{ marginBottom: theme.spacing.sm }}>
            What to expect during alpha testing:
          </Text>
          <View style={{ gap: theme.spacing.sm }}>
            <BulletRow>Some features may be incomplete or change during development.</BulletRow>
            <BulletRow>You might encounter occasional bugs or performance issues.</BulletRow>
            <BulletRow>Your feedback is extremely valuable to us at this stage.</BulletRow>
          </View>
        </View>
      </View>
    ),
  },
  {
    id: 'spikes',
    mode: 'intro',
    title: 'Meet Spikes',
    icon: <CurrencyDollar size={28} color="#f59e0b" weight="fill" />,
    showClaimSpikes: true,
    primaryCtaLabel: 'Finish',
    body: (
      <View style={{ gap: theme.spacing.md }}>
        <Text variant="body" color="muted" center>
          Spikes are your in-app currency that you earn automatically by training and engaging with
          TrackLit.
        </Text>
        <View style={styles.panel}>
          <Text variant="caption" weight="medium" color="foreground" style={{ marginBottom: theme.spacing.sm }}>
            Earn Spikes by:
          </Text>
          <View style={{ gap: theme.spacing.sm }}>
            <BulletRow>Completing training sessions</BulletRow>
            <BulletRow>Daily login streaks</BulletRow>
            <BulletRow>Achieving personal records</BulletRow>
            <BulletRow>Group participation</BulletRow>
            <BulletRow>Competition results</BulletRow>
          </View>
        </View>
        <View style={[styles.panel, styles.panelAmber]}>
          <Text variant="caption" weight="medium" color="foreground" style={{ marginBottom: theme.spacing.sm }}>
            Use Spikes to unlock:
          </Text>
          <View style={{ gap: theme.spacing.sm }}>
            <BulletRow>Pro tier features (1,000 Spikes)</BulletRow>
            <BulletRow>Advanced analytics</BulletRow>
            <BulletRow>Custom workout plans</BulletRow>
            <BulletRow>Priority support</BulletRow>
          </View>
        </View>
      </View>
    ),
  },
];
