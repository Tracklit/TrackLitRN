import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import PracticeScreen from './src/screens/PracticeScreen';
import ProgramsScreen from './src/screens/ProgramsScreen';
import RaceScreen from './src/screens/RaceScreen';

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#1e293b',
              borderTopColor: '#334155',
            },
            tabBarActiveTintColor: '#a855f7',
            tabBarInactiveTintColor: '#94a3b8',
          }}
        >
          <Tab.Screen 
            name="Home" 
            component={HomeScreen}
            options={{
              tabBarLabel: 'Home',
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
              tabBarLabel: 'Race',
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
    </QueryClientProvider>
  );
}