'use client';

import React from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'primary', className = '' }: BadgeProps) {
  // Варианты стилей для бейджа
  const variantClasses = {
    primary: 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200',
    secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    success: 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200',
    danger: 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200',
    warning: 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200',
    info: 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200',
  };

  return (
    <span className={`ml-2 text-xs ${variantClasses[variant]} py-0.5 px-1 rounded ${className}`}>
      {children}
    </span>
  );
} 