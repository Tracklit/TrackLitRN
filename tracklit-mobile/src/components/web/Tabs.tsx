import React, { createContext, useContext, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from '@/components/ui/Text';
import theme from '@/utils/theme';

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

export const WebTabsList: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => (
  <View style={[styles.list, style]}>{children}</View>
);

interface TriggerProps {
  value: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const WebTabsTrigger: React.FC<TriggerProps> = ({ value, children, style }) => {
  const ctx = useTabs();
  const active = ctx.value === value;
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
  return <View style={[style, { marginTop: theme.spacing.md }]}>{children}</View>;
};

const useTabs = () => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('WebTabs.* must be used within WebTabs');
  return ctx;
};

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  trigger: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  triggerActive: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
});

