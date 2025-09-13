'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CreateFolderButton } from './CreateFolderButton';
import { CreateFileButton } from './CreateFileButton';
import { getFolderIcon, getFileIcon } from '@/lib/icons';
import { useFolderListRefresh } from '@/lib/refreshContext';
import { PublicItem, PublicFolderListProps } from '@/types';
import { formatFileSize } from '@/lib/utils';
import { Folder, File, Trash2, MoreVertical, ArrowUp } from 'lucide-react';

/**
 * PublicFolderList component displays a navigable folder structure
 * with create, delete, and refresh functionality.
 * 
 * Features:
 * - Hierarchical folder navigation
 * - File and folder creation
 * - Individual and bulk deletion
 * - Real-time refresh capabilities
 * - Responsive design for mobile and desktop
 * 
 * @param currentPath - The current folder path being displayed
 */
export function PublicFolderList({ currentPath = '' }: PublicFolderListProps) {
  const [rootFolder, setRootFolder] = useState<PublicItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{type: 'file' | 'folder', path: string, name: string} | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Find the current folder based on the path
  const getCurrentFolder = (folder: PublicItem, path: string): PublicItem => {
    if (!path || path === '') return folder;
    
    const pathParts = path.split('/');
    let current = folder;
    
    for (const part of pathParts) {
      const child = current.children?.find(c => c.name === part);
      if (child && child.type === 'folder') {
        current = child;
      } else {
        return folder; // Return root if path not found
      }
    }
    
    return current;
  };

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/public-folders');
      if (!response.ok) throw new Error('Failed to fetch folders');
      const data = await response.json();
      setRootFolder(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: 'file' | 'folder', path: string) => {
    if (!deleteConfirm) return;
    
    try {
      setDeleting(path);
      const endpoint = type === 'file' ? '/api/delete-file' : '/api/delete-folder';
      const response = await fetch(`${endpoint}?path=${encodeURIComponent(path)}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete ${type}`);
      }
      
      // Refresh the folder list
      await fetchFolders();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to delete ${type}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleRemoveAll = async () => {
    if (!confirm('Are you sure you want to remove ALL files and folders? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/remove-all', {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove all files');
      }
      
      // Refresh the folder list
      await fetchFolders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove all files');
    }
  };

  useFolderListRefresh(fetchFolders);

  useEffect(() => {
    fetchFolders();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading folders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="text-red-500">Error: {error}</div>
        <button 
          onClick={fetchFolders}
          className="btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!rootFolder) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">No folders found</div>
      </div>
    );
  }

  const currentFolder = getCurrentFolder(rootFolder, currentPath);

  // Get parent path for "Go Up" functionality
  const getParentPath = () => {
    if (!currentPath) return null;
    const pathParts = currentPath.split('/');
    return pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
  };

  const parentNavigationPath = getParentPath();

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        {/* Go Up Button - only show if not at root */}
         {currentPath && (
           <Link
             href={parentNavigationPath ? `/public-folder/${encodeURIComponent(parentNavigationPath)}` : '/'}
             className="btn btn-secondary flex items-center justify-center gap-2"
           >
             <ArrowUp className="w-4 h-4 flex-shrink-0" />
             <span className="hidden sm:inline">Go Up</span>
             <span className="sm:hidden">Up</span>
           </Link>
         )}
        <CreateFolderButton parentPath={currentPath} />
        <CreateFileButton parentPath={currentPath} />
        <button 
          onClick={fetchFolders}
          className="btn btn-secondary flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="hidden sm:inline">Refresh</span>
        </button>
        {currentFolder.children && currentFolder.children.length > 0 && (
          <button 
            onClick={handleRemoveAll}
            className="btn btn-danger flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Remove All</span>
            <span className="sm:hidden">Clear</span>
          </button>
        )}
      </div>

      {/* Folder Contents */}
      {!currentFolder.children || currentFolder.children.length === 0 ? (
        <div className="text-center py-8 sm:py-12 text-gray-500">
          <Folder className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
          <p className="text-responsive">This folder is empty</p>
          <p className="text-xs sm:text-sm mt-2 px-4">Create a new folder or upload a file to get started</p>
        </div>
      ) : (
        <div className="grid-responsive">
          {currentFolder.children.map((item) => {
            // Ensure item.name is not undefined or empty
            const safeName = item.name && item.name.trim() ? item.name.trim() : 'Unknown Item';
            
            // Prevent recursive "Unknown" paths by checking if we're already in an unknown path
            const isInUnknownPath = currentPath.includes('Unknown');
            const isUnknownItem = safeName.includes('Unknown');
            
            // If we're already in an unknown path and this is another unknown item, skip it
            if (isInUnknownPath && isUnknownItem) {
              return null;
            }
            
            const itemPath = currentPath ? `${currentPath}/${safeName}` : safeName;
            // Create the navigation path by encoding each segment separately to avoid double encoding
            const navigationPath = currentPath 
              ? `${currentPath}/${encodeURIComponent(safeName)}`
              : encodeURIComponent(safeName);
            
            if (item.type === 'folder') {
              return (
                <div key={item.id} className="group relative border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200">
                  <Link
                    href={`/public-folder/${navigationPath}`}
                    className="block p-3 sm:p-4 active:scale-95 touch-manipulation"
                  >
                    <div className="flex items-center space-x-3">
                      <Folder className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 group-hover:text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate group-hover:text-blue-600">
                          {safeName}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          {item.children?.length || 0} {(item.children?.length || 0) === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setDeleteConfirm({type: 'folder', path: itemPath, name: safeName});
                    }}
                    disabled={deleting === itemPath}
                    className="absolute top-2 right-2 p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Delete folder"
                  >
                    {deleting === itemPath ? (
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              );
            } else {
              const handleFileClick = async () => {
                try {
                  // Track file access
                  await fetch('/api/track-access', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      filePath: item.path,
                      fileName: item.name,
                      size: item.size || 0
                    })
                  });
                  
                  // Open file in new tab
                  const fileUrl = `/${item.path}`;
                  window.open(fileUrl, '_blank');
                } catch (error) {
                  console.error('Error tracking file access:', error);
                  // Still open the file even if tracking fails
                  const fileUrl = `/${item.path}`;
                  window.open(fileUrl, '_blank');
                }
              };
              
              return (
                <div key={item.id} className="group relative border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all duration-200">
                  <button
                    onClick={handleFileClick}
                    className="block w-full p-3 sm:p-4 text-left cursor-pointer active:scale-95 touch-manipulation"
                  >
                    <div className="flex items-center space-x-3">
                      <File className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500 group-hover:text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate group-hover:text-blue-600">
                          {safeName}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          {item.size ? `${(item.size / 1024).toFixed(1)} KB` : 'File'} • <span className="hidden sm:inline">Click to open</span><span className="sm:hidden">Tap to open</span>
                        </p>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setDeleteConfirm({type: 'file', path: itemPath, name: safeName});
                    }}
                    disabled={deleting === itemPath}
                    className="absolute top-2 right-2 p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Delete file"
                  >
                    {deleting === itemPath ? (
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              );
            }
          })}
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete {deleteConfirm.type === 'file' ? 'File' : 'Folder'}
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{deleteConfirm.name}"?
              {deleteConfirm.type === 'folder' && ' This will also delete all files and folders inside it.'}
              <br />
              <span className="text-red-600 font-medium">This action cannot be undone.</span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={deleting !== null}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.type, deleteConfirm.path)}
                disabled={deleting !== null}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting === deleteConfirm.path ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}