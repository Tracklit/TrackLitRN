import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { House, Barbell, Newspaper, Timer } from 'phosphor-react-native';

import type { RootStackParamList, TabParamList } from '@/navigation/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ThemeValues } from '@/contexts/ThemeContext';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const TAB_ITEMS: { label: string; tab: keyof TabParamList; Icon: any }[] = [
  { label: 'Home', tab: 'Home', Icon: House },
  { label: 'Training', tab: 'Training', Icon: Barbell },
  { label: 'Feed', tab: 'Feed', Icon: Newspaper },
  { label: 'Tools', tab: 'Tools', Icon: Timer },
];

export const ScreenTabBar: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const { styles, theme } = useThemedStyles(createStyles);

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
              <Icon size={23} color={theme.colors.textSecondary} weight="fill" />
            </View>
            <Text style={styles.navLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const createStyles = (t: ThemeValues) => StyleSheet.create({
  container: {
    backgroundColor: t.colors.backgroundSolid,
    borderTopWidth: 1,
    borderTopColor: t.colors.overlayLight,
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
    fontSize: 10,
    fontWeight: '500',
    color: t.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 13,
  },
});
