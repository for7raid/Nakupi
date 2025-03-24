'use client';

import { useState } from 'react';
import { CategoryList } from './CategoryList';
import { ItemList } from './ItemList';

type TabType = 'items' | 'categories';

export function MainMenu() {
  const [activeTab, setActiveTab] = useState<TabType>('items');

  return (
    <div className="container mx-auto py-4">
      <div className="flex border-b mb-4">
        <button
          className={`py-2 px-4 mr-2 ${
            activeTab === 'items'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500 hover:text-blue-500'
          }`}
          onClick={() => setActiveTab('items')}
        >
          Список покупок
        </button>
        <button
          className={`py-2 px-4 ${
            activeTab === 'categories'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500 hover:text-blue-500'
          }`}
          onClick={() => setActiveTab('categories')}
        >
          Категории
        </button>
      </div>

      {activeTab === 'items' ? <ItemList /> : <CategoryList />}
    </div>
  );
} 