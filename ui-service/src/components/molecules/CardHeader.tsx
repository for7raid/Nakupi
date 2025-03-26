'use client';

import React from 'react';
import { Badge } from '../atoms/Badge';

interface CardHeaderProps {
  title: string;
  isShared?: boolean;
  isOwner?: boolean;
  actions?: React.ReactNode;
}

export function CardHeader({ title, isShared = false, isOwner = false, actions }: CardHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">
        {title}
        {isShared && !isOwner && (
          <Badge variant="primary">общий</Badge>
        )}
        {isOwner && (
          <Badge variant="warning">владелец</Badge>
        )}
      </h3>
      {actions && (
        <div className="flex space-x-2">
          {actions}
        </div>
      )}
    </div>
  );
} 