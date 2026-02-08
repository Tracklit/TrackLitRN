import React, { ReactNode } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '@/utils/theme';
import { KeyboardAwareScreenScrollView } from '@/components/keyboard/KeyboardAwareScroll';

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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      {scrollable ? (
        <KeyboardAwareScreenScrollView
          style={[styles.container, style]}
          contentContainerStyle={[
            styles.content,
            contentStyle,
            { paddingBottom: insets.bottom + theme.spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </KeyboardAwareScreenScrollView>
      ) : (
        <View style={[styles.container, style]}>
          <View style={[styles.content, contentStyle]}>{children}</View>
        </View>
      )}
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
