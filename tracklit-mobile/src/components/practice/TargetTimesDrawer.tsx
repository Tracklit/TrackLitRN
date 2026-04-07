import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X, Timer, Target, MapPin, Gauge, CaretDown, CaretRight } from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { KeyboardAwareScreenScrollView } from '@/components/keyboard/KeyboardAwareScroll';

import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';
const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 420);
const ANIM_DURATION = 280;
const easeOut = Easing.bezier(0.33, 1, 0.68, 1);


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

type OptionsSubPage = 'trackType' | 'timingMethod' | 'goalTimes';

export const TargetTimesDrawer: React.FC<TargetTimesDrawerProps> = ({ visible, onClose }) => {
  const { styles, theme } = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [adjustForTrackType, setAdjustForTrackType] = useState(false);
  const [currentTrackType, setCurrentTrackType] = useState<TrackType>('outdoor');
  const [timingMethod, setTimingMethod] = useState<TimingMethod>('firstFoot');
  const [goal100m, setGoal100m] = useState('11.0');
  const [goal200m, setGoal200m] = useState('22.5');
  const [goal400m, setGoal400m] = useState('50.0');
  const [goalHurdles100, setGoalHurdles100] = useState('13.5');
  const [goalHurdles400, setGoalHurdles400] = useState('54.0');
  const [isRendered, setIsRendered] = useState(false);

  const [optionsExpanded, setOptionsExpanded] = useState(false);
  const [optionsSubPage, setOptionsSubPage] = useState<OptionsSubPage>('trackType');

  const tableScrollRef = useRef<ScrollView>(null);

  const translateX = useSharedValue(DRAWER_WIDTH);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      translateX.value = withTiming(0, { duration: ANIM_DURATION, easing: easeOut });
      backdropOpacity.value = withTiming(1, { duration: ANIM_DURATION, easing: easeOut });
    } else if (isRendered) {
      translateX.value = withTiming(DRAWER_WIDTH, { duration: ANIM_DURATION, easing: easeOut });
      backdropOpacity.value = withTiming(0, { duration: ANIM_DURATION, easing: easeOut }, (finished) => {
        'worklet';
        if (finished) {
          runOnJS(setIsRendered)(false);
        }
      });
    }
  }, [visible]);

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

    const percentages = [60, 65, 70, 75, 80, 85, 90, 92, 95, 98, 100];

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

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!isRendered) return null;

  return (
    <View style={styles.overlay}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </TouchableWithoutFeedback>
      <Animated.View style={[styles.drawer, drawerStyle]}>
        <View style={[styles.drawerContent, { paddingTop: insets.top + 6 }]}>

          {/* Compact header */}
          <View style={styles.drawerHeader}>
            <View style={styles.drawerTitleRow}>
              <Timer size={16} color={theme.colors.brandOrange} weight="fill" />
              <Text style={styles.drawerTitle}>Target Times</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={13} color={theme.colors.textSecondary} weight="bold" />
            </TouchableOpacity>
          </View>

          <KeyboardAwareScreenScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            extraScrollHeight={80}
          >
            {/* Options — single collapsible with sub-page tabs */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => setOptionsExpanded((v) => !v)}
                activeOpacity={0.7}
              >
                <Gauge size={13} color={theme.colors.brandOrange} weight="fill" />
                <Text style={styles.sectionTitle}>Options</Text>
                <View style={styles.sectionCaret}>
                  {optionsExpanded
                    ? <CaretDown size={12} color={theme.colors.textMuted} weight="bold" />
                    : <CaretRight size={12} color={theme.colors.textMuted} weight="bold" />
                  }
                </View>
              </TouchableOpacity>

              {optionsExpanded && (
                <View style={styles.sectionBody}>
                  {/* Sub-page tab bar */}
                  <View style={styles.subTabBar}>
                    {([
                      { key: 'trackType', label: 'Track', icon: <MapPin size={11} color={optionsSubPage === 'trackType' ? theme.colors.brandOrange : theme.colors.textMuted} weight="fill" /> },
                      { key: 'timingMethod', label: 'Timing', icon: <Gauge size={11} color={optionsSubPage === 'timingMethod' ? theme.colors.brandOrange : theme.colors.textMuted} weight="fill" /> },
                      { key: 'goalTimes', label: 'Race Goals', icon: <Target size={11} color={optionsSubPage === 'goalTimes' ? theme.colors.brandOrange : theme.colors.textMuted} weight="fill" /> },
                    ] as { key: OptionsSubPage; label: string; icon: React.ReactNode }[]).map((tab) => (
                      <TouchableOpacity
                        key={tab.key}
                        style={[styles.subTab, optionsSubPage === tab.key && styles.subTabActive]}
                        onPress={() => setOptionsSubPage(tab.key)}
                        activeOpacity={0.7}
                      >
                        {tab.icon}
                        <Text style={[styles.subTabText, optionsSubPage === tab.key && styles.subTabTextActive]}>
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Sub-page content */}
                  {optionsSubPage === 'trackType' && (
                    <View style={styles.subPageContent}>
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
                            <Text style={[styles.toggleText, currentTrackType === type && styles.toggleTextActive]}>
                              {type === 'outdoor' ? 'Outdoor' : 'Indoor'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View style={styles.inlineRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inlineLabel}>Adjust for Track Type</Text>
                          <Text style={styles.inlineHint}>Apply track-specific timing adjustments</Text>
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
                    </View>
                  )}

                  {optionsSubPage === 'timingMethod' && (
                    <View style={styles.subPageContent}>
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
                            <Text style={[styles.toggleText, timingMethod === method && styles.toggleTextActive]}>
                              {method === 'reaction' ? 'Reaction' : method === 'firstFoot' ? 'First Foot' : 'Movement'}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {optionsSubPage === 'goalTimes' && (
                    <View style={styles.subPageContent}>
                      <View style={styles.inputGroup}>
                        {[
                          { label: '100m', value: goal100m, setter: setGoal100m, key: STORAGE_KEYS.goal100m },
                          { label: '200m', value: goal200m, setter: setGoal200m, key: STORAGE_KEYS.goal200m },
                          { label: '400m', value: goal400m, setter: setGoal400m, key: STORAGE_KEYS.goal400m },
                          { label: 'Hurdles', value: goalHurdles100, setter: setGoalHurdles100, key: STORAGE_KEYS.goalHurdles100 },
                          { label: '400H', value: goalHurdles400, setter: setGoalHurdles400, key: STORAGE_KEYS.goalHurdles400 },
                        ].map((item, idx) => (
                          <View key={item.label} style={[styles.inputRow, idx > 0 && styles.inputRowBorder]}>
                            <Text style={styles.inputLabel}>{item.label}</Text>
                            <TextInput
                              style={styles.input}
                              keyboardType="numeric"
                              value={item.value}
                              placeholderTextColor={theme.colors.textMuted}
                              onChangeText={(text) => {
                                const normalized = text.replace(',', '.');
                                item.setter(normalized);
                                saveString(item.key, normalized);
                              }}
                            />
                            <Text style={styles.inputUnit}>sec</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Speed Table — always visible, table scrolls from right */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderStatic}>
                <Timer size={13} color={theme.colors.brandOrange} weight="fill" />
                <Text style={styles.sectionTitle}>
                  Speed Table{'  '}
                  <Text style={styles.sectionSubtitle}>Change under options</Text>
                </Text>
              </View>
              <View style={styles.tableContainer}>
                {calculateTargetTimes.distances.length === 0 ? (
                  <View style={styles.tableEmpty}>
                    <Text style={styles.tableEmptyText}>Enter goal times above to see targets</Text>
                  </View>
                ) : (
                  <View style={styles.tableWrapper}>
                    <View style={styles.tableFrozenColumn}>
                      <View style={styles.tableHeaderCell}>
                        <Text style={styles.tableHeaderText}>Dist</Text>
                      </View>
                      {calculateTargetTimes.distances.map((distance, index) => (
                        <View
                          key={`dist-${distance}`}
                          style={[styles.tableCell, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}
                        >
                          <Text style={styles.tableCellDistText}>{distance}</Text>
                        </View>
                      ))}
                    </View>
                    <ScrollView
                      ref={tableScrollRef}
                      keyboardShouldPersistTaps="handled"
                      keyboardDismissMode="on-drag"
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      onContentSizeChange={() => {
                        tableScrollRef.current?.scrollToEnd({ animated: false });
                      }}
                    >
                      <View style={styles.tableScrollable}>
                        {calculateTargetTimes.percentages.map((percentage) => (
                          <View key={`col-${percentage}`} style={styles.tableColumn}>
                            <View style={styles.tableHeaderCell}>
                              <Text style={[styles.tableHeaderText, percentage === 100 && styles.tableHeaderAccent]}>
                                {percentage}%
                              </Text>
                            </View>
                            {calculateTargetTimes.distances.map((distance, index) => (
                              <View
                                key={`${distance}-${percentage}`}
                                style={[styles.tableCell, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}
                              >
                                <Text style={[styles.tableCellText, percentage === 100 && styles.tableCellAccent]}>
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
            </View>

            <Text style={styles.footnote}>
              Times are estimates based on selected track type and timing method.
            </Text>
          </KeyboardAwareScreenScrollView>
        </View>
      </Animated.View>
    </View>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 100,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    borderLeftWidth: 1,
    borderLeftColor: t.colors.border,
  },
  drawerContent: {
    flex: 1,
    backgroundColor: t.colors.backgroundSolid,
    paddingHorizontal: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  drawerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drawerTitle: {
    color: t.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  closeButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: t.colors.darkGray,
    borderWidth: 1,
    borderColor: t.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingTop: 6,
    paddingBottom: 32,
    gap: 14,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 4,
  },
  sectionHeaderStatic: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 4,
  },
  sectionTitle: {
    color: t.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    flex: 1,
  },
  sectionSubtitle: {
    color: t.colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  sectionCaret: {
    width: 16,
    alignItems: 'center',
  },
  sectionBody: {
    gap: 8,
  },
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: t.colors.darkGray,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: t.colors.border,
    padding: 3,
    gap: 2,
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 8,
  },
  subTabActive: {
    backgroundColor: t.colors.brandOrangeLight,
    borderWidth: 1,
    borderColor: t.colors.brandOrange + '40',
  },
  subTabText: {
    color: t.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  subTabTextActive: {
    color: t.colors.brandOrange,
  },
  subPageContent: {
    gap: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: t.colors.darkGray,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  toggleButtonActive: {
    backgroundColor: t.colors.brandOrangeLight,
    borderColor: t.colors.brandOrange + '40',
  },
  toggleText: {
    color: t.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: t.colors.brandOrange,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: t.colors.cardSolid,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  inlineLabel: {
    color: t.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  inlineHint: {
    color: t.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  switch: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: t.colors.overlayMedium,
    padding: 2,
  },
  switchActive: {
    backgroundColor: t.colors.brandOrange,
  },
  switchKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'white',
    transform: [{ translateX: 0 }],
  },
  switchKnobActive: {
    transform: [{ translateX: 16 }],
  },
  inputGroup: {
    backgroundColor: t.colors.cardSolid,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  inputRowBorder: {
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  },
  inputLabel: {
    width: 52,
    color: t.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: t.colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    color: t.colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
    backgroundColor: t.colors.overlaySubtle,
  },
  inputUnit: {
    color: t.colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 7,
    width: 22,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: t.colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: t.colors.cardSolid,
  },
  tableEmpty: {
    padding: 20,
    alignItems: 'center',
  },
  tableEmptyText: {
    color: t.colors.textMuted,
    fontSize: 12,
  },
  tableWrapper: {
    flexDirection: 'row',
  },
  tableFrozenColumn: {
    width: 52,
    borderRightWidth: 1,
    borderRightColor: t.colors.border,
  },
  tableScrollable: {
    flexDirection: 'row',
  },
  tableColumn: {
    width: 50,
  },
  tableHeaderCell: {
    paddingVertical: 7,
    alignItems: 'center',
    backgroundColor: t.colors.overlaySubtle,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  tableHeaderText: {
    color: t.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tableHeaderAccent: {
    color: t.colors.brandOrange,
  },
  tableCell: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: t.colors.overlaySubtle,
  },
  tableRowOdd: {
    backgroundColor: 'transparent',
  },
  tableCellDistText: {
    color: t.colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  tableCellText: {
    color: t.colors.textSecondary,
    fontSize: 11,
  },
  tableCellAccent: {
    color: t.colors.brandOrange,
    fontWeight: '600',
  },
  footnote: {
    color: t.colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 15,
  },
});
