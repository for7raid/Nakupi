'use client';

import { TelegramAuthManager } from '../components/TelegramAuthManager';
import { ItemListPage } from '../components/pages/ItemListPage';

export default function Home() {
  return (
    <TelegramAuthManager>
      <ItemListPage />
    </TelegramAuthManager>
  );
}
