'use client';

import React, { useEffect, useState } from 'react';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useUserStore } from '../../store/useUserStore';
import { Category } from '../../types';
import { Button } from '../atoms/Button';
import { CategoryCard } from '../organisms/CategoryCard';
import { CategoryForm } from '../organisms/CategoryForm';
import { ShareCodeModal } from '../organisms/ShareCodeModal';
import { JoinShareCodeForm } from '../organisms/JoinShareCodeForm';
import { AccessManagement } from '../organisms/AccessManagement';

export function CategoryListTemplate() {
  const { 
    categories, 
    isLoading: isLoadingCategories, 
    error, 
    getCategories, 
    removeCategory, 
    createShareCode,
    shareCode: storeShareCode
  } = useCategoryStore();
  
  const { user } = useUserStore();
  const [showForm, setShowForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAccessManagement, setShowAccessManagement] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [isCreatingCode, setIsCreatingCode] = useState(false);

  // Следим за shareCode из хранилища
  useEffect(() => {
    if (storeShareCode && showShareModal) {
      setShareCode(storeShareCode);
    }
  }, [storeShareCode, showShareModal]);

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
      try {
        await removeCategory(id);
        if (user?.id) {
          await getCategories(user.id);
        }
      } catch (error) {
        console.error('Ошибка при удалении категории:', error);
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedCategory(null);
  };
  
  const handleShowJoinForm = () => {
    setShowJoinForm(true);
  };
  
  const handleCloseJoinForm = () => {
    setShowJoinForm(false);
  };
  
  const handleShareList = async (category: Category) => {
    if (!category.id || !user?.id) return;
    
    try {
      setSelectedCategory(category);
      setIsCreatingCode(true);
      
      // Очищаем предыдущий код
      setShareCode(null);
      
      // Показываем модальное окно сразу
      setShowShareModal(true);
      
      // Используем API для создания кода доступа
      const result = await createShareCode(category.id, user.id);
      
      // Устанавливаем код после запроса
      setShareCode(result.code);
    } catch (error) {
      console.error('Ошибка при создании кода доступа:', error);
    } finally {
      setIsCreatingCode(false);
    }
  };
  
  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setShareCode(null);
  };
  
  const handleManageAccess = (category: Category) => {
    setSelectedCategory(category);
    setShowAccessManagement(true);
  };
  
  const handleCloseAccessManagement = () => {
    setShowAccessManagement(false);
  };

  if (isLoadingCategories && !categories.length) {
    return <div className="text-center py-4">Загрузка категорий...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4"> 
        <Button
          onClick={handleShowJoinForm}
          variant="success"
        >
          Присоединиться к списку
        </Button>
        <Button
          onClick={handleAddClick}
          variant="primary"
        >
          Добавить категорию
        </Button> 
      </div>

      {/* Форма создания/редактирования категории */}
      {showForm && (
        <CategoryForm
          category={selectedCategory}
          onClose={handleFormClose}
        />
      )}
      
      {/* Форма присоединения к списку */}
      {showJoinForm && (
        <JoinShareCodeForm
          onClose={handleCloseJoinForm}
        />
      )}
      
      {/* Модальное окно с кодом доступа */}
      <ShareCodeModal
        isOpen={showShareModal}
        onClose={handleCloseShareModal}
        shareCode={shareCode}
        isLoading={isCreatingCode}
      />
      
      {/* Управление доступом */}
      {showAccessManagement && selectedCategory && (
        <AccessManagement
          category={selectedCategory}
          onClose={handleCloseAccessManagement}
        />
      )}

      {error && (
        <div className="text-center text-red-500 py-4">Ошибка: {error}</div>
      )}

      {!isLoadingCategories && !categories.length ? (
        <div className="text-center py-4">Нет доступных категорий</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <CategoryCard
              key={category.id || ''}
              category={category}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onShare={handleShareList}
              onManageAccess={handleManageAccess}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
} 