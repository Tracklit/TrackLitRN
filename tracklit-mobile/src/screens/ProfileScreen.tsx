import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import theme from '@/utils/theme';

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Avatar
            size="xl"
            fallback={user?.name?.[0]}
            src={undefined}
          />
          <View style={styles.headerText}>
            <Text variant="h2" weight="bold" color="foreground">
              {user?.name || 'TrackLit Athlete'}
            </Text>
            <Text variant="body" color="muted">
              @{user?.username || 'guest'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="h4" weight="semiBold" color="foreground" style={styles.sectionTitle}>
            Account
          </Text>
          <Text variant="body" color="muted">
            Mobile profile parity work is underway. For now you can sign out and continue on web for advanced settings.
          </Text>
        </View>

        <Button
          variant="outline"
          size="lg"
          onPress={logout}
          style={styles.logoutButton}
        >
          <Text variant="body" weight="medium" color="primary">
            Sign Out
          </Text>
        </Button>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  headerText: {
    flex: 1,
  },
  section: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background + 'CC',
    marginBottom: theme.spacing.xxl,
  },
  sectionTitle: {
    marginBottom: theme.spacing.sm,
  },
  logoutButton: {
    alignSelf: 'flex-start',
  },
});

