'use client';

import React from 'react';
import { CategoryListTemplate } from '../templates/CategoryListTemplate';
import { Navigation } from '../organisms/Navigation';

export function CategoryListPage() {
  return (
    <>
      <Navigation />
      <CategoryListTemplate />
    </>
  );
} 