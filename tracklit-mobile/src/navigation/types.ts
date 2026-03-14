import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  Practice: undefined;
  Programs: undefined;
  Feed: undefined;
  Tools: undefined;
  Profile: { focusCoachToggle?: boolean } | undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  Feed: undefined;
  Marketplace: undefined;
  MarketplaceListingDetail: { id: number };
  MarketplaceCart: undefined;
  MarketplaceCreateListing: undefined;
  Settings: undefined;
  FeedPost: { id?: number | string; postData?: { userId?: number | null; name?: string | null; username?: string | null; profileImageUrl?: string | null; content?: string | null; createdAt: string; likesCount: number; commentsCount: number; isLiked: boolean } } | undefined;
  PublicProfile: { userId: number; name?: string | null; username?: string | null; profileImageUrl?: string | null };
  Stopwatch: undefined;
  StartGun: undefined;
  PhotoFinish: undefined;
  Journal: undefined;
  JournalEntry: { date: string };
  IntervalTimer: undefined;
  ExerciseLibrary: undefined;
  ExerciseLibraryAdd: undefined;
  VelocityTracker: undefined;
  SprintTimePrediction: undefined;
  ProgramDetail: { id: number | string };
  ProgramCreate: undefined;
  ProgramImport: undefined;
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
  MyAthletes: undefined;
  Sprinthia:
    | {
        entryContext?: 'default' | 'rehab';
        initialPrompt?: string;
      }
    | undefined;
  Rehab: undefined;
  RehabHamstringProgram: undefined;
  RehabFootProgram: undefined;
  RehabProgramComingSoon: { title: string; category: string };
  Spikes: undefined;
  SpikesInfo: undefined;
  SpikesProgress: undefined;
  Subscriptions: undefined;
  PhotoFinishAnalysis: { uri?: string; fileName?: string };
  AdminPanelWebView:
    | {
        redirectPath?: string;
      }
    | undefined;
};

export type AuthStackParamList = {
  Auth: undefined;
};
