'use client';

import React, { useState } from 'react';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useUserStore } from '../../store/useUserStore';
import { Modal } from '../atoms/Modal';
import { FormField } from '../molecules/FormField';
import { Button } from '../atoms/Button';

interface JoinShareCodeFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function JoinShareCodeForm({ onClose, onSuccess }: JoinShareCodeFormProps) {
  const [shareCode, setShareCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { joinSharedList, getCategories } = useCategoryStore();
  const { user } = useUserStore();
  
  const handleShareCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Форматируем код: только буквы и цифры, автоматически в верхний регистр
    const formattedCode = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    setShareCode(formattedCode);
    if (error) setError(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shareCode.trim()) {
      setError('Пожалуйста, введите код доступа');
      return;
    }
    
    // Проверяем длину кода (ожидаем не менее 6 символов)
    if (shareCode.length < 6) {
      setError('Код доступа должен содержать не менее 6 символов');
      return;
    }
    
    if (!user?.id) {
      setError('Необходимо авторизоваться');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Присоединяемся к списку по коду
      await joinSharedList(shareCode, user.id);
      
      // Обновляем список категорий после успешного добавления
      await getCategories(user.id);
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Закрываем форму
      onClose();
    } catch (err) {
      console.error('Ошибка при присоединении к списку:', err);
      
      // Показываем понятную ошибку пользователю
      const errorMessage = err instanceof Error 
        ? err.message.includes('не найдена') 
          ? 'Неверный код доступа. Пожалуйста, проверьте код и попробуйте снова.' 
          : err.message
        : 'Не удалось присоединиться к списку';
        
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Присоединиться к списку"
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
            variant="success"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={isSubmitting || !shareCode.trim()}
          >
            Присоединиться
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <FormField
          id="shareCode"
          label="Код доступа"
          value={shareCode}
          onChange={handleShareCodeChange}
          placeholder="Введите код (например: ABC123)"
          error={error || undefined}
          helperText="Введите код доступа, который вам предоставил владелец списка"
          isRequired
          autoFocus
          maxLength={8}
          isDisabled={isSubmitting}
        />
      </form>
    </Modal>
  );
} 