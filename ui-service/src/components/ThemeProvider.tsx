'use client';

import { useEffect } from 'react';
import { useThemeStore } from '../store/useThemeStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();

  useEffect(() => {
    // Отладочная информация
    console.log('Текущая тема:', theme);
    
    // Добавляем или удаляем класс dark из корневого элемента HTML
    const root = document.documentElement;
    
    if (theme === 'dark') {
      console.log('Включаем темную тему, добавляем класс dark');
      root.classList.add('dark');
    } else {
      console.log('Включаем светлую тему, удаляем класс dark');
      root.classList.remove('dark');
    }
    
    // Устанавливаем data-атрибут для контроля темы через CSS
    root.setAttribute('data-theme', theme);
  }, [theme]);

  return <>{children}</>;
} 