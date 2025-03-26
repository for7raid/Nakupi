import { create } from 'zustand';
import { User } from '../types';
import { userAPI } from '../api/client';

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  getUser: (userId: string) => Promise<void>;
  saveUser: (user: User) => Promise<void>;
  setUser: (user: User) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  getUser: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const user = await userAPI.getUser(userId);
      set({ user, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при получении пользователя';
      set({ error: errorMessage, isLoading: false });
    }
  },

  saveUser: async (user) => {
    set({ isLoading: true, error: null });
    try {
      await userAPI.saveUser(user);
      set({ user, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при сохранении пользователя';
      set({ error: errorMessage, isLoading: false });
    }
  },
  
  setUser: (user) => {
    set({ user, isLoading: false, error: null });
  }
})); 