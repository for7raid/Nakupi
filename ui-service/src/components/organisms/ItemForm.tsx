'use client';

import React, { useState, useEffect } from 'react';
import { useItemStore } from '../../store/useItemStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useUserStore } from '../../store/useUserStore';
import { ShoppingListItem } from '../../types';
import { Button } from '../atoms/Button';
import { Modal } from '../atoms/Modal';

interface ItemFormProps {
  item?: ShoppingListItem | null;
  selectedCategoryId?: string | null;
  onClose: () => void;
}

export function ItemForm({ item, selectedCategoryId, onClose }: ItemFormProps) {
  const { addItem, updateItem } = useItemStore();
  const { categories, isLoading: isLoadingCategories } = useCategoryStore();
  const { user } = useUserStore();
  
  const [formData, setFormData] = useState<Partial<ShoppingListItem>>({
    name: '',
    categoryId: selectedCategoryId || '',
    quantity: 1,
    purchased: false,
    userId: user?.id || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isEditing = Boolean(item?.id);
  
  useEffect(() => {
    if (item) {
      setFormData({
        ...item
      });
    } else if (selectedCategoryId) {
      setFormData(prev => ({
        ...prev,
        categoryId: selectedCategoryId
      }));
    }
  }, [item, selectedCategoryId]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (!formData.name) {
        throw new Error('Название товара обязательно для заполнения');
      }
      
      if (!formData.categoryId) {
        throw new Error('Выберите категорию');
      }
      
      if (!user?.id) {
        throw new Error('Пользователь не авторизован');
      }
      
      // Убедимся, что у нас есть ID пользователя
      const itemData: ShoppingListItem = {
        ...formData as ShoppingListItem,
        userId: user.id
      };
      
      if (isEditing && item?.id) {
        await updateItem(item.id, itemData);
      } else {
        await addItem(itemData);
      }
      
      onClose();
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEditing ? 'Редактирование товара' : 'Новый товар'}
      footer={
        <div className="flex justify-end space-x-2">
          <Button
            onClick={onClose}
            variant="secondary"
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
            disabled={loading}
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>{error}</span>
          </div>
        )}
        
        <div>
          <label htmlFor="name" className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            Название
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            className="input-field"
            placeholder="Введите название товара"
            required
          />
        </div>
        
        <div>
          <label htmlFor="categoryId" className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            Категория
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId || ''}
            onChange={handleChange}
            className="select-field"
            required
            disabled={isLoadingCategories}
          >
            <option value="">Выберите категорию</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {isLoadingCategories && (
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Загрузка категорий...
            </div>
          )}
        </div>
        
        <div>
          <label htmlFor="quantity" className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            Количество
          </label>
          <div className="flex items-center">
            <button 
              type="button" 
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-l-md border border-gray-300 dark:border-gray-600"
              onClick={() => setFormData(prev => ({ ...prev, quantity: Math.max(1, (prev.quantity || 1) - 1) }))}
            >
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path>
              </svg>
            </button>
            <input
              type="number"
              id="quantity"
              name="quantity"
              min="1"
              value={formData.quantity || 1}
              onChange={handleChange}
              className="py-2 px-3 border-y border-gray-300 dark:border-gray-600 text-center w-20 focus:outline-none focus:ring-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <button 
              type="button" 
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-r-md border border-gray-300 dark:border-gray-600"
              onClick={() => setFormData(prev => ({ ...prev, quantity: (prev.quantity || 1) + 1 }))}
            >
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <input 
              type="checkbox" 
              id="purchased" 
              name="purchased"
              checked={formData.purchased || false}
              onChange={handleChange}
              className="absolute block w-6 h-6 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-full appearance-none cursor-pointer checked:border-blue-500 checked:bg-blue-500 dark:checked:bg-blue-500 transition-all duration-200 left-0 top-0 checked:left-4"
            />
            <label 
              htmlFor="purchased" 
              className="block h-6 overflow-hidden bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer transition-all duration-200"
            ></label>
          </div>
          <label htmlFor="purchased" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
            Уже куплено
          </label>
        </div>
      </form>
    </Modal>
  );
} 