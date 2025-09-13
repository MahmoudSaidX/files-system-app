'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { BreadcrumbItem, BreadcrumbProps } from '@/types';

function buildBreadcrumbPath(folderId: string): Array<{ id: string; name: string; href: string }> {
  // Handle public folder structure
  if (folderId === 'public-root') {
    return [{ id: 'public-root', name: 'My Files', href: '/' }];
  }
  
  if (folderId.startsWith('public-folder/')) {
    const path = folderId.replace('public-folder/', '');
    const segments = path.split('/');
    const breadcrumbs = [{ id: 'public-root', name: 'My Files', href: '/' }];
    
    let currentPath = '';
    segments.forEach((segment, index) => {
      // Ensure segment is not undefined or empty
      const safeSegment = segment && segment.trim() ? segment.trim() : 'Unknown';
      currentPath = currentPath ? `${currentPath}/${safeSegment}` : safeSegment;
      breadcrumbs.push({
        id: `public-folder/${currentPath}`,
        name: decodeURIComponent(safeSegment),
        href: `/public-folder/${encodeURIComponent(currentPath)}`
      });
    });
    
    return breadcrumbs;
  }
  
  // Handle special routes
  if (folderId === 'public-files') {
    return [
      { id: 'public-root', name: 'My Files', href: '/' },
      { id: 'public-files', name: 'Public Files', href: '/public-files' }
    ];
  }
  
  // Default fallback
  return [{ id: 'public-root', name: 'My Files', href: '/' }];
}

export function Breadcrumb({ currentFolderId, path, className }: BreadcrumbProps) {
  const breadcrumbPath = currentFolderId ? buildBreadcrumbPath(currentFolderId) : (path ? buildBreadcrumbPath(`public-folder/${path}`) : buildBreadcrumbPath('public-root'));
  
  return (
    <nav className={`flex items-center space-x-2 text-sm text-gray-600 mb-4 p-2 bg-gray-50 rounded-lg ${className || ''}`}>
      {breadcrumbPath.map((item, index) => {
        const isLast = index === breadcrumbPath.length - 1;
        const isRoot = item.id === 'public-root';
        
        return (
          <div key={item.id} className="flex items-center flex-shrink-0">
            {index > 0 && <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mx-1 flex-shrink-0" />}
            {isLast ? (
              <span className="font-medium text-gray-900 flex items-center gap-1 truncate">
                {isRoot && <Home className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />}
                <span className="truncate">{item.name}</span>
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-blue-600 transition-colors flex items-center gap-1 font-medium truncate"
              >
                {isRoot && <Home className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />}
                <span className="truncate">{item.name}</span>
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}