// Shared types for React Native TrackLit app

export interface User {
  id: number;
  email: string;
  name: string;
  username: string;
  role: 'athlete' | 'coach' | 'admin';
  subscription_tier: 'free' | 'pro' | 'star';
  profile_image_url?: string;
  created_at: string;
}

export interface ChatChannel {
  id: number;
  name: string;
  description?: string;
  image?: string;
  avatar_url?: string;
  is_private: boolean;
  is_public: boolean;
  created_by: number;
  owner_id: number;
  created_at: string;
  last_message_at?: string;
  last_message_text?: string;
  last_message?: string;
  message_count: number;
  admin_ids: number[];
  member_count?: number;
  members?: Array<{
    id: number;
    name: string;
    username: string;
  }>;
  channel_type: 'group' | 'direct';
  other_user_id?: number;
  is_member: boolean;
  is_admin: boolean;
  is_owner: boolean;
}

export interface ChatMessage {
  id: number;
  group_id: number;
  user_id: number;
  text: string;
  created_at: string;
  edited_at?: string;
  is_deleted: boolean;
  reply_to_id?: number;
  message_type: 'text' | 'image' | 'video' | 'file' | 'system';
  media_url?: string;
  reactions?: Array<{
    emoji: string;
    count: number;
    users?: number[];
  }>;
  reply_to_message?: {
    id: number;
    text: string;
    message_type: string;
    user: {
      id: number;
      name: string;
    };
  };
  user?: {
    id: number;
    name: string;
    username: string;
    profile_image_url?: string;
  };
}

export interface TrainingProgram {
  id: number;
  title: string;
  description?: string;
  category: 'sprint' | 'distance' | 'field' | 'general';
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // weeks
  total_sessions: number;
  cover_image_url?: string;
  created_at: string;
}

export interface TrainingSession {
  id: number;
  program_id: number;
  title: string;
  description?: string;
  day_number: number;
  date: string;
  short_distance_workout?: string;
  medium_distance_workout?: string;
  long_distance_workout?: string;
  pre_activation1?: string;
  pre_activation2?: string;
  extra_session?: string;
  notes?: string;
  completed: boolean;
  completed_at?: string;
}

export interface Meet {
  id: number;
  name: string;
  date: string;
  venue: string;
  description?: string;
  events: MeetEvent[];
  registration_deadline?: string;
  is_registered: boolean;
}

export interface MeetEvent {
  id: number;
  meet_id: number;
  event_name: string;
  event_time: string;
  category: string;
}

export interface Performance {
  id: number;
  user_id: number;
  event_name: string;
  result: string;
  date: string;
  meet_id?: number;
  is_personal_best: boolean;
}

export interface CommunityActivity {
  id: number;
  user_id: number;
  activity_type: 'workout_completed' | 'personal_best' | 'meet_registration' | 'program_started';
  description: string;
  created_at: string;
  user?: User;
}

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  Practice: undefined;
  Programs: undefined;
  Race: undefined;
  Chat: undefined;
  GroupChat: { groupId: number; channelType: 'group' | 'direct' };
  DirectChat: { userId: number; userName: string };
  CreateGroup: undefined;
  GroupSettings: { groupId: number };
  ProgramDetails: { programId: number };
  MeetDetails: { meetId: number };
  Profile: undefined;
  Settings: undefined;
};

export interface DirectMessage {
  id: number;
  senderId: number;
  receiverId: number;
  text: string;
  createdAt: string;
  editedAt?: string;
  isDeleted: boolean;
  isRead: boolean;
  readAt?: string;
  replyToId?: number;
  reply_to_id?: number;
  messageType: 'text' | 'image' | 'file';
  mediaUrl?: string;
}

export interface Conversation {
  id: number;
  user1Id: number;
  user2Id: number;
  lastMessageId?: number;
  lastMessageAt: string;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}