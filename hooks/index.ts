/**
 * Custom React hooks for the application
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiResponse, FileUploadState, FolderCreationState } from '@/types';

/**
 * Hook for managing loading states
 */
export function useLoadingState(initialLoading = false) {
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);

  return {
    loading,
    error,
    setLoading,
    setError
  };
}

/**
 * Hook for managing API calls with loading and error states
 */
export function useApiCall<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (apiCall: () => Promise<ApiResponse<T>>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall();
      
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'An error occurred');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
}

/**
 * Hook for managing file upload state
 */
export function useFileUpload() {
  const [state, setState] = useState<FileUploadState>({
    file: null,
    fileName: '',
    isSubmitting: false,
    error: undefined,
    success: false,
    progress: 0
  });

  const setFile = useCallback((file: File | null) => {
    setState(prev => ({
      ...prev,
      file,
      fileName: file?.name || '',
      error: undefined,
      success: false
    }));
  }, []);

  const setFileName = useCallback((fileName: string) => {
    setState(prev => ({ ...prev, fileName }));
  }, []);

  const setProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress }));
  }, []);

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setState(prev => ({ ...prev, isSubmitting }));
  }, []);

  const setError = useCallback((error: string | undefined) => {
    setState(prev => ({ ...prev, error, success: false }));
  }, []);

  const setSuccess = useCallback((success: boolean) => {
    setState(prev => ({ ...prev, success, error: undefined }));
  }, []);

  const reset = useCallback(() => {
    setState({
      file: null,
      fileName: '',
      isSubmitting: false,
      error: undefined,
      success: false,
      progress: 0
    });
  }, []);

  return {
    ...state,
    setFile,
    setFileName,
    setProgress,
    setSubmitting,
    setError,
    setSuccess,
    reset
  };
}

/**
 * Hook for managing folder creation state
 */
export function useFolderCreation() {
  const [state, setState] = useState<FolderCreationState>({
    folderName: '',
    isOpen: false,
    isSubmitting: false,
    error: undefined,
    success: false
  });

  const setFolderName = useCallback((folderName: string) => {
    setState(prev => ({ ...prev, folderName }));
  }, []);

  const setOpen = useCallback((isOpen: boolean) => {
    setState(prev => ({ ...prev, isOpen }));
  }, []);

  const setSubmitting = useCallback((isSubmitting: boolean) => {
    setState(prev => ({ ...prev, isSubmitting }));
  }, []);

  const setError = useCallback((error: string | undefined) => {
    setState(prev => ({ ...prev, error, success: false }));
  }, []);

  const setSuccess = useCallback((success: boolean) => {
    setState(prev => ({ ...prev, success, error: undefined }));
  }, []);

  const reset = useCallback(() => {
    setState({
      folderName: '',
      isOpen: false,
      isSubmitting: false,
      error: undefined,
      success: false
    });
  }, []);

  return {
    ...state,
    setFolderName,
    setOpen,
    setSubmitting,
    setError,
    setSuccess,
    reset
  };
}

/**
 * Hook for debouncing values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for managing local storage
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

/**
 * Hook for managing previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
}

/**
 * Hook for managing component mount state
 */
export function useIsMounted(): boolean {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  return isMounted;
}

/**
 * Hook for handling click outside
 */
export function useClickOutside(
  ref: React.RefObject<HTMLElement>,
  handler: () => void
) {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, handler]);
}

/**
 * Hook for managing loading state
 */
export const useLoading = (initialState: boolean = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  
  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);
  
  return { isLoading, setLoading };
};