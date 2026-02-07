import React from 'react';
import { View, type ViewProps } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';

type Props = ViewProps & {
  colors: string[];
  locations?: number[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
};

export const LinearGradient: React.FC<Props> = (props) => {
  const gradientProps = {
    ...props,
    start: props.start ?? { x: 0, y: 0 },
    end: props.end ?? { x: 1, y: 1 },
  };
  return <ExpoLinearGradient {...(gradientProps as any)} />;
};
