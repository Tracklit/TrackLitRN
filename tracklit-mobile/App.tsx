import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, View, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, type BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { QueryClientProvider } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
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
import { ClubsScreen } from './src/screens/ClubsScreen';
import { ClubDetailScreen } from './src/screens/ClubDetailScreen';
import { ClubManagementScreen } from './src/screens/ClubManagementScreen';
import { CreateGroupScreen } from './src/screens/CreateGroupScreen';
import { ProgramCreateScreen } from './src/screens/ProgramCreateScreen';
import { ProgramEditorScreen } from './src/screens/ProgramEditorScreen';
import { VideoAnalysisScreen } from './src/screens/VideoAnalysisScreen';
import { ExerciseLibraryScreen } from './src/screens/ExerciseLibraryScreen';
import { ExerciseLibraryAddScreen } from './src/screens/ExerciseLibraryAddScreen';
import { VelocityTrackerScreen } from './src/screens/VelocityTrackerScreen';
import { SprintTimePredictionScreen } from './src/screens/SprintTimePredictionScreen';
import type { TabParamList, RootStackParamList, AuthStackParamList } from './src/navigation/types';
import { queryClient } from './src/lib/queryClient';
import theme from './src/utils/theme';

const Tab = createBottomTabNavigator<TabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Drawer = createDrawerNavigator();

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
        <Tab.Screen name="Sprinthia" component={SprinthiaScreen} />
        <Tab.Screen name="Tools" component={ToolsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </View>
  );
};

