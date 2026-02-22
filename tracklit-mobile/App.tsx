import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  StatusBar,
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  NavigationContainer,
  createNavigationContainerRef,
  type NavigationState,
  type PartialState,
} from '@react-navigation/native';
import { createBottomTabNavigator, type BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createDrawerNavigator,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import {
  House,
  Barbell,
  Book,
  Clock,
  Heart,
  ChatCircleDots,
  Trophy,
  ChartLineUp,
  ShoppingCart,
  UserCheck,
  Newspaper,
  Target,
  Users,
  Medal,
  ShieldCheck,
  CurrencyCircleDollar,
  Gear,
  SignOut,
  ArrowLeft,
  X,
  UserCircle,
} from 'phosphor-react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { OnboardingProvider, useOnboarding } from './src/contexts/OnboardingContext';
import { Text } from './src/components/ui/Text';

import { HomeScreen } from './src/screens/HomeScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { PracticeScreen } from './src/screens/PracticeScreen';
import { ProgramsScreen } from './src/screens/ProgramsScreen';
import { ProgramDetailScreen } from './src/screens/ProgramDetailScreen';
import { ToolsScreen } from './src/screens/ToolsScreen';
import { BottomNavigation } from './src/navigation/BottomNavigation';
import { FeedScreen } from './src/screens/FeedScreen';
import { MarketplaceScreen } from './src/screens/MarketplaceScreen';
import { MarketplaceListingDetailScreen } from './src/screens/MarketplaceListingDetailScreen';
import { MarketplaceCartScreen } from './src/screens/MarketplaceCartScreen';
import { MarketplaceCreateListingScreen } from './src/screens/MarketplaceCreateListingScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { FeedDetailScreen } from './src/screens/FeedDetailScreen';
import { StopwatchScreen } from './src/screens/StopwatchScreen';
import { StartGunScreen } from './src/screens/StartGunScreen';
import { PhotoFinishScreen } from './src/screens/PhotoFinishScreen';
import { PhotoFinishAnalysisScreen } from './src/screens/PhotoFinishAnalysisScreen';
import { JournalScreen } from './src/screens/JournalScreen';
import { JournalEntryScreen } from './src/screens/JournalEntryScreen';
import { IntervalTimerScreen } from './src/screens/IntervalTimerScreen';
import { SprinthiaScreen } from './src/screens/SprinthiaScreen';
import { MeetsScreen } from './src/screens/MeetsScreen';
import { CreateMeetScreen } from './src/screens/CreateMeetScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { ChatConversationScreen } from './src/screens/ChatConversationScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { ConnectionsScreen } from './src/screens/ConnectionsScreen';
import { CoachesScreen } from './src/screens/CoachesScreen';
import { AthletesScreen } from './src/screens/AthletesScreen';
import { RehabScreen } from './src/screens/RehabScreen';
import { HamstringRehabProgramScreen } from './src/screens/rehab/HamstringRehabProgramScreen';
import { FootRehabProgramScreen } from './src/screens/rehab/FootRehabProgramScreen';
import { RehabProgramComingSoonScreen } from './src/screens/rehab/RehabProgramComingSoonScreen';
import { SpikesScreen } from './src/screens/SpikesScreen';
import { SubscriptionsScreen } from './src/screens/SubscriptionsScreen';
import { PublicProfileScreen } from './src/screens/PublicProfileScreen';
import { ClubsScreen } from './src/screens/ClubsScreen';
import { ClubDetailScreen } from './src/screens/ClubDetailScreen';
import { ClubManagementScreen } from './src/screens/ClubManagementScreen';
import { CreateGroupScreen } from './src/screens/CreateGroupScreen';
import { ProgramCreateScreen } from './src/screens/ProgramCreateScreen';
import { ProgramEditorScreen } from './src/screens/ProgramEditorScreen';
import { ExerciseLibraryScreen } from './src/screens/ExerciseLibraryScreen';
import { ExerciseLibraryAddScreen } from './src/screens/ExerciseLibraryAddScreen';
import { VelocityTrackerScreen } from './src/screens/VelocityTrackerScreen';
import { SprintTimePredictionScreen } from './src/screens/SprintTimePredictionScreen';
import type { TabParamList, RootStackParamList, AuthStackParamList } from './src/navigation/types';
import { queryClient } from './src/lib/queryClient';

import theme from './src/utils/theme';
import { OnboardingOverlay } from './src/onboarding/OnboardingOverlay';

const Tab = createBottomTabNavigator<TabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Drawer = createDrawerNavigator();
const navigationRef = createNavigationContainerRef();
const TAB_ROUTE_NAMES = new Set(['Home', 'Practice', 'Programs', 'Feed', 'Tools', 'Profile']);
const LOCAL_BACK_ROUTE_NAMES = new Set<keyof RootStackParamList>([
  'MarketplaceListingDetail',
  'MarketplaceCart',
  'MarketplaceCreateListing',
  'Settings',
  'Stopwatch',
  'StartGun',
  'PhotoFinish',
  'PhotoFinishAnalysis',
  'Journal',
  'JournalEntry',
  'IntervalTimer',
  'ExerciseLibrary',
  'ExerciseLibraryAdd',
  'VelocityTracker',
  'SprintTimePrediction',
  'ProgramDetail',
  'ProgramCreate',
  'ProgramEditor',
  'Meets',
  'CreateMeet',
  'Results',
  'Chat',
  'ChatConversation',
  'Notifications',
  'Connections',
  'PublicProfile',
  'Coaches',
  'Athletes',
  'Clubs',
  'ClubDetail',
  'ClubManagement',
  'CreateGroup',
  'Rehab',
  'RehabHamstringProgram',
  'RehabFootProgram',
  'RehabProgramComingSoon',
  'Spikes',
  'Subscriptions',
]);

type AnyNavState = NavigationState | PartialState<NavigationState>;

const getDeepestActiveRouteName = (state?: AnyNavState): string | undefined => {
  if (!state?.routes?.length) return undefined;
  let currentState: AnyNavState | undefined = state;
  let routeName: string | undefined;

  while (currentState?.routes?.length) {
    const index = currentState.index ?? 0;
    const route = currentState.routes[index] as any;
    routeName = route?.name;
    currentState = route?.state as AnyNavState | undefined;
  }

  return routeName;
};

const isDrawerOpen = (state?: AnyNavState): boolean => {
  if (!state?.routes?.length) return false;

  const typedState = state as any;
  if (typedState.type === 'drawer') {
    const drawerHistory = (typedState.history ?? []).find((entry: any) => entry?.type === 'drawer');
    if (drawerHistory?.status === 'open') {
      return true;
    }
  }

  return state.routes.some((route: any) => isDrawerOpen(route?.state as AnyNavState | undefined));
};

type HomeTabProps = BottomTabScreenProps<TabParamList, 'Home'>;

const HomeTabScreen: React.FC<HomeTabProps> = ({ navigation }) => (
  <HomeScreen
    onNavigate={(routeName) => {
      // Some destinations are now stack screens (not bottom tabs).
      if (routeName === 'Marketplace') {
        (navigation.getParent() as any)?.navigate?.('Marketplace');
        return;
      }
      if (routeName === 'Chat') {
        (navigation.getParent() as any)?.navigate?.('Chat');
        return;
      }
      if (routeName === 'Notifications') {
        (navigation.getParent() as any)?.navigate?.('Notifications');
        return;
      }
      if (routeName === 'Sprinthia') {
        (navigation.getParent() as any)?.navigate?.('Sprinthia');
        return;
      }
      navigation.navigate(routeName as keyof TabParamList);
    }}
  />
);

const MainTabs: React.FC = () => {
  return (
    <View style={styles.mainTabsContainer}>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <BottomNavigation {...props} />}
      >
        <Tab.Screen name="Home" component={HomeTabScreen} />
        <Tab.Screen name="Practice" component={PracticeScreen} />
        <Tab.Screen name="Programs" component={ProgramsScreen} />
        <Tab.Screen name="Feed" component={FeedScreen} />
        <Tab.Screen name="Tools" component={ToolsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </View>
  );
};

const RootNavigator: React.FC = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="MainTabs" component={MainTabs} />
    <RootStack.Screen name="Marketplace" component={MarketplaceScreen} />
    <RootStack.Screen name="MarketplaceListingDetail" component={MarketplaceListingDetailScreen} />
    <RootStack.Screen name="MarketplaceCart" component={MarketplaceCartScreen} />
    <RootStack.Screen name="MarketplaceCreateListing" component={MarketplaceCreateListingScreen} />
    <RootStack.Screen name="Settings" component={SettingsScreen} />
    <RootStack.Screen name="FeedPost" component={FeedDetailScreen} />
    <RootStack.Screen name="PublicProfile" component={PublicProfileScreen} />
    <RootStack.Screen name="Stopwatch" component={StopwatchScreen} />
    <RootStack.Screen name="StartGun" component={StartGunScreen} />
    <RootStack.Screen name="PhotoFinish" component={PhotoFinishScreen} />
    <RootStack.Screen name="PhotoFinishAnalysis" component={PhotoFinishAnalysisScreen} />
    <RootStack.Screen name="Journal" component={JournalScreen} />
    <RootStack.Screen name="JournalEntry" component={JournalEntryScreen} />
    <RootStack.Screen name="IntervalTimer" component={IntervalTimerScreen} />
    <RootStack.Screen name="ExerciseLibrary" component={ExerciseLibraryScreen} />
    <RootStack.Screen name="ExerciseLibraryAdd" component={ExerciseLibraryAddScreen} />
    <RootStack.Screen name="VelocityTracker" component={VelocityTrackerScreen} />
    <RootStack.Screen name="SprintTimePrediction" component={SprintTimePredictionScreen} />
    <RootStack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
    <RootStack.Screen name="ProgramCreate" component={ProgramCreateScreen} />
    <RootStack.Screen name="ProgramEditor" component={ProgramEditorScreen} />
    <RootStack.Screen name="Meets" component={MeetsScreen} />
    <RootStack.Screen name="CreateMeet" component={CreateMeetScreen} />
    <RootStack.Screen name="Results" component={ResultsScreen} />
    <RootStack.Screen name="Chat" component={ChatScreen} />
    <RootStack.Screen name="ChatConversation" component={ChatConversationScreen} />
    <RootStack.Screen name="Notifications" component={NotificationsScreen} />
    <RootStack.Screen name="Connections" component={ConnectionsScreen} />
    <RootStack.Screen name="Coaches" component={CoachesScreen} />
    <RootStack.Screen name="Athletes" component={AthletesScreen} />
    <RootStack.Screen name="Clubs" component={ClubsScreen} />
    <RootStack.Screen name="ClubDetail" component={ClubDetailScreen} />
    <RootStack.Screen name="ClubManagement" component={ClubManagementScreen} />
    <RootStack.Screen name="CreateGroup" component={CreateGroupScreen} />
    <RootStack.Screen name="Sprinthia" component={SprinthiaScreen} />
    <RootStack.Screen name="Rehab" component={RehabScreen} />
    <RootStack.Screen name="RehabHamstringProgram" component={HamstringRehabProgramScreen} />
    <RootStack.Screen name="RehabFootProgram" component={FootRehabProgramScreen} />
    <RootStack.Screen name="RehabProgramComingSoon" component={RehabProgramComingSoonScreen} />
    <RootStack.Screen name="Spikes" component={SpikesScreen} />
    <RootStack.Screen name="Subscriptions" component={SubscriptionsScreen} />
  </RootStack.Navigator>
);

const DrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const isGuest = user?.id === 'guest';
  const isCoach = (user as any)?.isCoach === true;
  const isAdmin = (user as any)?.role === 'admin';

  const navigateIntoAppStack = (params: any) => {
    (props.navigation as any).navigate('AppStack', params);
    props.navigation.closeDrawer();
  };

  type MenuItem = {
    label: string;
    IconComponent: React.ComponentType<{ size?: number; color?: string; weight?: string }>;
    onPress?: () => void;
    disabled?: boolean;
    comingSoon?: boolean;
    requiresCoach?: boolean;
    requiresAdmin?: boolean;
  };

  const MenuRow: React.FC<MenuItem> = ({
    label,
    IconComponent,
    onPress,
    disabled,
    comingSoon,
  }) => {
    const content = (
      <View
        style={[
          styles.menuRow,
          disabled && styles.menuRowDisabled,
        ]}
      >
        <View style={styles.menuRowLeft}>
          <View style={styles.menuRowIcon}>
            <IconComponent
              size={14}
              color={disabled ? theme.colors.muted : theme.colors.sidebarForeground}
              weight="fill"
            />
          </View>
          <Text
            variant="small"
            weight="medium"
            color={disabled ? 'muted' : 'foreground'}
          >
            {label}
          </Text>
        </View>
        {comingSoon && (
          <View style={styles.comingSoonPill}>
            <Text variant="caption" color="muted">
              Coming Soon
            </Text>
          </View>
        )}
      </View>
    );

    if (disabled || !onPress) {
      return content;
    }

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.menuRowTouchable}
      >
        {content}
      </TouchableOpacity>
    );
  };

  const sections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Dashboard',
      items: [
        {
          label: 'Dashboard',
          IconComponent: House,
          onPress: () =>
            navigateIntoAppStack({ screen: 'MainTabs', params: { screen: 'Home' } }),
        },
      ],
    },
    {
      title: 'TRAINING',
      items: [
        {
          label: 'Practice',
          IconComponent: Barbell,
          onPress: () =>
            navigateIntoAppStack({ screen: 'MainTabs', params: { screen: 'Practice' } }),
        },
        {
          label: 'Programs',
          IconComponent: Book,
          onPress: () =>
            navigateIntoAppStack({ screen: 'MainTabs', params: { screen: 'Programs' } }),
        },
        {
          label: 'Training Tools',
          IconComponent: Clock,
          onPress: () =>
            navigateIntoAppStack({ screen: 'MainTabs', params: { screen: 'Tools' } }),
        },
        {
          label: 'Rehabilitation',
          IconComponent: Heart,
          onPress: () =>
            navigateIntoAppStack({ screen: 'Rehab' }),
        },
        {
          label: 'Sprinthia',
          IconComponent: ChatCircleDots,
          onPress: () =>
            navigateIntoAppStack({ screen: 'Sprinthia' }),
        },
      ],
    },
    {
      title: 'COMPETITION',
      items: [
        {
          label: 'Meets',
          IconComponent: Trophy,
          disabled: true,
          comingSoon: true,
        },
        {
          label: 'Results',
          IconComponent: ChartLineUp,
          disabled: true,
          comingSoon: true,
        },
      ],
    },
    {
      title: 'MARKETPLACE',
      items: [
        {
          label: 'Marketplace',
          IconComponent: ShoppingCart,
          disabled: true,
          comingSoon: true,
        },
      ],
    },
    {
      title: 'SOCIAL',
      items: [
        {
          label: 'Connections',
          IconComponent: UserCheck,
          onPress: () =>
            navigateIntoAppStack({ screen: 'Connections' }),
        },
        {
          label: 'Feed',
          IconComponent: Newspaper,
          onPress: () =>
            navigateIntoAppStack({ screen: 'MainTabs', params: { screen: 'Feed' } }),
        },
        {
          label: 'Group Chat',
          IconComponent: ChatCircleDots,
          onPress: () =>
            navigateIntoAppStack({ screen: 'Chat' }),
        },
        {
          label: 'My Athletes',
          IconComponent: Target,
          requiresCoach: true,
          onPress: () =>
            navigateIntoAppStack({ screen: 'Athletes' }),
        },
        {
          label: 'Roster Stats',
          IconComponent: ChartLineUp,
          requiresCoach: true,
          disabled: true,
          comingSoon: true,
        },
        {
          label: 'Athletes',
          IconComponent: Users,
          onPress: () =>
            navigateIntoAppStack({ screen: 'Athletes' }),
        },
        {
          label: 'Coaches',
          IconComponent: Medal,
          onPress: () =>
            navigateIntoAppStack({ screen: 'Coaches' }),
        },
        {
          label: 'Groups',
          IconComponent: Users,
          disabled: true,
          comingSoon: true,
        },
      ],
    },
    {
      title: 'ADMIN',
      items: [
        {
          label: 'Admin Panel',
          IconComponent: ShieldCheck,
          requiresAdmin: true,
          onPress: () =>
            navigateIntoAppStack({ screen: 'AppStack', params: { screen: 'Settings' } }),
        },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        {
          label: 'My Profile',
          IconComponent: UserCircle,
          disabled: isGuest || !user?.id,
          onPress: () => {
            if (isGuest || !user?.id) return;
            navigateIntoAppStack({
              screen: 'PublicProfile',
              params: {
                userId: Number(user.id),
                name: (user as any)?.name || null,
                username: (user as any)?.username || null,
                profileImageUrl: (user as any)?.profileImageUrl || null,
              },
            });
          },
        },
        {
          label: 'Account & Settings',
          IconComponent: Gear,
          onPress: () =>
            navigateIntoAppStack({ screen: 'Settings' }),
        },
        {
          label: 'Spikes',
          IconComponent: CurrencyCircleDollar,
          onPress: () =>
            navigateIntoAppStack({ screen: 'Spikes' }),
        },
        {
          label: 'My Subscriptions',
          IconComponent: Heart,
          onPress: () =>
            navigateIntoAppStack({ screen: 'Subscriptions' }),
        },
      ],
    },
  ];

  return (
    <View style={styles.drawerContainer} onStartShouldSetResponder={() => true}>
      <View style={[styles.drawerCloseRow, { paddingTop: insets.top + theme.spacing.md }]}>
        <TouchableOpacity
          onPress={() => props.navigation.closeDrawer()}
          activeOpacity={0.7}
          style={styles.drawerCloseButton}
          accessibilityRole="button"
          accessibilityLabel="Close menu"
        >
          <X size={18} color="rgba(255,255,255,0.85)" weight="bold" />
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={[
          styles.drawerScroll,
          {
            paddingBottom: Math.max(insets.bottom, theme.spacing.lg),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >

      {sections.map((section) => {
        const filteredItems = section.items.filter((item) => {
          if (item.requiresCoach && !isCoach) return false;
          if (item.requiresAdmin && !isAdmin) return false;
          return true;
        });

        if (!filteredItems.length) return null;

        return (
          <View style={styles.drawerSection} key={section.title}>
        <Text variant="small" color="muted" style={styles.drawerSectionLabel}>
              {section.title}
        </Text>
            {filteredItems.map((item) => (
              <MenuRow key={item.label} {...item} />
            ))}
      </View>
        );
      })}

      <View style={styles.drawerFooter}>
        <TouchableOpacity
          onPress={() => logout()}
          activeOpacity={0.7}
        >
          <View style={styles.menuRow}>
            <View style={styles.menuRowLeft}>
              <View style={styles.menuRowIcon}>
                <SignOut
                  size={14}
                  color={theme.colors.destructive}
                  weight="fill"
                />
              </View>
              <Text
                variant="small"
                weight="medium"
                style={{ color: theme.colors.destructive }}
              >
                {isGuest ? 'Exit Guest' : 'Sign Out'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        {isGuest && (
          <Text variant="small" color="muted" style={styles.drawerGuestNote}>
            Guest mode limits community, chat, and posting features.
          </Text>
        )}
      </View>
      </ScrollView>
    </View>
  );
};

const DrawerNavigator: React.FC = () => (
  <Drawer.Navigator
    screenOptions={{
      headerShown: false,
      drawerType: 'front',
      overlayColor: 'rgba(0,0,0,0.6)',
      sceneContainerStyle: { backgroundColor: 'transparent' },
      drawerStyle: {
        width: '60%',
        backgroundColor: '#1a1a1a',
        borderRightColor: 'rgba(255,255,255,0.08)',
        borderRightWidth: 1,
      },
    }}
    drawerContent={(drawerProps: DrawerContentComponentProps) => (
      <DrawerContent {...drawerProps} />
    )}
  >
    <Drawer.Screen name="AppStack" component={RootNavigator} />
  </Drawer.Navigator>
);

const AuthNavigator: React.FC = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Auth" component={AuthScreen} />
  </AuthStack.Navigator>
);

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isActive: onboardingActive } = useOnboarding();
  const insets = useSafeAreaInsets();
  const [showGlobalBackButton, setShowGlobalBackButton] = React.useState(false);

  const syncBackState = React.useCallback(() => {
    if (!navigationRef.isReady()) {
      setShowGlobalBackButton(false);
      return;
    }

    const rootState = navigationRef.getRootState();
    const deepestRouteName = getDeepestActiveRouteName(rootState);
    const canGoBack = navigationRef.canGoBack();
    const drawerIsOpen = isDrawerOpen(rootState);
    const isTabRoute = deepestRouteName ? TAB_ROUTE_NAMES.has(deepestRouteName) : false;
    const hasLocalBackButton = deepestRouteName
      ? LOCAL_BACK_ROUTE_NAMES.has(deepestRouteName as keyof RootStackParamList)
      : false;

    setShowGlobalBackButton(canGoBack && !drawerIsOpen && !isTabRoute && !hasLocalBackButton);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.appContentContainer}>
      <NavigationContainer
        ref={navigationRef}
        onReady={syncBackState}
        onStateChange={syncBackState}
      >
        {isAuthenticated ? <DrawerNavigator /> : <AuthNavigator />}
      </NavigationContainer>
      {isAuthenticated ? <OnboardingOverlay navigationRef={navigationRef} /> : null}
      {isAuthenticated && showGlobalBackButton && !onboardingActive ? (
        <TouchableOpacity
          style={[
            styles.globalBackButton,
            { top: insets.top + theme.spacing.sm },
          ]}
          onPress={() => navigationRef.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          activeOpacity={0.85}
        >
          <ArrowLeft size={14} color={theme.colors.foreground} weight="bold" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <OnboardingProvider>
              <StatusBar
                barStyle="light-content"
                backgroundColor="transparent"
                translucent
              />
              <AppContent />
            </OnboardingProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#010a18',
  },
  appContentContainer: {
    flex: 1,
  },
  globalBackButton: {
    position: 'absolute',
    left: theme.spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  mainTabsContainer: {
    flex: 1,
  },
  drawerContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  drawerCloseRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  drawerCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerScroll: {
    flexGrow: 1,
  },
  drawerHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.sidebarBorder,
  },
  drawerHeaderText: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drawerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  drawerLogoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  drawerHeaderCopy: {
    marginTop: theme.spacing.md,
  },
  drawerHeaderCopyInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  drawerSection: {
    paddingTop: theme.spacing.md,
  },
  drawerSectionLabel: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  drawerItemLabel: {
    color: theme.colors.sidebarForeground,
    fontSize: 14,
  },
  drawerItem: {
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  drawerFooter: {
    marginTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.sidebarBorder,
    paddingTop: theme.spacing.sm,
  },
  drawerGuestNote: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    lineHeight: 18,
  },
  menuRowTouchable: {
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'transparent',
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  menuRowIcon: {
    width: 18,
  },
  menuRowDisabled: {
    opacity: 0.4,
  },
  comingSoonPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
  },
});
