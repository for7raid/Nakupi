'use client';

import React from 'react';
import { ItemListTemplate } from '../templates/ItemListTemplate';
import { Navigation } from '../organisms/Navigation';
// import { ThemeDebugger } from '../ThemeDebugger';

export function ItemListPage() {
  return (
    <>
      <Navigation />
      <ItemListTemplate />
      {/* {process.env.NODE_ENV !== 'production' && <ThemeDebugger />} */}
    </>
  );
} 