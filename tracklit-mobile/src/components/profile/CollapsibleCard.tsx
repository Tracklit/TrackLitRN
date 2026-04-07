import React, { useCallback, useState } from 'react';
import { LayoutAnimation, Platform, UIManager, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { CardContent, CardHeader } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { spacing } from '@/utils/theme';
import { useTheme } from '@/contexts/ThemeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleCardProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  cardStyle?: any;
  headerStyle?: any;
  contentStyle?: any;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  subtitle,
  defaultOpen = true,
  children,
  cardStyle,
  headerStyle,
  contentStyle,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const { theme } = useTheme();

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((prev) => !prev);
  }, []);

  return (
    <Card style={[styles.card, cardStyle]}>
      <TouchableOpacity onPress={toggle} activeOpacity={0.8}>
        <CardHeader style={[styles.header, headerStyle]}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text variant="body" weight="semiBold" color="foreground">
                {title}
              </Text>
              {subtitle ? (
                <Text variant="small" color="muted" style={styles.subtitle}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <FontAwesome5
              name={open ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={theme.colors.textMuted}
            />
          </View>
        </CardHeader>
      </TouchableOpacity>
      {open && <CardContent style={[styles.content, contentStyle]}>{children}</CardContent>}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  header: {
    paddingVertical: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleBlock: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  subtitle: {
    marginTop: 0,
  },
  content: {
    paddingBottom: spacing.lg,
  },
});
