import React, { ReactNode } from 'react';
import { SafeAreaView, ScrollView, View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '@/utils/theme';

interface WebScreenProps {
  children: ReactNode;
  backgroundColor?: string;
  scrollable?: boolean;
  contentStyle?: ViewStyle;
  style?: ViewStyle;
}

export const WebScreen: React.FC<WebScreenProps> = ({
  children,
  backgroundColor = '#0b1220',
  scrollable = true,
  contentStyle,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const Wrapper = scrollable ? ScrollView : View;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <Wrapper
        style={[styles.container, style]}
        contentContainerStyle={
          scrollable
            ? [styles.content, contentStyle, { paddingBottom: insets.bottom + theme.spacing.xl }]
            : undefined
        }
      >
        {!scrollable ? <View style={[styles.content, contentStyle]}>{children}</View> : children}
      </Wrapper>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
});

