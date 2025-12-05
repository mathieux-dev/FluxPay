import { create } from 'zustand';
import { User } from '@/types/user';
import { APIClient } from '@/lib/api/client';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (email: string, password: string, mfaCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
}

const apiClient = new APIClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
});

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string, mfaCode?: string) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.post<{ user: User; accessToken: string }>(
        '/auth/login',
        { email, password, mfaCode }
      );
      
      set({
        user: response.user,
        accessToken: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
      
      apiClient.setAccessToken(response.accessToken);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      });
      apiClient.clearAccessToken();
    }
  },

  refreshToken: async () => {
    try {
      const response = await apiClient.post<{ user: User; accessToken: string }>(
        '/auth/refresh'
      );
      
      set({
        user: response.user,
        accessToken: response.accessToken,
        isAuthenticated: true,
      });
      
      apiClient.setAccessToken(response.accessToken);
    } catch (error) {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      });
      apiClient.clearAccessToken();
      throw error;
    }
  },

  setAccessToken: (token: string) => {
    set({ accessToken: token });
    apiClient.setAccessToken(token);
  },

  setUser: (user: User) => {
    set({ user, isAuthenticated: true });
  },
}));
