import React from 'react';
import { StyleSheet, View } from 'react-native';
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
});

const BulletRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.bulletRow}>
    <Text style={styles.bulletGlyph}>•</Text>
    <Text style={styles.bulletText}>{children}</Text>
  </View>
);

export const ONBOARDING_STEPS: OnboardingStep[] = [
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
          TrackLit helps you track workouts, manage programs, and analyse performance to reach your
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
          Welcome to the TrackLit alpha test. This app is still in development and not finalised
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
    id: 'get-started',
    mode: 'intro',
    title: 'What To Do First',
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
