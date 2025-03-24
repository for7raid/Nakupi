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
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Проверяем, запущено ли приложение внутри Telegram WebApp
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tgWebApp = window.Telegram.WebApp;
      setWebApp(tgWebApp);
      
      // Получаем данные о пользователе из Telegram WebApp
      const user = tgWebApp.initDataUnsafe.user;
      if (user) {
        setUserId(user.id.toString());
        setUserName(user.first_name + (user.last_name ? ` ${user.last_name}` : ''));
      }
      
      // Устанавливаем обработчик события готовности
      tgWebApp.ready();
      setIsReady(true);
      
      // Устанавливаем тему приложения
      if (tgWebApp.colorScheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
      
      // Расширяем WebApp на весь экран
      tgWebApp.expand();
    } else {
      // Устанавливаем тестовые данные для локальной разработки
      setUserId('12345');
      setUserName('Test User');
      setIsReady(true);
    }
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