const RootNavigator: React.FC = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="MainTabs" component={MainTabs} />
    <RootStack.Screen name="Sprinthia" component={SprinthiaScreen} />
    <RootStack.Screen name="Marketplace" component={MarketplaceScreen} />
    <RootStack.Screen name="MarketplaceListingDetail" component={MarketplaceListingDetailScreen} />
    <RootStack.Screen name="MarketplaceCart" component={MarketplaceCartScreen} />
    <RootStack.Screen name="MarketplaceCreateListing" component={MarketplaceCreateListingScreen} />
    <RootStack.Screen name="Settings" component={SettingsScreen} />
    <RootStack.Screen name="FeedPost" component={FeedDetailScreen} />
    <RootStack.Screen name="Stopwatch" component={StopwatchScreen} />
    <RootStack.Screen name="StartGun" component={StartGunScreen} />
    <RootStack.Screen name="PhotoFinish" component={PhotoFinishScreen} />
    <RootStack.Screen name="PhotoFinishAnalysis" component={PhotoFinishAnalysisScreen} />
    <RootStack.Screen name="Journal" component={JournalScreen} />
    <RootStack.Screen name="JournalEntry" component={JournalEntryScreen} />
    <RootStack.Screen name="IntervalTimer" component={IntervalTimerScreen} />
    <RootStack.Screen name="VideoAnalysis" component={VideoAnalysisScreen} />
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
    icon: React.ComponentProps<typeof FontAwesome5>['name'];
    onPress?: () => void;
    disabled?: boolean;
    comingSoon?: boolean;
    requiresCoach?: boolean;
    requiresAdmin?: boolean;
  };

  const MenuRow: React.FC<MenuItem> = ({
    label,
    icon,
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
          <FontAwesome5
            name={icon}
            size={14}
            color={disabled ? theme.colors.muted : theme.colors.sidebarForeground}
            solid
            style={styles.menuRowIcon}
          />
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
          icon: 'home',
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
          icon: 'dumbbell',
          onPress: () =>
            navigateIntoAppStack({ screen: 'MainTabs', params: { screen: 'Practice' } }),
        },
        {
          label: 'Programs',
          icon: 'book',
          onPress: () =>
            navigateIntoAppStack({ screen: 'MainTabs', params: { screen: 'Programs' } }),
        },
        {
          label: 'Training Tools',
          icon: 'clock',
          onPress: () =>
            navigateIntoAppStack({ screen: 'MainTabs', params: { screen: 'Tools' } }),
        },
        {
          label: 'Rehabilitation',
          icon: 'heart',
          onPress: () =>
            navigateIntoAppStack({ screen: 'Rehab' }),
        },
        {
          label: 'Sprinthia',
          icon: 'comments',
          onPress: () =>
            navigateIntoAppStack({ screen: 'MainTabs', params: { screen: 'Sprinthia' } }),
        },
      ],
    },
    {
      title: 'COMPETITION',
      items: [
        {
          label: 'Meets',
          icon: 'trophy',
          disabled: true,
          comingSoon: true,
        },
        {
          label: 'Results',
          icon: 'chart-line',
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
          icon: 'shopping-cart',
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
          icon: 'user-check',
          onPress: () =>
            navigateIntoAppStack({ screen: 'Connections' }),
        },
        {
          label: 'Feed',
          icon: 'newspaper',
          onPress: () =>
            navigateIntoAppStack({ screen: 'MainTabs', params: { screen: 'Feed' } }),
        },
        {
          label: 'Group Chat',
          icon: 'comments',
          onPress: () =>
            navigateIntoAppStack({ screen: 'Chat' }),
        },
        {
          label: 'My Athletes',
          icon: 'bullseye',
          requiresCoach: true,
          onPress: () =>
            navigateIntoAppStack({ screen: 'Athletes' }),
        },
        {
          label: 'Roster Stats',
          icon: 'chart-line',
          requiresCoach: true,
          disabled: true,
          comingSoon: true,
        },
        {
          label: 'Athletes',
          icon: 'users',
          onPress: () =>
            navigateIntoAppStack({ screen: 'Athletes' }),
        },
        {
          label: 'Coaches',
          icon: 'award',
          onPress: () =>
            navigateIntoAppStack({ screen: 'Coaches' }),
        },
        {
          label: 'Groups',
          icon: 'users',
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
          icon: 'shield-alt',
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
          label: 'Spikes',
          icon: 'coins',
          onPress: () =>
            navigateIntoAppStack({ screen: 'Spikes' }),
        },
        {
          label: 'Profile Settings',
          icon: 'cog',
          onPress: () =>
            navigateIntoAppStack({ screen: 'MainTabs', params: { screen: 'Profile' } }),
        },
        {
          label: 'My Subscriptions',
          icon: 'heart',
          onPress: () =>
            navigateIntoAppStack({ screen: 'Subscriptions' }),
        },
      ],
    },
  ];

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={[
        styles.drawerScroll,
        {
          paddingTop: insets.top + theme.spacing.lg,
          paddingBottom: Math.max(insets.bottom, theme.spacing.lg),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.drawerHeader}>
        <View style={styles.drawerTitleRow}>
          <View style={styles.drawerLogoDot} />
          <Text variant="h3" weight="bold" color="foreground">
            TrackLit
          </Text>
        </View>
        <Text variant="small" color="muted" style={{ marginTop: theme.spacing.sm }}>
          Quick access to everything in the app
        </Text>
      </View>

      <View style={styles.drawerIdentity}>
        <View style={styles.drawerIdentityRow}>
          <View style={styles.drawerAvatar}>
            <View style={styles.drawerAvatarInner} />
          </View>
          <View style={styles.drawerIdentityText}>
            <Text variant="body" weight="bold" color="foreground">
              {user?.name || 'TrackLit Athlete'}
            </Text>
            <Text variant="small" color="muted">
              @{user?.username || 'guest'}
            </Text>
          </View>
        </View>
      </View>

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
              <FontAwesome5
                name="sign-out-alt"
                size={14}
                color={theme.colors.destructive}
                solid
                style={styles.menuRowIcon}
              />
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
    </DrawerContentScrollView>
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
        backgroundColor: theme.colors.sidebar,
        borderRightColor: theme.colors.sidebarBorder,
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <DrawerNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar
            barStyle="light-content"
            backgroundColor="transparent"
            translucent
          />
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
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
  mainTabsContainer: {
    flex: 1,
  },
  drawerScroll: {
    flexGrow: 1,
    paddingTop: theme.spacing.lg,
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
  drawerIdentity: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.sidebarBorder,
  },
  drawerIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  drawerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerAvatarInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  drawerIdentityText: {
    flex: 1,
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
    paddingVertical: theme.spacing.md,
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
