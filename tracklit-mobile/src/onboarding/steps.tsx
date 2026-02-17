import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Sparkles,
  Info,
  Coins,
} from 'lucide-react-native';

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
  infoBox: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(91, 33, 182, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
  },
  infoBoxIcon: {
    width: 18,
    alignItems: 'center',
    marginTop: 1,
  },
  panel: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(47, 57, 77, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  panelAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.18)',
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

const InfoBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.infoBox}>
    <View style={styles.infoBoxIcon}>
      <Info size={16} color={theme.colors.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text variant="caption" color="muted">
        {children}
      </Text>
    </View>
  </View>
);


export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    mode: 'intro',
    title: 'Welcome to TrackLit',
    icon: <Sparkles size={34} color={theme.colors.primary} />,
    body: (
      <View style={{ gap: theme.spacing.md }}>
        <Text variant="body" color="muted" center>
          Your complete track and field training companion.
        </Text>
        <Text variant="body" color="muted" center>
          TrackLit helps you track workouts, manage programs, and analyze performance to reach your
          athletic potential.
        </Text>
        <InfoBox>We have created a sample training program so you can explore right away.</InfoBox>
      </View>
    ),
  },
  {
    id: 'alpha-info',
    mode: 'intro',
    title: 'Alpha Testing Information',
    icon: <Info size={34} color={theme.colors.primary} />,
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
    icon: <Coins size={34} color="#f59e0b" />,
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
