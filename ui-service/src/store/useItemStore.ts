import { create } from 'zustand';
import { ShoppingListItem } from '../types';
import { itemAPI } from '../api/client';
import { useUserStore } from './useUserStore';

interface ItemState {
  items: ShoppingListItem[];
  isLoading: boolean;
  error: string | null;
  getItems: (userId: string, categoryId?: string) => Promise<void>;
  addItem: (item: Omit<ShoppingListItem, 'id'>) => Promise<ShoppingListItem>;
  removeItem: (itemId: string) => Promise<void>;
  markAsPurchased: (itemId: string, userId: string) => Promise<void>;
  markAsNotPurchased: (itemId: string, userId: string) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  updateItem: (itemId: string, item: ShoppingListItem) => Promise<void>;
  clearPurchasedItems: (userId: string) => Promise<void>;
}

export const useItemStore = create<ItemState>((set) => ({
  items: [],
  isLoading: false,
  error: null,
  
  getItems: async (userId, categoryId) => {
    set({ isLoading: true, error: null });
    try {
      const items = await itemAPI.getItems(userId, categoryId);
      set({ items, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при получении списка покупок';
      set({ error: errorMessage, isLoading: false });
    }
  },
  
  addItem: async (item) => {
    set({ isLoading: true, error: null });
    try {
      const newItem = await itemAPI.addItem(item);
      set((state) => ({ 
        items: [...state.items, newItem],
        isLoading: false 
      }));
      return newItem;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при добавлении товара';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  removeItem: async (itemId) => {
    set({ isLoading: true, error: null });
    try {
      await itemAPI.removeItem(itemId);
      set((state) => ({ 
        items: state.items.filter(item => item.id !== itemId),
        isLoading: false 
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при удалении товара';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  markAsPurchased: async (itemId, userId) => {
    set({ isLoading: true, error: null });
    try {
      const updatedItem = await itemAPI.markAsPurchased(itemId, userId);
      set((state) => ({ 
        items: state.items.map(item => 
          item.id === itemId ? updatedItem : item
        ),
        isLoading: false 
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при отметке товара как купленного';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  markAsNotPurchased: async (itemId, userId) => {
    set({ isLoading: true, error: null });
    try {
      const updatedItem = await itemAPI.markAsNotPurchased(itemId, userId);
      set((state) => ({ 
        items: state.items.map(item => 
          item.id === itemId ? updatedItem : item
        ),
        isLoading: false 
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при снятии отметки о покупке';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  updateItemQuantity: async (itemId, quantity) => {
    set({ isLoading: true, error: null });
    try {
      await itemAPI.updateItemQuantity(itemId, quantity);
      set((state) => ({ 
        items: state.items.map(item => 
          item.id === itemId ? { ...item, quantity } : item
        ),
        isLoading: false 
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при обновлении количества товара';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
  
  updateItem: async (itemId, item) => {
    set({ isLoading: true, error: null });
    try {
      await itemAPI.updateItem(itemId, item);
      set((state) => ({ 
        items: state.items.map(stateItem => 
          stateItem.id === itemId ? { ...item } : stateItem
        ),
        isLoading: false 
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при обновлении товара';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  clearPurchasedItems: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      await itemAPI.clearPurchasedItems(userId);
      set((state) => ({
        items: state.items.filter(item => !item.purchased),
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при очистке купленных элементов';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  }
})); 