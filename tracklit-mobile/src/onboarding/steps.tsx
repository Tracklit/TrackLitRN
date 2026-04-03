import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';

const COLORS = {
  orange: '#FF7A00',
  textPrimary: '#FFFFFF',
  textMuted: '#8A90B5',
  glass: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.08)',
  amberBg: 'rgba(245,158,11,0.08)',
  amberBorder: 'rgba(245,158,11,0.15)',
};

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
    gap: 8,
  },
  bulletGlyph: {
    marginTop: 2,
    width: 14,
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.textMuted,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  panel: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: COLORS.glass,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  panelAmber: {
    backgroundColor: COLORS.amberBg,
    borderColor: COLORS.amberBorder,
  },
  panelLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  logo: {
    width: 104,
    height: 104,
    resizeMode: 'contain',
  },
});

const BulletRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.bulletRow}>
    <Text style={styles.bulletGlyph}>•</Text>
    <Text style={styles.bulletText}>{children}</Text>
  </View>
);

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'lets-get-started',
    mode: 'intro',
    title: "Let's Get Started",
    icon: <Image source={require('../../assets/tracklit-logo.png')} style={styles.logo} />,
    body: (
      <View style={{ gap: 14 }}>
        <Text style={styles.bodyText}>
          Welcome to TrackLit — your track and field training companion built for athletes and coaches.
        </Text>
        <Text style={styles.bodyText}>
          We'll walk you through a few things before you dive in.
        </Text>
      </View>
    ),
  },
  {
    id: 'welcome',
    mode: 'intro',
    title: 'Welcome to TrackLit',
    body: (
      <View style={{ gap: 14 }}>
        <Text style={styles.bodyText}>
          Your complete track and field training companion.
        </Text>
        <Text style={styles.bodyText}>
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
    body: (
      <View style={{ gap: 14 }}>
        <Text style={styles.bodyText}>
          Welcome to the TrackLit alpha test. This app is still in development and not finalized
          yet.
        </Text>
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>
            What to expect during alpha testing:
          </Text>
          <View style={{ gap: 8 }}>
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
    showClaimSpikes: true,
    body: (
      <View style={{ gap: 12 }}>
        <Text style={styles.bodyText}>
          Spikes are your in-app currency that you earn automatically by training and engaging with
          TrackLit.
        </Text>
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>
            Earn Spikes by:
          </Text>
          <View style={{ gap: 6 }}>
            <BulletRow>Completing training sessions</BulletRow>
            <BulletRow>Daily login streaks</BulletRow>
            <BulletRow>Achieving personal records</BulletRow>
            <BulletRow>Group participation</BulletRow>
            <BulletRow>Competition results</BulletRow>
          </View>
        </View>
        <View style={[styles.panel, styles.panelAmber]}>
          <Text style={styles.panelLabel}>
            Use Spikes to unlock:
          </Text>
          <View style={{ gap: 6 }}>
            <BulletRow>Pro and Elite tier features</BulletRow>
            <BulletRow>Advanced performance analytics</BulletRow>
            <BulletRow>AI-generated training programs</BulletRow>
            <BulletRow>Exclusive tools and content</BulletRow>
          </View>
        </View>
      </View>
    ),
  },
  {
    id: 'get-started',
    mode: 'intro',
    title: "Let's Get Started",
    primaryCtaLabel: 'Finish',
    body: (
      <View style={{ gap: 14 }}>
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>Where to begin</Text>
          <View style={{ gap: 8 }}>
            <BulletRow>Head to the Training tab to create or import your first training program.</BulletRow>
            <BulletRow>Log sessions, track your progress, and stay on top of your athletic goals.</BulletRow>
            <BulletRow>Explore Tools, Feed, and Aria for more features as you go.</BulletRow>
          </View>
        </View>
      </View>
    ),
  },
];
