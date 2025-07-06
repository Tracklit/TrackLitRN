// Shared types for React Native TrackLit app

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'athlete' | 'coach' | 'admin';
  subscription_tier: 'free' | 'pro' | 'star';
  profile_image_url?: string;
  created_at: string;
}

export interface ChatGroup {
  id: number;
  name: string;
  description?: string;
  avatar_url?: string;
  created_by: number;
  admin_ids: number[];
  is_private: boolean;
  created_at: string;
  last_message?: string;
  last_message_at?: string;
  message_count: number;
  is_member: boolean;
  is_admin: boolean;
  is_owner: boolean;
  members: User[];
}

export interface Message {
  id: number;
  group_id?: number;
  user_id: number;
  text: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  reply_to_id?: number;
  image_url?: string;
  file_url?: string;
  created_at: string;
  user?: User;
  reply_to?: Message;
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
  GroupChat: { groupId: number };
  ProgramDetails: { programId: number };
  MeetDetails: { meetId: number };
  Profile: undefined;
  Settings: undefined;
};

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