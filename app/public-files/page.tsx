import { PublicFilesList } from '@/components/PublicFilesList';
import { Breadcrumb } from '@/components/Breadcrumb';

interface Props {
  searchParams: { flat?: string };
}

export default function PublicFilesPage({ searchParams }: Props) {
  const isFlat = searchParams.flat === 'true';
  
  return (
    <div className="p-6 space-y-6">
      <Breadcrumb path="public-files" />
      
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Public Files Explorer</h1>
          <p className="text-gray-600 mt-2">
            Browse all files and folders in the public directory. Files uploaded through the app are stored here.
          </p>
        </div>
        
        <PublicFilesList flat={isFlat} />
      </div>
    </div>
  );
}