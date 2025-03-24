'use client';

import { useEffect } from 'react';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import { useUserStore } from '../store/useUserStore';
import { MainMenu } from './MainMenu';

export function TelegramAuthManager() {
  const { userId, userName, isReady } = useTelegramWebApp();
  const { user, getUser, saveUser } = useUserStore();

  // Авторизуем пользователя и сохраняем данные в базе
  useEffect(() => {
    async function initUser() {
      if (userId && isReady) {
        try {
          // Пытаемся получить пользователя по ID
          const existingUser = await getUser(userId);
          
          // Если пользователь не найден, создаем нового
          if (!existingUser) {
            await saveUser({
              id: userId,
              name: userName || 'Пользователь Telegram'
            });
          }
        } catch (error) {
          console.error('Ошибка при инициализации пользователя:', error);
        }
      }
    }

    initUser();
  }, [userId, userName, isReady, getUser, saveUser]);

  // Если приложение еще не готово или пользователь не авторизован, показываем загрузку
  if (!isReady || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="mb-4">
            <svg className="animate-spin h-10 w-10 mx-auto text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-lg">Загрузка приложения...</p>
        </div>
      </div>
    );
  }

  // Если пользователь авторизован, показываем основное приложение
  return <MainMenu />;
} 