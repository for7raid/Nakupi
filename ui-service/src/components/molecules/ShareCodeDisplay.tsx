'use client';

import React from 'react';
import { Button } from '../atoms/Button';

interface ShareCodeDisplayProps {
  shareCode: string | null;
  isLoading: boolean;
  onClose: () => void;
}

export function ShareCodeDisplay({ shareCode, isLoading, onClose }: ShareCodeDisplayProps) {
  return (
    <div>
      <h4 className="font-medium mb-2">Код доступа к списку:</h4>
      
      {isLoading ? (
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center mb-4">
          <p className="text-gray-600 dark:text-gray-400">Генерация кода доступа...</p>
        </div>
      ) : shareCode ? (
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center mb-4">
          <code className="text-xl font-bold">{shareCode}</code>
        </div>
      ) : (
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center mb-4">
          <p className="text-red-500">Ошибка при создании кода доступа</p>
        </div>
      )}
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Поделитесь этим кодом с друзьями, чтобы они могли присоединиться к вашему списку.
      </p>
      
      <div className="flex justify-end">
        <Button variant="primary" onClick={onClose}>
          Закрыть
        </Button>
      </div>
    </div>
  );
} 