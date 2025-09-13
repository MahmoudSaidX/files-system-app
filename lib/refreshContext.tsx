'use client';

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { RefreshContextType } from '@/types';

/**
 * Custom event names for refresh operations
 */
const REFRESH_EVENTS = {
  RECENT_FILES: 'refreshRecentFiles',
  FOLDER_LIST: 'refreshFolderList'
} as const;

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

interface RefreshProviderProps {
  children: ReactNode;
}

export function RefreshProvider({ children }: RefreshProviderProps) {
  const refreshRecentFiles = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(REFRESH_EVENTS.RECENT_FILES));
    }
  }, []);

  const refreshFolderList = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(REFRESH_EVENTS.FOLDER_LIST));
    }
  }, []);

  return (
    <RefreshContext.Provider value={{ refreshRecentFiles, refreshFolderList }}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh() {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
}

/**
 * Hook for components that need to listen to refresh events
 * @param callback - Function to call when refresh event is triggered
 * @param eventType - Type of refresh event to listen for (defaults to 'RECENT_FILES')
 */
export function useRefreshListener(
  callback: () => void,
  eventType: keyof typeof REFRESH_EVENTS = 'RECENT_FILES'
) {
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const eventName = REFRESH_EVENTS[eventType];
    const handleRefresh = () => callback();
    
    window.addEventListener(eventName, handleRefresh);
    return () => window.removeEventListener(eventName, handleRefresh);
  }, [callback, eventType]);
}

/**
 * Hook specifically for listening to folder list refresh events
 */
export function useFolderListRefresh(callback: () => void) {
  useRefreshListener(callback, 'FOLDER_LIST');
}

/**
 * Hook specifically for listening to recent files refresh events
 */
export function useRecentFilesRefresh(callback: () => void) {
  useRefreshListener(callback, 'RECENT_FILES');
}