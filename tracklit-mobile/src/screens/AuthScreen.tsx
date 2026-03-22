import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoogleLogo, AppleLogo } from 'phosphor-react-native';

import { Text } from '../components/ui/Text';
import { Button } from '../components/ui/Button';
import { LoginForm } from './auth/LoginForm';
import { RegisterForm } from './auth/RegisterForm';
import { ForgotPasswordForm } from './auth/ForgotPasswordForm';
import { ResetPasswordForm } from './auth/ResetPasswordForm';
import { env } from '@/config/env';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { KeyboardAwareScreenScrollView } from '@/components/keyboard/KeyboardAwareScroll';
import { getQueryParam } from '@/utils/url';

const COLORS = {
  bg: '#0E0F14',
  surface: '#161823',
  card: '#1C1F2B',
  orange: '#FF7A00',
  orangeLight: '#FF9D00',
  textPrimary: '#FFFFFF',
  textSecondary: '#B8C0FF',
  textMuted: '#8A90B5',
  border: 'rgba(255,255,255,0.08)',
  tabBg: 'rgba(255,255,255,0.04)',
  tabActive: 'rgba(255,122,0,0.15)',
  divider: 'rgba(255,255,255,0.06)',
};

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

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url) return;
      const tokenFromUrl = getQueryParam(url, 'resetToken');
      if (tokenFromUrl) {
        setResetToken(tokenFromUrl);
        setActiveTab('reset-password');
      }
    };

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', (event) => handleUrl(event.url));
    return () => sub.remove();
  }, []);

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
    if (isGoogleLoading) return;

    try {
      setIsGoogleLoading(true);

      const authUrl = `${env.API_BASE_URL}/api/auth/google/mobile`;
      const redirectUrl = 'tracklitmobile://auth';
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return;
      }

      if (result.type !== 'success' || !result.url) {
        Alert.alert('Google Sign In Failed', 'Unable to complete Google sign in.');
        return;
      }

      const token = getQueryParam(result.url, 'token');
      if (!token) {
        Alert.alert('Google Sign In Failed', 'Unable to start your session.');
        return;
      }

      const success = await loginWithToken(token);
      if (!success) {
        Alert.alert('Google Sign In Failed', 'Unable to start your session.');
      }
    } catch (error: any) {
      Alert.alert(
        'Google Sign In Failed',
        error?.message || 'Something went wrong. Please try again.',
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: COLORS.bg }]}>
      <KeyboardAwareScreenScrollView
        style={{ paddingTop: insets.top }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={80}
      >
        <View style={styles.header}>
          <Image
            source={require('../../assets/tracklit-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.welcomeTitle}>Welcome to TrackLit</Text>
          <Text style={styles.welcomeSubtitle}>
            Log in or register to get started
          </Text>
        </View>

        {showTabs && (
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'login' && styles.tabActive]}
              onPress={() => setActiveTab('login')}
            >
              <Text style={[styles.tabText, activeTab === 'login' && styles.tabTextActive]}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'register' && styles.tabActive]}
              onPress={() => setActiveTab('register')}
            >
              <Text style={[styles.tabText, activeTab === 'register' && styles.tabTextActive]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.formArea}>
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

        {showTabs && (
          <>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.socialBtn}
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading}
              activeOpacity={0.7}
            >
              <GoogleLogo size={18} color={COLORS.textPrimary} weight="bold" />
              <Text style={styles.socialBtnText}>
                {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>

            {Platform.OS === 'ios' && isAppleAvailable && (
              <TouchableOpacity
                style={[styles.socialBtn, styles.appleSocialBtn]}
                onPress={handleAppleSignIn}
                disabled={isAppleLoading}
                activeOpacity={0.7}
              >
                <AppleLogo size={18} color={COLORS.textPrimary} weight="fill" />
                <Text style={styles.socialBtnText}>
                  {isAppleLoading ? 'Connecting...' : 'Continue with Apple'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </KeyboardAwareScreenScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 36,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    borderRadius: 24,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.tabBg,
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 11,
  },
  tabActive: {
    backgroundColor: COLORS.tabActive,
    borderWidth: 0.5,
    borderColor: 'rgba(255,122,0,0.25)',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.orange,
  },
  formArea: {
    marginBottom: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: COLORS.divider,
  },
  dividerText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  appleSocialBtn: {
    backgroundColor: '#1a1a1a',
  },
  socialBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
