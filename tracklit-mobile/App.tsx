import React, { useState } from 'react';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { StatusBar, View, StyleSheet, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';

import { HomeScreen } from './src/screens/HomeScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { PracticeScreen } from './src/screens/PracticeScreen';
import { ProgramsScreen } from './src/screens/ProgramsScreen';
import { RaceScreen } from './src/screens/RaceScreen';
import { ToolsScreen } from './src/screens/ToolsScreen';
import { SprinthiaScreen } from './src/screens/SprinthiaScreen';
import { BottomNavigation } from './src/navigation/BottomNavigation';
import theme from './src/utils/theme';

type ScreenName = 'Home' | 'Practice' | 'Programs' | 'Race' | 'Tools' | 'Sprinthia';

const AppContent: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Home');
  const { isAuthenticated } = useAuth();

  const renderScreen = () => {
    // Show auth screen if not authenticated
    if (!isAuthenticated) {
      return <AuthScreen />;
    }

    switch (currentScreen) {
      case 'Home':
        return <HomeScreen />;
      case 'Practice':
        return <PracticeScreen />;
      case 'Programs':
        return <ProgramsScreen />;
      case 'Race':
        return <RaceScreen />;
      case 'Tools':
        return <ToolsScreen />;
      case 'Sprinthia':
        return <SprinthiaScreen />;
      default:
        return <HomeScreen />;
    }
  };

  const handleNavigation = (screenName: string) => {
    setCurrentScreen(screenName as ScreenName);
  };

  return (
    <View style={styles.container}>
      {renderScreen()}
      {isAuthenticated && (
        <BottomNavigation
          currentRoute={currentScreen}
          onNavigate={handleNavigation}
        />
      )}
    </View>
  );
};

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  placeholderText: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.medium,
  },
});

export default App;