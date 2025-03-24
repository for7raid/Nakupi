import axios from 'axios';
import { Category, ShoppingListItem, User } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API для работы с пользователями
export const userAPI = {
  saveUser: async (user: User): Promise<User> => {
    const response = await api.post<User>('/users', user);
    return response.data;
  },
  
  getUser: async (userId: string): Promise<User | null> => {
    try {
      const response = await api.get<User>(`/users/${userId}`);
      console.log(response)
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },
  
  createUser: async (userData: Omit<User, 'id'>): Promise<User> => {
    const response = await api.post('/users', userData);
    return response.data;
  },
  
  updateUser: async (userId: string, userData: Partial<User>): Promise<User> => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },
};

// API для работы с категориями
export const categoryAPI = {
  getCategories: async (userId: string): Promise<Category[]> => {
    const response = await api.get<Category[]>(`/categories?userId=${userId}`);
    return response.data;
  },
  
  addCategory: async (category: Category): Promise<Category> => {
    const response = await api.post<Category>('/categories', category);
    return response.data;
  },
  
  updateCategory: async (category: Category): Promise<Category> => {
    const response = await api.put(`/categories/${category.id}`, category);
    return response.data;
  },
  
  removeCategory: async (categoryId: string): Promise<void> => {
    await api.delete(`/categories/${categoryId}`);
  },
};

// API для работы с элементами списка покупок
export const itemAPI = {
  getItems: async (userId: string, categoryId?: string): Promise<ShoppingListItem[]> => {
    const url = categoryId 
      ? `/items?userId=${userId}&categoryId=${categoryId}` 
      : `/items?userId=${userId}`;
    const response = await api.get<ShoppingListItem[]>(url);
    return response.data;
  },
  
  addItem: async (item: ShoppingListItem): Promise<ShoppingListItem> => {
    const response = await api.post<ShoppingListItem>('/items', item);
    return response.data;
  },
  
  removeItem: async (itemId: string): Promise<void> => {
    await api.delete(`/items/${itemId}`);
  },
  
  markAsPurchased: async (itemId: string): Promise<void> => {
    await api.patch(`/items/${itemId}/purchase`, { purchased: true });
  },
  
  markAsNotPurchased: async (itemId: string): Promise<void> => {
    await api.patch(`/items/${itemId}/purchase`, { purchased: false });
  },
  
  updateItemQuantity: async (itemId: string, quantity: number): Promise<void> => {
    await api.patch(`/items/${itemId}/quantity`, { quantity });
  },
}; 