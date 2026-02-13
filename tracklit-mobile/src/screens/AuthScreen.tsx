import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import theme from '../utils/theme';
import { LoginForm } from './auth/LoginForm';
import { RegisterForm } from './auth/RegisterForm';
import { ForgotPasswordForm } from './auth/ForgotPasswordForm';
import { ResetPasswordForm } from './auth/ResetPasswordForm';
import { env } from '@/config/env';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { KeyboardAwareScreenScrollView } from '@/components/keyboard/KeyboardAwareScroll';
import { googleSignInStatusCodes, useGoogleAuthRequest, handleGoogleResponse } from '@/lib/googleSignIn';

export const AuthScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'login' | 'register' | 'forgot-password' | 'reset-password'
  >('login');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const { loginWithToken } = useAuth();
  const { request: googleRequest, response: googleResponse, promptAsync: googlePromptAsync } = useGoogleAuthRequest();

  // Handle deep links for reset password (tracklitmobile://auth?resetToken=...)
  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url) return;
      try {
        const parsed = new URL(url);
        const tokenFromUrl = parsed.searchParams.get('resetToken');
        if (tokenFromUrl) {
          setResetToken(tokenFromUrl);
          setActiveTab('reset-password');
        }
      } catch {
        // ignore invalid URLs
      }
    };

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', (event) => handleUrl(event.url));
    return () => sub.remove();
  }, []);

  // Pre-verify reset token when present
  useEffect(() => {
    const verify = async () => {
      if (!resetToken) return;
      try {
        setIsVerifyingToken(true);
        const response = await fetch(`${env.API_BASE_URL}/api/auth/verify-reset-token/${resetToken}`);
        const json = await response.json();
        if (!json?.valid) {
          Alert.alert('Invalid or expired link', 'Please request a new reset link.');
          setActiveTab('forgot-password');
        }
      } catch {
        Alert.alert('Unable to verify link', 'Please request a new reset link.');
        setActiveTab('forgot-password');
      } finally {
        setIsVerifyingToken(false);
      }
    };
    verify();
  }, [resetToken]);

  useEffect(() => {
    if (!googleResponse) return;
    (async () => {
      try {
        setIsGoogleLoading(true);
        const result = await handleGoogleResponse(googleResponse);
        if (!result) return;

        const response = await apiRequest<{ token?: string; user?: { token?: string } }>(
          '/api/auth/google/mobile',
          {
            method: 'POST',
            data: { idToken: result.idToken },
            skipAuth: true,
          },
        );

        const token = response?.token || response?.user?.token;
        if (!token) {
          Alert.alert('Google Sign In Failed', 'Unable to start your session.');
          return;
        }

        const success = await loginWithToken(token);
        if (!success) {
          Alert.alert('Google Sign In Failed', 'Unable to start your session.');
        }
      } catch (error: any) {
        if (error?.code === googleSignInStatusCodes.SIGN_IN_CANCELLED) {
          return;
        }
        Alert.alert(
          'Google Sign In Failed',
          error?.message || 'Something went wrong. Please try again.',
        );
      } finally {
        setIsGoogleLoading(false);
      }
    })();
  }, [googleResponse]);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      setIsAppleAvailable(false);
      return;
    }

    AppleAuthentication.isAvailableAsync()
      .then(setIsAppleAvailable)
      .catch(() => setIsAppleAvailable(false));
  }, []);

  const showTabs = useMemo(
    () => activeTab === 'login' || activeTab === 'register',
    [activeTab]
  );

  const handleAppleSignIn = async () => {
    if (isAppleLoading) return;

    try {
      setIsAppleLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        Alert.alert('Apple Sign In Failed', 'Unable to retrieve Apple identity token.');
        return;
      }

      const response = await apiRequest<{ token?: string; user?: { token?: string } }>(
        '/api/auth/apple/mobile',
        {
          method: 'POST',
          data: {
            identityToken: credential.identityToken,
            fullName: credential.fullName,
            email: credential.email,
          },
          skipAuth: true,
        },
      );

      const token = response?.token || response?.user?.token;
      if (!token) {
        Alert.alert('Apple Sign In Failed', 'Unable to authenticate with Apple.');
        return;
      }

      const success = await loginWithToken(token);
      if (!success) {
        Alert.alert('Apple Sign In Failed', 'Unable to start your session.');
      }
    } catch (error: any) {
      if (error?.code === 'ERR_CANCELED') {
        return;
      }
      Alert.alert(
        'Apple Sign In Failed',
        error?.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading || !googleRequest) return;
    await googlePromptAsync();
  };

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <KeyboardAwareScreenScrollView
        style={{ paddingTop: insets.top }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={80}
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

          {/* Features Section */}
          <View style={styles.featuresSection}>
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

          {/* Auth Card */}
          <Card style={styles.authCard}>
            {/* Tabs (only for login/register) */}
            {showTabs && (
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
            )}

            {/* Form Content */}
            <View style={styles.formContainer}>
              {activeTab === 'login' && (
                <LoginForm
                  onSwitchToRegister={() => setActiveTab('register')}
                  onForgotPassword={() => setActiveTab('forgot-password')}
                />
              )}
              {activeTab === 'register' && (
                <RegisterForm onSwitchToLogin={() => setActiveTab('login')} />
              )}
              {activeTab === 'forgot-password' && (
                <ForgotPasswordForm
                  onBackToLogin={() => setActiveTab('login')}
                />
              )}
              {activeTab === 'reset-password' && (
                <ResetPasswordForm
                  resetToken={resetToken}
                  isVerifyingToken={isVerifyingToken}
                  onBackToLogin={() => setActiveTab('login')}
                />
              )}
            </View>

            {/* Only show social divider for login/register */}
            {showTabs && (
              <>
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
                  onPress={handleGoogleSignIn}
                  loading={isGoogleLoading}
                  disabled={!googleRequest}
                  style={styles.googleButton}
                >
                  <FontAwesome5 name="google" size={16} color={theme.colors.primary} />
                  <Text variant="body" weight="semiBold" color="foreground" style={styles.googleButtonText}>
                    Continue with Google
                  </Text>
                </Button>

                {Platform.OS === 'ios' && isAppleAvailable && (
                  <View style={styles.appleButtonWrapper}>
                    <AppleAuthentication.AppleAuthenticationButton
                      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                      cornerRadius={12}
                      style={styles.appleButton}
                      onPress={handleAppleSignIn}
                    />
                    {isAppleLoading && (
                      <Text variant="small" color="muted" style={styles.appleLoadingText}>
                        Connecting to Apple...
                      </Text>
                    )}
                  </View>
                )}
              </>
            )}
          </Card>
      </KeyboardAwareScreenScrollView>
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
  appleButtonWrapper: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  appleButton: {
    width: '100%',
    height: 52,
  },
  appleLoadingText: {
    marginTop: theme.spacing.xs,
  },
  featuresSection: {
    marginTop: theme.spacing.xl,
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
