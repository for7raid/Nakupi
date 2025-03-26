'use client';

import React from 'react';
import { PencilIcon, TrashIcon, ShareIcon, UsersIcon } from '@heroicons/react/24/outline';
import { Card } from '../atoms/Card';
import { CardHeader } from '../molecules/CardHeader';
import { Category } from '../../types';

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onShare: (category: Category) => void;
  onManageAccess: (category: Category) => void;
  currentUserId?: string;
}

export function CategoryCard({ 
  category, 
  onEdit, 
  onDelete, 
  onShare, 
  onManageAccess,
  currentUserId
}: CategoryCardProps) {
  const isEditable = category.isOwner || (!category.isShared && currentUserId === category.userId);
  
  const handleEditClick = () => {
    onEdit(category);
  };

  const handleDeleteClick = () => {
    if (category.id) {
      onDelete(category.id);
    }
  };

  const handleShareClick = () => {
    onShare(category);
  };

  const handleManageAccessClick = () => {
    onManageAccess(category);
  };
  
  // Действия для карточки
  const actions = (
    <>
      {isEditable && (
        <>
          <button
            onClick={handleEditClick}
            className="p-2 text-blue-500 hover:text-blue-600 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title="Изменить"
          >
            <PencilIcon className="w-5 h-5" />
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-2 text-red-500 hover:text-red-600 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Удалить"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </>
      )}
      
      {isEditable && (
        <>
          <button
            onClick={handleShareClick}
            className="p-2 text-green-500 hover:text-green-600 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            title="Поделиться списком"
          >
            <ShareIcon className="w-5 h-5" />
          </button>
          <button
            onClick={handleManageAccessClick}
            className="p-2 text-purple-500 hover:text-purple-600 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
            title="Управление доступом"
          >
            <UsersIcon className="w-5 h-5" />
          </button>
        </>
      )}
    </>
  );

  return (
    <Card isShared={category.isShared}>
      <CardHeader
        title={category.name}
        isShared={category.isShared}
        isOwner={category.isOwner}
        actions={actions}
      />
    </Card>
  );
} 