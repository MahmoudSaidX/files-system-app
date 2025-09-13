'use client';

import { useState, useEffect, useCallback } from 'react';
import { getFileIcon } from '@/lib/icons';
import { Clock, Folder, RefreshCw, Trash2 } from 'lucide-react';
import { useRefreshListener } from '@/lib/refreshContext';
import Link from 'next/link';

interface RecentFile {
  id: string;
  name: string;
  path: string;
  size: number;
  lastModified: string;
  extension: string;
  accessedAt?: string;
}

export default function RecentPage() {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{path: string, name: string} | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchRecentFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/recent-files');
      if (!response.ok) throw new Error('Failed to fetch recent files');
      const files = await response.json();
      setRecentFiles(files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const refreshFiles = useCallback(() => {
    fetchRecentFiles();
  }, []);

  const handleDeleteFile = async (path: string) => {
    if (!deleteConfirm) return;
    
    try {
      setDeleting(path);
      const response = await fetch(`/api/delete-file?path=${encodeURIComponent(path)}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete file');
      }
      
      // Refresh the recent files list
      await fetchRecentFiles();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    } finally {
      setDeleting(null);
    }
  };

  const handleRemoveAllRecent = async () => {
    if (!confirm('Are you sure you want to remove ALL recent files? This action cannot be undone.')) {
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
      
      // Refresh the recent files list
      await fetchRecentFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove all files');
    }
  };

  useEffect(() => {
    fetchRecentFiles();
  }, []);

  // Listen for refresh events from other components
  useRefreshListener(refreshFiles);

  if (loading) {
    return (
      <div className="container-responsive">
        <h1 className="heading-responsive mb-6 sm:mb-8">Recent Files</h1>
        <div className="flex flex-col sm:flex-row items-center justify-center py-8 sm:py-12 gap-3">
          <RefreshCw className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-gray-400" />
          <span className="text-sm sm:text-base text-gray-600 text-center">Loading recent files...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-responsive">
        <h1 className="heading-responsive mb-6 sm:mb-8">Recent Files</h1>
        <div className="text-center py-8 sm:py-12 text-red-600 space-y-4">
          <p className="text-sm sm:text-base px-4">Error loading recent files: {error}</p>
          <button
            onClick={fetchRecentFiles}
            className="btn btn-primary w-full sm:w-auto"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-responsive">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="heading-responsive">Recent Files</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={fetchRecentFiles}
            className="btn btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh Files</span>
          </button>
          {recentFiles.length > 0 && (
            <button
              onClick={handleRemoveAllRecent}
              className="btn btn-danger flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Remove All</span>
              <span className="sm:hidden">Clear All</span>
            </button>
          )}
        </div>
      </div>
      
      {recentFiles.length === 0 ? (
        <div className="text-center py-8 sm:py-12 text-gray-500 px-4">
          <Clock className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 opacity-50" />
          <p className="text-sm sm:text-base">No recent files found</p>
          <p className="text-xs sm:text-sm mt-2">Upload some files to see them here</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {recentFiles.map((file) => {
            const FileIcon = getFileIcon(file.name);
            const lastModified = new Date(file.lastModified);
            const folderPath = file.path.includes('/') ? file.path.substring(0, file.path.lastIndexOf('/')) : 'Root';
            
            const handleFileClick = async () => {
               try {
                 // Track file access
                 await fetch('/api/track-access', {
                   method: 'POST',
                   headers: {
                     'Content-Type': 'application/json',
                   },
                   body: JSON.stringify({
                     filePath: file.path,
                     fileName: file.name,
                     size: file.size
                   })
                 });
                 
                 // Open file in new tab
                 const fileUrl = `/${file.path}`;
                 window.open(fileUrl, '_blank');
                 
                 // Refresh the recent files list to show updated access time
                 setTimeout(() => fetchRecentFiles(), 500);
               } catch (error) {
                 console.error('Error tracking file access:', error);
                 // Still open the file even if tracking fails
                 const fileUrl = `/${file.path}`;
                 window.open(fileUrl, '_blank');
               }
             };
             
             return (
               <div key={file.id} className="card hover:shadow-md transition-all duration-200 flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-5 w-full relative">
                 <button
                   onClick={handleFileClick}
                   className="flex items-start sm:items-center gap-3 sm:gap-4 w-full text-left cursor-pointer active:scale-95 touch-manipulation transition-transform"
                 >
                 <FileIcon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-1 sm:mt-0" />
                 <div className="flex-1 min-w-0">
                   <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                     <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">{file.name}</span>
                     {file.extension && (
                       <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full uppercase self-start">
                         {file.extension}
                       </span>
                     )}
                   </div>
                   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-gray-600">
                     <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                       <Folder size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                       <span className="truncate">📁 {folderPath}</span>
                       <span className="text-gray-400 hidden sm:inline">•</span>
                       <span className="whitespace-nowrap">{(file.size / 1024).toFixed(1)} KB</span>
                       <span className="text-gray-400 hidden sm:inline">•</span>
                       <span className="text-blue-600">
                         <span className="sm:hidden">Tap to open</span>
                         <span className="hidden sm:inline">Click to open</span>
                       </span>
                     </div>
                     <span className="text-xs text-gray-400 whitespace-nowrap">
                        {file.accessedAt ? (
                          <>
                            <span className="sm:hidden">Accessed: {new Date(file.accessedAt).toLocaleDateString()}</span>
                            <span className="hidden sm:inline">Accessed: {new Date(file.accessedAt).toLocaleDateString()} at {new Date(file.accessedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </>
                        ) : (
                          <>
                            <span className="sm:hidden">Modified: {lastModified.toLocaleDateString()}</span>
                            <span className="hidden sm:inline">Modified: {lastModified.toLocaleDateString()} at {lastModified.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </>
                        )}
                      </span>
                   </div>
                 </div>
                 </button>
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     setDeleteConfirm({path: file.path, name: file.name});
                   }}
                   disabled={deleting === file.path}
                   className="flex-shrink-0 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   title="Delete file"
                 >
                   {deleting === file.path ? (
                     <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                   ) : (
                     <Trash2 className="w-4 h-4" />
                   )}
                 </button>
               </div>
             );
          })}
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Delete File</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting !== null}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteFile(deleteConfirm.path)}
                disabled={deleting !== null}
                className="btn btn-danger flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
