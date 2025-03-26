import { create } from 'zustand';
import { Category, CategoryAccess, ShareCode } from '../types';
import { categoryAPI } from '../api/client';
import { useItemStore } from './useItemStore';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  shareCode: string | null;
  usersWithAccess: CategoryAccess[];
  getCategories: (userId: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
  removeCategory: (categoryId: string) => Promise<void>;
  updateCategory: (category: Category) => Promise<Category>;
  joinSharedList: (shareCode: string, userId: string) => Promise<Category>;
  createShareCode: (categoryId: string, userId: string) => Promise<ShareCode>;
  getUsersWithAccess: (categoryId: string, userId: string) => Promise<CategoryAccess[]>;
  revokeAccess: (categoryId: string, ownerId: string, targetUserId: string) => Promise<void>;
  syncSharedList: (categoryId: string, userId: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,
  shareCode: null,
  usersWithAccess: [],
  
  getCategories: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const categories = await categoryAPI.getCategories(userId);
      
      const processedCategories = categories.map(category => ({
        ...category,
        isShared: !!category.linkedCategoryId || category.isShared,
        isOwner: !category.linkedCategoryId && category.userId === userId
      }));
      
      set({ categories: processedCategories, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при получении категорий';
      set({ error: errorMessage, isLoading: false });
    }
  },
  
  addCategory: async (category) => {
    set({ isLoading: true, error: null });
    try {
      const newCategory = await categoryAPI.addCategory(category);
      const processedCategory = {
        ...newCategory,
        isShared: false,
        isOwner: true
      };
      
      set((state) => ({ 
        categories: [...state.categories, processedCategory],
        isLoading: false 
      }));
      return processedCategory;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при добавлении категории';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  removeCategory: async (categoryId) => {
    set({ isLoading: true, error: null });
    try {
      await categoryAPI.removeCategory(categoryId);
      set((state) => ({ 
        categories: state.categories.filter(cat => cat.id !== categoryId),
        isLoading: false 
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при удалении категории';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  updateCategory: async (category) => {
    set({ isLoading: true, error: null });
    try {
      const updatedCategory = await categoryAPI.updateCategory(category);
      
      const processedCategory = {
        ...updatedCategory,
        isShared: category.isShared,
        isOwner: category.isOwner
      };
      
      set((state) => ({ 
        categories: state.categories.map(cat => 
          cat.id === category.id ? processedCategory : cat
        ),
        isLoading: false 
      }));
      return processedCategory;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при обновлении категории';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  joinSharedList: async (shareCode, userId) => {
    set({ isLoading: true, error: null });
    try {
      const category = await categoryAPI.joinSharedList(shareCode, userId);
      
      const processedCategory = {
        ...category,
        isShared: true,
        isOwner: false
      };
      
      set((state) => ({
        categories: [...state.categories, processedCategory],
        isLoading: false
      }));
      return processedCategory;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при присоединении к списку';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  createShareCode: async (categoryId, userId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await categoryAPI.createShareCode(categoryId, userId);
      set({ 
        shareCode: result.code,
        isLoading: false 
      });
      
      set((state) => ({
        categories: state.categories.map(cat => 
          cat.id === categoryId ? { ...cat, isShared: true, isOwner: true } : cat
        )
      }));
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при создании кода доступа';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  getUsersWithAccess: async (categoryId, userId) => {
    const currentState = get();
    if (currentState.isLoading) {
      return currentState.usersWithAccess;
    }
    
    set({ isLoading: true, error: null });
    try {
      const users = await categoryAPI.getUsersWithAccess(categoryId, userId);
      
      const processedUsers = users.map(user => ({
        ...user,
        username: user.userId === userId ? 'Вы' : user.username || user.userId
      }));
      
      set({ 
        usersWithAccess: processedUsers,
        isLoading: false 
      });
      return processedUsers;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при получении списка пользователей';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  revokeAccess: async (categoryId, ownerId, targetUserId) => {
    set({ isLoading: true, error: null });
    try {
      await categoryAPI.revokeAccess(categoryId, ownerId, targetUserId);
      set((state) => ({
        usersWithAccess: state.usersWithAccess.filter(u => u.userId !== targetUserId),
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при отзыве доступа';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  syncSharedList: async (categoryId, userId) => {
    try {
      await categoryAPI.syncSharedList(categoryId, userId);
      // После синхронизации обновляем список категорий и товаров
      await get().getCategories(userId);
      // Обновляем список товаров через useItemStore
      const { getItems } = useItemStore.getState();
      await getItems(userId, categoryId);
    } catch (error) {
      console.error('Ошибка при синхронизации списка:', error);
    }
  }
})); 