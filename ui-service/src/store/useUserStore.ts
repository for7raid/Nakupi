import { create } from 'zustand';
import { User } from '../types';
import { userAPI } from '../api/client';

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  saveUser: (userData: Omit<User, 'registrationDate' | 'lastActionDate'>) => Promise<User>;
  getUser: (userId: string) => Promise<User | null>;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  
  saveUser: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const user = await userAPI.saveUser({
        ...userData,
        registrationDate: new Date().toISOString(),
        lastActionDate: new Date().toISOString(),
      });
      set({ user, isLoading: false });
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при сохранении пользователя';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  getUser: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const user = await userAPI.getUser(userId);
      set({ user, isLoading: false });
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при получении пользователя';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  setUser: (user) => {
    set({ user });
  },
  
  clearUser: () => {
    set({ user: null });
  },
})); 