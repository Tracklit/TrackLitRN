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
      <Text style={styles.title}>Set New Password</Text>
      <Text style={styles.subtitle}>Enter your new password below.</Text>

      <Input
        label="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="Enter your new password"
        secureTextEntry
      />

      <Input
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirm your new password"
        secureTextEntry
      />

      {message && <Text style={styles.successText}>{message}</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {isVerifyingToken && (
        <Text style={styles.mutedText}>Verifying reset link...</Text>
      )}

      <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} activeOpacity={0.8} disabled={loading || isVerifyingToken}>
        <LinearGradient
          colors={[COLORS.orange, COLORS.orangeLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryBtnInner}
        >
          <Text style={styles.primaryBtnText}>
            {loading ? 'Resetting...' : 'Reset Password'}
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
  mutedText: {
    fontSize: 13,
    color: COLORS.textMuted,
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
