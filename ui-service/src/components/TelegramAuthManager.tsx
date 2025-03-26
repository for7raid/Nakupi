'use client';

import { useEffect } from 'react';
import { useTelegramWebApp } from '../hooks/useTelegramWebApp';
import { useUserStore } from '../store/useUserStore';
import { useSystemStatusStore } from '../store/useSystemStatusStore';
import { userAPI } from '../api/client';
import { TelegramWebApp } from '../types';

declare global {
  interface Window {
    Telegram: {
      WebApp: TelegramWebApp;
    };
  }
}

export function TelegramAuthManager({ children }: { children: React.ReactNode }) {
  const { userId, userName, isReady } = useTelegramWebApp();
  const { user, getUser, saveUser, setUser } = useUserStore();
  const { status, error, uptime, timestamp, lastChecked, getStatus } = useSystemStatusStore();

  // Добавляем логирование состояния
  useEffect(() => {
    console.log('TelegramAuthManager state:', { userId, userName, isReady, user });
  }, [userId, userName, isReady, user]);

  useEffect(() => {
    const checkStatus = async () => {
      await getStatus();
      console.log('API Status:', { status, uptime, timestamp, lastChecked });
    };
    
    checkStatus();
    // Проверяем статус каждые 30 секунд
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const initTelegramAuth = async () => {
      try {
        // Проверяем, доступен ли Telegram WebApp
        if (window.Telegram && window.Telegram.WebApp) {
          console.log('Telegram WebApp доступен, инициализация...');
          const telegramApp = window.Telegram.WebApp;
          
          // Инициализируем WebApp
          telegramApp.ready();
          telegramApp.expand();
          
          // Получаем данные пользователя
          const initData = telegramApp.initDataUnsafe;
          
          if (initData.user) {
            const telegramUser = initData.user;
            console.log('Получены данные пользователя из Telegram:', telegramUser);
            
            // Проверяем, существует ли пользователь
            const userId = telegramUser.id.toString();
            let foundUser = await userAPI.getUser(userId);
            
            if (!foundUser) {
              // Создаем нового пользователя
              console.log('Создаем нового пользователя из Telegram');
              foundUser = await userAPI.createUser({
                name: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
                registrationDate: new Date().toISOString()
              });
            }
            
            // Сохраняем пользователя в хранилище
            setUser(foundUser);
          } else {
            console.log('Нет данных пользователя в Telegram WebApp, используем тестового пользователя');
            await setupTestUser();
          }
        } else {
          console.log('Telegram WebApp не доступен, используем тестового пользователя для разработки');
          await setupTestUser();
        }
      } catch (error) {
        console.error('Ошибка при инициализации Telegram WebApp:', error);
        // В случае ошибки используем тестового пользователя
        await setupTestUser();
      }
    };
    
    const setupTestUser = async () => {
      try {
        // Для разработки используем тестового пользователя
        const testUserId = '126765008';
        console.log('Попытка получения тестового пользователя с ID:', testUserId);
        
        let testUser = await userAPI.getUser(testUserId);
        
        if (!testUser) {
          console.log('Тестовый пользователь не найден, создаем нового');
          const newUser = {
            name: 'Тестовый Пользователь',
            registrationDate: new Date().toISOString()
          };
          
          try {
            testUser = await userAPI.createUser(newUser);
            console.log('Создан новый тестовый пользователь:', testUser);
          } catch (createError) {
            console.error('Ошибка при создании тестового пользователя:', createError);
            
            // Если не удалось создать через API, используем локального пользователя
            testUser = {
              id: testUserId,
              name: 'Тестовый Пользователь',
              registrationDate: new Date().toISOString(),
              lastActionDate: new Date().toISOString()
            };
          }
        } else {
          console.log('Найден существующий тестовый пользователь:', testUser);
        }
        
        // Сохраняем тестового пользователя в хранилище
        setUser(testUser);
      } catch (error) {
        console.error('Ошибка при настройке тестового пользователя:', error);
        
        // В крайнем случае, создаем пользователя локально
        setUser({
          id: 'test-user-id-123',
          name: 'Тестовый Пользователь (Аварийный)',
          registrationDate: new Date().toISOString(),
          lastActionDate: new Date().toISOString()
        });
      }
    };

    if (!user) {
      console.log('Пользователь не найден, инициализируем...');
      initTelegramAuth();
    } else {
      console.log('Пользователь уже инициализирован:', user);
    }
  }, [user, setUser]);

  // Если пользователь не авторизован, показываем splash screen
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-blue-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <div className="mb-6">
            <div className="animate-spin h-16 w-16 mx-auto border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
          <h1 className="text-2xl font-bold text-blue-600 mb-2">NAKUPI</h1>
          <p className="text-lg text-gray-700 mb-4">Ваш умный список покупок</p>
          <p className="text-sm text-gray-500">Загрузка приложения...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 