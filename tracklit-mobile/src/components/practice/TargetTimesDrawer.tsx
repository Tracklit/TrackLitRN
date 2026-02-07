import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { LinearGradient } from '@/components/LinearGradient';
import { Text } from '@/components/ui/Text';
import theme from '@/utils/theme';

const STORAGE_KEYS = {
  adjustForTrackType: 'tracklit_adjustForTrackType',
  currentTrackType: 'tracklit_currentTrackType',
  timingMethod: 'tracklit_timingMethod',
  goal100m: 'tracklit_goal100m',
  goal200m: 'tracklit_goal200m',
  goal400m: 'tracklit_goal400m',
  goalHurdles100: 'tracklit_goalHurdles100',
  goalHurdles400: 'tracklit_goalHurdles400',
};

type TrackType = 'indoor' | 'outdoor';
type TimingMethod = 'reaction' | 'firstFoot' | 'onMovement';

interface TargetTimesDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export const TargetTimesDrawer: React.FC<TargetTimesDrawerProps> = ({ visible, onClose }) => {
  const [adjustForTrackType, setAdjustForTrackType] = useState(false);
  const [currentTrackType, setCurrentTrackType] = useState<TrackType>('outdoor');
  const [timingMethod, setTimingMethod] = useState<TimingMethod>('firstFoot');
  const [goal100m, setGoal100m] = useState('11.0');
  const [goal200m, setGoal200m] = useState('22.5');
  const [goal400m, setGoal400m] = useState('50.0');
  const [goalHurdles100, setGoalHurdles100] = useState('13.5');
  const [goalHurdles400, setGoalHurdles400] = useState('54.0');

  useEffect(() => {
    const load = async () => {
      const adjust = await AsyncStorage.getItem(STORAGE_KEYS.adjustForTrackType);
      const track = await AsyncStorage.getItem(STORAGE_KEYS.currentTrackType);
      const timing = await AsyncStorage.getItem(STORAGE_KEYS.timingMethod);
      const g100 = await AsyncStorage.getItem(STORAGE_KEYS.goal100m);
      const g200 = await AsyncStorage.getItem(STORAGE_KEYS.goal200m);
      const g400 = await AsyncStorage.getItem(STORAGE_KEYS.goal400m);
      const gH100 = await AsyncStorage.getItem(STORAGE_KEYS.goalHurdles100);
      const gH400 = await AsyncStorage.getItem(STORAGE_KEYS.goalHurdles400);

      if (adjust !== null) setAdjustForTrackType(JSON.parse(adjust));
      if (track === 'indoor' || track === 'outdoor') setCurrentTrackType(track);
      if (timing === 'reaction' || timing === 'firstFoot' || timing === 'onMovement') {
        setTimingMethod(timing);
      }
      if (g100) setGoal100m(g100);
      if (g200) setGoal200m(g200);
      if (g400) setGoal400m(g400);
      if (gH100) setGoalHurdles100(gH100);
      if (gH400) setGoalHurdles400(gH400);
    };
    load();
  }, []);

