import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import type { RootStackParamList } from '@/navigation/types';
import theme from '@/utils/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type Visibility = 'public' | 'private' | 'premium';

type PriceType = 'spikes' | 'money';

type DurationWeeks = 1 | 2 | 4 | 6 | 8 | 12;

export const ProgramCreateScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user, isAuthenticated } = useAuth();
  const isGuest = user?.id === 'guest';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [priceType, setPriceType] = useState<PriceType>('spikes');
  const [price, setPrice] = useState('0');
  const [duration, setDuration] = useState<DurationWeeks>(4);

  const createProgramMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated || isGuest) {
        throw new Error('Login required');
      }
      if (!title.trim()) {
        throw new Error('Program title is required');
      }

      const priceNum = Number(price);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        throw new Error('Price must be 0 or greater');
      }

      return apiRequest<{ id: number | string }>('/api/programs', {
        method: 'POST',
        data: {
          title: title.trim(),
          description: description.trim(),
          visibility,
          price: priceNum,
          priceType,
          duration,
        },
      });
    },
    onSuccess: (program) => {
      queryClient.invalidateQueries({ queryKey: ['user-programs'] });
      queryClient.invalidateQueries({ queryKey: ['purchased-programs'] });
      Alert.alert('Created', 'Your program was created successfully.');
      if (program?.id !== undefined) {
        navigation.replace('ProgramDetail', { id: program.id });
      } else {
        navigation.goBack();
      }
    },
    onError: (error: Error) => {
      Alert.alert('Unable to create program', error.message || 'Please try again.');
    },
  });

  const pill = (selected: boolean) => [styles.pill, selected && styles.pillActive];

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.colors.foreground} solid />
        </TouchableOpacity>
        <Text variant="h3" weight="bold" color="foreground">
          Create Program
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={{ marginBottom: 0 }}>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
          </CardHeader>
          <CardContent style={{ gap: theme.spacing.md }}>
            <TextInput
              style={styles.input}
              placeholder="Program title"
              placeholderTextColor={theme.colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              placeholderTextColor={theme.colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <Text variant="body" weight="semiBold" color="foreground">
              Visibility
            </Text>
            <View style={styles.pillRow}>
              {(['public', 'private', 'premium'] as const).map((v) => (
                <TouchableOpacity key={v} style={pill(visibility === v)} onPress={() => setVisibility(v)}>
                  <Text variant="small" weight="medium" color={visibility === v ? 'foreground' : 'muted'}>
                    {v}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text variant="body" weight="semiBold" color="foreground">
              Duration
            </Text>
            <View style={styles.pillRow}>
              {([1, 2, 4, 6, 8, 12] as const).map((w) => (
                <TouchableOpacity key={w} style={pill(duration === w)} onPress={() => setDuration(w)}>
                  <Text variant="small" weight="medium" color={duration === w ? 'foreground' : 'muted'}>
                    {w}w
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text variant="body" weight="semiBold" color="foreground">
              Pricing
            </Text>
            <View style={styles.pillRow}>
              {(['spikes', 'money'] as const).map((t) => (
                <TouchableOpacity key={t} style={pill(priceType === t)} onPress={() => setPriceType(t)}>
                  <Text variant="small" weight="medium" color={priceType === t ? 'foreground' : 'muted'}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Price"
              placeholderTextColor={theme.colors.textMuted}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />

            <Button
              variant="default"
              size="lg"
              onPress={() => createProgramMutation.mutate()}
              loading={createProgramMutation.isPending}
              disabled={!isAuthenticated || isGuest}
            >
              <FontAwesome5 name="check" size={16} color="white" solid />
              <Text variant="body" weight="bold" color="primary-foreground" style={styles.buttonText}>
                Create
              </Text>
            </Button>

            {(!isAuthenticated || isGuest) && (
              <Text variant="small" color="muted" style={styles.helperText}>
                Sign in to create programs.
              </Text>
            )}
          </CardContent>
        </Card>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  headerSpacer: { flex: 1 },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.card,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  pill: {
    minWidth: 84,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  pillActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  buttonText: { marginLeft: theme.spacing.sm },
  helperText: { textAlign: 'center', lineHeight: 18 },
});
