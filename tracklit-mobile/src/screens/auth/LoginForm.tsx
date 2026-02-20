import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { useAuth } from '../../contexts/AuthContext';
import { LinearGradient } from '@/components/LinearGradient';

const COLORS = {
  orange: '#FF7A00',
  orangeLight: '#FF9D00',
  textPrimary: '#FFFFFF',
  textMuted: '#8A90B5',
};

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
        />

        <Input
          label="Password"
          value={formData.password}
          onChangeText={(value) => handleInputChange('password', value)}
          placeholder="Enter your password"
          secureTextEntry
          error={errors.password}
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} activeOpacity={0.8} disabled={loading}>
          <LinearGradient
            colors={[COLORS.orange, COLORS.orangeLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnInner}
          >
            <Text style={styles.primaryBtnText}>
              {loading ? 'Logging in...' : 'Log In'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.linksArea}>
        <View style={styles.signupRow}>
          <Text style={styles.mutedText}>Don't have an account? </Text>
          <TouchableOpacity onPress={onSwitchToRegister}>
            <Text style={styles.linkText}>Sign up</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onForgotPassword} style={styles.forgotLink}>
          <Text style={styles.linkText}>Forgot your password?</Text>
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
    marginBottom: 16,
  },
  primaryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
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
  linksArea: {
    alignItems: 'center',
    gap: 6,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mutedText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.orange,
  },
  forgotLink: {
    marginTop: 2,
  },
});
