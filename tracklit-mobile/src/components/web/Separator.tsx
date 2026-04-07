import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';

export const WebSeparator: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { styles } = useThemedStyles(createStyles);
  return <View style={[styles.sep, style]} />;
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.colors.border,
    width: '100%',
  },
});
