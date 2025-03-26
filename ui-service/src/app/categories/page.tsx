'use client';

import { TelegramAuthManager } from '../../components/TelegramAuthManager';
import { CategoryListPage } from '../../components/pages/CategoryListPage';

export default function CategoriesPage() {
  return (
    <TelegramAuthManager>
      <CategoryListPage />
    </TelegramAuthManager>
  );
} 