import { PublicFolderList } from '@/components/PublicFolderList';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function Home() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <Breadcrumb currentFolderId="public-root" />
      
      <div className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <h1 className="heading-responsive font-bold text-gray-900">My Files</h1>
          <p className="text-responsive text-gray-600">
            Browse and manage files in the public directory
          </p>
        </div>
        
        <PublicFolderList />
      </div>
    </div>
  );
}
