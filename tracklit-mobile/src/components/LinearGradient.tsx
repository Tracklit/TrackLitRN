import React from 'react';
import { UIManager, View, type ViewProps } from 'react-native';

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

  // Prefer Expo's implementation in Expo Go / Expo builds
  const ExpoImpl = tryRequireExpoLinearGradient();
  if (ExpoImpl) return <ExpoImpl {...(gradientProps as any)} />;

  // Fallback to RN community module (bare builds)
  const RNImpl = tryRequireRNLinearGradient();
  if (RNImpl) return <RNImpl {...(gradientProps as any)} />;

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

function tryRequireExpoLinearGradient(): React.ComponentType<any> | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('expo-linear-gradient');
    const Impl = mod?.LinearGradient ?? null;

    // In bare RN builds it's common to have the JS package installed but NOT have
    // Expo Modules native view managers registered (leading to UIManager crash).
    // Guard against that and fall back to react-native-linear-gradient instead.
    if (Impl && hasNativeViewManager('ViewManagerAdapter_ExpoLinearGradient')) return Impl;
    return null;
  } catch {
    return null;
  }
}

function tryRequireRNLinearGradient(): React.ComponentType<any> | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-linear-gradient');
    const Impl = mod?.default ?? mod ?? null;
    if (Impl && hasNativeViewManager('BVLinearGradient')) return Impl;
    return null;
  } catch {
    return null;
  }
}


