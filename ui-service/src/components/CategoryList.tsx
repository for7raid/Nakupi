'use client';

import { useEffect, useState } from 'react';
import { useCategoryStore } from '../store/useCategoryStore';
import { useUserStore } from '../store/useUserStore';
import { Category } from '../types';
import { CategoryForm } from './CategoryForm';

export function CategoryList() {
  const { categories, isLoading, error, getCategories, removeCategory } = useCategoryStore();
  const { user } = useUserStore();
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Загружаем категории при монтировании компонента
  useEffect(() => {
    if (user?.id) {
      getCategories(user.id);
    }
  }, [getCategories, user]);

  const handleAddClick = () => {
    setSelectedCategory(null);
    setShowForm(true);
  };

  const handleEditClick = (category: Category) => {
    setSelectedCategory(category);
    setShowForm(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту категорию?')) {
      await removeCategory(id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedCategory(null);
  };

  if (isLoading) {
    return <div className="text-center py-4">Загрузка категорий...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-4">Ошибка: {error}</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Категории</h2>
        <button
          onClick={handleAddClick}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
        >
          Добавить категорию
        </button>
      </div>

      {showForm && (
        <CategoryForm
          category={selectedCategory}
          onClose={handleFormClose}
        />
      )}

      {categories.length === 0 ? (
        <div className="text-center py-4">Нет доступных категорий</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id || ''}
              className="border rounded-lg p-4 shadow-sm bg-white dark:bg-gray-800"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{category.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditClick(category)}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => handleDeleteClick(category.id || '')}
                    className="text-red-500 hover:text-red-600"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 