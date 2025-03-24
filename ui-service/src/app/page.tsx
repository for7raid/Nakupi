'use client';

import { TelegramAuthManager } from '../components/TelegramAuthManager';

export default function Home() {
  return (
    <main className="min-h-screen">
      <TelegramAuthManager />
    </main>
  );
}
