import React from 'react';
import { ApiError } from '../../api/client';
import './ErrorMessage.css';

interface ErrorMessageProps {
  error: ApiError | Error | string | null;
  onClose?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onClose,
  className = '',
}) => {
  if (!error) return null;

  const getErrorMessage = (error: ApiError | Error | string): string => {
    if (typeof error === 'string') return error;
    if (error instanceof ApiError) return error.message;
    return error.message || 'An unexpected error occurred';
  };

  const getErrorCode = (error: ApiError | Error | string): string | undefined => {
    if (error instanceof ApiError) return error.code;
    return undefined;
  };

  const message = getErrorMessage(error);
  const code = getErrorCode(error);

  return (
    <div className={`error-message ${className}`}>
      <div className="error-message__content">
        <div className="error-message__icon">⚠️</div>
        <div className="error-message__text">
          {code && <div className="error-message__code">Error: {code}</div>}
          <div className="error-message__message">{message}</div>
        </div>
        {onClose && (
          <button
            className="error-message__close"
            onClick={onClose}
            aria-label="Close error message"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};