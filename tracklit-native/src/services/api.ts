// API service for React Native TrackLit app
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse } from '../types/api';

// Base URL for API calls (will need to be configured for production)
const BASE_URL = true // __DEV__ fallback
  ? 'http://localhost:5000' // Development
  : 'https://your-production-url.com'; // Production

interface ApiConfig {
  method: string;
  headers: Record<string, string>;
  body?: string;
  credentials?: RequestCredentials;
}

export class ApiService {
  private static instance: ApiService;

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    try {
      const sessionId = await AsyncStorage.getItem('sessionId');
      if (sessionId) {
        headers['Cookie'] = `sessionId=${sessionId}`;
      }
    } catch (error) {
      console.warn('Failed to get session from AsyncStorage:', error);
    }

    return headers;
  }

  public async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      data?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const { method = 'GET', data, headers: customHeaders = {} } = options;
    
    const authHeaders = await this.getAuthHeaders();
    const headers = { ...authHeaders, ...customHeaders };

    const config: RequestInit = {
      method,
      headers,
      credentials: 'include',
    };

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result as T;
    } catch (error) {
      console.error(`API request failed: ${method} ${endpoint}`, error);
      throw error;
    }
  }

  // Authentication
  public async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      data: { email, password }
    });
  }

  public async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
      await AsyncStorage.removeItem('sessionId');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  public async register(email: string, password: string, name: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      data: { email, password, name }
    });
  }

  public async getCurrentUser() {
    return this.request('/api/user');
  }

  // Chat API methods
  public async getChatChannels() {
    return this.request('/api/chat/groups');
  }

  public async getChannelMessages(channelId: number, channelType: 'group' | 'direct') {
    const endpoint = channelType === 'direct' 
      ? `/api/direct-messages/${channelId}`
      : `/api/chat/groups/${channelId}/messages`;
    return this.request(endpoint);
  }

  public async sendMessage(
    channelId: number, 
    text: string, 
    channelType: 'group' | 'direct',
    replyToId?: number
  ) {
    const endpoint = channelType === 'direct'
      ? `/api/direct-messages/${channelId}/send`
      : `/api/chat/groups/${channelId}/messages`;
    
    return this.request(endpoint, {
      method: 'POST',
      data: { text, reply_to_id: replyToId }
    });
  }

  public async editMessage(messageId: number, text: string, channelType: 'group' | 'direct') {
    const endpoint = channelType === 'direct'
      ? `/api/direct-messages/${messageId}`
      : `/api/chat/messages/${messageId}`;
    
    return this.request(endpoint, {
      method: 'PATCH',
      data: { text }
    });
  }

  public async deleteMessage(messageId: number, channelType: 'group' | 'direct') {
    const endpoint = channelType === 'direct'
      ? `/api/direct-messages/${messageId}`
      : `/api/chat/messages/${messageId}`;
    
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }

  public async getUnreadCounts() {
    return this.request('/api/chat/groups/unread-counts');
  }

  public async getConversations() {
    return this.request('/api/conversations');
  }

  // Training programs API
  public async getTrainingPrograms() {
    return this.request('/api/programs');
  }

  public async getProgramDetails(programId: number) {
    return this.request(`/api/programs/${programId}`);
  }

  public async getProgramSessions(programId: number) {
    return this.request(`/api/programs/${programId}/sessions`);
  }

  public async getUserProgram() {
    return this.request('/api/user/program');
  }

  public async getTodaysSession() {
    return this.request('/api/sessions/today');
  }

  public async completeSession(sessionId: number) {
    return this.request(`/api/sessions/${sessionId}/complete`, {
      method: 'POST',
    });
  }

  // Meets API
  public async getMeets() {
    return this.request('/api/meets');
  }

  public async getMeetDetails(meetId: number) {
    return this.request(`/api/meets/${meetId}`);
  }

  public async registerForMeet(meetId: number, events: string[]) {
    return this.request(`/api/meets/${meetId}/register`, {
      method: 'POST',
      data: { events },
    });
  }

  // User API
  public async getUserProfile() {
    return this.request('/api/user/profile');
  }

  public async updateProfile(data: any) {
    return this.request('/api/user/profile', {
      method: 'PATCH',
      data
    });
  }

  // Community API
  public async getCommunityActivities() {
    return this.request('/api/community/activities');
  }
}

// Export singleton instance
export const apiService = ApiService.getInstance();