import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import theme from '@/utils/theme';
import type { RootStackParamList } from '@/navigation/types';
import { KeyboardAwareScreenScrollView } from '@/components/keyboard/KeyboardAwareScroll';

type TabKey = 'live' | 'manual' | 'calculator';

interface TimeEntry {
  id: string;
  distanceMeters: number;
  timeSeconds: number;
  speedMps: number;
  pacePer100m: string;
  createdAt: Date;
}

function formatTime(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const centiseconds = Math.floor((milliseconds % 1000) / 10);
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}

function formatPacePer100m(speedMps: number): string {
  if (!speedMps) return '0:00';
  const secondsPer100m = 100 / speedMps;
  const minutes = Math.floor(secondsPer100m / 60);
  const seconds = Math.floor(secondsPer100m % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export const VelocityTrackerScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [activeTab, setActiveTab] = useState<TabKey>('live');

  // Live timer state
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Entries
  const [entries, setEntries] = useState<TimeEntry[]>([]);

  // Split modal
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [splitDistance, setSplitDistance] = useState('');

  // Manual entry
  const [manualDistance, setManualDistance] = useState('');
  const [manualTime, setManualTime] = useState('');

  // Calculator
  const [calcDistance, setCalcDistance] = useState('');
  const [calcTime, setCalcTime] = useState('');

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedMs((prev) => prev + 10);
      }, 10);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const addEntry = (distanceMeters: number, timeSeconds: number) => {
    const speedMps = distanceMeters / timeSeconds;
    const pacePer100m = formatPacePer100m(speedMps);

    setEntries((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        distanceMeters,
        timeSeconds,
        speedMps,
        pacePer100m,
        createdAt: new Date(),
      },
      ...prev,
    ]);
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedMs(0);
  };

  const handleSplit = () => {
    setSplitDistance('');
    setSplitModalOpen(true);
  };

  const confirmSplit = () => {
    const dist = Number(splitDistance);
    const timeSeconds = elapsedMs / 1000;
    if (!dist || dist <= 0 || !timeSeconds) {
      setSplitModalOpen(false);
      return;
    }
    addEntry(dist, timeSeconds);
    setSplitModalOpen(false);
  };

  const addManual = () => {
    const dist = Number(manualDistance);
    const timeSeconds = Number(manualTime);
    if (!dist || dist <= 0 || !timeSeconds || timeSeconds <= 0) return;
    addEntry(dist, timeSeconds);
    setManualDistance('');
    setManualTime('');
  };

  const requiredSpeed = useMemo(() => {
    const dist = Number(calcDistance);
    const timeSeconds = Number(calcTime);
    if (!dist || dist <= 0 || !timeSeconds || timeSeconds <= 0) return null;
    return dist / timeSeconds;
  }, [calcDistance, calcTime]);

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <KeyboardAwareScreenScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={{ paddingTop: insets.top }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.spacing.xl }]}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={80}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <FontAwesome5 name="arrow-left" size={18} color={theme.colors.foreground} solid />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <View style={styles.titleRow}>
              <FontAwesome5 name="bolt" size={22} color={theme.colors.primary} solid />
              <Text variant="h2" weight="bold" color="foreground">
                Velocity Tracker
              </Text>
            </View>
            <Text variant="body" color="muted">
              Track speed from time + distance.
            </Text>
          </View>
          <View style={styles.backButton} />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'live' && styles.activeTab]}
            onPress={() => setActiveTab('live')}
          >
            <Text variant="small" weight="medium" color={activeTab === 'live' ? 'foreground' : 'muted'}>
              Live Timer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'manual' && styles.activeTab]}
            onPress={() => setActiveTab('manual')}
          >
            <Text variant="small" weight="medium" color={activeTab === 'manual' ? 'foreground' : 'muted'}>
              Manual
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'calculator' && styles.activeTab]}
            onPress={() => setActiveTab('calculator')}
          >
            <Text
              variant="small"
              weight="medium"
              color={activeTab === 'calculator' ? 'foreground' : 'muted'}
            >
              Calculator
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'live' && (
          <Card>
            <CardHeader>
              <CardTitle style={styles.cardTitleRow}>
                <FontAwesome5 name="stopwatch" size={16} color={theme.colors.primary} solid />
                <Text variant="body" weight="semiBold" color="foreground">
                  Stopwatch
                </Text>
              </CardTitle>
            </CardHeader>
            <CardContent style={{ gap: theme.spacing.md }}>
              <Text variant="h2" weight="bold" color="foreground" style={styles.monoTime}>
                {formatTime(elapsedMs)}
              </Text>

              <View style={styles.row}>
                <Button
                  variant="default"
                  onPress={() => setIsRunning((v) => !v)}
                  style={styles.flex1}
                >
                  <FontAwesome5
                    name={isRunning ? 'pause' : 'play'}
                    size={14}
                    color="white"
                    solid
                  />
                  <Text
                    variant="body"
                    weight="bold"
                    color="primary-foreground"
                    style={styles.buttonText}
                  >
                    {isRunning ? 'Pause' : 'Start'}
                  </Text>
                </Button>
                <Button variant="outline" onPress={handleReset} style={styles.flex1}>
                  Reset
                </Button>
              </View>

              <Button
                variant="outline"
                onPress={handleSplit}
                disabled={elapsedMs <= 0}
              >
                Add split (distance)
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'manual' && (
          <Card>
            <CardHeader>
              <CardTitle style={styles.cardTitleRow}>
                <FontAwesome5 name="calculator" size={16} color={theme.colors.primary} solid />
                <Text variant="body" weight="semiBold" color="foreground">
                  Manual entry
                </Text>
              </CardTitle>
            </CardHeader>
            <CardContent style={{ gap: theme.spacing.md }}>
              <TextInput
                style={styles.input}
                placeholder="Distance (meters)"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
                value={manualDistance}
                onChangeText={setManualDistance}
              />
              <TextInput
                style={styles.input}
                placeholder="Time (seconds)"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
                value={manualTime}
                onChangeText={setManualTime}
              />
              <Button variant="default" onPress={addManual}>
                <FontAwesome5 name="plus" size={14} color="white" solid />
                <Text variant="body" weight="bold" color="primary-foreground" style={styles.buttonText}>
                  Add
                </Text>
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'calculator' && (
          <Card>
            <CardHeader>
              <CardTitle style={styles.cardTitleRow}>
                <FontAwesome5 name="bullseye" size={16} color={theme.colors.primary} solid />
                <Text variant="body" weight="semiBold" color="foreground">
                  Required speed
                </Text>
              </CardTitle>
            </CardHeader>
            <CardContent style={{ gap: theme.spacing.md }}>
              <TextInput
                style={styles.input}
                placeholder="Distance (meters)"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
                value={calcDistance}
                onChangeText={setCalcDistance}
              />
              <TextInput
                style={styles.input}
                placeholder="Time (seconds)"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
                value={calcTime}
                onChangeText={setCalcTime}
              />

              <View style={styles.calcResult}>
                <Text variant="body" color="muted">
                  Required speed:
                </Text>
                <Text variant="h3" weight="bold" color="foreground">
                  {requiredSpeed ? `${requiredSpeed.toFixed(2)} m/s` : '--'}
                </Text>
                <Text variant="small" color="muted">
                  {requiredSpeed ? `~${formatPacePer100m(requiredSpeed)} per 100m` : 'Enter distance + time'}
                </Text>
              </View>
            </CardContent>
          </Card>
        )}

        <View style={styles.sectionHeaderRow}>
          <Text variant="h4" weight="semiBold" color="foreground">
            History
          </Text>
          {entries.length > 0 && (
            <TouchableOpacity onPress={() => setEntries([])}>
              <Text variant="small" color="muted">
                Clear
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {entries.length === 0 ? (
          <Text variant="body" color="muted" style={styles.emptyText}>
            No entries yet.
          </Text>
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            {entries.map((e) => (
              <Card key={e.id} style={{ marginBottom: 0 }}>
                <CardContent style={styles.entryRow}>
                  <View style={styles.entryLeft}>
                    <Text variant="body" weight="semiBold" color="foreground">
                      {e.distanceMeters}m
                    </Text>
                    <Text variant="small" color="muted">
                      {e.timeSeconds.toFixed(2)}s
                    </Text>
                  </View>
                  <View style={styles.entryRight}>
                    <Text variant="body" weight="bold" color="foreground">
                      {e.speedMps.toFixed(2)} m/s
                    </Text>
                    <Text variant="small" color="muted">
                      {e.pacePer100m} /100m
                    </Text>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </KeyboardAwareScreenScrollView>

      <Modal
        visible={splitModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSplitModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAwareScreenScrollView
            style={styles.modalCard}
            contentContainerStyle={[
              styles.modalCardContent,
              { paddingBottom: insets.bottom + theme.spacing.lg },
            ]}
            showsVerticalScrollIndicator={false}
            extraScrollHeight={80}
          >
            <Text variant="h4" weight="semiBold" color="foreground" style={styles.modalTitle}>
              Add split
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Distance (meters)"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="numeric"
              value={splitDistance}
              onChangeText={setSplitDistance}
            />
            <View style={styles.modalActions}>
              <Button variant="ghost" onPress={() => setSplitModalOpen(false)} style={styles.modalButton}>
                Cancel
              </Button>
              <Button variant="default" onPress={confirmSplit} style={styles.modalButton}>
                Add
              </Button>
            </View>
          </KeyboardAwareScreenScrollView>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  headerText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.colors.backgroundSolid,
  },
  monoTime: {
    textAlign: 'center',
    fontFamily: 'Menlo',
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  flex1: { flex: 1 },
  buttonText: { marginLeft: theme.spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.foreground,
    backgroundColor: theme.colors.card,
  },
  calcResult: {
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  emptyText: { textAlign: 'center', paddingVertical: theme.spacing.lg },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  entryLeft: { gap: 2 },
  entryRight: { alignItems: 'flex-end', gap: 2 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: theme.colors.backgroundSolid,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '85%',
  },
  modalCardContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  modalTitle: { textAlign: 'center' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
  },
  modalButton: { minWidth: 120 },
});
