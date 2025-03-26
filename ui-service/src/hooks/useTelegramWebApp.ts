import { useEffect, useState } from 'react';
import { TelegramWebApp } from '../types';

declare global {
  interface Window {
    Telegram: {
      WebApp: TelegramWebApp;
    };
  }
}

export const useTelegramWebApp = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 5;

    const initializeTelegramWebApp = () => {
      try {
        console.log('Initializing Telegram WebApp...');
        console.log('window.Telegram:', typeof window !== 'undefined' ? window.Telegram : 'undefined');
        
        if (typeof window === 'undefined') {
          console.log('Window is undefined (SSR)');
          return;
        }

        if (!window.Telegram) {
          console.log('Telegram object not found, waiting...');
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(initializeTelegramWebApp, 1000);
            return;
          }
          console.log('Max retries reached, using test data');
          setUserId(126765008);
          setUserName('Test User');
          setIsReady(true);
          return;
        }

        if (!window.Telegram.WebApp) {
          console.log('WebApp not found, waiting...');
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(initializeTelegramWebApp, 1000);
            return;
          }
          console.log('Max retries reached, using test data');
          setUserId(126765008);
          setUserName('Test User');
          setIsReady(true);
          return;
        }

        console.log('Telegram WebApp found');
        const tgWebApp = window.Telegram.WebApp;
        setWebApp(tgWebApp);
        
        // Инициализируем WebApp
        tgWebApp.ready();
        
        // Получаем данные о пользователе
        const user = tgWebApp.initDataUnsafe.user;
        console.log('Telegram user data:', user);
        
        if (user) {
          setUserId(user.id);
          setUserName(user.first_name + (user.last_name ? ` ${user.last_name}` : ''));
          console.log('User data set:', { id: user.id, name: user.first_name });
        } else {
          console.log('No user data found, using test data');
          setUserId(126765008);
          setUserName('Test User');
        }
        
        setIsReady(true);
        console.log('Telegram WebApp ready');
        
        // Устанавливаем тему приложения
        if (tgWebApp.colorScheme === 'dark') {
          document.documentElement.classList.add('dark');
        }
        
        // Расширяем WebApp на весь экран
        tgWebApp.expand();
      } catch (error) {
        console.error('Error initializing Telegram WebApp:', error);
        // В случае ошибки используем тестовые данные
        setUserId(126765008);
        setUserName('Test User');
        setIsReady(true);
      }
    };

    initializeTelegramWebApp();
  }, []);

  return {
    webApp,
    userId,
    userName,
    isReady,
    // Хелперы для работы с WebApp
    close: () => webApp?.close(),
    expand: () => webApp?.expand(),
    setHeaderColor: (color: string) => webApp?.setHeaderColor(color),
    setBackgroundColor: (color: string) => webApp?.setBackgroundColor(color),
    isExpanded: webApp?.isExpanded || false,
    colorScheme: webApp?.colorScheme || 'light',
    // Функция для определения, запущено ли приложение в Telegram WebApp
    isInTelegramWebApp: !!webApp,
  };
}; 