'use client';

import React from 'react';
import { Modal } from '../atoms/Modal';
import { ShareCodeDisplay } from '../molecules/ShareCodeDisplay';

interface ShareCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareCode: string | null;
  isLoading: boolean;
}

export function ShareCodeModal({ isOpen, onClose, shareCode, isLoading }: ShareCodeModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Код доступа к списку"
      footer={null}
    >
      <ShareCodeDisplay 
        shareCode={shareCode}
        isLoading={isLoading}
        onClose={onClose}
      />
    </Modal>
  );
} 