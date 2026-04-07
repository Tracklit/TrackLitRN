import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';

import { Text } from '@/components/ui/Text';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { getScreenContentBottomPadding } from '@/utils/layoutPadding';
import themeStatic from '@/utils/theme';
import type { RootStackParamList } from '@/navigation/types';
import { KeyboardAwareScreenScrollView } from '@/components/keyboard/KeyboardAwareScroll';

import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';
type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const CreateMeetScreen: React.FC = () => {
  const { styles, theme } = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { user } = useAuth();
  const isGuest = user?.id === 'guest';

  const contentBottomPadding = useMemo(
    () => getScreenContentBottomPadding(insets.bottom, { includeBottomNav: false, extra: themeStatic.spacing.xl }),
    [insets.bottom],
  );

  const [name, setName] = useState('');
  const [date, setDate] = useState(''); // YYYY-MM-DD
  const [location, setLocation] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [events, setEvents] = useState(''); // comma-separated

  const createMeetMutation = useMutation({
    mutationFn: async () => {
      if (isGuest) throw new Error('Login required');
      if (!name.trim() || !date.trim() || !location.trim()) {
        throw new Error('Name, date, and location are required.');
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
        throw new Error('Date must be YYYY-MM-DD.');
      }
      const payload = {
        name: name.trim(),
        date: date.trim(),
        location: location.trim(),
        websiteUrl: websiteUrl.trim() || null,
        events: events
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean),
      };
      return apiRequest('/api/meets', { method: 'POST', data: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meets'] });
      Alert.alert('Created', 'Meet created successfully.');
      navigation.goBack();
    },
    onError: (error: Error) => {
      Alert.alert('Create failed', error.message || 'Please try again.');
    },
  });

  return (
    <LinearGradient colors={theme.gradient.background} locations={theme.gradient.locations} style={styles.container}>
      <KeyboardAwareScreenScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={{ paddingTop: insets.top }}
        contentContainerStyle={[styles.content, { paddingBottom: contentBottomPadding }]}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={80}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <FontAwesome5 name="arrow-left" size={18} color={theme.colors.foreground} solid />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="h3" weight="bold" color="foreground">
              Create Meet
            </Text>
            <Text variant="small" color="muted">
              Add a competition to your calendar
            </Text>
          </View>
          <View style={styles.iconBtn} />
        </View>

        {isGuest && (
          <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
            Sign in to create a meet.
          </Text>
        )}

        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent style={styles.cardContent}>
            <Text variant="body" color="foreground" weight="semiBold">
              Name
            </Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Meet name"
              placeholderTextColor={theme.colors.textMuted}
            />

            <Text variant="body" color="foreground" weight="semiBold">
              Date
            </Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />

            <Text variant="body" color="foreground" weight="semiBold">
              Location
            </Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="City, venue, etc."
              placeholderTextColor={theme.colors.textMuted}
            />

            <Text variant="body" color="foreground" weight="semiBold">
              Website (optional)
            </Text>
            <TextInput
              style={styles.input}
              value={websiteUrl}
              onChangeText={setWebsiteUrl}
              placeholder="https://..."
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
            />

            <Text variant="body" color="foreground" weight="semiBold">
              Events (optional)
            </Text>
            <TextInput
              style={styles.input}
              value={events}
              onChangeText={setEvents}
              placeholder="100m, 200m, Long Jump"
              placeholderTextColor={theme.colors.textMuted}
            />

            <Button
              variant="default"
              size="lg"
              onPress={() => createMeetMutation.mutate()}
              loading={createMeetMutation.isPending}
              disabled={isGuest || createMeetMutation.isPending}
            >
              <FontAwesome5 name="plus" size={16} color="white" solid />
              <Text variant="body" weight="bold" color="primary-foreground" style={{ marginLeft: themeStatic.spacing.sm }}>
                Create
              </Text>
            </Button>
          </CardContent>
        </Card>
      </KeyboardAwareScreenScrollView>
    </LinearGradient>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: themeStatic.spacing.lg,
    gap: themeStatic.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: themeStatic.spacing.lg,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  card: { marginBottom: 0 },
  cardContent: { gap: themeStatic.spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: t.colors.border,
    borderRadius: themeStatic.borderRadius.lg,
    padding: themeStatic.spacing.md,
    color: t.colors.foreground,
    backgroundColor: t.colors.card,
    marginBottom: themeStatic.spacing.sm,
  },
});

