'use client';

import { useRouter } from 'next/navigation';
import { useRefresh } from '@/lib/refreshContext';
import { useFolderCreation } from '@/hooks';
import { CreateFolderButtonProps, CreateFolderRequest, CreateFolderResponse } from '@/types';
import { sanitizeFileName, isValidFileName } from '@/lib/utils';

export function CreateFolderButton({ parentPath, onSuccess }: CreateFolderButtonProps) {
  const router = useRouter();
  const { refreshRecentFiles, refreshFolderList } = useRefresh();
  const {
    folderName,
    isOpen,
    isSubmitting,
    error,
    success,
    setFolderName,
    setOpen,
    setSubmitting,
    setError,
    setSuccess,
    reset
  } = useFolderCreation();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn btn-secondary flex items-center justify-center gap-2 flex-1 sm:flex-none"
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span className="hidden sm:inline">New Folder</span>
        <span className="sm:hidden">Folder</span>
      </button>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
          <form
            className="card p-4 sm:p-6 w-full max-w-md mx-4"
            onSubmit={async (e) => {
            e.preventDefault();
            const trimmed = folderName.trim();
            
            if (!isValidFileName(trimmed)) {
              setError('Please enter a valid folder name');
              return;
            }
            
            setSubmitting(true);
            setError(undefined);
            
            try {
              const response = await fetch('/api/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  name: sanitizeFileName(trimmed),
                  parentPath: parentPath 
                }),
              });
              
              if (response.ok) {
                refreshRecentFiles();
                refreshFolderList();
                setSuccess(true);
                onSuccess?.();
                setOpen(false);
                reset();
              } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to create folder');
              }
            } catch (error) {
              setError('Failed to create folder');
            } finally {
              setSubmitting(false);
            }
            }}
          >
            <h3 className="text-lg sm:text-xl font-semibold mb-4">Create New Folder</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Folder Name</label>
                <input
                  autoFocus
                  name="name"
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 sm:px-3 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  disabled={isSubmitting}
                />
                {error && (
                  <p className="text-red-500 text-sm mt-1">{error}</p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    reset();
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting || !folderName.trim()}
                >
                  {isSubmitting ? 'Creating...' : 'Create Folder'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
