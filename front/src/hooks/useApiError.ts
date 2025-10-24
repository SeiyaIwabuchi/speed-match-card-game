import { useState, useCallback } from 'react';
import { ApiError } from '../api/client';

export interface ApiErrorState {
  hasError: boolean;
  error: ApiError | null;
  message: string;
}

export const useApiError = () => {
  const [errorState, setErrorState] = useState<ApiErrorState>({
    hasError: false,
    error: null,
    message: '',
  });

  const setError = useCallback((error: ApiError | Error | string) => {
    if (error instanceof ApiError) {
      setErrorState({
        hasError: true,
        error,
        message: error.message,
      });
    } else if (error instanceof Error) {
      setErrorState({
        hasError: true,
        error: null,
        message: error.message,
      });
    } else {
      setErrorState({
        hasError: true,
        error: null,
        message: error,
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      message: '',
    });
  }, []);

  const handleApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: ApiError) => void
  ): Promise<T | null> => {
    try {
      clearError();
      const result = await apiCall();
      if (onSuccess) {
        onSuccess(result);
      }
      return result;
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError('UNKNOWN_ERROR', 'An unexpected error occurred');
      setError(apiError);
      if (onError) {
        onError(apiError);
      }
      return null;
    }
  }, [clearError, setError]);

  return {
    ...errorState,
    setError,
    clearError,
    handleApiCall,
  };
};