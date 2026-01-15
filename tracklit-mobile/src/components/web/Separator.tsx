import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import theme from '@/utils/theme';

export const WebSeparator: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.sep, style]} />
);

const styles = StyleSheet.create({
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    width: '100%',
  },
});

