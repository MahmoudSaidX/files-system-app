'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { getFileIcon, getFolderIcon } from '@/lib/icons';
import { useRecentFilesRefresh } from '@/lib/refreshContext';
import { useLoading } from '@/hooks';
import { FileItem, PublicFilesListProps } from '@/types';
import { formatFileSize } from '@/lib/utils';

export function PublicFilesList({ flat = false }: PublicFilesListProps) {
  const [data, setData] = useState<FileItem[]>([]);
  const { isLoading, setLoading } = useLoading(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    fetchPublicFiles();
  }, [flat]);

  const fetchPublicFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public-files${flat ? '?flat=true' : ''}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch files');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  useRecentFilesRefresh(fetchPublicFiles);

  const renderItem = (item: FileItem, depth: number = 0) => {
    const isExpanded = expandedFolders.has(item.path);
    const hasChildren = item.children && item.children.length > 0;
    
    if (item.type === 'folder') {
      const FolderIcon = getFolderIcon();
      return (
        <div key={item.path}>
          <div 
            className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer rounded"
            style={{ paddingLeft: `${depth * 20 + 8}px` }}
            onClick={() => toggleFolder(item.path)}
          >
            {hasChildren && (
              isExpanded ? 
                <ChevronDown className="w-4 h-4 text-gray-400" /> : 
                <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
            {!hasChildren && <div className="w-4" />}
            <FolderIcon className="w-5 h-5" />
            <span className="font-medium">{item.name}</span>
            {hasChildren && (
              <span className="text-xs text-gray-500 ml-auto">
                {item.children?.length} items
              </span>
            )}
          </div>
          {isExpanded && hasChildren && (
            <div>
              {item.children?.map((child: FileItem) => renderItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    } else {
      const FileIcon = getFileIcon(item.name);
      return (
        <div 
          key={item.path}
          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
        >
          <div className="w-4" />
          <FileIcon className="w-5 h-5" />
          <span>{item.name}</span>
          {item.size && (
            <span className="text-xs text-gray-500 ml-auto">
              {formatFileSize(item.size)}
            </span>
          )}
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading public files...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-700 font-medium">Error</div>
        <div className="text-red-600 text-sm">{error}</div>
        <button 
          onClick={fetchPublicFiles}
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Public Folder Contents {flat ? '(Flat View)' : '(Tree View)'}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.href = window.location.pathname + (flat ? '' : '?flat=true')}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            {flat ? 'Tree View' : 'Flat View'}
          </button>
          <button
            onClick={fetchPublicFiles}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {data.length === 0 ? (
        <div className="text-gray-500 text-center p-8">
          No files found in public folder
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg bg-white">
          {data.map(item => renderItem(item))}
        </div>
      )}
    </div>
  );
}