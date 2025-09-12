import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { Text } from './Text';
import theme from '@/utils/theme';

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
  imageStyle?: ImageStyle;
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
  const avatarSize = sizes[size];
  
  const avatarStyle = [
    styles.avatar,
    { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
    style,
  ];

  const textSize = size === 'sm' ? 'small' : size === 'lg' ? 'body' : size === 'xl' ? 'h4' : 'caption';

  if (src) {
    return (
      <View style={avatarStyle}>
        <Image
          source={{ uri: src }}
          style={[styles.image, imageStyle, { borderRadius: avatarSize / 2 }]}
          accessibilityLabel={alt}
        />
      </View>
    );
  }

  // Fallback with initials
  const initials = fallback || alt?.substring(0, 2)?.toUpperCase() || '??';
  
  return (
    <View style={[avatarStyle, styles.fallback]}>
      <Text variant={textSize} weight="medium" color="primary">
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.muted,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    backgroundColor: theme.colors.primary,
  },
});