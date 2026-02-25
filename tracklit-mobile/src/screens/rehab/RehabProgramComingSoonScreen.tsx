import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Clock, ArrowLeft } from 'phosphor-react-native';

import { Text } from '@/components/ui/Text';
import { WebScreen } from '@/components/web/Screen';
import { WebCard } from '@/components/web/Card';
import { WebButton } from '@/components/web/Button';
import type { RootStackParamList } from '@/navigation/types';
import theme from '@/utils/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'RehabProgramComingSoon'>;

export const RehabProgramComingSoonScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { title } = route.params;

  return (
    <WebScreen backgroundColor="#010a18" contentStyle={{ paddingTop: theme.spacing.xl }}>
      <WebCard tone="muted" padding={theme.spacing.lg} style={styles.card}>
        <Clock size={36} color={theme.colors.textMuted} />
        <Text variant="h3" weight="bold" color="foreground">
          {title}
        </Text>
        <Text variant="body" color="muted" center>
          This rehabilitation protocol is being finalized for mobile. Check back soon for the complete program.
        </Text>
        <View style={styles.actions}>
          <WebButton variant="outline" onPress={() => navigation.goBack()}>
            <ArrowLeft size={14} color={theme.colors.foreground} />
            <Text variant="body" weight="semiBold" color="foreground">
              Back to Rehab
            </Text>
          </WebButton>
        </View>
      </WebCard>
    </WebScreen>
  );
};

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: theme.spacing.md },
  actions: { marginTop: theme.spacing.md, width: '100%' },
});

