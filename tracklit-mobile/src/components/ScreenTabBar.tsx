import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { House, CalendarBlank, BookOpen, Newspaper, Timer } from 'phosphor-react-native';

import type { RootStackParamList, TabParamList } from '@/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const TAB_ITEMS: { label: string; tab: keyof TabParamList; Icon: any }[] = [
  { label: 'Home', tab: 'Home', Icon: House },
  { label: 'Practice', tab: 'Practice', Icon: CalendarBlank },
  { label: 'Programs', tab: 'Programs', Icon: BookOpen },
  { label: 'Feed', tab: 'Feed', Icon: Newspaper },
  { label: 'Tools', tab: 'Tools', Icon: Timer },
];

export const ScreenTabBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();

  const handleTabPress = (tab: keyof TabParamList) => {
    navigation.navigate('MainTabs', { screen: tab });
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.navBar}>
        {TAB_ITEMS.map(({ label, tab, Icon }) => (
          <TouchableOpacity
            key={tab}
            style={styles.navItem}
            onPress={() => handleTabPress(tab)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <Icon size={23} color="rgba(255,255,255,0.45)" weight="fill" />
            </View>
            <Text style={styles.navLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 12,
  },
  navBar: {
    flexDirection: 'row',
    height: 48,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  navLabel: {
    fontSize: 8,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    lineHeight: 10,
  },
});
