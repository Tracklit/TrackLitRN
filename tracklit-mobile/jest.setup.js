/* global jest */

// ──────────────────────── React-Native-Safe-Area ────────────────────────
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
}));

// ──────────────────────── Vector Icons ────────────────────────
jest.mock('@expo/vector-icons/FontAwesome5', () => {
  const { View } = require('react-native');
  const MockIcon = (props) => {
    const { Text } = require('react-native');
    return <Text>{props.name}</Text>;
  };
  MockIcon.displayName = 'FontAwesome5';
  return MockIcon;
});

// ──────────────────────── LinearGradient ────────────────────────
jest.mock('@/components/LinearGradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, style, testID, ...rest }) =>
      <View style={style} testID={testID}>{children}</View>,
  };
});

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, style }) => <View style={style}>{children}</View>,
  };
});

jest.mock('react-native-linear-gradient', () => {
  const { View } = require('react-native');
  return ({ children, style }) => <View style={style}>{children}</View>;
});

// ──────────────────────── Reanimated ────────────────────────
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// ──────────────────────── Keyboard Aware Scroll ────────────────────────
jest.mock('react-native-keyboard-aware-scroll-view', () => {
  const React = require('react');
  const { ScrollView, FlatList, SectionList } = require('react-native');

  const KeyboardAwareScrollView = React.forwardRef((props, ref) => (
    <ScrollView ref={ref} {...props} />
  ));
  KeyboardAwareScrollView.displayName = 'KeyboardAwareScrollView';

  const KeyboardAwareFlatList = React.forwardRef((props, ref) => (
    <FlatList ref={ref} {...props} />
  ));
  KeyboardAwareFlatList.displayName = 'KeyboardAwareFlatList';

  const KeyboardAwareSectionList = React.forwardRef((props, ref) => (
    <SectionList ref={ref} {...props} />
  ));
  KeyboardAwareSectionList.displayName = 'KeyboardAwareSectionList';

  return {
    KeyboardAwareScrollView,
    KeyboardAwareFlatList,
    KeyboardAwareSectionList,
  };
});

// ──────────────────────── AsyncStorage ────────────────────────
const mockAsyncStorage = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => Promise.resolve(store[key] || null)),
    setItem: jest.fn((key, value) => {
      store[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      store = {};
      return Promise.resolve();
    }),
    multiGet: jest.fn((keys) =>
      Promise.resolve(keys.map((k) => [k, store[k] || null]))
    ),
    multiSet: jest.fn((pairs) => {
      pairs.forEach(([k, v]) => {
        store[k] = v;
      });
      return Promise.resolve();
    }),
    _getStore: () => store,
    _resetStore: () => {
      store = {};
    },
  };
})();

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// ──────────────────────── Navigation ────────────────────────
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReplace = jest.fn();

const mockUseRoute = jest.fn(() => ({ params: {} }));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    replace: mockReplace,
    dispatch: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
    removeListener: jest.fn(),
    canGoBack: jest.fn(() => true),
    isFocused: jest.fn(() => true),
    setOptions: jest.fn(),
  }),
  useRoute: mockUseRoute,
  useIsFocused: () => true,
  NavigationContainer: ({ children }) => children,
  useFocusEffect: jest.fn(),
}));

// ──────────────────────── Expo deps ────────────────────────
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('expo-linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(() => Promise.resolve({ type: 'cancel' })),
  openBrowserAsync: jest.fn(() => Promise.resolve()),
  maybeCompleteAuthSession: jest.fn(),
}));

// ──────────────────────── DateTimePicker ────────────────────────
jest.mock('@react-native-community/datetimepicker', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props) => <View testID="datetime-picker" />,
  };
});

// ──────────────────────── API ────────────────────────
jest.mock('@/lib/api', () => ({
  apiRequest: jest.fn(),
}));

jest.mock('@/lib/upload', () => ({
  uploadProgramFile: jest.fn(),
}));

// ──────────────────────── Auth Context ────────────────────────
const mockUser = {
  id: 1,
  name: 'Test User',
  username: 'testuser',
  email: 'test@example.com',
  isCoach: false,
};

const mockUseAuth = jest.fn(() => ({
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  hasValidToken: true,
  login: jest.fn(),
  loginWithToken: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  continueAsGuest: jest.fn(),
  refreshUser: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: mockUseAuth,
  AuthProvider: ({ children }) => children,
}));

// ──────────────────────── Config ────────────────────────
jest.mock('@/config/env', () => ({
  env: { API_BASE_URL: 'https://api.test.com' },
}));

// ──────────────────────── Token Storage ────────────────────────
jest.mock('@/lib/tokenStorage', () => ({
  getToken: jest.fn(() => Promise.resolve('test-token')),
  setToken: jest.fn(() => Promise.resolve()),
  clearAuthStorage: jest.fn(() => Promise.resolve()),
  getStoredUser: jest.fn(() => Promise.resolve(null)),
  setStoredUser: jest.fn(() => Promise.resolve()),
  debugAuthStorage: jest.fn(),
}));

// ──────────────────────── Layout Padding ────────────────────────
jest.mock('@/utils/layoutPadding', () => ({
  getBottomNavOverlayHeight: () => 80,
  getScreenContentBottomPadding: () => 120,
}));

// ──────────────────────── Lucide Icons ────────────────────────
jest.mock('lucide-react-native', () => new Proxy({}, {
  get: (_, name) => {
    const { View } = require('react-native');
    return (props) => <View testID={`lucide-${String(name)}`} />;
  },
}));

// ──────────────────────── Silence logs in tests ────────────────────────
global.console.log = jest.fn();
global.console.debug = jest.fn();

// Expose navigation mocks for tests
global.__mockNavigate = mockNavigate;
global.__mockGoBack = mockGoBack;
global.__mockReplace = mockReplace;
global.__mockAsyncStorage = mockAsyncStorage;
