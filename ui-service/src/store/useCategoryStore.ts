import { create } from 'zustand';
import { Category } from '../types';
import { categoryAPI } from '../api/client';
import { useUserStore } from './useUserStore';

export interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  getCategories: (userId?: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  getCategories: async (userId) => {
    try {
      set({ isLoading: true, error: null });
      const data = await categoryAPI.getCategories(userId);
      set({ categories: data, isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Ошибка при загрузке категорий'
      });
    }
  },

  addCategory: async (category) => {
    try {
      set({ isLoading: true, error: null });
      const newCategory = await categoryAPI.addCategory(category);
      set((state) => ({
        categories: [...state.categories, newCategory],
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Ошибка при добавлении категории'
      });
    }
  },

  removeCategory: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await categoryAPI.removeCategory(id);
      set((state) => ({
        categories: state.categories.filter((cat) => cat.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Ошибка при удалении категории'
      });
    }
  },

  updateCategory: async (category) => {
    try {
      set({ isLoading: true, error: null });
      const updatedCategory = await categoryAPI.updateCategory(category);
      set((state) => ({
        categories: state.categories.map((cat) => 
          cat.id === category.id ? updatedCategory : cat
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Ошибка при обновлении категории'
      });
    }
  },
})); 