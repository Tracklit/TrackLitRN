import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { LinearGradient } from '@/components/LinearGradient';
import { ArrowLeft } from 'phosphor-react-native';
import { apiRequest } from '@/lib/api';

const COLORS = {
  orange: '#FF7A00',
  orangeLight: '#FF9D00',
  textPrimary: '#FFFFFF',
  textMuted: '#8A90B5',
  success: '#22c55e',
  destructive: '#ef4444',
};

interface ForgotPasswordFormProps {
  onBackToLogin?: () => void;
  onResetLinkSent?: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onBackToLogin,
  onResetLinkSent,
}) => {
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
          colors={[COLORS.orange, COLORS.orangeLight]}
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
        <ArrowLeft size={14} color={COLORS.orange} weight="bold" />
        <Text style={styles.linkText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  successText: {
    fontSize: 13,
    color: COLORS.success,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    color: COLORS.destructive,
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
    color: COLORS.textPrimary,
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
    color: COLORS.orange,
  },
});
