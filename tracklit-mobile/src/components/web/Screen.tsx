import React, { ReactNode } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/utils/theme';
import { useTheme } from '@/contexts/ThemeContext';
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
  backgroundColor,
  scrollable = true,
  contentStyle,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const bg = backgroundColor ?? theme.colors.webChatBackground;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      {scrollable ? (
        <KeyboardAwareScreenScrollView
          style={[styles.container, style]}
          contentContainerStyle={[
            styles.content,
            contentStyle,
            { paddingBottom: insets.bottom + spacing.xl },
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
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
});
