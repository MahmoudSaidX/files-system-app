import { Breadcrumb } from '@/components/Breadcrumb';
import { PublicFolderList } from '@/components/PublicFolderList';

interface PublicFolderPageProps {
  params: {
    path: string[];
  };
}

export default function PublicFolderPage({ params }: PublicFolderPageProps) {
  const currentPath = params.path ? params.path.join('/') : '';
  
  return (
    <div className="space-y-6">
      <Breadcrumb currentFolderId={`public-folder/${currentPath}`} />
      
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentPath ? decodeURIComponent(params.path[params.path.length - 1]) : 'Public Files'}
          </h1>
          <p className="text-gray-600 mt-1">
            {currentPath 
              ? `Browse files and folders in ${decodeURIComponent(currentPath)}`
              : 'Browse and manage files in the public directory'
            }
          </p>
        </div>
        
        <PublicFolderList currentPath={currentPath} />
      </div>
    </div>
  );
}