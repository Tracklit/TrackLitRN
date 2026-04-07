import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { LinearGradient } from '@/components/LinearGradient';
import { ArrowLeft } from 'phosphor-react-native';
import { apiRequest } from '@/lib/api';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';

interface ForgotPasswordFormProps {
  onBackToLogin?: () => void;
  onResetLinkSent?: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onBackToLogin,
  onResetLinkSent,
}) => {
  const { styles, theme } = useThemedStyles(createStyles);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        data: { email },
        skipAuth: true,
      });
      setMessage('Password reset email sent! Check your inbox.');
      onResetLinkSent?.();
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>
        Enter your email and we'll send you a reset link.
      </Text>

      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {message && <Text style={styles.successText}>{message}</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} activeOpacity={0.8} disabled={loading}>
        <LinearGradient
          colors={['#FF7A00', '#FF9D00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryBtnInner}
        >
          <Text style={styles.primaryBtnText}>
            {loading ? 'Sending...' : 'Send Reset Email'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backRow} onPress={onBackToLogin} activeOpacity={0.7}>
        <ArrowLeft size={14} color={theme.colors.brandOrange} weight="bold" />
        <Text style={styles.linkText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: t.colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: t.colors.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  successText: {
    fontSize: 13,
    color: t.colors.success,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    color: t.colors.destructive,
    textAlign: 'center',
  },
  primaryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  primaryBtnInner: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: t.colors.textPrimary,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: t.colors.brandOrange,
  },
});
