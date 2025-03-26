'use client';

import { useThemeStore } from '../store/useThemeStore';

export function ThemeDebugger() {
  const { theme, setTheme, toggleTheme } = useThemeStore();

  return (
    <div className="fixed bottom-0 right-0 p-4 m-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg z-50">
      <h3 className="font-bold mb-2">Отладка темы</h3>
      <p className="mb-2">Текущая тема: <span className="font-mono">{theme}</span></p>
      <div className="flex flex-col space-y-2">
        <button
          onClick={() => setTheme('light')}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Светлая тема
        </button>
        <button
          onClick={() => setTheme('dark')}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Тёмная тема
        </button>
        <button
          onClick={toggleTheme}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Переключить
        </button>
      </div>
    </div>
  );
} 