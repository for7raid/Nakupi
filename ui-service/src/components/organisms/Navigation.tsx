'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSystemStatusStore } from '../../store/useSystemStatusStore';
import { useThemeStore } from '../../store/useThemeStore';
import { SunIcon, MoonIcon, ShoppingBagIcon, SquaresPlusIcon } from '@heroicons/react/24/outline';

export function Navigation() {
  const pathname = usePathname();
  const { status } = useSystemStatusStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleThemeToggle = useCallback(() => {
    console.log('Клик по кнопке переключения темы');
    toggleTheme();
  }, [toggleTheme]);

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 shadow-sm mb-4">
    {/* Статус системы */}
    <div className="flex items-center justify-between py-1 px-3 bg-gray-50 dark:bg-gray-800 text-xs">
      <div className="flex items-center">
        <span className={`inline-block w-2 h-2 rounded-full mr-1 ${status ? 'bg-green-500' : 'bg-red-500'}`}></span>
        <span className="text-gray-600 dark:text-gray-300">Статус системы: {status ? 'онлайн' : 'офлайн'}</span>
      </div>
      
      <button 
        onClick={handleThemeToggle} 
        className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Переключить тему"
        type="button"
      >
        {theme === 'light' ? (
          <MoonIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        ) : (
          <SunIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        )}
      </button>
    </div>
      <div className="container-app">
        
        {/* Основная навигация */}
        <div className="flex justify-start py-4">
          <Link 
            href="/"
            className={`flex items-center py-2 px-4 mr-4 rounded-lg transition-all duration-200 ${
              pathname === '/'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <ShoppingBagIcon className="h-5 w-5 mr-2" />
            Список покупок
          </Link>
          <Link 
            href="/categories"
            className={`flex items-center py-2 px-4 rounded-lg transition-all duration-200 ${
              pathname === '/categories'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <SquaresPlusIcon className="h-5 w-5 mr-2" />
            Категории
          </Link>
        </div>
      </div>
    </div>
  );
} 