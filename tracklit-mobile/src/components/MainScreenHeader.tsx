import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Bell, PaperPlaneTilt } from 'phosphor-react-native';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/api';
import type { RootStackParamList } from '@/navigation/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '@/utils/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export const MainScreenHeader: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const userId = (user as any)?.id;
  const isGuest = !user || userId === 'guest';

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications-home'],
    queryFn: () => apiRequest<any[]>('/api/notifications'),
    staleTime: 30000,
    select: (data: any[] | undefined) =>
      (data || []).filter((n: any) => n.type !== 'message_received'),
    enabled: !isGuest,
  });

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['friend-requests-pending'],
    queryFn: () => apiRequest<any[]>('/api/friend-requests/pending'),
    staleTime: 30000,
    enabled: !isGuest,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations-home'],
    queryFn: () => apiRequest<any[]>('/api/conversations'),
    staleTime: 30000,
    enabled: !isGuest,
  });

  const unreadNotifications =
    (notifications as any[]).filter((n) => !n.isRead).length +
    (pendingRequests as any[]).length;

  const unreadMessages =
    conversations && userId
      ? (conversations as any[]).filter(
          (conv) =>
            conv.lastMessage &&
            !conv.lastMessage.isRead &&
            conv.lastMessage.receiverId === userId,
        ).length
      : 0;

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <ScreenHeader
        title=""
        right={
          <>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <Bell size={29} color="#94a3b8" weight="fill" />
              {unreadNotifications > 0 && (
                <View style={styles.badge}>
                  <Text variant="caption" weight="bold" color="foreground">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Chat')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Messages"
            >
              <PaperPlaneTilt size={25} color="#94a3b8" weight="fill" />
              {unreadMessages > 0 && (
                <View style={styles.badge}>
                  <Text variant="caption" weight="bold" color="foreground">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </>
        }
        containerStyle={styles.header}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 10,
    paddingLeft: theme.spacing.container,
    paddingRight: theme.spacing.container + 45,
  },
  header: {
    paddingVertical: theme.spacing.xs,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
});
