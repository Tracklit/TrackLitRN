import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import PracticeScreen from './src/screens/PracticeScreen';
import ProgramsScreen from './src/screens/ProgramsScreen';
import RaceScreen from './src/screens/RaceScreen';

// Create bottom tab navigator
const Tab = createBottomTabNavigator();

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <Tab.Navigator
              screenOptions={{
                tabBarStyle: {
                  backgroundColor: '#1f2937',
                  borderTopWidth: 0,
                  height: 60,
                },
                tabBarActiveTintColor: '#3b82f6',
                tabBarInactiveTintColor: '#6b7280',
                headerShown: false,
              }}
            >
              <Tab.Screen 
                name="Home" 
                component={HomeScreen}
                options={{
                  tabBarLabel: 'Dashboard',
                }}
              />
              <Tab.Screen 
                name="Practice" 
                component={PracticeScreen}
                options={{
                  tabBarLabel: 'Practice',
                }}
              />
              <Tab.Screen 
                name="Programs" 
                component={ProgramsScreen}
                options={{
                  tabBarLabel: 'Programs',
                }}
              />
              <Tab.Screen 
                name="Race" 
                component={RaceScreen}
                options={{
                  tabBarLabel: 'Meets',
                }}
              />
              <Tab.Screen 
                name="Chat" 
                component={ChatScreen}
                options={{
                  tabBarLabel: 'Chat',
                }}
              />
            </Tab.Navigator>
          </NavigationContainer>
          <StatusBar style="light" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
});