// Mock React Native components for TypeScript compatibility
// In a real React Native environment, these would come from react-native

export const View = 'div' as any;
export const Text = 'span' as any;
export const ScrollView = 'div' as any;
export const FlatList = 'div' as any;
export const TextInput = 'input' as any;
export const TouchableOpacity = 'button' as any;
export const Pressable = 'button' as any;
export const StyleSheet = {
  create: (styles: any) => styles,
};

export const Platform = {
  OS: 'ios' as 'ios' | 'android',
};

export const Dimensions = {
  get: (dimension: 'window' | 'screen') => ({
    width: 375,
    height: 812,
  }),
};

export const Keyboard = {
  addListener: (event: string, callback: (e: any) => void) => ({
    remove: () => {},
  }),
  dismiss: () => {},
};

export const Alert = {
  alert: (title: string, message?: string, buttons?: any[]) => {
    console.log('Alert:', title, message);
  },
};

export const RefreshControl = (props: any) => null;

// Gesture Handler Mocks
export const PanGestureHandler = ({ children }: { children: any }) => children;
export const State = {
  BEGAN: 'BEGAN',
  ACTIVE: 'ACTIVE',
  END: 'END',
  CANCELLED: 'CANCELLED',
};

// Reanimated Mocks
export const useSharedValue = (initial: any) => ({ value: initial });
export const useAnimatedGestureHandler = (handler: any) => handler;
export const useAnimatedStyle = (style: any) => style;
export const runOnJS = (fn: any) => fn;
export const withSpring = (value: any) => value;
export const withTiming = (value: any, config?: any, callback?: any) => {
  if (callback) callback();
  return value;
};

export const Animated = {
  View: 'div' as any,
};

// Safe Area Context Mock
export const SafeAreaView = ({ children }: { children: any }) => children;