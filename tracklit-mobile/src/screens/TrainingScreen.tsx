import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { Text } from '@/components/ui/Text';
import { MainScreenHeader } from '@/components/MainScreenHeader';
import { PracticeScreen } from './PracticeScreen';
import { ProgramsScreen } from './ProgramsScreen';
import theme from '@/utils/theme';
import { useRoute, useFocusEffect, type RouteProp } from '@react-navigation/native';
import type { TabParamList } from '@/navigation/types';

const C = {
  orange: '#FF7A00',
  textMuted: '#8A90B5',
  tabBg: 'rgba(255,255,255,0.04)',
  tabActive: 'rgba(255,122,0,0.15)',
  tabBorder: 'rgba(255,255,255,0.08)',
};

export const TrainingScreen: React.FC = () => {
  const route = useRoute<RouteProp<TabParamList, 'Training'>>();
  const [activeTab, setActiveTab] = useState<'practice' | 'programs'>(
    route.params?.tab ?? 'practice'
  );

  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.tab) {
        setActiveTab(route.params.tab);
      }
    }, [route.params?.tab])
  );

  return (
    <LinearGradient
      colors={theme.gradient.background}
      locations={theme.gradient.locations}
      style={styles.container}
    >
      <MainScreenHeader />

      <View style={styles.tabBar}>
        {(['practice', 'programs'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'practice' ? 'Practice' : 'Programs'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {activeTab === 'practice' ? (
          <PracticeScreen hideHeader />
        ) : (
          <ProgramsScreen hideHeader />
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 4,
    backgroundColor: C.tabBg,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: C.tabBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: C.tabActive,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.textMuted,
  },
  tabTextActive: {
    color: C.orange,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});
