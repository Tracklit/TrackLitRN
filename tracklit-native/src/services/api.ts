// API service for React Native TrackLit app
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for API calls (will need to be configured for production)
const BASE_URL = __DEV__ 
  ? 'http://localhost:5000' // Development
  : 'https://your-production-url.com'; // Production

interface ApiConfig {
  method: string;
  headers: Record<string, string>;
  body?: string;
}

export class ApiService {
  private static instance: ApiService;

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async request(endpoint: string, options: Partial<ApiConfig> = {}): Promise<Response> {
    const token = await this.getAuthToken();
    
    const config: ApiConfig = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (options.body) {
      config.body = options.body;
    }

    const url = `${BASE_URL}${endpoint}`;
    console.log(`Making ${config.method} request to ${url}`);

    return fetch(url, config);
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.token) {
        await AsyncStorage.setItem('authToken', data.token);
      }
    }

    return response;
  }

  async logout() {
    await AsyncStorage.removeItem('authToken');
    return this.request('/api/auth/logout', { method: 'POST' });
  }

  // Chat methods
  async getConversations() {
    return this.request('/api/conversations');
  }

  async getChatGroups() {
    return this.request('/api/chat/groups');
  }

  async getGroupMessages(groupId: string) {
    return this.request(`/api/chat/groups/${groupId}/messages`);
  }

  async sendGroupMessage(groupId: string, text: string, replyToId?: string) {
    return this.request(`/api/chat/groups/${groupId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ 
        text, 
        reply_to_id: replyToId,
        message_type: 'text' 
      }),
    });
  }

  async markGroupAsRead(groupId: string) {
    return this.request(`/api/chat/groups/${groupId}/mark-read`, {
      method: 'PATCH',
    });
  }

  // Training methods
  async getPrograms() {
    return this.request('/api/programs');
  }

  async getUserProgram() {
    return this.request('/api/user/program');
  }

  async getTodaysSession() {
    return this.request('/api/sessions/today');
  }

  async completeSession(sessionId: string) {
    return this.request(`/api/sessions/${sessionId}/complete`, {
      method: 'POST',
    });
  }

  // Meet methods
  async getMeets() {
    return this.request('/api/meets');
  }

  async registerForMeet(meetId: string, events: string[]) {
    return this.request(`/api/meets/${meetId}/register`, {
      method: 'POST',
      body: JSON.stringify({ events }),
    });
  }

  // Profile methods
  async getUserProfile() {
    return this.request('/api/user/profile');
  }

  async updateProfile(data: any) {
    return this.request('/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Community methods
  async getCommunityActivities() {
    return this.request('/api/community/activities');
  }
}

// Export singleton instance
export const apiService = ApiService.getInstance();