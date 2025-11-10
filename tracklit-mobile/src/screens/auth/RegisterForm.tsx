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

interface RegisterFormData {
  name: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const success = await register({
        name: formData.name,
        email: formData.email,
        username: formData.username,
        password: formData.password,
      });
      
      if (!success) {
        Alert.alert(
          'Registration Failed',
          'Unable to create account. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Registration Failed',
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
          label="Full Name"
          value={formData.name}
          onChangeText={(value) => handleInputChange('name', value)}
          placeholder="Enter your full name"
          error={errors.name}
          autoCapitalize="words"
          data-testid="input-name"
        />

        <Input
          label="Email"
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.email}
          data-testid="input-email"
        />

        <Input
          label="Username"
          value={formData.username}
          onChangeText={(value) => handleInputChange('username', value)}
          placeholder="Choose a username"
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.username}
          data-testid="input-username"
        />

        <Input
          label="Password"
          value={formData.password}
          onChangeText={(value) => handleInputChange('password', value)}
          placeholder="Create a password"
          secureTextEntry
          error={errors.password}
          data-testid="input-password"
        />

        <Input
          label="Confirm Password"
          value={formData.confirmPassword}
          onChangeText={(value) => handleInputChange('confirmPassword', value)}
          placeholder="Confirm your password"
          secureTextEntry
          error={errors.confirmPassword}
          data-testid="input-confirm-password"
        />

        <Button
          variant="default"
          size="lg"
          onPress={handleRegister}
          loading={loading}
          disabled={loading}
          style={styles.registerButton}
          data-testid="button-register"
        >
          {loading ? 'Creating account...' : 'Create Account'}
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

      {/* Login link */}
      <View style={styles.loginPrompt}>
        <Text variant="small" color="muted">
          Already have an account?{' '}
        </Text>
        <TouchableOpacity onPress={onSwitchToLogin} data-testid="link-switch-to-login">
          <Text variant="small" color="primary" weight="medium">
            Log in
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
  registerButton: {
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
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});