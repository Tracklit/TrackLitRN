import React from 'react';
import { UIManager, View, type ViewProps } from 'react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import RNLinearGradient from 'react-native-linear-gradient';

type Props = ViewProps & {
  colors: string[];
  locations?: number[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
};

/**
 * Expo Go does NOT include native modules from `react-native-linear-gradient` (BVLinearGradient),
 * so importing it directly will crash with:
 *   requireNativeComponent: "BVLinearGradient" was not found in the UIManager.
 *
 * This wrapper prefers `expo-linear-gradient` when available (Expo Go), otherwise falls back to
 * `react-native-linear-gradient` (bare RN), and finally to a plain View.
 */
export const LinearGradient: React.FC<Props> = (props) => {
  const gradientProps = {
    ...props,
    start: props.start ?? { x: 0, y: 0 },
    end: props.end ?? { x: 1, y: 1 },
  };

  // Prefer Expo's implementation in Expo / dev-client builds
  if (hasNativeViewManager('ViewManagerAdapter_ExpoLinearGradient')) {
    return <ExpoLinearGradient {...(gradientProps as any)} />;
  }

  // Fallback to RN community module (bare builds)
  if (hasNativeViewManager('BVLinearGradient')) {
    return <RNLinearGradient {...(gradientProps as any)} />;
  }

  // Last resort: no gradient support, just render children
  const { children, style, ...rest } = gradientProps;
  return (
    <View style={style} {...rest}>
      {children}
    </View>
  );
};

function hasNativeViewManager(viewManagerName: string): boolean {
  try {
    // RN 0.74+: getViewManagerConfig is the supported way to check registration
    const cfg = UIManager?.getViewManagerConfig?.(viewManagerName);
    return !!cfg;
  } catch {
    return false;
  }
}
