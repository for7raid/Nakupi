import { create } from 'zustand';
import { ShoppingListItem } from '../types';
import { itemAPI } from '../api/client';

interface ItemState {
  items: ShoppingListItem[];
  isLoading: boolean;
  error: string | null;
  showPurchased: boolean;
  getItems: (userId: string, categoryId?: string) => Promise<void>;
  addItem: (item: Omit<ShoppingListItem, 'id' | 'createdAt' | 'purchasedDate'>) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  markAsPurchased: (itemId: string) => Promise<void>;
  markAsNotPurchased: (itemId: string) => Promise<void>;
  updateItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  toggleShowPurchased: () => void;
}

export const useItemStore = create<ItemState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  showPurchased: false,
  
  getItems: async (userId, categoryId) => {
    set({ isLoading: true, error: null });
    try {
      const items = await itemAPI.getItems(userId, categoryId);
      set({ items, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при получении элементов';
      set({ error: errorMessage, isLoading: false });
    }
  },
  
  addItem: async (itemData) => {
    set({ isLoading: true, error: null });
    try {
      const item = await itemAPI.addItem({
        ...itemData,
        createdAt: new Date().toISOString()
      });
      set(state => ({ 
        items: [...state.items, item],
        isLoading: false 
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при добавлении элемента';
      set({ error: errorMessage, isLoading: false });
    }
  },
  
  removeItem: async (itemId) => {
    set({ isLoading: true, error: null });
    try {
      await itemAPI.removeItem(itemId);
      set(state => ({ 
        items: state.items.filter(item => item.id !== itemId),
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при удалении элемента';
      set({ error: errorMessage, isLoading: false });
    }
  },
  
  markAsPurchased: async (itemId) => {
    set({ isLoading: true, error: null });
    try {
      await itemAPI.markAsPurchased(itemId);
      set(state => ({
        items: state.items.map(item => 
          item.id === itemId 
            ? { ...item, purchased: true, purchasedDate: new Date().toISOString() } 
            : item
        ),
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при отметке о покупке';
      set({ error: errorMessage, isLoading: false });
    }
  },
  
  markAsNotPurchased: async (itemId) => {
    set({ isLoading: true, error: null });
    try {
      await itemAPI.markAsNotPurchased(itemId);
      set(state => ({
        items: state.items.map(item => 
          item.id === itemId 
            ? { ...item, purchased: false, purchasedDate: undefined } 
            : item
        ),
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при снятии отметки о покупке';
      set({ error: errorMessage, isLoading: false });
    }
  },
  
  updateItemQuantity: async (itemId, quantity) => {
    set({ isLoading: true, error: null });
    try {
      await itemAPI.updateItemQuantity(itemId, quantity);
      set(state => ({
        items: state.items.map(item => 
          item.id === itemId 
            ? { ...item, quantity } 
            : item
        ),
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при обновлении количества';
      set({ error: errorMessage, isLoading: false });
    }
  },
  
  toggleShowPurchased: () => {
    set(state => ({ showPurchased: !state.showPurchased }));
  }
})); 