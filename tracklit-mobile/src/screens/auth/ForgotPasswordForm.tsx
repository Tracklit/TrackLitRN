import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import theme from '@/utils/theme';
import { apiRequest } from '@/lib/api';

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
      <Text variant="h3" weight="bold" color="foreground" style={styles.title}>
        Reset Password
      </Text>
      <Text variant="body" color="muted" style={styles.subtitle}>
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
        data-testid="input-forgot-email"
      />

      {message && (
        <Text variant="small" color="success" style={styles.statusText}>
          {message}
        </Text>
      )}
      {error && (
        <Text variant="small" color="destructive" style={styles.statusText}>
          {error}
        </Text>
      )}

      <Button
        variant="default"
        size="lg"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={styles.submit}
        data-testid="button-send-reset-email"
      >
        {loading ? 'Sending...' : 'Send Reset Email'}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onPress={onBackToLogin}
        style={styles.backButton}
        data-testid="link-back-to-login"
      >
        Back to Login
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  statusText: {
    textAlign: 'center',
  },
  submit: {
    marginTop: theme.spacing.sm,
  },
  backButton: {
    marginTop: theme.spacing.xs,
  },
});

