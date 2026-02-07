import React, { ReactNode } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  StyleSheet,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scrollable ? (
          <ScrollView
            style={[styles.container, style]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={[
              styles.content,
              contentStyle,
              { paddingBottom: insets.bottom + theme.spacing.xl },
            ]}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.container, style]}>
            <View style={[styles.content, contentStyle]}>{children}</View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  keyboardContainer: { flex: 1 },
  container: { flex: 1 },
  content: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
});
