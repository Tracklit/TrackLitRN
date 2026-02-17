import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Text } from '../../components/ui/Text';
import { useAuth } from '../../contexts/AuthContext';
import theme from '../../utils/theme';

interface LoginFormData {
  usernameOrEmail: string;
  password: string;
}

interface LoginFormProps {
  onSwitchToRegister?: () => void;
  onForgotPassword?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onForgotPassword }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    usernameOrEmail: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};
    
    if (!formData.usernameOrEmail.trim()) {
      newErrors.usernameOrEmail = 'Username or email is required';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(formData.usernameOrEmail, formData.password);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'An error occurred. Please try again.';
      Alert.alert('Login Failed', message, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Input
          label="Username or Email"
          value={formData.usernameOrEmail}
          onChangeText={(value) => handleInputChange('usernameOrEmail', value)}
          placeholder="Enter your username or email"
          error={errors.usernameOrEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          data-testid="input-username"
        />

        <Input
          label="Password"
          value={formData.password}
          onChangeText={(value) => handleInputChange('password', value)}
          placeholder="Enter your password"
          secureTextEntry
          error={errors.password}
          data-testid="input-password"
        />

        <Button
          variant="default"
          size="lg"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.loginButton}
          data-testid="button-login"
        >
          {loading ? 'Logging in...' : 'Log In'}
        </Button>
      </View>

      {/* Sign up / Forgot */}
      <View style={styles.signupPrompt}>
        <View style={styles.signupRow}>
          <Text variant="small" color="muted">
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={onSwitchToRegister} data-testid="link-switch-to-register">
            <Text variant="small" color="primary" weight="medium">
              Sign up
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={onForgotPassword}
          style={styles.forgotPassword}
          data-testid="link-forgot-password"
        >
          <Text variant="small" color="primary" weight="medium">
            Forgot your password?
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    marginBottom: theme.spacing.lg,
  },
  loginButton: {
    marginTop: theme.spacing.md,
  },
  signupPrompt: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotPassword: {
    marginTop: theme.spacing.xs,
  },
});