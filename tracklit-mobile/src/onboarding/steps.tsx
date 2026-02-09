import React from 'react';
import { StyleSheet, View } from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import {
  Sparkles,
  Info,
  Coins,
  Home,
  Calendar,
  BookOpen,
  Newspaper,
  Wrench,
  MessageSquare,
  User,
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

const navigateToTab = (navRef: any, tabName: string) => {
  if (!navRef?.isReady?.()) return;

  try {
    navRef.dispatch?.(DrawerActions.closeDrawer());
  } catch {
    // ignore
  }

  // Root navigator is a Drawer with a single screen "AppStack" which hosts the native stack.
  // Tabs live at AppStack -> MainTabs -> <TabName>.
  navRef.navigate?.('AppStack', { screen: 'MainTabs', params: { screen: tabName } });
};

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
  {
    id: 'tour-home',
    mode: 'tour',
    title: 'Home',
    icon: <Home size={26} color={theme.colors.foreground} />,
    onEnter: (navRef) => navigateToTab(navRef, 'Home'),
    body: (
      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="body" color="muted">
          Your dashboard. See what is happening, pick where to go next, and get back into training
          quickly.
        </Text>
        <Text variant="caption" color="muted">
          Tip: Use the Home cards as shortcuts into Practice, Programs, and Tools.
        </Text>
      </View>
    ),
  },
  {
    id: 'tour-practice',
    mode: 'tour',
    title: 'Practice',
    icon: <Calendar size={26} color={theme.colors.foreground} />,
    onEnter: (navRef) => navigateToTab(navRef, 'Practice'),
    body: (
      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="body" color="muted">
          Your daily workout hub. Log sessions, follow your plan, and build consistency.
        </Text>
        <Text variant="caption" color="muted">
          Tip: Start here on training days to keep everything in one place.
        </Text>
      </View>
    ),
  },
  {
    id: 'tour-programs',
    mode: 'tour',
    title: 'Programs',
    icon: <BookOpen size={26} color={theme.colors.foreground} />,
    onEnter: (navRef) => navigateToTab(navRef, 'Programs'),
    body: (
      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="body" color="muted">
          Explore training plans, open the sample program, and build or edit your own programs.
        </Text>
        <Text variant="caption" color="muted">
          Tip: Programs are the best way to stay structured week to week.
        </Text>
      </View>
    ),
  },
  {
    id: 'tour-feed',
    mode: 'tour',
    title: 'Feed',
    icon: <Newspaper size={26} color={theme.colors.foreground} />,
    onEnter: (navRef) => navigateToTab(navRef, 'Feed'),
    body: (
      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="body" color="muted">
          Follow the community. Share updates, see what others are doing, and stay motivated.
        </Text>
        <Text variant="caption" color="muted">
          Tip: Engaging with the community helps you earn Spikes over time.
        </Text>
      </View>
    ),
  },
  {
    id: 'tour-tools',
    mode: 'tour',
    title: 'Tools',
    icon: <Wrench size={26} color={theme.colors.foreground} />,
    onEnter: (navRef) => navigateToTab(navRef, 'Tools'),
    body: (
      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="body" color="muted">
          Training and performance tools like stopwatch, start gun, video analysis, and more.
        </Text>
        <Text variant="caption" color="muted">
          Tip: Use Tools on the track to capture reps and stay focused.
        </Text>
      </View>
    ),
  },
  {
    id: 'tour-sprinthia',
    mode: 'tour',
    title: 'Sprinthia',
    icon: <MessageSquare size={26} color={theme.colors.foreground} />,
    onEnter: (navRef) => navigateToTab(navRef, 'Sprinthia'),
    body: (
      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="body" color="muted">
          Your AI coach. Ask questions, get guidance, and generate training ideas.
        </Text>
        <Text variant="caption" color="muted">
          Tip: If you are unsure what to do next, start by asking Sprinthia.
        </Text>
      </View>
    ),
  },
  {
    id: 'tour-profile',
    mode: 'tour',
    title: 'Profile',
    icon: <User size={26} color={theme.colors.foreground} />,
    onEnter: (navRef) => navigateToTab(navRef, 'Profile'),
    primaryCtaLabel: 'Finish',
    body: (
      <View style={{ gap: theme.spacing.sm }}>
        <Text variant="body" color="muted">
          Customize your profile, update preferences, and manage your account.
        </Text>
        <Text variant="caption" color="muted">
          You can replay this tour any time from your Profile.
        </Text>
      </View>
    ),
  },
];
