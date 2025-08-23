// API Response types with proper typing
export interface ApiResponse<T = any> {
  data?: T;
  success?: boolean;
  message?: string;
  error?: string;
  sessionId?: string;
  user?: any;
}

// Ensure API responses are properly typed
export type ChatChannelsResponse = any[];
export type MessagesResponse = any[];
export type UnreadCountsResponse = Record<string, number>;
export type UserResponse = any;

// Type guards for API responses
export const isApiResponse = (response: unknown): response is ApiResponse => {
  return typeof response === 'object' && response !== null;
};

export const hasData = <T>(response: unknown): response is { data: T } => {
  return typeof response === 'object' && response !== null && 'data' in response;
};