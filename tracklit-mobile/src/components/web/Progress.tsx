import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import theme from '@/utils/theme';

interface WebProgressProps {
  value: number; // 0-100
  style?: ViewStyle;
}

export const WebProgress: React.FC<WebProgressProps> = ({ value, style }) => {
  const clamped = Math.min(Math.max(value, 0), 100);
  return (
    <View style={[styles.track, style]}>
      <View style={[styles.fill, { width: `${clamped}%` }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: '#1f2937',
    borderRadius: theme.borderRadius.round,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
});

