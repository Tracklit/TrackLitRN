import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  TextStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import theme from '@/utils/theme';
import { Text } from './Text';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  gradient?: boolean;
  opacity?: number;
  onPress?: () => void;
}

interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

interface CardDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
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
    const CardWrapper = onPress ? TouchableOpacity : View;
    return (
      <CardWrapper style={cardStyle} onPress={onPress} {...(onPress ? props : {})}>
        <LinearGradient
          colors={[
            `rgba(37, 42, 52, ${opacity})`,
            `rgba(26, 32, 44, ${opacity - 0.1})`
          ]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.gradientBackground}
        >
          {content}
        </LinearGradient>
      </CardWrapper>
    );
  }

  const CardWrapper = onPress ? TouchableOpacity : View;
  return (
    <CardWrapper style={cardStyle} onPress={onPress} {...(onPress ? props : {})}>
      {content}
    </CardWrapper>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({ children, style }) => (
  <View style={[styles.cardHeader, style]}>
    {children}
  </View>
);

export const CardContent: React.FC<CardContentProps> = ({ children, style }) => (
  <View style={[styles.cardContentInner, style]}>
    {children}
  </View>
);

export const CardFooter: React.FC<CardFooterProps> = ({ children, style }) => (
  <View style={[styles.cardFooter, style]}>
    {children}
  </View>
);

export const CardTitle: React.FC<CardTitleProps> = ({ children, style }) => (
  <Text variant="h4" weight="semiBold" style={[styles.cardTitle, style]}>
    {children}
  </Text>
);

export const CardDescription: React.FC<CardDescriptionProps> = ({ children, style }) => (
  <Text variant="body" color="secondary" style={[styles.cardDescription, style]}>
    {children}
  </Text>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  gradientCard: {
    backgroundColor: 'transparent',
    padding: 0,
    overflow: 'hidden',
  },
  gradientBackground: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    marginBottom: theme.spacing.md,
  },
  cardContentInner: {
    flex: 1,
  },
  cardFooter: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  cardTitle: {
    marginBottom: theme.spacing.sm,
  },
  cardDescription: {
    marginBottom: theme.spacing.md,
  },
});