import axios from 'axios';
import { Category, ShoppingListItem, User, Status, ShareCode, CategoryAccess } from '../types';
import { useUserStore } from '../store/useUserStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const handleApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) {
      throw new Error('Запрашиваемый ресурс не найден');
    }
    if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Неверный запрос');
    }
    if (error.response?.status === 500) {
      throw new Error('Внутренняя ошибка сервера');
    }
    throw new Error(error.message || 'Произошла ошибка при выполнении запроса');
  }
  throw error;
};

// API для получения статуса системы
export const healthAPI = {
  getStatus: async (): Promise<Status> => {
    try {
      const response = await api.get<Status>('/health');
      console.log('Получен статус API:', response.data);
      return {
        status: response.data.status || 'OK',
        uptime: response.data.uptime || 0,
        timestamp: response.data.timestamp || Date.now()
      };
    } catch (error) {
      console.warn('Ошибка при проверке статуса API:', error);
      // При ошибке возвращаем статус, который указывает на недоступность
      return {
        status: 'ERROR',
        uptime: 0,
        timestamp: Date.now()
      };
    }
  }
};

// API для работы с пользователями
export const userAPI = {
  saveUser: async (user: User): Promise<User> => {
    try {
      const response = await api.post<User>('/users', user);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  getUser: async (userId: string): Promise<User | null> => {
    try {
      const response = await api.get<User>(`/users/${userId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw handleApiError(error);
    }
  },
  
  createUser: async (userData: Omit<User, 'id'>): Promise<User> => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  updateUser: async (userId: string, userData: Partial<User>): Promise<User> => {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// API для работы с категориями
export const categoryAPI = {
  getCategories: async (userId: string): Promise<Category[]> => {
    try {
      const response = await api.get<Category[]>(`/categories?userId=${userId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  addCategory: async (category: Omit<Category, 'id'>): Promise<Category> => {
    try {
      const response = await api.post<Category>('/categories', category);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  updateCategory: async (category: Category): Promise<Category> => {
    try {
      const response = await api.put(`/categories/${category.id}`, category);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  removeCategory: async (categoryId: string): Promise<void> => {
    try {
      const userId = useUserStore.getState().user?.id;
      if (!userId) throw new Error('Пользователь не найден');
      
      await api.delete(`/categories/${categoryId}?userId=${userId}`);
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  joinSharedList: async (shareCode: string, userId: string): Promise<Category> => {
    try {
      const response = await api.post<Category>('/categories/join', { 
        shareCode, 
        userId 
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  createShareCode: async (categoryId: string, userId: string): Promise<ShareCode> => {
    try {
      const response = await api.post<ShareCode>('/categories/share', {
        categoryId,
        userId
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  syncSharedList: async (categoryId: string, userId: string): Promise<void> => {
    try {
      await api.post(`/categories/${categoryId}/sync`, { userId });
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  getUsersWithAccess: async (categoryId: string, userId: string): Promise<CategoryAccess[]> => {
    try {
      console.debug(`[API] Запрос пользователей с доступом к категории ${categoryId} (${new Date().toISOString()})`);
      
      const response = await api.get<CategoryAccess[]>(`/categories/${categoryId}/access?userId=${userId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  revokeAccess: async (categoryId: string, ownerId: string, targetUserId: string): Promise<void> => {
    try {
      await api.delete(`/categories/${categoryId}/access/${targetUserId}?userId=${ownerId}`);
    } catch (error) {
      throw handleApiError(error);
    }
  }
};

// API для работы с элементами списка покупок
export const itemAPI = {
  getItems: async (userId: string, categoryId?: string): Promise<ShoppingListItem[]> => {
    try {
      const url = categoryId 
        ? `/items?userId=${userId}&categoryId=${categoryId}` 
        : `/items?userId=${userId}`;
      const response = await api.get<ShoppingListItem[]>(url);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  addItem: async (item: Omit<ShoppingListItem, 'id'>): Promise<ShoppingListItem> => {
    try {
      const response = await api.post<ShoppingListItem>('/items', item);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  removeItem: async (itemId: string): Promise<void> => {
    try {
      const userId = useUserStore.getState().user?.id;
      if (!userId) throw new Error('Пользователь не найден');
      
      await api.delete(`/items/${itemId}?userId=${userId}`);
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  markAsPurchased: async (itemId: string, userId: string): Promise<ShoppingListItem> => {
    try {
      const response = await api.put<ShoppingListItem>(`/items/${itemId}/purchased`, { purchased: true, userId });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  markAsNotPurchased: async (itemId: string, userId: string): Promise<ShoppingListItem> => {
    try {
      const response = await api.put<ShoppingListItem>(`/items/${itemId}/purchased`, { purchased: false, userId });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  updateItemQuantity: async (itemId: string, quantity: number): Promise<void> => {
    try {
      const userId = useUserStore.getState().user?.id;
      if (!userId) throw new Error('Пользователь не найден');
      
      await api.put(`/items/${itemId}/quantity`, { userId, quantity });
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  updateItem: async (itemId: string, item: ShoppingListItem): Promise<ShoppingListItem> => {
    try {
      const response = await api.put<ShoppingListItem>(`/items/${itemId}`, item);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  clearPurchasedItems: async (userId: string): Promise<void> => {
    try {
      await api.delete(`/items/purchased?userId=${userId}`);
    } catch (error) {
      throw handleApiError(error);
    }
  }
}; 