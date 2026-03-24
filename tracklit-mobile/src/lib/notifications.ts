import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiRequest } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('chat', {
      name: 'Chat Messages',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF7A00',
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

export async function sendPushTokenToServer(token: string): Promise<void> {
  try {
    await apiRequest('/api/user/push-token', {
      method: 'POST',
      data: { pushToken: token },
    });
  } catch {
    // Silently fail — server may not support this endpoint yet
  }
}

export function setupNotificationListeners(
  onNotification: (notification: Notifications.Notification) => void,
  onResponse: (response: Notifications.NotificationResponse) => void,
) {
  const notifSub = Notifications.addNotificationReceivedListener(onNotification);
  const responseSub = Notifications.addNotificationResponseReceivedListener(onResponse);
  return () => {
    notifSub.remove();
    responseSub.remove();
  };
}
