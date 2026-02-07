import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { LinearGradient } from '@/components/LinearGradient';
import { Text } from '@/components/ui/Text';
import { Card, CardContent } from '@/components/ui/Card';
import theme from '@/utils/theme';
import type { RootStackParamList } from '@/navigation/types';

const distances = [
  { value: '30', label: '30m' },
  { value: '40', label: '40m' },
  { value: '50', label: '50m' },
  { value: '60', label: '60m' },
  { value: '70', label: '70m' },
  { value: '80', label: '80m' },
  { value: '90', label: '90m' },
  { value: '100', label: '100m' },
  { value: '120', label: '120m' },
  { value: '150', label: '150m' },
  { value: '200', label: '200m' },
  { value: '250', label: '250m' },
];

const conversionMatrix: Record<string, Record<string, number>> = {
  '30': { '30': 1.0, '40': 1.2337, '50': 1.4673, '60': 1.701, '70': 1.9572, '80': 2.2136, '90': 2.4724, '100': 2.7286, '120': 3.2437, '150': 4.0427, '200': 5.4874, '250': 6.9673 },
  '40': { '30': 0.8106, '40': 1.0, '50': 1.1894, '60': 1.3789, '70': 1.5865, '80': 1.7941, '90': 2.004, '100': 2.2114, '120': 2.629, '150': 3.2764, '200': 4.4479, '250': 5.6479 },
  '50': { '30': 0.6816, '40': 0.8408, '50': 1.0, '60': 1.1596, '70': 1.3342, '80': 1.5088, '90': 1.6849, '100': 1.8595, '120': 2.2104, '150': 2.7551, '200': 3.7397, '250': 4.7484 },
  '60': { '30': 0.5878, '40': 0.7253, '60': 1.0, '70': 1.1506, '80': 1.3012, '90': 1.4532, '100': 1.6038, '120': 1.9063, '150': 2.3754, '200': 3.2244, '250': 4.0946 },
  '70': { '30': 0.5109, '40': 0.6303, '50': 0.7495, '60': 0.869, '70': 1.0, '80': 1.1309, '90': 1.2631, '100': 1.394, '120': 1.6571, '150': 2.0645, '200': 2.8019, '250': 3.5585 },
  '80': { '30': 0.4518, '40': 0.5574, '50': 0.6628, '60': 0.7684, '70': 0.8842, '80': 1.0, '90': 1.1169, '100': 1.2327, '120': 1.4651, '150': 1.8254, '200': 2.4779, '250': 3.1467 },
  '90': { '30': 0.4044, '40': 0.499, '50': 0.5936, '60': 0.6881, '70': 0.7918, '80': 0.8954, '90': 1.0, '100': 1.1036, '120': 1.3117, '150': 1.6344, '200': 2.2184, '250': 2.8172 },
  '100': { '30': 0.3665, '40': 0.4522, '50': 0.5378, '60': 0.6234, '70': 0.7174, '80': 0.8113, '90': 0.9061, '100': 1.0, '120': 1.1886, '150': 1.4808, '200': 2.01, '250': 2.5519 },
  '120': { '30': 0.3083, '40': 0.3804, '50': 0.4525, '60': 0.5245, '70': 0.6034, '80': 0.6824, '90': 0.7623, '100': 0.8413, '120': 1.0, '150': 1.2458, '200': 1.6908, '250': 2.1474 },
  '150': { '30': 0.2474, '40': 0.3053, '50': 0.3631, '60': 0.421, '70': 0.4844, '80': 0.5478, '90': 0.6119, '100': 0.6753, '120': 0.8028, '150': 1.0, '200': 1.3571, '250': 1.7237 },
  '200': { '30': 0.1823, '40': 0.2249, '50': 0.2675, '60': 0.3101, '70': 0.3569, '80': 0.4036, '90': 0.4508, '100': 0.4975, '120': 0.5915, '150': 0.7369, '200': 1.0, '250': 1.27 },
  '250': { '30': 0.1435, '40': 0.1771, '50': 0.2106, '60': 0.2442, '70': 0.281, '80': 0.3178, '90': 0.355, '100': 0.3918, '120': 0.4657, '150': 0.5802, '200': 0.7874, '250': 1.0 },
};

const formatTime = (seconds: number): string => (seconds ? seconds.toFixed(2) : '--');
const isElectronic = (distance: string): boolean => distance === '100' || distance === '200';
const parseInputTime = (value: string): number | null => {
  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '');
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

