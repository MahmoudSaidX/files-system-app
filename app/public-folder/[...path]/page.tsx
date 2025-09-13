import { Breadcrumb } from '@/components/Breadcrumb';
import { PublicFolderList } from '@/components/PublicFolderList';

interface PublicFolderPageProps {
  params: {
    path: string[];
  };
}

export default function PublicFolderPage({ params }: PublicFolderPageProps) {
  // Decode each path segment to handle URL encoding properly
  const decodedPath = params.path ? params.path.map(segment => decodeURIComponent(segment)) : [];
  const currentPath = decodedPath.join('/');
  
  return (
    <div className="space-y-6">
      <Breadcrumb currentFolderId={`public-folder/${currentPath}`} />
      
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentPath ? decodedPath[decodedPath.length - 1] : 'Public Files'}
          </h1>
          <p className="text-gray-600 mt-1">
            {currentPath 
              ? `Browse files and folders in ${currentPath}`
              : 'Browse and manage files in the public directory'
            }
          </p>
        </div>
        
        <PublicFolderList currentPath={currentPath} />
      </div>
    </div>
  );
}