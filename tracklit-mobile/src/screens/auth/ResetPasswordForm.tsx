import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import theme from '@/utils/theme';
import { apiRequest } from '@/lib/api';

interface ResetPasswordFormProps {
  resetToken: string | null;
  isVerifyingToken?: boolean;
  onBackToLogin?: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  resetToken,
  isVerifyingToken,
  onBackToLogin,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!resetToken) {
      setError('Reset link missing. Please request a new link.');
      return false;
    }
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Please fill in both password fields.');
      return false;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        data: { token: resetToken, newPassword },
        skipAuth: true,
      });
      setMessage('Password reset successfully! You can now log in.');
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="h3" weight="bold" color="foreground" style={styles.title}>
        Set New Password
      </Text>
      <Text variant="body" color="muted" style={styles.subtitle}>
        Enter your new password below.
      </Text>

      <Input
        label="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="Enter your new password"
        secureTextEntry
        data-testid="input-new-password"
      />

      <Input
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirm your new password"
        secureTextEntry
        data-testid="input-confirm-password"
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
      {isVerifyingToken && (
        <Text variant="small" color="muted" style={styles.statusText}>
          Verifying reset link...
        </Text>
      )}

      <Button
        variant="default"
        size="lg"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading || isVerifyingToken}
        style={styles.submit}
        data-testid="button-reset-password"
      >
        {loading ? 'Resetting...' : 'Reset Password'}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onPress={onBackToLogin}
        style={styles.backButton}
        data-testid="link-back-to-login-2"
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

