import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, ArrowLeft } from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import type { RootStackParamList } from '@/navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'RehabProgramComingSoon'>;

export const RehabProgramComingSoonScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { title } = route.params;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Clock size={36} color="rgba(255,255,255,0.4)" />
          <Text variant="h3" weight="bold" color="foreground">
            {title}
          </Text>
          <Text variant="body" color="muted" center>
            This rehabilitation protocol is being finalized for mobile. Check back soon for the complete program.
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <ArrowLeft size={14} color="#FFFFFF" />
              <Text variant="body" weight="semiBold" color="foreground">
                Back to Rehab
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0F14',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1C1F2B',
    borderRadius: 12,
    padding: 20,
  },
  actions: {
    marginTop: 12,
    width: '100%',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});
