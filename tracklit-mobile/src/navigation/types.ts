import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  Practice: undefined;
  Programs: undefined;
  Feed: undefined;
  Tools: undefined;
  Profile: undefined;
  Sprinthia: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  FeedPost: { id?: number | string } | undefined;
  Stopwatch: undefined;
  StartGun: undefined;
  PhotoFinish: undefined;
  Journal: undefined;
  IntervalTimer: undefined;
  ProgramDetail: { id: number | string };
  Meets: undefined;
  Chat: undefined;
  ChatConversation: { conversationId: number; type: 'direct' | 'group' };
};

export type AuthStackParamList = {
  Auth: undefined;
};