  const saveString = async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value);
  };

  const saveBoolean = async (key: string, value: boolean) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  };

  const calculateTargetTimes = useMemo(() => {
    const baseTimesByDistance: Record<string, number> = {};

    const goal100 = parseFloat(goal100m);
    if (!isNaN(goal100) && goal100 > 0) {
      let adjusted100m = goal100;
      if (timingMethod === 'firstFoot') adjusted100m -= 0.55;
      if (timingMethod === 'onMovement') adjusted100m -= 0.15;

      baseTimesByDistance['50m'] = adjusted100m * 0.5;
      baseTimesByDistance['60m'] = adjusted100m * 0.6;
      baseTimesByDistance['80m'] = adjusted100m * 0.8;
      baseTimesByDistance['100m'] = adjusted100m;

      let time120m = adjusted100m * 1.2;
      let time150m = adjusted100m * 1.5;

      if (adjustForTrackType && currentTrackType === 'indoor') {
        time120m += 0.2;
        time150m += 0.42;
      }

      baseTimesByDistance['120m'] = time120m;
      baseTimesByDistance['150m'] = time150m;
    }

    const goal200 = parseFloat(goal200m);
    if (!isNaN(goal200) && goal200 > 0) {
      baseTimesByDistance['200m'] = goal200;
      baseTimesByDistance['250m'] = goal200 * 1.25;
      baseTimesByDistance['300m'] = goal200 * 1.5;
    }

    const goal400 = parseFloat(goal400m);
    if (!isNaN(goal400) && goal400 > 0) {
      let adjusted400m = goal400;
      if (timingMethod === 'firstFoot') adjusted400m -= 0.55;
      if (timingMethod === 'onMovement') adjusted400m -= 0.15;
      baseTimesByDistance['400m'] = adjusted400m;
    }

    const distances = Object.keys(baseTimesByDistance).sort((a, b) => {
      const getDistance = (d: string) => parseInt(d.replace('m', ''), 10);
      return getDistance(a) - getDistance(b);
    });

    const percentages = [60, 65, 70, 75, 80, 85, 90, 95, 100];

    return {
      distances,
      percentages,
      getTime: (distance: string, percentage: number) => {
        const baseTime = baseTimesByDistance[distance];
        if (!baseTime) return '-';
        const adjustedTime = baseTime * (100 / percentage);
        return adjustedTime.toFixed(2);
      },
    };
  }, [goal100m, goal200m, goal400m, timingMethod, adjustForTrackType, currentTrackType]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} />
      <View style={styles.drawer}>
        <LinearGradient
          colors={theme.gradients.webPurpleDeep.colors}
          start={theme.gradients.webPurpleDeep.start}
          end={theme.gradients.webPurpleDeep.end}
          style={styles.drawerContent}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <FontAwesome5 name="times" size={14} color="white" solid />
          </TouchableOpacity>

          <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Text variant="body" weight="semiBold" color="primary-foreground">
              Track Type
            </Text>
            <View style={styles.toggleRow}>
              {(['outdoor', 'indoor'] as TrackType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.toggleButton, currentTrackType === type && styles.toggleButtonActive]}
                  onPress={() => {
                    setCurrentTrackType(type);
                    saveString(STORAGE_KEYS.currentTrackType, type);
                  }}
                >
                  <Text
                    variant="small"
                    weight="medium"
                    color={currentTrackType === type ? 'primary-foreground' : 'primary-foreground'}
                  >
                    {type === 'outdoor' ? 'Outdoor' : 'Indoor'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inlineRow}>
              <View>
                <Text variant="body" weight="semiBold" color="primary-foreground">
                  Adjust for Track Type
                </Text>
                <Text variant="small" color="primary-foreground" style={styles.mutedText}>
                  Apply track-specific timing adjustments
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.switch, adjustForTrackType && styles.switchActive]}
                onPress={() => {
                  const next = !adjustForTrackType;
                  setAdjustForTrackType(next);
                  saveBoolean(STORAGE_KEYS.adjustForTrackType, next);
                }}
              >
                <View style={[styles.switchKnob, adjustForTrackType && styles.switchKnobActive]} />
              </TouchableOpacity>
            </View>

            <Text variant="body" weight="semiBold" color="primary-foreground">
              Timing Method
            </Text>
            <View style={styles.toggleRow}>
              {(['reaction', 'firstFoot', 'onMovement'] as TimingMethod[]).map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[styles.toggleButton, timingMethod === method && styles.toggleButtonActive]}
                  onPress={() => {
                    setTimingMethod(method);
                    saveString(STORAGE_KEYS.timingMethod, method);
                  }}
                >
                  <Text variant="small" weight="medium" color="primary-foreground">
                    {method === 'reaction' ? 'Reaction' : method === 'firstFoot' ? 'First Foot' : 'On Movement'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text variant="body" weight="semiBold" color="primary-foreground">
              Goal Times
            </Text>
            <View style={styles.inputGroup}>
              {[
                { label: '100m', value: goal100m, setter: setGoal100m, key: STORAGE_KEYS.goal100m },
                { label: '200m', value: goal200m, setter: setGoal200m, key: STORAGE_KEYS.goal200m },
                { label: '400m', value: goal400m, setter: setGoal400m, key: STORAGE_KEYS.goal400m },
                { label: 'Hurdles', value: goalHurdles100, setter: setGoalHurdles100, key: STORAGE_KEYS.goalHurdles100 },
                { label: '400H', value: goalHurdles400, setter: setGoalHurdles400, key: STORAGE_KEYS.goalHurdles400 },
              ].map((item) => (
                <View key={item.label} style={styles.inputRow}>
                  <Text variant="small" color="primary-foreground" style={styles.inputLabel}>
                    {item.label}
                  </Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={item.value}
                    onChangeText={(text) => {
                      const normalized = text.replace(',', '.');
                      item.setter(normalized);
                      saveString(item.key, normalized);
                    }}
                  />
                  <Text variant="small" color="primary-foreground" style={styles.inputUnit}>
                    sec
                  </Text>
                </View>
              ))}
            </View>

            <Text variant="body" weight="semiBold" color="primary-foreground">
              Target Times
            </Text>
            <View style={styles.tableContainer}>
              {calculateTargetTimes.distances.length === 0 ? (
                <Text variant="small" color="primary-foreground">
                  No goal times set in your profile.
                </Text>
              ) : (
                <View style={styles.tableWrapper}>
                  <View style={styles.tableFrozenColumn}>
                    <View style={styles.tableHeaderCell}>
                      <Text variant="small" weight="bold" color="primary-foreground">
                        Dist
                      </Text>
                    </View>
                    {calculateTargetTimes.distances.map((distance, index) => (
                      <View
                        key={`dist-${distance}`}
                        style={[styles.tableCell, index % 2 === 0 ? styles.tableRowDark : styles.tableRowLight]}
                      >
                        <Text variant="small" weight="semiBold" color="primary-foreground">
                          {distance}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag" horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.tableScrollable}>
                      {calculateTargetTimes.percentages.map((percentage) => (
                        <View key={`col-${percentage}`} style={styles.tableColumn}>
                          <View style={styles.tableHeaderCell}>
                            <Text variant="small" weight="bold" color="primary-foreground">
                              {percentage}%
                            </Text>
                          </View>
                          {calculateTargetTimes.distances.map((distance, index) => (
                            <View
                              key={`${distance}-${percentage}`}
                              style={[styles.tableCell, index % 2 === 0 ? styles.tableRowDark : styles.tableRowLight]}
                            >
                              <Text variant="small" color="primary-foreground">
                                {calculateTargetTimes.getTime(distance, percentage)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>

            <Text variant="small" color="primary-foreground" style={styles.mutedText}>
              Times are estimates based on selected track type and timing method.
            </Text>
          </ScrollView>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    width: '85%',
    maxWidth: 420,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(168, 85, 247, 0.3)',
  },
  drawerContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 2,
    padding: theme.spacing.sm,
  },
  scrollContent: {
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.9)',
    borderColor: 'rgba(124, 58, 237, 1)',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 3,
  },
  switchActive: {
    backgroundColor: 'rgba(124, 58, 237, 1)',
  },
  switchKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'white',
    transform: [{ translateX: 0 }],
  },
  switchKnobActive: {
    transform: [{ translateX: 18 }],
  },
  inputGroup: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  inputLabel: {
    width: 70,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    color: 'white',
    fontSize: theme.typography.sizes.sm,
  },
  inputUnit: {
    opacity: 0.7,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  tableWrapper: {
    flexDirection: 'row',
  },
  tableFrozenColumn: {
    width: 64,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.2)',
  },
  tableScrollable: {
    flexDirection: 'row',
  },
  tableColumn: {
    width: 56,
  },
  tableHeaderCell: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.4)',
  },
  tableCell: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  tableRowDark: {
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
  },
  tableRowLight: {
    backgroundColor: 'rgba(88, 28, 135, 0.3)',
  },
  mutedText: {
    opacity: 0.7,
  },
});

