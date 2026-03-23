import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { env } from '@/config/env';
import { getToken } from '@/lib/tokenStorage';
import type { RootStackParamList } from '@/navigation/types';
import { goBackOrNavigateToTab } from '@/navigation/appNavigation';
import theme from '@/utils/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AdminPanelWebView'>;

export const AdminPanelWebViewScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const [token, setToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectPath = route.params?.redirectPath ?? '/admin-panel';

  const adminUrl = `${env.API_BASE_URL}${redirectPath}`;

  const injectedJS = token
    ? `(function(){try{['token','auth_token','accessToken','authToken','jwt'].forEach(function(k){localStorage.setItem(k,'${token}');});}catch(e){}true;})();`
    : 'true;';

  const source = useMemo(() => {
    if (!token) return null;
    return { uri: adminUrl, headers: { Authorization: `Bearer ${token}` } };
  }, [token, adminUrl]);

  useEffect(() => {
    let isMounted = true;

    const loadToken = async () => {
      try {
        const nextToken = await getToken();
        if (!isMounted) {
          return;
        }

        if (!nextToken) {
          setErrorMessage('You need to sign in again before opening the admin panel.');
          return;
        }

        setToken(nextToken);
      } catch {
        if (isMounted) {
          setErrorMessage('Unable to open the admin panel right now.');
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    };

    loadToken();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleBackPress = () => {
    goBackOrNavigateToTab(navigation, 'Home');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + theme.spacing.sm }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={handleBackPress} activeOpacity={0.7}>
          <FontAwesome5 name="arrow-left" size={18} color={theme.colors.foreground} solid />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text variant="body" weight="semiBold" color="foreground">
            Admin Panel
          </Text>
          <Text variant="small" color="muted">
            Secure web session
          </Text>
        </View>
        <View style={styles.iconBtn} />
      </View>

      {isBootstrapping ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text variant="body" color="muted">
            Preparing admin session...
          </Text>
        </View>
      ) : errorMessage || !source ? (
        <View style={styles.stateContainer}>
          <Text variant="body" color="muted" center>
            {errorMessage ?? 'Unable to load the admin panel.'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleBackPress} activeOpacity={0.8}>
            <Text variant="small" weight="semiBold" color="foreground">
              Back to app
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          source={source}
          injectedJavaScriptBeforeContentLoaded={injectedJS}
          injectedJavaScript={injectedJS}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text variant="body" color="muted">
                Loading admin panel...
              </Text>
            </View>
          )}
          onHttpError={(event) => {
            if (event.nativeEvent.statusCode >= 400) {
              setErrorMessage(`Admin panel returned ${event.nativeEvent.statusCode}.`);
            }
          }}
          onError={() => {
            setErrorMessage('Unable to load the admin panel.');
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0F14',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerCopy: {
    flex: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  retryBtn: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
