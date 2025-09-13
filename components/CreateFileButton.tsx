'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { useRefresh } from '@/lib/refreshContext';
import { useFileUpload } from '@/hooks';
import { CreateFileButtonProps, UploadResponse } from '@/types';
import { sanitizeFileName, isValidFileName } from '@/lib/utils';

export function CreateFileButton({ folderId, parentPath, onSuccess }: CreateFileButtonProps) {
  const router = useRouter();
  const { refreshRecentFiles, refreshFolderList } = useRefresh();
  const {
    file,
    fileName,
    isSubmitting,
    error,
    success,
    progress,
    setFile,
    setFileName,
    setSubmitting,
    setError,
    setSuccess,
    setProgress,
    reset
  } = useFileUpload();
  
  const [isOpen, setIsOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    if (!isValidFileName(fileName)) {
      setError('Please enter a valid file name');
      return;
    }

    setSubmitting(true);
    setError(undefined);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (fileName.trim() && fileName !== file.name) {
        formData.append('name', sanitizeFileName(fileName.trim()));
      }

      // Add parentPath to formData for public folder uploads
      if (parentPath !== undefined) {
        formData.append('parentPath', parentPath);
      }
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        refreshRecentFiles();
        refreshFolderList();
        setSuccess(true);
        onSuccess?.();
        setIsOpen(false);
        reset();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Upload failed');
      }
    } catch (error) {
      setError('Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-none"
      >
        <Upload className="w-4 h-4 flex-shrink-0" />
        <span className="hidden sm:inline">Upload File</span>
        <span className="sm:hidden">Upload</span>
      </button>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSubmit} className="card w-full max-w-md space-y-4 p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold">Upload File</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2">Select File</label>
              <input
                type="file"
                onChange={handleFileChange}
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                required
              />
            </div>

            {file && (
              <div>
                <label className="block text-sm font-medium mb-2">File Name</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  placeholder="Enter file name (optional)"
                  disabled={isSubmitting}
                />
              </div>
            )}

            {error && (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  reset();
                }}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!file || isSubmitting}
                className="btn btn-primary disabled:opacity-50"
              >
                {isSubmitting ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}