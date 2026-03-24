import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  Training: { tab?: 'practice' | 'programs' } | undefined;
  Feed: undefined;
  Tools: undefined;
  Profile: { focusCoachToggle?: boolean } | undefined;
  Sprinthia: { entryContext?: 'default' | 'rehab'; initialPrompt?: string } | undefined;
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
  SheetFormatInfo: { showContinue?: boolean } | undefined;
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
  GroupSettings: { groupId: number; groupName: string; groupImageUrl?: string; isOwner?: boolean };
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
  RehabProgramDetail: { programKey: string; programName: string; categoryLabel: string };
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
