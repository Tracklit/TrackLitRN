import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  ViewStyle,
  ImageStyle,
  StyleProp,
} from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { Text } from './Text';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

const sizes = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  fallback,
  size = 'md',
  style,
  imageStyle,
}) => {
  const { styles, theme } = useThemedStyles(createStyles);
  const avatarSize = sizes[size];

  const avatarStyle: StyleProp<ViewStyle> = [
    styles.avatar,
    { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
    style,
  ];

  const textSize =
    size === 'sm'
      ? 'small'
      : size === 'lg'
      ? 'body'
      : size === 'xl'
      ? 'h4'
      : 'caption';

  if (src) {
    return (
      <View style={avatarStyle}>
        <Image
          source={{ uri: src }}
          style={[staticStyles.image, imageStyle, { borderRadius: avatarSize / 2 }]}
          accessibilityLabel={alt}
        />
      </View>
    );
  }

  const initials = fallback || alt?.substring(0, 2)?.toUpperCase() || null;

  return (
    <View style={[avatarStyle, styles.fallback]}>
      {initials ? (
        <Text variant={textSize} weight="medium" color="primary-foreground">
          {initials}
        </Text>
      ) : (
        <FontAwesome5
          name="user"
          size={avatarSize * 0.45}
          color={theme.colors.primary}
        />
      )}
    </View>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.muted,
  },
  fallback: {
    backgroundColor: t.colors.primary,
  },
});

const staticStyles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});
