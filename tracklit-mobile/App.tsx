import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, type BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';

import { HomeScreen } from './src/screens/HomeScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { PracticeScreen } from './src/screens/PracticeScreen';
import { ProgramsScreen } from './src/screens/ProgramsScreen';
import { ToolsScreen } from './src/screens/ToolsScreen';
import { BottomNavigation } from './src/navigation/BottomNavigation';
import { FeedScreen } from './src/screens/FeedScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { FeedDetailScreen } from './src/screens/FeedDetailScreen';
import { StopwatchScreen } from './src/screens/StopwatchScreen';
import { StartGunScreen } from './src/screens/StartGunScreen';
import type { TabParamList, RootStackParamList, AuthStackParamList } from './src/navigation/types';
import { queryClient } from './src/lib/queryClient';

const Tab = createBottomTabNavigator<TabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

type HomeTabProps = BottomTabScreenProps<TabParamList, 'Home'>;

const HomeTabScreen: React.FC<HomeTabProps> = ({ navigation }) => (
  <HomeScreen
    onNavigate={(routeName) => navigation.navigate(routeName as keyof TabParamList)}
  />
);

const MainTabs: React.FC = () => (
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
);

const RootNavigator: React.FC = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="MainTabs" component={MainTabs} />
    <RootStack.Screen name="FeedPost" component={FeedDetailScreen} />
    <RootStack.Screen name="Stopwatch" component={StopwatchScreen} />
    <RootStack.Screen name="StartGun" component={StartGunScreen} />
  </RootStack.Navigator>
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
      {isAuthenticated ? <RootNavigator /> : <AuthNavigator />}
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
});