/**
 * Core application types and interfaces
 */

import React from 'react';

// File system related types
export interface FileSystemItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileSystemItem[];
  createdAt?: Date;
  modifiedAt?: Date;
}

export interface FileItem {
  name: string;
  type: 'file' | 'folder';
  size?: number;
  path: string;
  children?: FileItem[];
}

// Public folder/file types
export interface PublicItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  path: string;
  children?: PublicItem[];
  size?: number;
  parentPath?: string;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Upload related types
export interface UploadResponse extends ApiResponse {
  fileName?: string;
  filePath?: string;
  fileSize?: number;
}

// Folder creation types
export interface CreateFolderRequest {
  name: string;
  parentPath?: string;
}

export interface CreateFolderResponse extends ApiResponse {
  folderName?: string;
  path?: string;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface CreateFolderButtonProps extends BaseComponentProps {
  parentPath?: string;
  onSuccess?: () => void;
}

export interface CreateFileButtonProps extends BaseComponentProps {
  folderId?: string;
  parentPath?: string;
  onSuccess?: () => void;
}

export interface PublicFolderListProps extends BaseComponentProps {
  currentPath?: string;
}

export interface PublicFilesListProps extends BaseComponentProps {
  flat?: boolean;
}

export interface BreadcrumbProps {
  className?: string;
  currentFolderId?: string;
  path?: string;
}

// Breadcrumb item type
export interface BreadcrumbItem {
  name: string;
  path: string;
}

// Delete confirmation types
export interface DeleteConfirmation {
  type: 'file' | 'folder';
  path: string;
  name: string;
}

// Context types
export interface RefreshContextType {
  refreshRecentFiles: () => void;
  refreshFolderList: () => void;
}

// File type categories
export type FileCategory = 
  | 'IMAGE'
  | 'VIDEO'
  | 'AUDIO'
  | 'DOCUMENT'
  | 'SPREADSHEET'
  | 'CODE'
  | 'ARCHIVE'
  | 'DEFAULT';

// Icon configuration
export interface IconConfig {
  component: React.ComponentType<any>;
  color: string;
}

// Form state types
export interface FormState {
  isSubmitting: boolean;
  error?: string;
  success?: boolean;
}

// Loading states
export interface LoadingState {
  loading: boolean;
  error?: string | null;
}

// File upload state
export interface FileUploadState extends FormState {
  file: File | null;
  fileName: string;
  progress?: number;
}

// Folder creation state
export interface FolderCreationState extends FormState {
  folderName: string;
  isOpen: boolean;
}