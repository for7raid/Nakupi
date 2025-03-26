'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  isShared?: boolean;
}

export function Card({ children, className = '', isShared = false }: CardProps) {
  return (
    <div 
      className={`rounded-lg p-4 shadow-sm ${
        isShared 
          ? 'bg-blue-50 dark:bg-blue-900/20' 
          : 'bg-white dark:bg-gray-800'
      } ${className}`}
    >
      {children}
    </div>
  );
} 