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
  username: string;
  password: string;
}

export const LoginForm: React.FC = () => {
  const { login, continueAsGuest } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
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
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
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
      const success = await login(formData.username, formData.password);
      
      if (!success) {
        Alert.alert(
          'Login Failed',
          'Invalid username or password. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Login Failed',
        'An error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    Alert.alert(
      'Google Sign-In',
      'Google authentication coming soon!',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Input
          label="Username"
          value={formData.username}
          onChangeText={(value) => handleInputChange('username', value)}
          placeholder="Enter your username"
          error={errors.username}
          autoCapitalize="none"
          autoCorrect={false}
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

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text variant="small" color="muted" style={styles.dividerText}>
          Or continue with
        </Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Google Sign-in */}
      <Button
        variant="outline"
        size="lg"
        onPress={handleGoogleSignIn}
        style={styles.googleButton}
        data-testid="button-google-signin"
      >
        <View style={styles.googleButtonContent}>
          <Text variant="body" weight="medium" color="foreground">
            Continue with Google
          </Text>
        </View>
      </Button>

      {/* Sign up link */}
      <View style={styles.signupPrompt}>
        <Text variant="small" color="muted">
          Don't have an account?{' '}
        </Text>
        <TouchableOpacity>
          <Text variant="small" color="primary" weight="medium">
            Sign up
          </Text>
        </TouchableOpacity>
      </View>

      {/* Guest access */}
      <View style={styles.guestAccess}>
        <Button
          variant="outline"
          size="sm"
          onPress={continueAsGuest}
          style={styles.guestButton}
          data-testid="button-continue-guest"
        >
          Continue as Guest
        </Button>
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    paddingHorizontal: theme.spacing.md,
    textTransform: 'uppercase',
  },
  googleButton: {
    marginBottom: theme.spacing.lg,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestAccess: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  guestButton: {
    paddingHorizontal: theme.spacing.xl,
  },
});