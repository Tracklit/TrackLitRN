import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  Practice: undefined;
  Programs: undefined;
  Feed: undefined;
  Tools: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  FeedPost: { id?: number | string } | undefined;
  Stopwatch: undefined;
  StartGun: undefined;
};

export type AuthStackParamList = {
  Auth: undefined;
};

