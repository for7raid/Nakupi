import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type ThemeType = 'light' | 'dark';

interface ThemeState {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
}

// Определяем предпочитаемую системную тему
const getSystemTheme = (): ThemeType => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light', // Инициализируем светлой темой по умолчанию
      setTheme: (theme) => {
        console.log('Устанавливаем тему:', theme);
        set({ theme });
      },
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        console.log('Переключаем тему с', get().theme, 'на', newTheme);
        set({ theme: newTheme });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            console.log('Восстановлена тема из localStorage:', state.theme);
          } else {
            console.log('Нет сохраненной темы, используем системную тему');
            // Если в localStorage нет темы, используем системную
            const systemTheme = getSystemTheme();
            // Установка системной темы через useThemeStore, а не через state напрямую
            setTimeout(() => {
              useThemeStore.getState().setTheme(systemTheme);
            }, 0);
          }
        };
      },
    }
  )
); 