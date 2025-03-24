'use client';

import { useEffect, useState } from 'react';
import { useItemStore } from '../store/useItemStore';
import { useCategoryStore } from '../store/useCategoryStore';
import { useUserStore } from '../store/useUserStore';
import { ShoppingListItem } from '../types';
import { ItemForm } from './ItemForm';

export function ItemList() {
  const { items, isLoading, error, getItems, removeItem, markAsPurchased, markAsNotPurchased, showPurchased, toggleShowPurchased } = useItemStore();
  const { categories } = useCategoryStore();
  const { user } = useUserStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShoppingListItem | null>(null);

  // Загружаем элементы при монтировании компонента или изменении категории
  useEffect(() => {
    if (user?.id) {
      getItems(user.id, selectedCategoryId || undefined);
    }
  }, [getItems, user, selectedCategoryId]);

  const handleAddClick = () => {
    setSelectedItem(null);
    setShowForm(true);
  };

  const handleEditClick = (item: ShoppingListItem) => {
    setSelectedItem(item);
    setShowForm(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      await removeItem(id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedItem(null);
  };

  const handleTogglePurchased = async (item: ShoppingListItem) => {
    if (item.purchased) {
      await markAsNotPurchased(item.id || '');
    } else {
      await markAsPurchased(item.id || '');
    }
  };

  // Фильтруем элементы в зависимости от настроек отображения
  const filteredItems = showPurchased 
    ? items 
    : items.filter(item => !item.purchased);

  if (isLoading) {
    return <div className="text-center py-4">Загрузка товаров...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-4">Ошибка: {error}</div>;
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Без категории';
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Список покупок</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => toggleShowPurchased()}
            className="bg-gray-200 hover:bg-gray-300 py-2 px-4 rounded"
          >
            {showPurchased ? 'Скрыть купленные' : 'Показать купленные'}
          </button>
          
          <button
            onClick={handleAddClick}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            Добавить товар
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="category" className="block mb-2 font-medium">
          Фильтр по категории
        </label>
        <select
          id="category"
          value={selectedCategoryId || ''}
          onChange={(e) => setSelectedCategoryId(e.target.value || null)}
          className="w-full p-2 border rounded"
        >
          <option value="">Все категории</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <ItemForm
          item={selectedItem}
          onClose={handleFormClose}
        />
      )}

      {filteredItems.length === 0 ? (
        <div className="text-center py-4">Нет доступных товаров</div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`border rounded-lg p-4 shadow-sm ${
                item.purchased 
                  ? 'bg-gray-100 dark:bg-gray-700' 
                  : 'bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={item.purchased}
                    onChange={() => handleTogglePurchased(item)}
                    className="h-5 w-5"
                  />
                  <div className={item.purchased ? 'line-through text-gray-500' : ''}>
                    <h3 className="text-lg font-semibold">{item.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Категория: {getCategoryName(item.categoryId)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Количество: {item.quantity}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditClick(item)}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => handleDeleteClick(item.id || '')}
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