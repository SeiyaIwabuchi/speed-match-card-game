import React, { forwardRef } from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  fullWidth = false,
  leftIcon,
  rightIcon,
  variant = 'default',
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseClasses = 'input-field';
  const variantClasses = `input-field--${variant}`;
  const fullWidthClasses = fullWidth ? 'input-field--full-width' : '';
  const errorClasses = error ? 'input-field--error' : '';
  const iconClasses = (leftIcon || rightIcon) ? 'input-field--with-icons' : '';

  const allClasses = [
    baseClasses,
    variantClasses,
    fullWidthClasses,
    errorClasses,
    iconClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={`input-wrapper ${fullWidth ? 'input-wrapper--full-width' : ''}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div className="input-container">
        {leftIcon && (
          <div className="input-icon input-icon--left">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={allClasses}
          {...props}
        />
        {rightIcon && (
          <div className="input-icon input-icon--right">
            {rightIcon}
          </div>
        )}
      </div>
      {hint && !error && (
        <div className="input-hint">
          {hint}
        </div>
      )}
      {error && (
        <div className="input-error">
          {error}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Textarea Component
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
  variant?: 'default' | 'filled' | 'outlined';
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  hint,
  fullWidth = false,
  variant = 'default',
  resize = 'vertical',
  className = '',
  id,
  ...props
}, ref) => {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseClasses = 'textarea-field';
  const variantClasses = `textarea-field--${variant}`;
  const fullWidthClasses = fullWidth ? 'textarea-field--full-width' : '';
  const errorClasses = error ? 'textarea-field--error' : '';
  const resizeClasses = `textarea-field--resize-${resize}`;

  const allClasses = [
    baseClasses,
    variantClasses,
    fullWidthClasses,
    errorClasses,
    resizeClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={`input-wrapper ${fullWidth ? 'input-wrapper--full-width' : ''}`}>
      {label && (
        <label htmlFor={textareaId} className="input-label">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={allClasses}
        {...props}
      />
      {hint && !error && (
        <div className="input-hint">
          {hint}
        </div>
      )}
      {error && (
        <div className="input-error">
          {error}
        </div>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';