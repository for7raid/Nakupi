'use client';

import React, { useEffect, useState } from 'react';
import { useItemStore } from '../../store/useItemStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useUserStore } from '../../store/useUserStore';
import { PencilIcon, TrashIcon, ShoppingBagIcon, CheckCircleIcon, ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { Button } from '../atoms/Button';
import { Modal } from '../atoms/Modal';
import { ShoppingListItem } from '../../types';
import { ItemForm } from '../organisms/ItemForm';

export function ItemListTemplate() {
  const { 
    items, 
    isLoading, 
    error, 
    getItems, 
    addItem, 
    removeItem, 
    markAsPurchased, 
    markAsNotPurchased,
    updateItemQuantity,
    clearPurchasedItems
  } = useItemStore();
  
  const { categories, getCategories, syncSharedList } = useCategoryStore();
  const { user } = useUserStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPurchased, setShowPurchased] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShoppingListItem | null>(null);

  // Загружаем товары и категории при монтировании компонента
  useEffect(() => {
    if (user?.id) {
      getItems(user.id, selectedCategory || undefined);
      getCategories(user.id);
    }
  }, [getItems, getCategories, user, selectedCategory]);

  const handleAddClick = () => {
    setSelectedItem(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedItem(null);
  };
  
  const handleEditClick = (item: ShoppingListItem) => {
    setSelectedItem(item);
    setShowForm(true);
  };

  const handleFormSubmit = async (formData: any) => {
    if (!user?.id || !selectedCategory) return;
    
    try {
      await addItem({
        ...formData,
        userId: user.id,
        categoryId: selectedCategory
      });
      
      // Если это общая категория, запускаем синхронизацию
      const category = categories.find(c => c.id === selectedCategory);
      if (category?.isShared) {
        await syncSharedList(selectedCategory, user.id);
      }
      
      handleCloseForm();
    } catch (error) {
      console.error('Ошибка при добавлении элемента:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.id) return;
    
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      try {
        await removeItem(id);
        
        // Если это общая категория, запускаем синхронизацию
        if (selectedCategory) {
          const category = categories.find(c => c.id === selectedCategory);
          if (category?.isShared) {
            await syncSharedList(selectedCategory, user.id);
          }
        }
      } catch (error) {
        console.error('Ошибка при удалении элемента:', error);
      }
    }
  };

  const handleTogglePurchased = async (id: string, currentPurchased: boolean) => {
    if (!user?.id) return;
    
    try {
      if (!currentPurchased) {
        await markAsPurchased(id, user.id);
      } else {
        await markAsNotPurchased(id, user.id);
      }
      
      // Если это общая категория, запускаем синхронизацию
      if (selectedCategory) {
        const category = categories.find(c => c.id === selectedCategory);
        if (category?.isShared) {
          await syncSharedList(selectedCategory, user.id);
        }
      }
    } catch (error) {
      console.error('Ошибка при изменении статуса элемента:', error);
    }
  };

  const handleQuantityChange = async (id: string, quantity: number) => {
    if (!user?.id) return;
    
    try {
      await updateItemQuantity(id, quantity);
      
      // Если это общая категория, запускаем синхронизацию
      if (selectedCategory) {
        const category = categories.find(c => c.id === selectedCategory);
        if (category?.isShared) {
          await syncSharedList(selectedCategory, user.id);
        }
      }
    } catch (error) {
      console.error('Ошибка при изменении количества:', error);
    }
  };

  const handleClearPurchased = async () => {
    if (!user?.id) return;
    
    if (window.confirm('Вы уверены, что хотите удалить все купленные элементы?')) {
      try {
        await clearPurchasedItems(user.id);
        
        // Если это общая категория, запускаем синхронизацию
        if (selectedCategory) {
          const category = categories.find(c => c.id === selectedCategory);
          if (category?.isShared) {
            await syncSharedList(selectedCategory, user.id);
          }
        }
      } catch (error) {
        console.error('Ошибка при очистке купленных элементов:', error);
      }
    }
  };

  const filteredItems = items
    .filter(item => {
      // Проверяем, что у элемента есть categoryId
      if (!item.categoryId) return true;
      
      // Фильтр по категории
      if (selectedCategory && item.categoryId !== selectedCategory) {
        return false;
      }
      // Фильтр по статусу покупки
      if (!showPurchased && item.purchased) {
        return false;
      }
      return true;
    });

  // Подсчет статистики
  const stats = {
    total: items.filter(item => {
      if (!selectedCategory) return true;
      return item.categoryId === selectedCategory;
    }).length,
    purchased: items.filter(item => {
      if (!selectedCategory) return item.purchased;
      return item.categoryId === selectedCategory && item.purchased;
    }).length,
    notPurchased: items.filter(item => {
      if (!selectedCategory) return !item.purchased;
      return item.categoryId === selectedCategory && !item.purchased;
    }).length,
    progress: (() => {
      const filteredItems = items.filter(item => {
        if (!selectedCategory) return true;
        return item.categoryId === selectedCategory;
      });
      return filteredItems.length > 0 
        ? Math.round((filteredItems.filter(item => item.purchased).length / filteredItems.length) * 100) 
        : 0;
    })()
  };

  if (isLoading) {
    return <div className="text-center py-4">Загрузка товаров...</div>;
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Без категории';
  };

  return (
    <div className="container-app pb-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">  
        <div className="flex items-center w-full gap-3">
          <select 
            className="select-field w-1/2 h-10"
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
          >
            <option value="">Все категории</option>
            {categories.map((category) => (
              <option key={category.id || ''} value={category.id || ''}>
                {category.name}
              </option>
            ))}
          </select>
          
          <Button
            onClick={() => setShowPurchased(!showPurchased)}
            variant="outline"
            size="sm"
            isFullWidth
            leftIcon={showPurchased ? 
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg> : 
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
              </svg>
            }
            className="w-1/2 h-10"
          >
            {showPurchased ? 'Скрыть купленные' : 'Показать купленные'}
          </Button>
        </div>
        
        <Button
          onClick={handleAddClick}
          variant="primary"
          leftIcon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
          }
        >
          Добавить товар
        </Button> 
      </div>
      
      {/* Форма создания/редактирования товара */}
      {showForm && (
        <ItemForm
          item={selectedItem}
          selectedCategoryId={selectedCategory}
          onClose={handleCloseForm}
        />
      )}
      
      {/* Статистика */}
      <div className="bg-white dark:bg-gray-800 mb-6 p-5 rounded-lg shadow-md border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-gray-200 flex items-center">
          <ChartBarIcon className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
          Статистика списка покупок
        </h3>
        {selectedCategory && (
          <div className="mb-2 text-sm font-normal text-gray-500 dark:text-gray-400">
            ({getCategoryName(selectedCategory)})
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <ShoppingBagIcon className="h-6 w-6 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="text-blue-500 dark:text-blue-400 text-xl font-bold text-center">{stats.total}</div>
            <div className="text-gray-600 dark:text-gray-400 text-sm text-center">Всего товаров</div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <CheckCircleIcon className="h-6 w-6 text-green-500 dark:text-green-400" />
            </div>
            <div className="text-green-500 dark:text-green-400 text-xl font-bold text-center">{stats.purchased}</div>
            <div className="text-gray-600 dark:text-gray-400 text-sm text-center">Куплено</div>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <ClockIcon className="h-6 w-6 text-amber-500 dark:text-amber-400" />
            </div>
            <div className="text-amber-500 dark:text-amber-400 text-xl font-bold text-center">{stats.notPurchased}</div>
            <div className="text-gray-600 dark:text-gray-400 text-sm text-center">Осталось</div>
          </div>
        </div>
        
        <div className="mb-1 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Прогресс покупок</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stats.progress}%</span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              stats.progress < 30 ? 'bg-red-500' : 
              stats.progress < 70 ? 'bg-amber-500' : 
              'bg-green-500'
            }`}
            style={{ width: `${stats.progress}%` }}
          ></div>
        </div>
      </div>

      {error && (
        <div className="text-center py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg mb-6">
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Ошибка: {error}
          </div>
        </div>
      )}

      {!isLoading && !filteredItems.length ? (
        <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
            {selectedCategory 
              ? 'Нет товаров в выбранной категории' 
              : !showPurchased 
                ? 'Нет некупленных товаров' 
                : 'Нет товаров в списке'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            // Проверяем, что у элемента есть id
            if (!item.id) return null;
            
            return (
              <div 
                key={item.id} 
                className={`rounded-lg p-4 flex justify-between items-center shadow-md transition-all duration-200 hover:shadow-lg ${
                  item.purchased 
                    ? 'bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700' 
                    : 'bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900/30'
                }`}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <div className="relative mr-4">
                    <input
                      type="checkbox"
                      checked={item.purchased}
                      onChange={() => handleTogglePurchased(item.id || '', item.purchased)}
                      className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer transition-colors"
                    />
                  </div>
                  
                  <div 
                    className={`truncate ${item.purchased ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}`} 
                    onClick={() => handleEditClick(item)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="font-medium text-base">{item.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center"> 
                      {item.categoryId ? getCategoryName(item.categoryId) : 'Без категории'}
                      {item.quantity && (
                        <span className="ml-2 flex items-center">
                          <ShoppingBagIcon className="h-3 w-3 mr-1" /> 
                          {item.quantity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 ml-4">
                  <button
                    onClick={() => handleEditClick(item)}
                    className="p-2 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                    title="Изменить"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id || '')}
                    className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    title="Удалить"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 