import type { RootStackParamList, TabParamList } from '@/navigation/types';

type RootNavigation = {
  canGoBack: () => boolean;
  goBack: () => void;
  navigate: (...args: any[]) => void;
};

export function navigateToTab<T extends keyof TabParamList>(
  navigation: RootNavigation,
  screen: T,
  params?: TabParamList[T],
) {
  if (params === undefined) {
    navigation.navigate('MainTabs', { screen });
    return;
  }

  navigation.navigate('MainTabs', { screen, params });
}

export function goBackOrNavigateToTab<T extends keyof TabParamList>(
  navigation: RootNavigation,
  screen: T,
  params?: TabParamList[T],
) {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }

  navigateToTab(navigation, screen, params);
}

export function goBackOrNavigateToScreen<T extends Exclude<keyof RootStackParamList, 'MainTabs'>>(
  navigation: RootNavigation,
  screen: T,
  params?: RootStackParamList[T],
) {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }

  if (params === undefined) {
    navigation.navigate(screen);
    return;
  }

  navigation.navigate(screen, params);
}
