'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '../../store/useUserStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { Category, CategoryAccess } from '../../types';
import { Modal } from '../atoms/Modal';
import { Button } from '../atoms/Button';

interface AccessManagementProps {
  category: Category;
  onClose: () => void;
}

export function AccessManagement({ category, onClose }: AccessManagementProps) {
  // Разделяем состояния загрузки для списка пользователей и для создания кода
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingCode, setIsLoadingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showShareCode, setShowShareCode] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  const { user } = useUserStore();
  const { createShareCode, getUsersWithAccess, usersWithAccess, shareCode, revokeAccess } = useCategoryStore();
  
  // Загрузка данных по требованию с useCallback для мемоизации
  const loadUsersWithAccess = useCallback(async () => {
    if (!category.id || !user?.id || isLoadingUsers) return;
    
    setIsLoadingUsers(true);
    setError(null);
    
    try {
      await getUsersWithAccess(category.id, user.id);
      setDataLoaded(true);
    } catch (error) {
      console.error('Ошибка при загрузке пользователей с доступом:', error);
      setError('Не удалось загрузить пользователей с доступом');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [category.id, user?.id, getUsersWithAccess, isLoadingUsers]);
  
  // Используем useEffect для загрузки данных только при первом рендере
  useEffect(() => {
    // Загружаем список пользователей при открытии
    loadUsersWithAccess();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Пустой массив зависимостей гарантирует выполнение только при монтировании
  
  // Создание кода доступа через API
  const handleCreateShareCode = useCallback(async () => {
    if (!category.id || !user?.id) return;
    
    // Сначала показываем модалку, затем загружаем код
    setShowShareCode(true);
    setIsLoadingCode(true);
    setError(null);
    
    try {
      await createShareCode(category.id, user.id);
    } catch (error) {
      console.error('Ошибка при создании кода доступа:', error);
      setError('Не удалось создать код доступа');
    } finally {
      setIsLoadingCode(false);
    }
  }, [category.id, user?.id, createShareCode]);
  
  // Отзыв доступа через API
  const handleRevokeAccess = useCallback(async (targetUserId: string) => {
    if (!category.id || !user?.id) return;
    
    setIsLoadingUsers(true);
    setError(null);
    
    try {
      await revokeAccess(category.id, user.id, targetUserId);
      
      // После отзыва доступа обновляем список пользователей
      await getUsersWithAccess(category.id, user.id);
      
      setError(null);
    } catch (error) {
      console.error('Ошибка при отзыве доступа:', error);
      setError('Не удалось отозвать доступ');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [category.id, user?.id, revokeAccess, getUsersWithAccess]);
  
  // Обработчик для ручного обновления
  const handleRefresh = useCallback(async () => {
    if (!category.id || !user?.id || isLoadingUsers) return;
    
    await loadUsersWithAccess();
  }, [category.id, user?.id, isLoadingUsers, loadUsersWithAccess]);
  
  // Рендерим содержимое модального окна в зависимости от состояния
  const renderContent = () => {
    if (showShareCode) {
      return (
        <div>
          <h4 className="font-medium mb-2">Код доступа к списку:</h4>
          {isLoadingCode ? (
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center mb-4">
              <p className="text-gray-600 dark:text-gray-400">Генерация кода...</p>
            </div>
          ) : (
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center mb-4">
              <code className="text-xl font-bold">{shareCode}</code>
            </div>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Поделитесь этим кодом с друзьями, чтобы они могли присоединиться к вашему списку.
          </p>
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={() => setShowShareCode(false)}
              disabled={isLoadingCode}
            >
              Назад
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <>
        {isLoadingUsers && (
          <div className="py-4 text-center">Загрузка списка пользователей...</div>
        )}
        
        {!isLoadingUsers && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Пользователи с доступом:</h4>
              {dataLoaded && (
                <Button 
                  variant="secondary"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoadingUsers}
                >
                  Обновить
                </Button>
              )}
            </div>
            
            {!dataLoaded ? (
              <p className="text-gray-600 dark:text-gray-400">
                Загрузка данных...
              </p>
            ) : !usersWithAccess || usersWithAccess.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                К списку пока никто не имеет доступа
              </p>
            ) : (
              <ul className="max-h-60 overflow-y-auto divide-y">
                {usersWithAccess.map(userAccess => (
                  <li 
                    key={userAccess.userId} 
                    className="py-2 flex justify-between items-center"
                  >
                    <div>
                      <span>{userAccess.username || userAccess.userId}</span>
                      {userAccess.isOwner && (
                        <span className="ml-2 text-xs bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 py-0.5 px-1 rounded">
                          владелец
                        </span>
                      )}
                    </div>
                    
                    {!userAccess.isOwner && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRevokeAccess(userAccess.userId)}
                      >
                        Отозвать доступ
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        
        <div className="flex justify-between">
          <Button
            variant="success"
            onClick={handleCreateShareCode}
            disabled={isLoadingCode}
          >
            Создать код доступа
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Закрыть
          </Button>
        </div>
      </>
    );
  };
  
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Управление доступом к списку: ${category.name}`}
      footer={null}
    >
      {error && (
        <div className="py-2 text-red-500 mb-2">{error}</div>
      )}
      
      {renderContent()}
    </Modal>
  );
} 