export const SprintTimePredictionScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedDistance, setSelectedDistance] = useState('100');
  const [inputTime, setInputTime] = useState('');
  const [showDistancePicker, setShowDistancePicker] = useState(false);

  const parsedTime = useMemo(() => parseInputTime(inputTime), [inputTime]);
  const predictions = useMemo(() => {
    if (!parsedTime) return {};
    const baseTime = parsedTime;
    if (baseTime <= 0) return {};

    const fromDist = parseFloat(selectedDistance);
    const normalized100m = baseTime * (100 / fromDist);
    if (normalized100m < 9 || normalized100m > 16) return {};

    const results: Record<string, number> = {};
    distances.forEach(({ value }) => {
      if (value === selectedDistance) return;
      const coefficient = conversionMatrix[selectedDistance]?.[value];
      if (!coefficient) return;
      results[value] = baseTime * coefficient;
    });
    return results;
  }, [parsedTime, selectedDistance]);

  const error =
    inputTime && (!parsedTime || Object.keys(predictions).length === 0)
      ? 'Enter a valid sprint time to see predictions.'
      : '';

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={{ paddingTop: insets.top }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <FontAwesome5 name="arrow-left" size={20} color={theme.colors.foreground} solid />
          </TouchableOpacity>
          <Text variant="h2" weight="bold" color="foreground">
            Sprint Time Predictions
          </Text>
          <View style={styles.backButton} />
        </View>

        <Text variant="body" color="muted" style={styles.subtitle}>
          30m to 250m Performance Calculator using Dick's (1987) algorithms
        </Text>

        <Card style={styles.inputCard}>
          <CardContent style={styles.cardContent}>
            <Text variant="body" weight="semiBold" color="foreground">
              Predictions based on a given distance and time
            </Text>
            <View style={styles.fieldGroup}>
              <Text variant="small" color="muted">Distance</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowDistancePicker(true)}
              >
                <Text variant="body" color="foreground">
                  {distances.find((d) => d.value === selectedDistance)?.label ?? 'Select'}
                </Text>
                <FontAwesome5 name="chevron-down" size={12} color={theme.colors.textMuted} solid />
              </TouchableOpacity>
            </View>
            <View style={styles.fieldGroup}>
              <Text variant="small" color="muted">Time (seconds)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter time in seconds"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
                value={inputTime}
                onChangeText={setInputTime}
              />
            </View>
            {!!error && (
              <Text variant="small" color="muted" style={styles.errorText}>
                {error}
              </Text>
            )}
          </CardContent>
        </Card>

        {Object.keys(predictions).length > 0 && (
          <Card style={styles.resultsCard}>
            <CardContent style={styles.cardContent}>
              <Text variant="body" weight="semiBold" color="foreground">
                Predicted Times
              </Text>
              <View style={styles.resultsGrid}>
                {distances.map(({ value, label }) => {
                  if (value === selectedDistance) {
                    return (
                      <View key={value} style={[styles.resultTile, styles.resultTileActive]}>
                        <Text variant="small" weight="bold" color="primary">
                          {label}
                        </Text>
                      <Text variant="h4" weight="bold" color="foreground">
                        {formatTime(parsedTime || 0)}s
                      </Text>
                        <Text variant="small" color="muted">
                          input
                        </Text>
                      </View>
                    );
                  }
                  if (!predictions[value]) return null;
                  return (
                    <View key={value} style={styles.resultTile}>
                      <Text variant="small" weight="bold" color="foreground">
                        {label}
                      </Text>
                      <Text variant="h4" weight="bold" color="foreground">
                        {formatTime(predictions[value])}s
                      </Text>
                      <Text variant="small" color="muted">
                        {isElectronic(value) ? 'Electronic' : 'Hand timing'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </CardContent>
          </Card>
        )}
      </ScrollView>

      <Modal visible={showDistancePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text variant="h3" weight="bold" color="foreground">
              Select Distance
            </Text>
            <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
              {distances.map((distance) => (
                <TouchableOpacity
                  key={distance.value}
                  style={styles.modalRow}
                  onPress={() => {
                    setSelectedDistance(distance.value);
                    setShowDistancePicker(false);
                  }}
                >
                  <Text variant="body" color="foreground">
                    {distance.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowDistancePicker(false)}>
              <Text variant="body" weight="semiBold" color="primary">
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  inputCard: {
    marginBottom: 0,
  },
  resultsCard: {
    marginBottom: 0,
  },
  cardContent: {
    gap: theme.spacing.md,
  },
  fieldGroup: {
    gap: theme.spacing.xs,
  },
  selectButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.card,
  },
  errorText: {
    color: theme.colors.destructive,
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  resultTile: {
    width: '48%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  resultTileActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '20',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.cardSolid,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    maxHeight: '80%',
  },
  modalRow: {
    paddingVertical: theme.spacing.sm,
  },
  modalClose: {
    alignSelf: 'flex-end',
  },
});

