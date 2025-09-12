import React, { useState } from 'react';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { StatusBar, View, StyleSheet, Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import { HomeScreen } from './src/screens/HomeScreen';
import { BottomNavigation } from './src/navigation/BottomNavigation';
import theme from './src/utils/theme';

// Placeholder screens - will be implemented in subsequent tasks
const PracticeScreen = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>Practice Screen</Text>
  </View>
);

const ProgramsScreen = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>Programs Screen</Text>
  </View>
);

const RaceScreen = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>Race Screen</Text>
  </View>
);

const ToolsScreen = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>Tools Screen</Text>
  </View>
);

const SprinthiaScreen = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>Sprinthia AI Screen</Text>
  </View>
);

type ScreenName = 'Home' | 'Practice' | 'Programs' | 'Race' | 'Tools' | 'Sprinthia';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Home');

  const renderScreen = () => {
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
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.container}>
        {renderScreen()}
        <BottomNavigation
          currentRoute={currentScreen}
          onNavigate={handleNavigation}
        />
      </View>
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