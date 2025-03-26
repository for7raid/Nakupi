'use client';

import React from 'react';
import { Input } from '../atoms/Input';

interface FormFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
}

export function FormField({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  helperText,
  isRequired = false,
  isDisabled = false,
  autoFocus = false,
  maxLength,
  ...props
}: FormFieldProps) {
  return (
    <div className="mb-4">
      <Input
        id={id}
        type={type}
        label={label}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        error={error}
        helperText={helperText}
        required={isRequired}
        disabled={isDisabled}
        autoFocus={autoFocus}
        maxLength={maxLength}
        {...props}
      />
    </div>
  );
} 