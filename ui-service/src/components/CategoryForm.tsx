'use client';

import { useState, useEffect } from 'react';
import { useCategoryStore } from '../store/useCategoryStore';
import { useUserStore } from '../store/useUserStore';
import { Category } from '../types';

interface CategoryFormProps {
  category: Category | null;
  onClose: () => void;
}

export function CategoryForm({ category, onClose }: CategoryFormProps) {
  const { addCategory, updateCategory } = useCategoryStore();
  const { user } = useUserStore();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name || '');
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Название категории не может быть пустым');
      return;
    }

    if (!user?.id) {
      setError('Пользователь не найден');
      return;
    }

    try {
      setIsSubmitting(true);
      if (category) {
        await updateCategory({ ...category, name });
      } else {
        await addCategory({ 
          name,
          userId: user.id
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
          {category ? 'Редактировать категорию' : 'Добавить категорию'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block mb-2 font-medium">
              Название категории
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите название категории"
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