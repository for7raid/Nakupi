'use client';

import React, { useState } from 'react';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useUserStore } from '../../store/useUserStore';
import { Category } from '../../types';
import { Modal } from '../atoms/Modal';
import { FormField } from '../molecules/FormField';
import { Button } from '../atoms/Button';

interface CategoryFormProps {
  category?: Category | null;
  onClose: () => void;
}

export function CategoryForm({ category, onClose }: CategoryFormProps) {
  const [name, setName] = useState(category?.name || '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { addCategory, updateCategory } = useCategoryStore();
  const { user } = useUserStore();
  
  const isEditMode = !!category?.id;
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (error) setError(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Пожалуйста, введите название категории');
      return;
    }
    
    if (!user?.id) {
      setError('Вы должны быть авторизованы для создания категорий');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (isEditMode && category) {
        await updateCategory({
          ...category,
          name
        });
      } else {
        await addCategory({
          userId: user.id,
          name
        });
      }
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEditMode ? 'Редактирование категории' : 'Создание категории'}
      footer={
        <div className="flex justify-end space-x-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            {isEditMode ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <FormField
          id="category-name"
          label="Название категории"
          value={name}
          onChange={handleNameChange}
          placeholder="Например: Продукты, Бытовая химия и т.д."
          error={error || undefined}
          isRequired
          autoFocus
          maxLength={50}
          isDisabled={isSubmitting}
        />
      </form>
    </Modal>
  );
} 