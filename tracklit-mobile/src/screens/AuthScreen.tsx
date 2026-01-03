import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import theme from '../utils/theme';
import { LoginForm } from './auth/LoginForm';
import { RegisterForm } from './auth/RegisterForm';
import { env } from '@/config/env';

export const AuthScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text variant="h2" weight="bold" color="primary">
              TrackLit
            </Text>
            <Text variant="body" color="muted" style={styles.subtitle}>
              Join the Future of Athletics
            </Text>
          </View>

          {/* Auth Card */}
          <Card style={styles.authCard}>
            {/* Tabs */}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'login' && styles.activeTab
                ]}
                onPress={() => setActiveTab('login')}
                data-testid="tab-login"
              >
                <Text 
                  variant="body" 
                  weight="medium"
                  style={[
                    styles.tabText,
                    activeTab === 'login' && styles.activeTabText
                  ]}
                >
                  Login
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'register' && styles.activeTab
                ]}
                onPress={() => setActiveTab('register')}
                data-testid="tab-register"
              >
                <Text 
                  variant="body" 
                  weight="medium"
                  style={[
                    styles.tabText,
                    activeTab === 'register' && styles.activeTabText
                  ]}
                >
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form Content */}
            <View style={styles.formContainer}>
              {activeTab === 'login' ? (
                <LoginForm onSwitchToRegister={() => setActiveTab('register')} />
              ) : (
                <RegisterForm onSwitchToLogin={() => setActiveTab('login')} />
              )}
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text variant="small" color="muted" style={styles.dividerText}>
                or
              </Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              variant="outline"
              size="lg"
              onPress={async () => {
                try {
                  await Linking.openURL(`${env.API_BASE_URL}/api/auth/google/mobile`);
                } catch (e) {
                  Alert.alert('Unable to open browser', 'Please try again.');
                }
              }}
              style={styles.googleButton}
            >
              <FontAwesome5 name="google" size={16} color={theme.colors.primary} />
              <Text variant="body" weight="semiBold" color="foreground" style={styles.googleButtonText}>
                Continue with Google
              </Text>
            </Button>
          </Card>

          {/* Features Section */}
          <View style={styles.featuresSection}>
            <Text variant="h3" weight="bold" color="foreground" style={styles.featuresTitle}>
              Why Choose TrackLit?
            </Text>
            
            <View style={styles.featuresList}>
              <FeatureItem
                title="Own Your Progress"
                description="Track every rep, jump, and race with powerful analytics and PR tracking."
              />
              <FeatureItem
                title="Stay Meet-Ready"
                description="Plan competitions with integrated calendars, weather insights, and prep tools."
              />
              <FeatureItem
                title="Never Miss a Beat"
                description="Get smart reminders for workouts, recovery, and meet prep."
              />
              <FeatureItem
                title="Train Smarter, Compete Stronger"
                description="Let Sprinthia, your AI coach, build personalized workouts tailored to your goals."
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

interface FeatureItemProps {
  title: string;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ title, description }) => (
  <View style={styles.featureItem}>
    <Text variant="body" weight="semiBold" color="primary" style={styles.featureTitle}>
      {title}
    </Text>
    <Text variant="small" color="muted" style={styles.featureDescription}>
      {description}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginTop: theme.spacing.xl * 2,
    marginBottom: theme.spacing.xl,
  },
  subtitle: {
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  authCard: {
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.muted,
    padding: theme.spacing.xs,
    marginBottom: theme.spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.colors.background,
  },
  tabText: {
    color: theme.colors.textMuted,
  },
  activeTabText: {
    color: theme.colors.foreground,
  },
  formContainer: {
    flex: 1,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    textAlign: 'center',
  },
  googleButton: {
    width: '100%',
  },
  googleButtonText: {
    marginLeft: theme.spacing.sm,
  },
  featuresSection: {
    marginTop: theme.spacing.xl,
  },
  featuresTitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  featuresList: {
    gap: theme.spacing.lg,
  },
  featureItem: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  featureTitle: {
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  featureDescription: {
    textAlign: 'center',
    lineHeight: 20,
  },
});