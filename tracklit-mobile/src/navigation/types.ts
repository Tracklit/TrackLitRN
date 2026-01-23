import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  Practice: undefined;
  Programs: undefined;
  Feed: undefined;
  Sprinthia: undefined;
  Tools: undefined;
  Profile: { focusCoachToggle?: boolean } | undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  Sprinthia: undefined;
  Feed: undefined;
  Marketplace: undefined;
  MarketplaceListingDetail: { id: number };
  MarketplaceCart: undefined;
  MarketplaceCreateListing: undefined;
  Settings: undefined;
  FeedPost: { id?: number | string } | undefined;
  Stopwatch: undefined;
  StartGun: undefined;
  PhotoFinish: undefined;
  Journal: undefined;
  JournalEntry: { date: string };
  IntervalTimer: undefined;
  VideoAnalysis: undefined;
  ExerciseLibrary: undefined;
  ExerciseLibraryAdd: undefined;
  VelocityTracker: undefined;
  SprintTimePrediction: undefined;
  ProgramDetail: { id: number | string };
  ProgramCreate: undefined;
  ProgramEditor: { id: number | string };
  Meets: undefined;
  CreateMeet: undefined;
  Results: undefined;
  Clubs: undefined;
  ClubDetail: { id: number };
  ClubManagement: { id: number };
  CreateGroup: undefined;
  Chat: undefined;
  ChatConversation: { conversationId: number; type: 'direct' | 'group' };
  Notifications: undefined;
  Connections: undefined;
  Coaches: undefined;
  Athletes: undefined;
  Rehab: undefined;
  RehabHamstringProgram: undefined;
  RehabFootProgram: undefined;
  RehabProgramComingSoon: { title: string; category: string };
  Spikes: undefined;
  Subscriptions: undefined;
  PhotoFinishAnalysis: { uri?: string; fileName?: string };
};

export type AuthStackParamList = {
  Auth: undefined;
};
