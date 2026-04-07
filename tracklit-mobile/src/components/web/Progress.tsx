import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { borderRadius } from '@/utils/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';

interface WebProgressProps {
  value: number; // 0-100
  style?: ViewStyle;
}

export const WebProgress: React.FC<WebProgressProps> = ({ value, style }) => {
  const { styles } = useThemedStyles(createStyles);
  const clamped = Math.min(Math.max(value, 0), 100);
  return (
    <View style={[styles.track, style]}>
      <View style={[styles.fill, { width: `${clamped}%` }]} />
    </View>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: t.colors.darkGray,
    borderRadius: borderRadius.round,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: t.colors.primary,
  },
});
