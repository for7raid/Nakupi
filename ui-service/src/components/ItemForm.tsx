'use client';

import { useState, useEffect } from 'react';
import { useItemStore } from '../store/useItemStore';
import { useCategoryStore } from '../store/useCategoryStore';
import { useUserStore } from '../store/useUserStore';
import { ShoppingListItem } from '../types';

interface ItemFormProps {
  item: ShoppingListItem | null;
  onClose: () => void;
}

export function ItemForm({ item, onClose }: ItemFormProps) {
  const { addItem, updateItemQuantity } = useItemStore();
  const { categories } = useCategoryStore();
  const { user } = useUserStore();
  
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    quantity: 1
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        categoryId: item.categoryId,
        quantity: item.quantity
      });
    }
  }, [item]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'quantity') {
      const quantity = parseInt(value);
      if (quantity > 0) {
        setFormData(prev => ({ ...prev, [name]: quantity }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name.trim()) {
      setError('Название товара не может быть пустым');
      return;
    }

    if (!formData.categoryId) {
      setError('Выберите категорию');
      return;
    }

    if (!user?.id) {
      setError('Пользователь не найден');
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (item) {
        // Обновляем только количество существующего товара
        await updateItemQuantity(item.id || '', formData.quantity);
      } else {
        // Добавляем новый товар
        await addItem({
          name: formData.name,
          categoryId: formData.categoryId,
          userId: user.id,
          quantity: formData.quantity,
          purchased: false
        });
      }
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {item ? 'Редактировать товар' : 'Добавить товар'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block mb-2 font-medium">
              Название товара
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите название товара"
              disabled={!!item} // Отключаем редактирование имени для существующего товара
            />
          </div>

          <div className="mb-4">
            <label htmlFor="categoryId" className="block mb-2 font-medium">
              Категория
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!!item} // Отключаем смену категории для существующего товара
            >
              <option value="">Выберите категорию</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="quantity" className="block mb-2 font-medium">
              Количество
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              min="1"
              onChange={handleChange}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {error && (
            <div className="mb-4 text-red-500">{error}</div>
          )}
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 