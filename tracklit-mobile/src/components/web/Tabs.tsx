import React, { createContext, useContext, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from '@/components/ui/Text';
import { spacing, borderRadius } from '@/utils/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const WebTabs: React.FC<TabsProps> = ({ defaultValue, value, onValueChange, children, style }) => {
  const [internal, setInternal] = useState(defaultValue || '');
  const current = value !== undefined ? value : internal;

  const ctx = useMemo<TabsContextValue>(
    () => ({
      value: current,
      setValue: (v: string) => {
        setInternal(v);
        onValueChange?.(v);
      },
    }),
    [current, onValueChange],
  );

  return (
    <TabsContext.Provider value={ctx}>
      <View style={style}>{children}</View>
    </TabsContext.Provider>
  );
};

export const WebTabsList: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => {
  const { styles } = useThemedStyles(createStyles);
  return <View style={[styles.list, style]}>{children}</View>;
};

interface TriggerProps {
  value: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const WebTabsTrigger: React.FC<TriggerProps> = ({ value, children, style }) => {
  const ctx = useTabs();
  const active = ctx.value === value;
  const { styles } = useThemedStyles(createStyles);
  return (
    <Pressable
      onPress={() => ctx.setValue(value)}
      style={[
        styles.trigger,
        active && styles.triggerActive,
        style,
      ]}
    >
      <Text variant="small" weight="medium" color={active ? 'foreground' : 'muted'}>
        {children}
      </Text>
    </Pressable>
  );
};

interface ContentProps {
  value: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const WebTabsContent: React.FC<ContentProps> = ({ value, children, style }) => {
  const ctx = useTabs();
  if (ctx.value !== value) return null;
  return <View style={[style, { marginTop: spacing.md }]}>{children}</View>;
};

const useTabs = () => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('WebTabs.* must be used within WebTabs');
  return ctx;
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  list: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    backgroundColor: t.colors.webChatBackground,
    borderWidth: 1,
    borderColor: t.colors.darkGray,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  trigger: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  triggerActive: {
    backgroundColor: t.colors.darkNavy,
    borderWidth: 1,
    borderColor: t.colors.darkGray,
  },
});
