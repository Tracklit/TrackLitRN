import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TouchableOpacity,
  TouchableOpacityProps,
  TextStyle,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';
import { spacing, borderRadius } from '@/utils/theme';
import { Text } from './Text';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  gradient?: boolean;
  opacity?: number;
  onPress?: () => void;
}

interface CardHeaderProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface CardContentProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface CardFooterProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface CardTitleProps {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

interface CardDescriptionProps {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  contentStyle,
  gradient = false,
  opacity = 0.8,
  onPress,
  ...props
}) => {
  const { styles, theme } = useThemedStyles(createStyles);

  const cardStyle = [
    styles.card,
    gradient && styles.gradientCard,
    style,
  ];

  const content = (
    <View style={[styles.cardContent, contentStyle]}>
      {children}
    </View>
  );

  if (gradient) {
    const gradientDef = theme.gradients.cardGradient;
    const gradientContent = (
      <LinearGradient
        colors={gradientDef.colors}
        start={gradientDef.start}
        end={gradientDef.end}
        style={styles.gradientBackground}
      >
        {content}
      </LinearGradient>
    );

    if (onPress) {
      return (
        <TouchableOpacity style={cardStyle} onPress={onPress} {...props}>
          {gradientContent}
        </TouchableOpacity>
      );
    }

    return (
      <View style={cardStyle}>
        {gradientContent}
      </View>
    );
  }

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} {...props}>
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
      {content}
    </View>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({ children, style }) => {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={[styles.cardHeader, style]}>
      {children}
    </View>
  );
};

export const CardContent: React.FC<CardContentProps> = ({ children, style }) => {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={[styles.cardContentInner, style]}>
      {children}
    </View>
  );
};

export const CardFooter: React.FC<CardFooterProps> = ({ children, style }) => {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={[styles.cardFooter, style]}>
      {children}
    </View>
  );
};

export const CardTitle: React.FC<CardTitleProps> = ({ children, style }) => (
  <Text variant="h4" weight="semiBold" style={[staticStyles.cardTitle, style]}>
    {children}
  </Text>
);

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, style }) => (
  <Text variant="body" color="secondary" style={[staticStyles.cardDescription, style]}>
    {children}
  </Text>
);

const createStyles = (t: ThemeValues) => StyleSheet.create({
  card: {
    backgroundColor: t.colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...t.shadows.md,
    borderWidth: 1,
    borderColor: t.colors.border,
  },
  gradientCard: {
    backgroundColor: 'transparent',
    padding: 0,
    overflow: 'hidden',
  },
  gradientBackground: {
    flex: 1,
    padding: spacing.lg,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    marginBottom: spacing.md,
  },
  cardContentInner: {
    flex: 1,
  },
  cardFooter: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  },
});

const staticStyles = StyleSheet.create({
  cardTitle: {
    marginBottom: spacing.sm,
  },
  cardDescription: {
    marginBottom: spacing.md,
  },
});
